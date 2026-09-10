import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { EmptyRegion } from "@/lib/empty-preview";
import { TableRowActions } from "@/components/TableRowActions";
import { usePagination, TablePagination } from "@/components/TablePagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
import {
  StyledTable, StyledTableBody, StyledTableCell, StyledTableHead,
  StyledTableHeader, StyledTableHeaderRow, StyledTableRow,
} from "@/components/StyledTable";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Paperclip } from "@/lib/icons";
import {
  risks as seedRisks, issues as seedIssues, projects, RISK_CATEGORIES,
  type RiskItem, type RiskStatus, type IssueItem, type IssuePriority, type IssueStatus,
} from "@/lib/mock-data";

export const Route = createFileRoute("/risks")({
  component: RisksPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Risk & Issues — Nexus PMO" },
      { name: "description", content: "Portfolio-wide risk register, probability × impact heat map and the live issues log." },
      { property: "og:title", content: "Risk & Issues — Nexus PMO" },
      { property: "og:description", content: "Track risks, mitigation plans and open issues across the whole portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/* ── Severity helpers ─────────────────────────────────────────────────────── */

type Severity = "Critical" | "High" | "Medium" | "Low";

function severityOf(score: number): Severity {
  if (score >= 15) return "Critical";
  if (score >= 9) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

const SEVERITY_TONE: Record<Severity, string> = {
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

/** Small round icon button used for the "Update status" row action. */
function StatusActionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      data-ds-size="auto"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-9 w-9 shrink-0 rounded-full border border-border/60 !bg-[var(--btn-secondary-bg)] text-accent-secondary opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 hover:!bg-[var(--btn-secondary-bg-hover)]"
    >
      <ClipboardCheck size={16} />
    </Button>
  );
}

function Pill({ label, tone }: { label: string; tone: string }) {
  return <Badge variant="outline" className={cn("rounded-full", tone)}>{label}</Badge>;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

const TAB_LABEL: Record<string, string> = {
  register: "Risk Register",
  heatmap: "Heat Map",
  issues: "Issues Log",
};

function RisksPage() {
  const { tab = "register" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [riskRows, setRiskRows] = useState<RiskItem[]>(seedRisks);
  const [issueRows, setIssueRows] = useState<IssueItem[]>(seedIssues);

  const stats = useMemo(() => ({
    critical: riskRows.filter((r) => severityOf(r.score) === "Critical").length,
    high: riskRows.filter((r) => severityOf(r.score) === "High").length,
    medium: riskRows.filter((r) => severityOf(r.score) === "Medium").length,
    open: riskRows.filter((r) => r.status === "Open").length,
    issues: issueRows.filter((i) => i.status !== "Resolved").length,
  }), [riskRows, issueRows]);

  return (
    <div>
      <PageHeader title="Risk & Issues" current={TAB_LABEL[tab] ?? "Risk Register"} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: "Critical (≥15)", v: stats.critical, bar: "bg-rag-red" },
          { l: "High (9–14)", v: stats.high, bar: "bg-rag-amber" },
          { l: "Medium (4–8)", v: stats.medium, bar: "bg-rag-blue" },
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

      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>
        <TabsContent value="register" className="mt-0">
          <RegisterTab rows={riskRows} setRows={setRiskRows} />
        </TabsContent>
        <TabsContent value="heatmap" className="mt-0">
          <HeatmapTab rows={riskRows} />
        </TabsContent>
        <TabsContent value="issues" className="mt-0">
          <IssuesTab rows={issueRows} setRows={setIssueRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Register tab ─────────────────────────────────────────────────────────── */

function RegisterTab({ rows, setRows }: { rows: RiskItem[]; setRows: (fn: (prev: RiskItem[]) => RiskItem[]) => void }) {
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RiskItem | null>(null);
  const [view, setView] = useState<RiskItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RiskItem | null>(null);
  const [statusFor, setStatusFor] = useState<RiskItem | null>(null);

  const q = query.trim().toLowerCase();
  const list = rows
    .filter((r) => !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q))
    .filter((r) => projectFilter.length === 0 || projectFilter.includes(r.project))
    .filter((r) => categoryFilter.length === 0 || categoryFilter.includes(r.category))
    .filter((r) => severity === "all" || severityOf(r.score) === severity)
    .filter((r) => status === "all" || r.status === status);

  const pagination = usePagination(list, 10);
  const projectOptions = Array.from(new Set([...projects.map((p) => p.name), ...rows.map((r) => r.project)]));

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search risk, ID or owner…"
        filterGroups={[
          { key: "project", label: "Projects", mode: "multi", value: projectFilter, onChange: setProjectFilter, options: [{ value: "all", label: "All projects" }, ...projectOptions.map((p) => ({ value: p, label: p }))] },
          { key: "category", label: "Categories", mode: "multi", value: categoryFilter, onChange: setCategoryFilter, options: [{ value: "all", label: "All categories" }, ...RISK_CATEGORIES.map((c) => ({ value: c, label: c }))] },
          { key: "severity", label: "Score", value: severity, onChange: setSeverity, options: [{ value: "all", label: "All severities" }, { value: "Critical", label: "Critical" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, ...RISK_STATUSES.map((v) => ({ value: v, label: v }))] },
        ]}
        cta={<Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>Log Risk</Button>}
      />

      <EmptyRegion id="risks-register">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="whitespace-nowrap">ID</StyledTableHead>
              <StyledTableHead>Project</StyledTableHead>
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
            {list.length === 0 && <EmptyRow colSpan={12} />}
            {pagination.pageItems.map((r) => (
              <StyledTableRow key={r.id} onClick={() => setView(r)} className="cursor-pointer">
                <StyledTableCell className="num-mono text-xs text-muted-foreground">{r.id}</StyledTableCell>
                <StyledTableCell className="text-muted-foreground">{r.project}</StyledTableCell>
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
                  <div className="flex items-center justify-end gap-1.5">
                    <StatusActionButton label="Update risk status" onClick={() => setStatusFor(r)} />
                    <TableRowActions
                      onEdit={() => { setEditing(r); setFormOpen(true); }}
                      onDelete={() => setPendingDelete(r)}
                    />
                  </div>
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
        projectOptions={projectOptions}
        onSave={(risk) => {
          setRows((prev) => (editing ? prev.map((r) => (r.id === editing.id ? risk : r)) : [risk, ...prev]));
          toast.done("Risk", editing ? "updated" : "logged");
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <RiskSheet
        risk={view}
        onClose={() => setView(null)}
        onEdit={(r) => { setView(null); setEditing(r); setFormOpen(true); }}
        onStatus={(r, next) => {
          setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
          setView({ ...r, status: next });
          toast.done("Risk", next === "Mitigated" ? "mitigated" : "updated");
        }}
      />

      <RiskStatusDialog
        key={`status-${statusFor?.id ?? "none"}`}
        risk={statusFor}
        onClose={() => setStatusFor(null)}
        onSave={(next, mitigation) => {
          setRows((prev) => prev.map((x) => (x.id === statusFor?.id ? { ...x, status: next, mitigation } : x)));
          toast.done("Risk status", "updated");
          setStatusFor(null);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="The risk is removed from the register. Mitigation history is lost."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          setRows((prev) => prev.filter((r) => r.id !== pendingDelete?.id));
          toast.done("Risk", "deleted");
          setPendingDelete(null);
        }}
      />
    </>
  );
}

/* ── Risk form ────────────────────────────────────────────────────────────── */

function RiskFormDialog({
  open, onOpenChange, risk, projectOptions, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  risk: RiskItem | null;
  projectOptions: string[];
  onSave: (risk: RiskItem) => void;
}) {
  const [title, setTitle] = useState(risk?.title ?? "");
  const [project, setProject] = useState(risk?.project ?? "");
  const [category, setCategory] = useState(risk?.category ?? "");
  const [owner, setOwner] = useState(risk?.owner ?? "");
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
    if (!owner.trim()) next.owner = "Risk owner is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      id: risk?.id ?? `R-${String(Math.floor(100 + Math.random() * 800))}`,
      project, title: title.trim(), category, owner: owner.trim(),
      prob: Number(prob), impact: Number(impact), score, status,
      mitigation: mitigation.trim(),
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={risk ? "Edit risk" : "Log a new risk"}
      size="lg"
      submitLabel={risk ? "Save Changes" : "Log Risk"}
      onSubmit={submit}
    >
      <Field label="Risk title" htmlFor="risk-title" error={errors.title}>
        <Input id="risk-title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); }} placeholder="Describe the risk in one line" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Project" htmlFor="risk-project" error={errors.project}>
          <Select value={project} onValueChange={(v) => { setProject(v); setErrors((x) => ({ ...x, project: "" })); }}>
            <SelectTrigger id="risk-project"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Category" htmlFor="risk-category" error={errors.category}>
          <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((x) => ({ ...x, category: "" })); }}>
            <SelectTrigger id="risk-category"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {RISK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Field label="Probability" htmlFor="risk-prob" hint="1 – 5">
          <Select value={prob} onValueChange={setProb}>
            <SelectTrigger id="risk-prob"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Impact" htmlFor="risk-impact" hint="1 – 5">
          <Select value={impact} onValueChange={setImpact}>
            <SelectTrigger id="risk-impact"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Score" hint="Probability × Impact">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-[var(--field-bg-filled)] px-3">
            <span className="num-mono text-sm text-foreground">{score}</span>
            <Pill label={severityOf(score)} tone={SEVERITY_TONE[severityOf(score)]} />
          </div>
        </Field>
        <Field label="Status" htmlFor="risk-status">
          <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
            <SelectTrigger id="risk-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RISK_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Risk owner" htmlFor="risk-owner" error={errors.owner}>
        <Input id="risk-owner" value={owner} onChange={(e) => { setOwner(e.target.value); setErrors((x) => ({ ...x, owner: "" })); }} placeholder="Who manages this risk?" />
      </Field>

      <Field label="Mitigation plan" htmlFor="risk-mitigation" optional>
        <Textarea id="risk-mitigation" value={mitigation} onChange={(e) => setMitigation(e.target.value)} placeholder="Actions that reduce probability or impact" rows={3} />
      </Field>
    </FormDialog>
  );
}

/* ── Risk detail sheet ────────────────────────────────────────────────────── */

function RiskSheet({
  risk, onClose, onEdit, onStatus,
}: {
  risk: RiskItem | null;
  onClose: () => void;
  onEdit: (r: RiskItem) => void;
  onStatus: (r: RiskItem, next: RiskStatus) => void;
}) {
  if (!risk) return null;
  const severity = severityOf(risk.score);

  return (
    <Sheet open={!!risk} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col p-0">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <span className="num-mono text-xs text-muted-foreground">{risk.id}</span>
            <Pill label={severity} tone={SEVERITY_TONE[severity]} />
            <Pill label={risk.status} tone={RISK_STATUS_TONE[risk.status]} />
          </div>
          <SheetTitle className="mt-2 text-lg">{risk.title}</SheetTitle>
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
            <p className="text-sm text-foreground">{risk.owner}</p>
          </div>
          <Separator />
          <div>
            <div className="label-eyebrow mb-1">Mitigation plan</div>
            <p className="text-sm text-muted-foreground">{risk.mitigation || "No mitigation plan recorded yet."}</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border px-6 py-4">
          <div className="flex gap-2">
            {risk.status !== "In Progress" && (
              <Button variant="primary" className="flex-1" onClick={() => onStatus(risk, "In Progress")}>Mark as In Progress</Button>
            )}
            {risk.status !== "Mitigated" && (
              <Button variant="outlineSecondary" className="flex-1" onClick={() => onStatus(risk, "Mitigated")}>Mark as Mitigated</Button>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={() => onEdit(risk)}>Edit Risk</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Heat map tab ─────────────────────────────────────────────────────────── */

function HeatmapTab({ rows }: { rows: RiskItem[] }) {
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
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">Probability × Impact</div>
            <p className="mt-1 text-xs text-muted-foreground">Select a cell to see the risks it holds.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["Critical", "High", "Medium", "Low"] as Severity[]).map((s) => (
              <Pill key={s} label={s} tone={SEVERITY_TONE[s]} />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center">
            <span className="-rotate-90 whitespace-nowrap text-xs text-muted-foreground">Probability →</span>
          </div>
          <div className="flex flex-col justify-between py-0.5 text-right">
            {[5, 4, 3, 2, 1].map((p) => (
              <div key={p} className="flex flex-1 items-center justify-end pr-1 text-xs text-muted-foreground">{p}</div>
            ))}
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-2">
              {[5, 4, 3, 2, 1].map((p) =>
                [1, 2, 3, 4, 5].map((i) => {
                  const items = at(p, i);
                  return (
                    <button
                      key={`${p}-${i}`}
                      type="button"
                      onClick={() => items.length > 0 && setCell({ p, i })}
                      className={cn(
                        "flex aspect-[4/3] flex-col items-center justify-center rounded-lg border transition",
                        toneFor(p * i),
                        items.length > 0 ? "hover:brightness-125" : "opacity-50",
                      )}
                    >
                      <span className="num-mono text-2xl font-medium">{items.length}</span>
                      <span className="mt-0.5 text-[10px] opacity-80">{p * i}</span>
                    </button>
                  );
                }),
              )}
            </div>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center text-xs text-muted-foreground">{i}</div>
              ))}
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">Impact →</div>
          </div>
        </div>
      </div>

      <FormDialog
        open={!!cell}
        onOpenChange={(o) => !o && setCell(null)}
        title={cell ? `Probability ${cell.p} × Impact ${cell.i}` : ""}
        size="lg"
        hideFooter
      >
        <div className="space-y-2">
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
      </FormDialog>
    </>
  );
}

/* ── Issues tab ───────────────────────────────────────────────────────────── */

function IssuesTab({ rows, setRows }: { rows: IssueItem[]; setRows: (fn: (prev: IssueItem[]) => IssueItem[]) => void }) {
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IssueItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IssueItem | null>(null);

  const q = query.trim().toLowerCase();
  const list = rows
    .filter((i) => !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.owner.toLowerCase().includes(q))
    .filter((i) => projectFilter.length === 0 || projectFilter.includes(i.project))
    .filter((i) => priority === "all" || i.priority === priority)
    .filter((i) => status === "all" || i.status === status);

  const pagination = usePagination(list, 10);
  const projectOptions = Array.from(new Set([...projects.map((p) => p.name), ...rows.map((r) => r.project)]));

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search issue, ID or owner…"
        filterGroups={[
          { key: "project", label: "Projects", mode: "multi", value: projectFilter, onChange: setProjectFilter, options: [{ value: "all", label: "All projects" }, ...projectOptions.map((p) => ({ value: p, label: p }))] },
          { key: "priority", label: "Priority", value: priority, onChange: setPriority, options: [{ value: "all", label: "All priorities" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, { value: "Open", label: "Open" }, { value: "In Progress", label: "In Progress" }, { value: "Resolved", label: "Resolved" }] },
        ]}
        cta={<Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>Log Issue</Button>}
      />

      <EmptyRegion id="risks-issues">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="whitespace-nowrap">ID</StyledTableHead>
              <StyledTableHead>Project</StyledTableHead>
              <StyledTableHead>Issue</StyledTableHead>
              <StyledTableHead className="text-center">Priority</StyledTableHead>
              <StyledTableHead>Owner</StyledTableHead>
              <StyledTableHead className="text-center whitespace-nowrap">Raised</StyledTableHead>
              <StyledTableHead className="text-center">Status</StyledTableHead>
              <StyledTableHead className="w-32" />
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <StyledTableBody>
            {list.length === 0 && <EmptyRow colSpan={8} />}
            {pagination.pageItems.map((i) => (
              <StyledTableRow key={i.id}>
                <StyledTableCell className="num-mono text-xs text-muted-foreground">{i.id}</StyledTableCell>
                <StyledTableCell className="text-muted-foreground">{i.project}</StyledTableCell>
                <StyledTableCell className="font-medium text-foreground">{i.title}</StyledTableCell>
                <StyledTableCell className="text-center"><Pill label={i.priority} tone={PRIORITY_TONE[i.priority]} /></StyledTableCell>
                <StyledTableCell className="text-muted-foreground">{i.owner}</StyledTableCell>
                <StyledTableCell className="text-center text-xs text-muted-foreground">{i.raised}</StyledTableCell>
                <StyledTableCell className="text-center"><Pill label={i.status} tone={ISSUE_STATUS_TONE[i.status]} /></StyledTableCell>
                <StyledTableCell>
                  <TableRowActions
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
        projectOptions={projectOptions}
        onSave={(issue) => {
          setRows((prev) => (editing ? prev.map((r) => (r.id === editing.id ? issue : r)) : [issue, ...prev]));
          toast.done("Issue", editing ? "updated" : "logged");
          setFormOpen(false);
          setEditing(null);
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
          setRows((prev) => prev.filter((r) => r.id !== pendingDelete?.id));
          toast.done("Issue", "deleted");
          setPendingDelete(null);
        }}
      />
    </>
  );
}

function IssueFormDialog({
  open, onOpenChange, issue, projectOptions, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  issue: IssueItem | null;
  projectOptions: string[];
  onSave: (issue: IssueItem) => void;
}) {
  const [title, setTitle] = useState(issue?.title ?? "");
  const [project, setProject] = useState(issue?.project ?? "");
  const [owner, setOwner] = useState(issue?.owner ?? "");
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority ?? "Medium");
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "Open");
  const [action, setAction] = useState(issue?.action ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Issue title is required";
    if (!project) next.project = "Select the project this issue belongs to";
    if (!owner.trim()) next.owner = "Issue owner is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      id: issue?.id ?? `I-${String(Math.floor(45 + Math.random() * 400))}`,
      project, title: title.trim(), owner: owner.trim(), priority, status,
      raised: issue?.raised ?? "Today",
      action: action.trim(),
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={issue ? "Edit issue" : "Log a new issue"}
      size="lg"
      submitLabel={issue ? "Save Changes" : "Log Issue"}
      onSubmit={submit}
    >
      <Field label="Issue title" htmlFor="issue-title" error={errors.title}>
        <Input id="issue-title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); }} placeholder="What is blocking or going wrong?" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Project" htmlFor="issue-project" error={errors.project}>
          <Select value={project} onValueChange={(v) => { setProject(v); setErrors((x) => ({ ...x, project: "" })); }}>
            <SelectTrigger id="issue-project"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>{projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Issue owner" htmlFor="issue-owner" error={errors.owner}>
          <Input id="issue-owner" value={owner} onChange={(e) => { setOwner(e.target.value); setErrors((x) => ({ ...x, owner: "" })); }} placeholder="Who resolves it?" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Action taken" htmlFor="issue-action" optional>
        <Textarea id="issue-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="Current corrective action" rows={3} />
      </Field>
    </FormDialog>
  );
}
