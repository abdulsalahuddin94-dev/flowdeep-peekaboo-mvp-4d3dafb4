import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, Diamond, GitBranch, Inbox, Bell, CalendarDays } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApprovals, type ApprovalRequest } from "@/lib/projects-store";
import { toast } from "sonner";

export const Route = createFileRoute("/approvals")({
  component: ApprovalsInbox,
  validateSearch: (search: Record<string, unknown>) => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Approvals Inbox — Nexus PMO MVP" },
      { name: "description", content: "Central inbox for milestone completion gates and baseline change requests awaiting your decision." },
      { property: "og:title", content: "Approvals Inbox — Nexus PMO MVP" },
      { property: "og:description", content: "Review and decide on milestone gates and baseline change requests in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Filter = "Pending on me" | "All pending" | "History";

function ApprovalsInbox() {
  const { approvals, decideApproval, remindApproval, currentUser } = useApprovals();
  const { project: projectFilter } = Route.useSearch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("Pending on me");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [comment, setComment] = useState("");

  const rows = useMemo(() => {
    const scoped = projectFilter
      ? approvals.filter((a) => a.projectName === projectFilter)
      : approvals;
    if (filter === "History") return scoped.filter((a) => a.status !== "pending");
    if (filter === "All pending") return scoped.filter((a) => a.status === "pending");
    return scoped.filter(
      (a) => a.status === "pending" && a.approvers.some((ap) => ap.id === currentUser.id && ap.decision === "pending"),
    );
  }, [approvals, filter, currentUser.id, projectFilter]);

  const projectNames = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.projectName).filter(Boolean))).sort(),
    [approvals],
  );

  function openDecision(a: ApprovalRequest, m: "approve" | "reject") {
    setSelected(a); setMode(m); setComment("");
  }

  function confirm() {
    if (!selected) return;
    if (mode === "reject" && !comment.trim()) {
      toast.error("A comment is required when rejecting");
      return;
    }
    decideApproval(selected.id, currentUser.id, mode === "approve" ? "approved" : "rejected", comment.trim() || undefined);
    toast[mode === "approve" ? "success" : "error"](
      mode === "approve" ? `Approved — ${selected.title}` : `Rejected — ${selected.title}`,
    );
    setSelected(null);
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle={`Signed in as ${currentUser.name} · ${currentUser.role}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={projectFilter ?? "__all"}
              onValueChange={(v) =>
                navigate({ to: "/approvals", search: v === "__all" ? {} : { project: v } })
              }
            >
              <SelectTrigger className="h-9 w-[220px] text-xs">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all" className="text-xs">All projects</SelectItem>
                {projectNames.map((n) => (
                  <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                {(["Pending on me", "All pending", "History"] as Filter[]).map((f) => (
                  <TabsTrigger key={f} value={f} className="text-xs">{f}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        }
      />

      {projectFilter && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">
            Project: {projectFilter}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={() => navigate({ to: "/approvals", search: {} })}
          >
            <X className="mr-1 h-3 w-3" /> Clear filter
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-2 p-12 text-center">
          <Inbox className="h-7 w-7 text-muted-foreground" />
          <div className="text-sm text-foreground">Nothing here</div>
          <p className="text-xs text-muted-foreground">
            {filter === "History" ? "No decisions recorded yet." : "No approval requests are waiting."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const me = a.approvers.find((ap) => ap.id === currentUser.id);
            const canAct = a.status === "pending" && me?.decision === "pending";
            const approvedCount = a.approvers.filter((ap) => ap.decision === "approved").length;
            return (
              <section key={a.id} className="glass-card p-4">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                      a.type === "milestone-gate" ? "bg-rag-amber/15 text-rag-amber" : "bg-accent-dim text-accent"
                    }`}>
                      {a.type === "milestone-gate" ? <Diamond className="h-4 w-4" />
                        : a.type === "calendar-change" ? <CalendarDays className="h-4 w-4" />
                        : <GitBranch className="h-4 w-4" />}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{a.title}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.projectId ? (
                        <Link
                          to="/portfolio/$projectId"
                          params={{ projectId: a.projectId }}
                          className="text-accent hover:underline"
                        >
                          {a.projectName}
                        </Link>
                        ) : <span>{a.projectName}</span>}
                        {" · "}{a.type === "milestone-gate" ? "Milestone completion gate"
                          : a.type === "calendar-change" ? "Organization calendar change"
                          : "Baseline change request"}
                        {" · "}requested by {a.requestedBy} on {a.requestedAt}
                        {a.reminders > 0 && ` · ${a.reminders} reminder${a.reminders === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    a.status === "approved" ? "border-rag-green/40 bg-rag-green/10 text-rag-green"
                    : a.status === "rejected" ? "border-rag-red/40 bg-rag-red/10 text-rag-red"
                    : "border-rag-amber/40 bg-rag-amber/10 text-rag-amber"
                  }>
                    {a.status === "pending" ? `Waiting — ${approvedCount}/${a.approvers.length} approved` : a.status}
                  </Badge>
                </header>

                {a.summary.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-md border border-border">
                    <table className="w-full text-[11px]">
                      <thead className="bg-secondary/40 text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium">Item</th>
                          <th className="px-2 py-1.5 text-left font-medium">Before</th>
                          <th className="px-2 py-1.5 text-left font-medium">After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.summary.map((s, i) => (
                          <tr key={i} className="border-t border-border/60">
                            <td className="px-2 py-1.5 text-foreground">{s.label}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{s.before ?? "—"}</td>
                            <td className="px-2 py-1.5 text-foreground">{s.after ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <ul className="mt-3 space-y-1.5">
                  {a.approvers.map((ap) => (
                    <li key={ap.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">
                        {ap.name}
                        <span className="ml-1 text-muted-foreground">· {ap.role}{ap.department ? ` · ${ap.department}` : ""}</span>
                      </span>
                      <span className={
                        ap.decision === "approved" ? "inline-flex items-center gap-1 text-rag-green"
                        : ap.decision === "rejected" ? "inline-flex items-center gap-1 text-rag-red"
                        : "text-muted-foreground"
                      }>
                        {ap.decision === "approved" && <Check className="h-3 w-3" />}
                        {ap.decision === "rejected" && <X className="h-3 w-3" />}
                        {ap.decision === "pending" ? "Pending" : `${ap.decision === "approved" ? "Approved" : "Rejected"} ${ap.decidedAt ?? ""}`}
                      </span>
                    </li>
                  ))}
                </ul>

                <footer className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  {a.status === "pending" && (
                    <Button size="sm" variant="ghost" className="h-8 text-[11px]"
                      onClick={() => { remindApproval(a.id); toast.success("Reminder sent to pending approvers"); }}>
                      <Bell className="mr-1 h-3 w-3" /> Remind
                    </Button>
                  )}
                  {canAct ? (
                    <>
                      <Button size="sm" variant="outline" className="h-8 border-rag-red/40 text-rag-red text-[11px]"
                        onClick={() => openDecision(a, "reject")}>
                        Reject
                      </Button>
                      <Button size="sm" className="h-8 bg-accent text-accent-foreground text-[11px] hover:bg-accent/90"
                        onClick={() => openDecision(a, "approve")}>
                        Approve
                      </Button>
                    </>
                  ) : a.status === "pending" ? (
                    <span className="text-[11px] text-muted-foreground">
                      {me ? "You already decided on this request" : "Only assigned approvers can decide"}
                    </span>
                  ) : null}
                </footer>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "approve" ? "Approve request" : "Reject request"}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{selected?.title} · {selected?.projectName}</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={mode === "approve" ? "Optional comment…" : "Reason for rejection (required)"}
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              className={mode === "approve" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              onClick={confirm}
            >
              {mode === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
