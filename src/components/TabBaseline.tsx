import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Send, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "@tanstack/react-router";
import { useApprovals, useProjects } from "@/lib/projects-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TabScope =
  | "charter"
  | "team"
  | "financials"
  | "risks"
  | "procurement"
  | "stakeholders";

export type ApproverPick = {
  id: string;
  name: string;
  role?: string;
};

export type TabChange = {
  path: string; // e.g. "Objective" or "Risk R-01 · Probability"
  before: string;
  after: string;
};

export type ApproverResponse = {
  approverId: string;
  decision: "approved" | "rejected";
  note?: string;
  at: string;
};

export type TabChangeRequest<TSnapshot = unknown> = {
  id: string;
  scope: TabScope;
  summary: string;
  changes: TabChange[];
  submittedBy: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  approvers: ApproverPick[];
  responses: ApproverResponse[];
  pendingSnapshot: TSnapshot;
  /** Linked central Approvals Inbox request id. */
  approvalId?: string;
};

export type BaselineVersion<TSnapshot = unknown> = {
  version: number;
  createdAt: string;
  author: string;
  snapshot: TSnapshot;
};

export type UseTabBaselineOptions<TSnapshot> = {
  scope: TabScope;
  label: string;
  current: TSnapshot;
  onCommit?: (snapshot: TSnapshot) => void;
  diff?: (a: TSnapshot, b: TSnapshot) => TabChange[];
  autoLock?: boolean;
  initialAuthor?: string;
};

export function defaultDiff<T>(a: T, b: T): TabChange[] {
  const changes: TabChange[] = [];
  const av = a as unknown as Record<string, unknown>;
  const bv = b as unknown as Record<string, unknown>;
  if (!av || !bv || typeof av !== "object" || typeof bv !== "object") return changes;
  const keys = new Set([...Object.keys(av ?? {}), ...Object.keys(bv ?? {})]);
  for (const k of keys) {
    const before = av?.[k];
    const after = bv?.[k];
    const bs = stringify(before);
    const as_ = stringify(after);
    if (bs !== as_) changes.push({ path: k, before: bs, after: as_ });
  }
  return changes;
}

function stringify(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTabBaseline<TSnapshot>({
  scope,
  label,
  current,
  onCommit,
  diff,
  autoLock = true,
  initialAuthor = "System",
}: UseTabBaselineOptions<TSnapshot>) {
  const [versions, setVersions] = useState<BaselineVersion<TSnapshot>[]>(() =>
    autoLock
      ? [{ version: 1, createdAt: today(), author: initialAuthor, snapshot: current }]
      : []
  );
  const [viewedVersion, setViewedVersion] = useState<number | "latest">("latest");
  const [editMode, setEditMode] = useState(false);
  const [changeRequests, setChangeRequests] = useState<TabChangeRequest<TSnapshot>[]>([]);
  const [crDialogOpen, setCrDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [activeCrId, setActiveCrId] = useState<string | null>(null);
  const params = useParams({ strict: false }) as { projectId?: string };
  const { projects } = useProjects();
  const { approvals, addApprovalRequest, currentUser } = useApprovals();
  const project = projects.find((p) => p.id === params.projectId);

  // Ensure v1 exists on first render even if `current` was undefined initially.
  useEffect(() => {
    if (autoLock && versions.length === 0) {
      setVersions([{ version: 1, createdAt: today(), author: initialAuthor, snapshot: current }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isViewingCurrent = viewedVersion === "latest";
  const latestVersion = versions[versions.length - 1];
  const viewedSnapshot: TSnapshot | null = isViewingCurrent
    ? null
    : versions.find((v) => v.version === viewedVersion)?.snapshot ?? null;
  const isViewOnly = !isViewingCurrent;
  const canEdit = editMode && !isViewOnly;

  const diffFn = diff ?? defaultDiff;

  const pendingChanges: TabChange[] = useMemo(() => {
    if (!latestVersion) return [];
    return diffFn(latestVersion.snapshot, current);
  }, [latestVersion, current, diffFn]);

  const submitChangeRequest = useCallback(
    ({
      summary,
      approvers,
      submittedBy,
    }: {
      summary: string;
      approvers: ApproverPick[];
      submittedBy?: string;
    }) => {
      if (!latestVersion) return;
      const changes = diffFn(latestVersion.snapshot, current);
      if (changes.length === 0) {
        toast.info("No changes to submit");
        return;
      }
      const cr: TabChangeRequest<TSnapshot> = {
        id: `CR-${scope}-${Date.now()}`,
        scope,
        summary,
        changes,
        submittedBy: submittedBy ?? currentUser.name,
        createdAt: today(),
        status: "pending",
        approvers,
        responses: [],
        pendingSnapshot: current,
      };
      cr.approvalId = addApprovalRequest({
        type: "change-request",
        projectId: project?.id ?? params.projectId ?? "p-001",
        projectName: project?.name ?? "Project",
        ref: cr.id,
        title: `${label} change request — ${changes.length} change${changes.length === 1 ? "" : "s"}`,
        requestedBy: cr.submittedBy,
        summary: changes.map((c) => ({ label: c.path, before: c.before, after: c.after })),
        approvers: approvers.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role ?? "Approver",
          decision: "pending" as const,
        })),
      });
      setChangeRequests((prev) => [cr, ...prev]);
      setCrDialogOpen(false);
      setEditMode(false);
      toast.success(`${label} change request sent for approval`);
    },
    [latestVersion, current, diffFn, scope, label, addApprovalRequest, currentUser.name, project, params.projectId]
  );

  const respondToCr = useCallback(
    (crId: string, approverId: string, decision: "approved" | "rejected", note?: string) => {
      setChangeRequests((prev) =>
        prev.map((cr) => {
          if (cr.id !== crId) return cr;
          const filtered = cr.responses.filter((r) => r.approverId !== approverId);
          const next: TabChangeRequest<TSnapshot> = {
            ...cr,
            responses: [...filtered, { approverId, decision, note, at: today() }],
          };
          // Any rejection → rejected. All approved → approved and commit new baseline.
          const anyReject = next.responses.some((r) => r.decision === "rejected");
          const allApproved =
            next.approvers.length > 0 &&
            next.approvers.every((a) =>
              next.responses.some((r) => r.approverId === a.id && r.decision === "approved")
            );
          if (anyReject) {
            next.status = "rejected";
            toast.error(`${label} change request rejected`);
          } else if (allApproved) {
            next.status = "approved";
            const newVersion: BaselineVersion<TSnapshot> = {
              version: (latestVersion?.version ?? 1) + 1,
              createdAt: today(),
              author: cr.submittedBy,
              snapshot: next.pendingSnapshot,
            };
            setVersions((vs) => [...vs, newVersion]);
            onCommit?.(next.pendingSnapshot);
            toast.success(`${label} baseline updated to v${newVersion.version}`);
          }
          return next;
        })
      );
    },
    [label, latestVersion, onCommit]
  );

  const openApprovalDialog = (crId: string) => {
    setActiveCrId(crId);
    setApprovalDialogOpen(true);
  };

  // Mirror decisions taken in the central Approvals Inbox back onto this tab's CR.
  useEffect(() => {
    for (const cr of changeRequests) {
      if (cr.status !== "pending" || !cr.approvalId) continue;
      const central = approvals.find((a) => a.id === cr.approvalId);
      if (!central) continue;
      for (const ap of central.approvers) {
        if (ap.decision === "pending") continue;
        const already = cr.responses.some((r) => r.approverId === ap.id && r.decision === ap.decision);
        if (already) continue;
        respondToCr(cr.id, ap.id, ap.decision, ap.comment);
      }
    }
  }, [approvals, changeRequests, respondToCr]);

  const pendingCrs = changeRequests.filter((c) => c.status === "pending");

  return {
    scope,
    label,
    versions,
    latestVersion,
    viewedVersion,
    setViewedVersion,
    viewedSnapshot,
    isViewingCurrent,
    isViewOnly,
    editMode,
    setEditMode,
    canEdit,
    changeRequests,
    pendingCrs,
    pendingChanges,
    submitChangeRequest,
    respondToCr,
    crDialogOpen,
    setCrDialogOpen,
    approvalDialogOpen,
    setApprovalDialogOpen,
    activeCrId,
    openApprovalDialog,
  };
}

export type TabBaselineState<TSnapshot = unknown> = ReturnType<
  typeof useTabBaseline<TSnapshot>
>;

// ── Header ────────────────────────────────────────────────────────────────────

export function BaselineHeader<TSnapshot>({
  state,
  extra,
}: {
  state: TabBaselineState<TSnapshot>;
  extra?: React.ReactNode;
}) {
  const {
    label,
    versions,
    latestVersion,
    viewedVersion,
    setViewedVersion,
    isViewingCurrent,
    editMode,
    setEditMode,
    pendingChanges,
    setCrDialogOpen,
    pendingCrs,
    openApprovalDialog,
    changeRequests,
  } = state;
  const lastDecided = changeRequests.find((c) => c.status !== "pending");

  return (
    <>
    <div className="glass-card mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div>
          <div className="label-eyebrow">Baseline</div>
          <div className="text-sm font-medium text-foreground">{label}</div>
        </div>
        <Select
          value={isViewingCurrent ? "latest" : `v${viewedVersion}`}
          onValueChange={(v) =>
            setViewedVersion(v === "latest" ? "latest" : Number(v.replace("v", "")))
          }
        >
          <SelectTrigger className="h-auto min-h-[38px] w-56 items-start py-1.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">
              <div className="flex flex-col items-start gap-0.5 leading-none">
                <span className="text-foreground">
                  Current (v{latestVersion?.version ?? 1}) ⭐
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {latestVersion?.createdAt} · by {latestVersion?.author}
                </span>
              </div>
            </SelectItem>
            {versions
              .slice(0, -1)
              .reverse()
              .map((v) => (
                <SelectItem key={v.version} value={`v${v.version}`}>
                  <div className="flex flex-col leading-tight">
                    <span>v{v.version}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {v.createdAt} · by {v.author}
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {!isViewingCurrent && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            📖 View Only
          </Badge>
        )}
        {pendingCrs.length > 0 && (
          <Badge
            variant="outline"
            className="cursor-pointer border-rag-amber/40 bg-rag-amber/10 text-xs text-rag-amber"
            onClick={() => openApprovalDialog(pendingCrs[0].id)}
          >
            {pendingCrs.length} pending approval{pendingCrs.length === 1 ? "" : "s"}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {isViewingCurrent && !editMode && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setEditMode(true)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit {label}
          </Button>
        )}
        {isViewingCurrent && editMode && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              onClick={() => setCrDialogOpen(true)}
              disabled={pendingChanges.length === 0}
            >
              <Send className="mr-1 h-3.5 w-3.5" />
              Send Change Request
              {pendingChanges.length > 0 && (
                <span className="ml-1 rounded-full bg-background/30 px-1.5 py-0.5 text-[10px]">
                  {pendingChanges.length}
                </span>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
    {lastDecided && (
      <div
        className={`mb-4 rounded-lg border px-4 py-3 ${
          lastDecided.status === "approved"
            ? "border-rag-green/40 bg-rag-green/10"
            : "border-rag-red/40 bg-rag-red/10"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            lastDecided.status === "approved" ? "text-rag-green" : "text-rag-red"
          }`}
        >
          {lastDecided.status === "approved" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Change request {lastDecided.status} · {lastDecided.changes.length} change
          {lastDecided.changes.length === 1 ? "" : "s"} · submitted by {lastDecided.submittedBy}
        </div>
        <ul className="mt-1.5 space-y-1">
          {lastDecided.approvers.map((a) => {
            const resp = lastDecided.responses.find((r) => r.approverId === a.id);
            if (!resp) return null;
            return (
              <li key={a.id} className="text-[11px]">
                <span className="text-foreground">{a.name}</span>
                {a.role && <span className="ml-1 text-muted-foreground">· {a.role}</span>}
                <span
                  className={`ml-1 ${resp.decision === "approved" ? "text-rag-green" : "text-rag-red"}`}
                >
                  {resp.decision === "approved" ? "Approved" : "Rejected"} · {resp.at}
                </span>
                {resp.note && (
                  <div className="mt-0.5 rounded bg-background/40 px-1.5 py-1 text-[10px] text-muted-foreground">
                    Reason: {resp.note}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    )}
    </>
  );
}

// ── Change Request Dialog ─────────────────────────────────────────────────────

export function TabChangeRequestDialog<TSnapshot>({
  state,
  approverPool,
}: {
  state: TabBaselineState<TSnapshot>;
  approverPool: ApproverPick[];
}) {
  const { crDialogOpen, setCrDialogOpen, pendingChanges, submitChangeRequest, label } = state;

  function handleSubmit() {
    submitChangeRequest({ summary: "", approvers: approverPool });
  }

  return (
    <Dialog open={crDialogOpen} onOpenChange={setCrDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Change Request — {label}</DialogTitle>
          <DialogDescription>
            Review the changes below. Approvers configured at Project Creation will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] space-y-2 overflow-y-auto">
          {pendingChanges.length === 0 && (
            <div className="text-xs text-muted-foreground">No changes detected.</div>
          )}
          {pendingChanges.map((c, i) => (
            <div key={i} className="rounded-md border border-border/60 bg-secondary/20 p-3">
              <div className="text-[11px] font-medium text-foreground">{c.path}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-rag-red/10 px-2 py-0.5 text-rag-red line-through">
                  {c.before}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded bg-rag-green/10 px-2 py-0.5 text-rag-green">
                  {c.after}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-border/40 bg-secondary/10 p-3">
          <div className="label-eyebrow mb-2">Approvers</div>
          <div className="flex flex-wrap gap-2">
            {approverPool.map((a) => (
              <Badge key={a.id} variant="outline" className="text-xs">
                {a.name}
                {a.role && <span className="ml-1 text-muted-foreground">· {a.role}</span>}
              </Badge>
            ))}
            {approverPool.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No approvers configured for this project.
              </span>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCrDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSubmit}
            disabled={pendingChanges.length === 0 || approverPool.length === 0}
          >
            <Send className="mr-1 h-4 w-4" />
            Send Change Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Approval Dialog ───────────────────────────────────────────────────────────

export function TabApprovalDialog<TSnapshot>({
  state,
  currentUserId,
}: {
  state: TabBaselineState<TSnapshot>;
  currentUserId?: string;
}) {
  const {
    approvalDialogOpen,
    setApprovalDialogOpen,
    activeCrId,
    changeRequests,
    respondToCr,
    label,
  } = state;
  const cr = changeRequests.find((c) => c.id === activeCrId) ?? null;
  const [note, setNote] = useState("");
  const [pendingReject, setPendingReject] = useState(false);

  useEffect(() => {
    if (!approvalDialogOpen) {
      setNote("");
      setPendingReject(false);
    }
  }, [approvalDialogOpen]);

  if (!cr) return null;

  const activeApproverId = currentUserId ?? cr.approvers[0]?.id;
  const canRespond = !!activeApproverId && cr.status === "pending";

  return (
    <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Change Request — {label}</DialogTitle>
          <DialogDescription>
            Submitted by {cr.submittedBy} on {cr.createdAt}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {cr.changes.map((c, i) => (
            <div key={i} className="rounded-md border border-border/60 bg-secondary/20 p-3">
              <div className="text-[11px] font-medium text-foreground">{c.path}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-rag-red/10 px-2 py-0.5 text-rag-red line-through">
                  {c.before}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded bg-rag-green/10 px-2 py-0.5 text-rag-green">
                  {c.after}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border/40 bg-secondary/10 p-3">
          <div className="label-eyebrow mb-2">Approvers</div>
          <div className="space-y-1">
            {cr.approvers.map((a) => {
              const resp = cr.responses.find((r) => r.approverId === a.id);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-foreground">
                    {a.name}
                    {a.role && (
                      <span className="ml-1 text-muted-foreground">· {a.role}</span>
                    )}
                  </span>
                  {resp ? (
                    resp.decision === "approved" ? (
                      <Badge className="bg-rag-green/20 text-rag-green">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-rag-red/20 text-rag-red">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pending
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canRespond && pendingReject && (
          <div>
            <div className="label-eyebrow mb-1">Reason for rejection (required)</div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain why this change cannot be approved…"
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
            Close
          </Button>
          {canRespond && !pendingReject && (
            <>
              <Button
                variant="outline"
                className="border-rag-red/40 text-rag-red hover:bg-rag-red/10"
                onClick={() => setPendingReject(true)}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-rag-green text-white hover:bg-rag-green/90"
                onClick={() => {
                  respondToCr(cr.id, activeApproverId!, "approved");
                  setApprovalDialogOpen(false);
                }}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          {canRespond && pendingReject && (
            <Button
              className="bg-rag-red text-white hover:bg-rag-red/90"
              disabled={note.trim().length === 0}
              onClick={() => {
                respondToCr(cr.id, activeApproverId!, "rejected", note.trim());
                setApprovalDialogOpen(false);
              }}
            >
              Confirm Reject
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared project-level approver pool (demo) ────────────────────────────────

export const DEFAULT_PROJECT_APPROVERS: ApproverPick[] = [
  { id: "sara", name: "Sara Al-Rashid", role: "Director · Engineering" },
  { id: "john", name: "John Smith", role: "Project Manager · IT" },
  { id: "mei", name: "Mei Chen", role: "Finance Manager" },
];