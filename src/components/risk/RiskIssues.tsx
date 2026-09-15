import { useMemo, useState } from "react";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { EmptyRegion } from "@/lib/empty-preview";
import { TableRowActions } from "@/components/TableRowActions";
import { Pill } from "@/components/Pill";
import { usePagination, TablePagination } from "@/components/TablePagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
import {
  StyledTable, StyledTableBody, StyledTableCell, StyledTableHead,
  StyledTableHeader, StyledTableHeaderRow, StyledTableRow,
} from "@/components/StyledTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Paperclip } from "@/lib/icons";
import { projects, type RiskStatus, type IssueItem, type IssuePriority, type IssueStatus } from "@/lib/mock-data";
import { useRiskRegister, type RiskRecord } from "@/lib/risk-store";
import { useOrgRules, severityForScore, type RiskSeverity } from "@/lib/org-rules";
import { useOrgActive } from "@/lib/org-active";
import { useCurrentUser } from "@/lib/projects-store";

/* ── Tone helpers ─────────────────────────────────────────────────────────── */

export const SEVERITY_TONE: Record<RiskSeverity, string> = {
  Critical: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  High: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Medium: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  Low: "border-rag-green/40 bg-rag-green/10 text-rag-green",
};

const RISK_STATUS_TONE: Record<RiskStatus, string> = {
  Open: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  "In Progress": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Mitigated: "border-rag-green/40 bg-rag-green/10 text-rag-green",
};

const RISK_STATUSES: RiskStatus[] = ["Open", "In Progress", "Mitigated"];
const ISSUE_STATUSES: IssueStatus[] = ["Open", "Resolved", "Escalated"];

const PRIORITY_TONE: Record<IssuePriority, string> = {
  High: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  Medium: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Low: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
};

const ISSUE_STATUS_TONE: Record<IssueStatus, string> = {
  Open: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  Escalated: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Resolved: "border-rag-green/40 bg-rag-green/10 text-rag-green",
};

/** Severity bands come from Organization → Rules & Thresholds. */
export function useSeverity() {
  const rules = useOrgRules();
  return {
    severityOf: (score: number) => severityForScore(score, rules),
    rules,
  };
}

/* ── Risk register ────────────────────────────────────────────────────────── */

export function RiskRegisterTab({ project }: { project?: string }) {
  const { risks, categories, addRisk, updateRisk, removeRisk, logRiskUpdate, convertRiskToIssue } = useRiskRegister();
  const { severityOf } = useSeverity();
  const { isActive } = useOrgActive("risk-category");
  const { currentUser } = useCurrentUser();

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RiskRecord | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RiskRecord | null>(null);
  const [statusFor, setStatusFor] = useState<RiskRecord | null>(null);

  const scoped = project ? risks.filter((r) => r.project === project) : risks;
  const q = query.trim().toLowerCase();
  const list = scoped
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q))
    .filter((r) => projectFilter.length === 0 || projectFilter.includes(r.project))
    .filter((r) => categoryFilter.length === 0 || categoryFilter.includes(r.category))
    .filter((r) => severity === "all" || severityOf(r.score) === severity)
    .filter((r) => status === "all" || r.status === status);

  const pagination = usePagination(list, 10);
  const projectOptions = Array.from(new Set([...projects.map((p) => p.name), ...risks.map((r) => r.project)]));
  const activeCategories = categories.filter((c) => isActive(c.id)).map((c) => c.name);
  const view = risks.find((r) => r.id === viewId) ?? null;

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search risk, ID or owner…"
        filterGroups={[
          ...(project ? [] : [{ key: "project", label: "Projects", mode: "multi" as const, value: projectFilter, onChange: setProjectFilter, options: [{ value: "all", label: "All projects" }, ...projectOptions.map((p) => ({ value: p, label: p }))] }]),
          { key: "category", label: "Categories", mode: "multi", value: categoryFilter, onChange: setCategoryFilter, options: [{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c.name, label: c.name }))] },
          { key: "severity", label: "Score", value: severity, onChange: setSeverity, options: [{ value: "all", label: "All severities" }, { value: "Critical", label: "Critical" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, ...RISK_STATUSES.map((v) => ({ value: v, label: v }))] },
        ]}
        trailing={<Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>Log Risk</Button>}
      />

      <EmptyRegion id="risks-register">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="whitespace-nowrap">ID</StyledTableHead>
              {!project && <StyledTableHead>Project</StyledTableHead>}
              <StyledTableHead>Risk</StyledTableHead>
              <StyledTableHead>Category</StyledTableHead>
              <StyledTableHead className="text-center">P</StyledTableHead>
              <StyledTableHead className="text-center">I</StyledTableHead>
              <StyledTableHead className="text-center">Score</StyledTableHead>
              <StyledTableHead className="text-center whitespace-nowrap">Severity</StyledTableHead>
              <StyledTableHead>Mitigation plan</StyledTableHead>
              <StyledTableHead>Owner</StyledTableHead>
              <StyledTableHead className="text-center">Status</StyledTableHead>
              <StyledTableHead className="w-40" />
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <StyledTableBody>
            {list.length === 0 && <EmptyRow colSpan={project ? 11 : 12} />}
            {pagination.pageItems.map((r) => (
              <StyledTableRow key={r.id} onClick={() => setViewId(r.id)} className="cursor-pointer">
                <StyledTableCell className="num-mono text-xs text-muted-foreground">{r.id}</StyledTableCell>
                {!project && <StyledTableCell className="text-muted-foreground">{r.project}</StyledTableCell>}
                <StyledTableCell className="font-medium text-foreground">{r.title}</StyledTableCell>
                <StyledTableCell className="text-muted-foreground">{r.category}</StyledTableCell>
                <StyledTableCell className="text-center num-mono">{r.prob}</StyledTableCell>
                <StyledTableCell className="text-center num-mono">{r.impact}</StyledTableCell>
                <StyledTableCell className="text-center num-mono text-foreground">{r.score}</StyledTableCell>
                <StyledTableCell className="text-center">
                  <Pill label={severityOf(r.score)} tone={SEVERITY_TONE[severityOf(r.score)]} />
                </StyledTableCell>
                <StyledTableCell className="max-w-[220px] truncate text-muted-foreground" title={r.mitigation || undefined}>
                  {r.mitigation || "—"}
                </StyledTableCell>
                <StyledTableCell className="text-muted-foreground">{r.owner}</StyledTableCell>
                <StyledTableCell className="text-center">
                  <Pill label={r.status} tone={RISK_STATUS_TONE[r.status]} />
                </StyledTableCell>
                <StyledTableCell onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    onStatus={() => setStatusFor(r)}
                    statusLabel="Update risk status"
                    statusIcon={<ClipboardCheck size={16} />}
                    onEdit={() => { setEditing(r); setFormOpen(true); }}
                    onDelete={() => setPendingDelete(r)}
                  />
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </StyledTableBody>
        </StyledTable>
        <TablePagination {...pagination} itemLabel="risks" />
      </EmptyRegion>

      <RiskFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        risk={editing}
        lockedProject={project}
        projectOptions={projectOptions}
        categoryOptions={activeCategories.length > 0 ? activeCategories : categories.map((c) => c.name)}
        onSave={(risk) => {
          if (editing) updateRisk(editing.id, risk);
          else addRisk({ ...risk, owner: risk.owner || currentUser.name });
          toast.done("Risk", editing ? "updated" : "logged");
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <RiskSheet
        risk={view}
        onClose={() => setViewId(null)}
        onEdit={(r) => { setViewId(null); setEditing(r); setFormOpen(true); }}
        onUpdate={(r) => setStatusFor(r)}
        onConvert={(r) => {
          const id = convertRiskToIssue(r.id, currentUser.name);
          if (id) toast.success(`Issue ${id} created from ${r.id}`);
        }}
      />

      <RiskStatusDialog
        key={`status-${statusFor?.id ?? "none"}`}
        risk={statusFor}
        onClose={() => setStatusFor(null)}
        onSave={(input) => {
          if (!statusFor) return;
          logRiskUpdate(statusFor.id, { ...input, by: currentUser.name });
          toast.done("Risk update", "recorded");
          setStatusFor(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="The risk is removed from the register. Its update history is lost."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (pendingDelete) removeRisk(pendingDelete.id);
          toast.done("Risk", "deleted");
          setPendingDelete(null);
        }}
      />
    </>
  );
}

/* ── Risk form ────────────────────────────────────────────────────────────── */

function RiskFormDialog({
  open, onOpenChange, risk, projectOptions, categoryOptions, lockedProject, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  risk: RiskRecord | null;
  projectOptions: string[];
  categoryOptions: string[];
  lockedProject?: string;
  onSave: (risk: Omit<RiskRecord, "id" | "updates">) => void;
}) {
  const { severityOf, rules } = useSeverity();
  const [title, setTitle] = useState(risk?.title ?? "");
  const [project, setProject] = useState(risk?.project ?? lockedProject ?? "");
  const [category, setCategory] = useState(risk?.category ?? "");
  const [prob, setProb] = useState(String(risk?.prob ?? 3));
  const [impact, setImpact] = useState(String(risk?.impact ?? 3));
  const [status, setStatus] = useState<RiskStatus>(risk?.status ?? "Open");
  const [mitigation, setMitigation] = useState(risk?.mitigation ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const score = Number(prob) * Number(impact);

  function submit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Risk title is required";
    if (!project) next.project = "Select the project this risk belongs to";
    if (!category) next.category = "Select a category";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      project, title: title.trim(), category,
      owner: risk?.owner ?? "",
      prob: Number(prob), impact: Number(impact), score, status,
      mitigation: mitigation.trim(),
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={risk ? "Edit risk" : "Log a new risk"}
      description={risk ? "Update this risk's classification, scoring and mitigation plan." : "Record a potential event, assess its likelihood and impact, and define an optional mitigation plan."}
      size="lg"
      submitLabel={risk ? "Save Changes" : "Log Risk"}
      onSubmit={submit}
    >
      <Field label="Risk title" htmlFor="risk-title" error={errors.title}>
        <Input id="risk-title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); }} placeholder="Describe the risk in one line" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project" htmlFor="risk-project" error={errors.project}>
          <Select value={project} onValueChange={(v) => { setProject(v); setErrors((x) => ({ ...x, project: "" })); }} disabled={!!lockedProject}>
            <SelectTrigger id="risk-project"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Category" htmlFor="risk-category" error={errors.category} hint="Maintained in Organization → Risk Categories">
          <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((x) => ({ ...x, category: "" })); }}>
            <SelectTrigger id="risk-category"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Probability" htmlFor="risk-prob" hint="1 – 5">
          <Select value={prob} onValueChange={setProb}>
            <SelectTrigger id="risk-prob"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} · {rules.risk.probabilityLabels[n - 1]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Impact" htmlFor="risk-impact" hint="1 – 5">
          <Select value={impact} onValueChange={setImpact}>
            <SelectTrigger id="risk-impact"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} · {rules.risk.impactLabels[n - 1]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Score" hint="Probability × Impact">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-[var(--field-bg-filled)] px-3">
            <span className="num-mono text-sm text-foreground">{score}</span>
            <Pill label={severityOf(score)} tone={SEVERITY_TONE[severityOf(score)]} />
          </div>
        </Field>
        <Field label="Status" htmlFor="risk-status" className="lg:col-span-3">
          <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
            <SelectTrigger id="risk-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RISK_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Mitigation plan" htmlFor="risk-mitigation" optional>
        <Textarea id="risk-mitigation" value={mitigation} onChange={(e) => setMitigation(e.target.value)} placeholder="Actions that reduce probability or impact" rows={3} />
      </Field>
    </FormDialog>
  );
}

/* ── Risk detail sheet ────────────────────────────────────────────────────── */

function RiskSheet({
  risk, onClose, onEdit, onUpdate, onConvert,
}: {
  risk: RiskRecord | null;
  onClose: () => void;
  onEdit: (r: RiskRecord) => void;
  onUpdate: (r: RiskRecord) => void;
  onConvert: (r: RiskRecord) => void;
}) {
  const { severityOf } = useSeverity();
  if (!risk) return null;
  const severity = severityOf(risk.score);

  return (
    <Sheet open={!!risk} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <span className="num-mono text-xs text-muted-foreground">{risk.id}</span>
            <Pill label={severity} tone={SEVERITY_TONE[severity]} />
            <Pill label={risk.status} tone={RISK_STATUS_TONE[risk.status]} />
          </div>
          <SheetTitle className="mt-2 text-lg">{risk.title}</SheetTitle>
          <SheetDescription className="sr-only">Risk details, mitigation plan, and update history.</SheetDescription>
          <p className="mt-1 text-xs text-muted-foreground">{risk.project}</p>
        </SheetHeader>

        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { l: "Probability", v: risk.prob },
            { l: "Impact", v: risk.impact },
            { l: "Score", v: risk.score },
          ].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 num-mono text-sm font-medium text-foreground">{k.v}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div>
            <div className="label-eyebrow mb-1">Category</div>
            <p className="text-sm text-foreground">{risk.category}</p>
          </div>
          <div>
            <div className="label-eyebrow mb-1">Risk owner</div>
            <p className="text-sm text-foreground">{risk.owner || "—"}</p>
          </div>
          <Separator />
          <div>
            <div className="label-eyebrow mb-1">Mitigation plan</div>
            <p className="text-sm text-muted-foreground">{risk.mitigation || "No mitigation plan recorded yet."}</p>
          </div>
          <Separator />
          <div>
            <div className="label-eyebrow mb-2">Status updates</div>
            {risk.updates.length === 0 && (
              <p className="text-sm text-muted-foreground">No updates recorded yet.</p>
            )}
            <div className="space-y-3">
              {risk.updates.map((u) => (
                <div key={u.id} className="rounded-lg border border-border bg-[var(--field-bg-filled)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{u.by}</span>
                    <span className="num-mono text-[10px] text-muted-foreground">{u.at}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{u.comment}</p>
                  {u.change && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {u.change.status && u.change.status[0] !== u.change.status[1] && (
                        <Badge variant="outline" className="rounded-full text-[10px]">Status {u.change.status[0]} → {u.change.status[1]}</Badge>
                      )}
                      {u.change.prob && (
                        <Badge variant="outline" className="rounded-full text-[10px]">P {u.change.prob[0]} → {u.change.prob[1]}</Badge>
                      )}
                      {u.change.impact && (
                        <Badge variant="outline" className="rounded-full text-[10px]">I {u.change.impact[0]} → {u.change.impact[1]}</Badge>
                      )}
                      {u.change.score && (
                        <Badge variant="outline" className="rounded-full text-[10px]">Score {u.change.score[0]} → {u.change.score[1]}</Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-border px-6 py-4">
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={() => { onClose(); onUpdate(risk); }}>Update risk status</Button>
            <Button variant="outline" className="flex-1" onClick={() => { onClose(); onConvert(risk); }}>Convert to Issue</Button>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => onEdit(risk)}>Edit Risk</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Heat map ─────────────────────────────────────────────────────────────── */

export function RiskHeatmapTab({ project }: { project?: string }) {
  const { risks } = useRiskRegister();
  const { severityOf } = useSeverity();
  const rows = project ? risks.filter((r) => r.project === project) : risks;
  const [cell, setCell] = useState<{ p: number; i: number } | null>(null);
  const at = (p: number, i: number) => rows.filter((r) => r.prob === p && r.impact === i);
  const cellItems = cell ? at(cell.p, cell.i) : [];

  const toneFor = (score: number) => {
    const s = severityOf(score);
    return s === "Critical"
      ? "border-rag-red/40 bg-rag-red/15 text-rag-red"
      : s === "High"
        ? "border-rag-amber/40 bg-rag-amber/15 text-rag-amber"
        : s === "Medium"
          ? "border-rag-blue/40 bg-rag-blue/15 text-rag-blue"
          : "border-rag-green/40 bg-rag-green/12 text-rag-green";
  };

  return (
    <>
      <div className="w-full rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">Probability × Impact</div>
            <p className="mt-1 text-xs text-muted-foreground">Select a cell to see the risks it holds.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["Critical", "High", "Medium", "Low"] as RiskSeverity[]).map((s) => (
              <Pill key={s} label={s} tone={SEVERITY_TONE[s]} />
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1120px]">
          <div className="flex gap-3">
            <div className="flex items-center">
              <span className="-rotate-90 whitespace-nowrap text-xs text-muted-foreground">Probability →</span>
            </div>
            <div className="flex flex-col justify-between py-1 text-right">
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="flex flex-1 items-center justify-end pr-1.5 text-sm text-muted-foreground">{p}</div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-2.5">
                {[5, 4, 3, 2, 1].map((p) =>
                  [1, 2, 3, 4, 5].map((i) => {
                    const items = at(p, i);
                    return (
                      <button
                        key={`${p}-${i}`}
                        type="button"
                        onClick={() => items.length > 0 && setCell({ p, i })}
                        className={cn(
                          "flex aspect-[2/1] flex-col items-center justify-center rounded-lg border transition",
                          toneFor(p * i),
                          items.length > 0 ? "hover:brightness-125" : "opacity-50",
                        )}
                      >
                        <span className="num-mono text-2xl font-medium leading-none">{items.length}</span>
                        <span className="mt-1 text-xs leading-none opacity-80">{p * i}</span>
                      </button>
                    );
                  }),
                )}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="text-center text-sm text-muted-foreground">{i}</div>
                ))}
              </div>
              <div className="mt-1.5 text-center text-xs text-muted-foreground">Impact →</div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={!!cell} onOpenChange={(o) => !o && setCell(null)}>
        <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
          <SheetHeader className="border-b border-border px-6 py-4 text-left">
            <SheetTitle>{cell ? `Probability ${cell.p} × Impact ${cell.i}` : ""}</SheetTitle>
            <SheetDescription>Risks currently positioned in the selected probability and impact cell.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
            {cellItems.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-[var(--field-bg-filled)] p-3">
                <div className="flex items-center gap-2">
                  <span className="num-mono text-xs text-muted-foreground">{r.id}</span>
                  <Pill label={severityOf(r.score)} tone={SEVERITY_TONE[severityOf(r.score)]} />
                  <Pill label={r.status} tone={RISK_STATUS_TONE[r.status]} />
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{r.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.project} · {r.owner}</div>
              </div>
            ))}
            {cellItems.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No risks in this cell.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ── Issues log ───────────────────────────────────────────────────────────── */

export function IssuesLogTab({ project }: { project?: string }) {
  const { risks, issues, addIssue, updateIssue, removeIssue } = useRiskRegister();
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IssueItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IssueItem | null>(null);
  const [statusFor, setStatusFor] = useState<IssueItem | null>(null);

  const riskTitle = (id?: string) => (id ? (risks.find((r) => r.id === id)?.title ?? id) : "");

  const scoped = project ? issues.filter((i) => i.project === project) : issues;
  const q = query.trim().toLowerCase();
  const list = scoped
    .filter((i) => !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.owner.toLowerCase().includes(q))
    .filter((i) => projectFilter.length === 0 || projectFilter.includes(i.project))
    .filter((i) => priority === "all" || i.priority === priority)
    .filter((i) => status === "all" || i.status === status)
    .filter((i) => riskFilter.length === 0 || riskFilter.includes(i.riskId ?? "none"));

  const pagination = usePagination(list, 10);
  const projectOptions = Array.from(new Set([...projects.map((p) => p.name), ...issues.map((r) => r.project)]));

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search issue, ID or owner…"
        filterGroups={[
          ...(project ? [] : [{ key: "project", label: "Projects", mode: "multi" as const, value: projectFilter, onChange: setProjectFilter, options: [{ value: "all", label: "All projects" }, ...projectOptions.map((p) => ({ value: p, label: p }))] }]),
          { key: "priority", label: "Priority", value: priority, onChange: setPriority, options: [{ value: "all", label: "All priorities" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, ...ISSUE_STATUSES.map((v) => ({ value: v, label: v }))] },
          { key: "risk", label: "Originating Risk", mode: "multi", value: riskFilter, onChange: setRiskFilter, options: [{ value: "all", label: "All risks" }, { value: "none", label: "No originating risk" }, ...risks.map((r) => ({ value: r.id, label: `${r.id} · ${r.title}` }))] },
        ]}
        trailing={<Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>Log Issue</Button>}
      />

      <EmptyRegion id="risks-issues">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="whitespace-nowrap">ID</StyledTableHead>
              {!project && <StyledTableHead>Project</StyledTableHead>}
              <StyledTableHead>Issue</StyledTableHead>
              <StyledTableHead className="whitespace-nowrap">Originating Risk</StyledTableHead>
              <StyledTableHead className="whitespace-nowrap">Action taken</StyledTableHead>
              <StyledTableHead className="text-center">Priority</StyledTableHead>
              <StyledTableHead>Owner</StyledTableHead>
              <StyledTableHead className="text-center whitespace-nowrap">Raised</StyledTableHead>
              <StyledTableHead className="text-center">Status</StyledTableHead>
              <StyledTableHead className="w-32" />
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <StyledTableBody>
            {list.length === 0 && <EmptyRow colSpan={project ? 9 : 10} />}
            {pagination.pageItems.map((i) => (
              <StyledTableRow key={i.id}>
                <StyledTableCell className="num-mono text-xs text-muted-foreground">{i.id}</StyledTableCell>
                {!project && <StyledTableCell className="text-muted-foreground">{i.project}</StyledTableCell>}
                <StyledTableCell className="font-medium text-foreground">{i.title}</StyledTableCell>
                <StyledTableCell className="max-w-[200px] truncate text-muted-foreground" title={riskTitle(i.riskId) || undefined}>
                  {i.riskId ? `${i.riskId} · ${riskTitle(i.riskId)}` : "—"}
                </StyledTableCell>
                <StyledTableCell className="max-w-[220px] truncate text-muted-foreground" title={i.action || undefined}>
                  {i.action || "—"}
                </StyledTableCell>
                <StyledTableCell className="text-center"><Pill label={i.priority} tone={PRIORITY_TONE[i.priority]} /></StyledTableCell>
                <StyledTableCell className="text-muted-foreground">{i.owner}</StyledTableCell>
                <StyledTableCell className="text-center text-xs text-muted-foreground">{i.raised}</StyledTableCell>
                <StyledTableCell className="text-center"><Pill label={i.status} tone={ISSUE_STATUS_TONE[i.status]} /></StyledTableCell>
                <StyledTableCell>
                  <TableRowActions
                    onStatus={() => setStatusFor(i)}
                    statusLabel="Update issue status"
                    statusIcon={<ClipboardCheck size={16} />}
                    onEdit={() => { setEditing(i); setFormOpen(true); }}
                    onDelete={() => setPendingDelete(i)}
                  />
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </StyledTableBody>
        </StyledTable>
        <TablePagination {...pagination} itemLabel="issues" />
      </EmptyRegion>

      <IssueFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        issue={editing}
        lockedProject={project}
        projectOptions={projectOptions}
        risks={risks}
        defaultOwner={currentUser.name}
        onSave={(issue) => {
          if (editing) updateIssue(editing.id, issue);
          else addIssue(issue);
          toast.done("Issue", editing ? "updated" : "logged");
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <IssueStatusDialog
        key={`istatus-${statusFor?.id ?? "none"}`}
        issue={statusFor}
        onClose={() => setStatusFor(null)}
        onSave={(patch) => {
          if (statusFor) updateIssue(statusFor.id, patch);
          toast.done("Issue status", "updated");
          setStatusFor(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="The issue is removed from the log."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (pendingDelete) removeIssue(pendingDelete.id);
          toast.done("Issue", "deleted");
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function IssueFormDialog({
  open, onOpenChange, issue, projectOptions, risks, lockedProject, defaultOwner, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  issue: IssueItem | null;
  projectOptions: string[];
  risks: RiskRecord[];
  lockedProject?: string;
  defaultOwner: string;
  onSave: (issue: Omit<IssueItem, "id">) => void;
}) {
  const [title, setTitle] = useState(issue?.title ?? "");
  const [project, setProject] = useState(issue?.project ?? lockedProject ?? "");
  const [owner, setOwner] = useState(issue?.owner ?? defaultOwner);
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority ?? "Medium");
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "Open");
  const [action, setAction] = useState(issue?.action ?? "");
  const [riskId, setRiskId] = useState(issue?.riskId ?? "none");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Issue title is required";
    if (!project) next.project = "Select the project this issue belongs to";
    if (!owner.trim()) next.owner = "Issue owner is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      project, title: title.trim(), owner: owner.trim(), priority, status,
      raised: issue?.raised ?? "Today",
      action: action.trim(),
      riskId: riskId === "none" ? undefined : riskId,
      resolution: issue?.resolution,
      attachment: issue?.attachment,
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={issue ? "Edit issue" : "Log a new issue"}
      description={issue ? "Update this issue's details, ownership and corrective action." : "Record a realized event that requires immediate corrective action."}
      size="lg"
      submitLabel={issue ? "Save Changes" : "Log Issue"}
      onSubmit={submit}
    >
      <Field label="Issue title" htmlFor="issue-title" error={errors.title}>
        <Input id="issue-title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); }} placeholder="What is blocking or going wrong?" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project" htmlFor="issue-project" error={errors.project}>
          <Select value={project} onValueChange={(v) => { setProject(v); setErrors((x) => ({ ...x, project: "" })); }} disabled={!!lockedProject}>
            <SelectTrigger id="issue-project"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>{projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Issue owner" htmlFor="issue-owner" error={errors.owner}>
          <Input id="issue-owner" value={owner} onChange={(e) => { setOwner(e.target.value); setErrors((x) => ({ ...x, owner: "" })); }} placeholder="Who resolves it?" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Priority" htmlFor="issue-priority">
          <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
            <SelectTrigger id="issue-priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status" htmlFor="issue-status">
          <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
            <SelectTrigger id="issue-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ISSUE_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Originating risk" htmlFor="issue-risk" optional hint="Leave empty when the issue was not foreseen as a risk.">
        <Select value={riskId} onValueChange={setRiskId}>
          <SelectTrigger id="issue-risk"><SelectValue placeholder="No originating risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No originating risk</SelectItem>
            {risks.map((r) => <SelectItem key={r.id} value={r.id}>{r.id} · {r.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Action taken" htmlFor="issue-action" optional>
        <Textarea id="issue-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="Current corrective action" rows={3} />
      </Field>
    </FormDialog>
  );
}

/* ── Status update dialogs ────────────────────────────────────────────────── */

function RiskStatusDialog({
  risk, onClose, onSave,
}: {
  risk: RiskRecord | null;
  onClose: () => void;
  onSave: (input: { status: RiskStatus; prob: number; impact: number; comment: string }) => void;
}) {
  const { severityOf } = useSeverity();
  const [status, setStatus] = useState<RiskStatus>(risk?.status ?? "Open");
  const [prob, setProb] = useState(String(risk?.prob ?? 3));
  const [impact, setImpact] = useState(String(risk?.impact ?? 3));
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const score = Number(prob) * Number(impact);

  function submit() {
    if (!comment.trim()) {
      setError("A comment is required so the change stays documented");
      return;
    }
    onSave({ status, prob: Number(prob), impact: Number(impact), comment: comment.trim() });
  }

  return (
    <FormDialog
      open={!!risk}
      onOpenChange={(o) => { if (!o) onClose(); }}
      title="Update risk status"
      description={risk ? `${risk.id} · ${risk.title}` : undefined}
      submitLabel="Record Update"
      onSubmit={submit}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Status" htmlFor="risk-status-update">
          <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
            <SelectTrigger id="risk-status-update"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RISK_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Probability" htmlFor="risk-status-prob">
          <Select value={prob} onValueChange={setProb}>
            <SelectTrigger id="risk-status-prob"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Impact" htmlFor="risk-status-impact">
          <Select value={impact} onValueChange={setImpact}>
            <SelectTrigger id="risk-status-impact"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Score" hint="Probability × Impact" className="sm:col-span-2 lg:col-span-1">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-[var(--field-bg-filled)] px-3">
            <span className="num-mono text-sm text-foreground">{score}</span>
            <Pill label={severityOf(score)} tone={SEVERITY_TONE[severityOf(score)]} />
          </div>
        </Field>
      </div>

      <Field
        label="Comment"
        htmlFor="risk-status-comment"
        error={error}
        hint="What progressed, and why the severity changed. Kept in the risk history."
      >
        <Textarea
          id="risk-status-comment"
          value={comment}
          onChange={(e) => { setComment(e.target.value); setError(""); }}
          rows={3}
          placeholder="e.g. Mitigation plan executed — probability reduced from 4 to 2"
        />
      </Field>
    </FormDialog>
  );
}

function IssueStatusDialog({
  issue, onClose, onSave,
}: {
  issue: IssueItem | null;
  onClose: () => void;
  onSave: (patch: Partial<IssueItem>) => void;
}) {
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "Open");
  const [resolution, setResolution] = useState(issue?.resolution ?? "");
  const [attachment, setAttachment] = useState(issue?.attachment ?? "");
  const [error, setError] = useState("");

  const needsResolution = status === "Resolved";

  function submit() {
    if (needsResolution && !resolution.trim()) {
      setError("A resolution description is required to resolve the issue");
      return;
    }
    onSave({ status, resolution: resolution.trim() || undefined, attachment: attachment || undefined });
  }

  return (
    <FormDialog
      open={!!issue}
      onOpenChange={(o) => { if (!o) onClose(); }}
      title="Update issue status"
      description={issue ? `${issue.id} · ${issue.title}` : undefined}
      submitLabel="Update Status"
      onSubmit={submit}
    >
      <Field label="Status" htmlFor="issue-status-update">
        <Select value={status} onValueChange={(v) => { setStatus(v as IssueStatus); setError(""); }}>
          <SelectTrigger id="issue-status-update"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ISSUE_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Resolution description"
        htmlFor="issue-resolution"
        optional={!needsResolution}
        error={error}
        hint={needsResolution ? "Describe how the issue was resolved before closing it." : undefined}
      >
        <Textarea
          id="issue-resolution"
          value={resolution}
          onChange={(e) => { setResolution(e.target.value); setError(""); }}
          rows={3}
          placeholder="What was done to resolve the issue?"
        />
      </Field>

      <Field label="Supporting proof" htmlFor="issue-attachment" optional hint="Photo or document that evidences the resolution.">
        <div className="flex items-center gap-3">
          <Button asChild type="button" variant="secondary" size="sm">
            <label htmlFor="issue-attachment" className="cursor-pointer">
              <Paperclip size={14} />
              Attach file
            </label>
          </Button>
          <input
            id="issue-attachment"
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xlsx"
            className="sr-only"
            onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? "")}
          />
          <span className="truncate text-xs text-muted-foreground">{attachment || "No file attached"}</span>
        </div>
      </Field>
    </FormDialog>
  );
}

/* ── KPI strip ────────────────────────────────────────────────────────────── */

export function RiskKpiStrip({ project }: { project?: string }) {
  const { risks, issues } = useRiskRegister();
  const { severityOf, rules } = useSeverity();
  const scopedRisks = project ? risks.filter((r) => r.project === project) : risks;
  const scopedIssues = project ? issues.filter((i) => i.project === project) : issues;

  const stats = useMemo(() => ({
    critical: scopedRisks.filter((r) => severityOf(r.score) === "Critical").length,
    high: scopedRisks.filter((r) => severityOf(r.score) === "High").length,
    medium: scopedRisks.filter((r) => severityOf(r.score) === "Medium").length,
    open: scopedRisks.filter((r) => r.status === "Open").length,
    issues: scopedIssues.filter((i) => i.status !== "Resolved").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [scopedRisks, scopedIssues, rules]);

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
      {[
        { l: `Critical (≥${rules.risk.criticalMin})`, v: stats.critical, bar: "bg-rag-red" },
        { l: `High (${rules.risk.highMin}–${rules.risk.criticalMin - 1})`, v: stats.high, bar: "bg-rag-amber" },
        { l: `Medium (${rules.risk.mediumMin}–${rules.risk.highMin - 1})`, v: stats.medium, bar: "bg-rag-blue" },
        { l: "Open Risks", v: stats.open, bar: "bg-border" },
        { l: "Open Issues", v: stats.issues, bar: "bg-border" },
      ].map((m) => (
        <div key={m.l} className="glass-card relative overflow-hidden p-4 pl-5">
          <span className={cn("absolute inset-y-0 left-0 w-[3px]", m.bar)} />
          <div className="text-xs text-muted-foreground">{m.l}</div>
          <div className="mt-1 text-xl font-medium num-mono text-foreground">{m.v}</div>
        </div>
      ))}
    </div>
  );
}
