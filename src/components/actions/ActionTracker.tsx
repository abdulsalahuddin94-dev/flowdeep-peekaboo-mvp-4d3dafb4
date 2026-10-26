import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "@tanstack/react-router";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { TableRowActions } from "@/components/TableRowActions";
import { Pill } from "@/components/Pill";
import { usePagination, TablePagination } from "@/components/TablePagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow,
} from "@/components/StyledTable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { EditAction, DeleteAction, ClipboardCheck, Plus, Check } from "@/lib/icons";
import { formatDateWithYear, formatDateTime } from "@/lib/date-format";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import { useRiskRegister } from "@/lib/risk-store";
import {
  useActions, isActionOverdue, daysOverdue, ACTION_SOURCES, ACTION_STATUSES,
  type ActionItem, type ActionSource, type ActionResponsibility, type ActionStatus, type ActionUpdate,
} from "@/lib/action-store";
import { useResponsibilities, respTone, defaultResponsibility } from "@/lib/responsibility-store";
import { useOrgActive } from "@/lib/org-active";
import { useBackParam } from "@/lib/record-pages";

export const T = {
  en: {
    title: "Action Tracker", add: "Add Action", meeting: "Log meeting actions", search: "Search action…",
    open: "Open", overdue: "Overdue", dueWeek: "Due this week", done: "Done", mine: "My actions",
    commentsUpdates: "Comments & Updates", updateStatus: "Update action status",
    commentTrackerHint: "Comments are saved with this action and can be viewed in the Action Tracker.",
    actionPlaceholder: "Action", responsibility: "Responsibility", dueDate: "Due date",
    addActionRow: "Add action", updateActionRow: "Update action", editActionRow: "Edit action", deleteActionRow: "Delete action",
    actionRowRequired: "Complete the action, responsibility, and due date first.", noDraftActions: "No actions added yet.",
    viewLinkedActions: "View linked actions in Action Tracker", linkedPlan: "Linked plan", allPlans: "All plans", doneWord: "done",
    linkedActionPlan: "Action plan",
    linkedRiskHint: "Actions are added to the project's Action Tracker and stay linked to this risk.",
    linkedIssueHint: "Actions are added to the project's Action Tracker and stay linked to this issue.",
    linkedMeetingHint: "Actions are added to the project's Action Tracker and stay linked to this meeting.",
  },
  ar: {
    title: "متابعة الإجراءات", add: "إضافة إجراء", meeting: "تسجيل إجراءات الاجتماع", search: "ابحث عن إجراء…",
    open: "مفتوح", overdue: "متأخر", dueWeek: "مستحق هذا الأسبوع", done: "منجز", mine: "إجراءاتي",
    commentsUpdates: "التعليقات والتحديثات", updateStatus: "تحديث حالة الإجراء",
    commentTrackerHint: "يُحفظ التعليق مع هذا الإجراء ويمكن الرجوع إليه من متابعة الإجراءات.",
    actionPlaceholder: "الإجراء", responsibility: "المسؤولية", dueDate: "تاريخ الاستحقاق",
    addActionRow: "إضافة إجراء", updateActionRow: "تحديث الإجراء", editActionRow: "تعديل الإجراء", deleteActionRow: "حذف الإجراء",
    actionRowRequired: "أكمل الإجراء ونوع المسؤولية وتاريخ الاستحقاق أولاً.", noDraftActions: "لم تتم إضافة إجراءات بعد.",
    viewLinkedActions: "عرض الإجراءات المرتبطة في متابعة الإجراءات", linkedPlan: "الخطة المرتبطة", allPlans: "كل الخطط", doneWord: "منجز",
    linkedActionPlan: "خطة الإجراءات",
    linkedRiskHint: "تُضاف الإجراءات إلى متابعة إجراءات المشروع وتظل مرتبطة بهذا الخطر.",
    linkedIssueHint: "تُضاف الإجراءات إلى متابعة إجراءات المشروع وتظل مرتبطة بهذه المشكلة.",
    linkedMeetingHint: "تُضاف الإجراءات إلى متابعة إجراءات المشروع وتظل مرتبطة بهذا الاجتماع.",
  },
};
const t = T.en;

export const STATUS_TONE: Record<ActionStatus | "Overdue", string> = {
  Open: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  "In Progress": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Done: "border-rag-green/40 bg-rag-green/10 text-rag-green",
  Cancelled: "border-border bg-muted text-muted-foreground",
  Overdue: "border-rag-red/40 bg-rag-red/10 text-rag-red",
};
const COMMENT_MAX = 500;
const todayIso = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

export function sourceLabel(a: ActionItem) {
  if (a.source === "Meeting") return a.meetingName ? `Meeting · ${a.meetingName}` : "Meeting";
  if (a.sourceRef) return `${a.source} · ${a.sourceRef}`;
  return a.source;
}

export function StatusCell({ a }: { a: ActionItem }) {
  const over = isActionOverdue(a);
  return <Pill label={over ? "Overdue" : a.status} tone={STATUS_TONE[over ? "Overdue" : a.status]} />;
}

function DueCell({ a }: { a: ActionItem }) {
  const over = isActionOverdue(a);
  return (
    <div className={cn("num-mono text-sm", over ? "text-rag-red" : "text-foreground")}>
      {formatDateWithYear(a.dueDate)}
      {over && <div className="text-[11px]">{daysOverdue(a)}d overdue</div>}
    </div>
  );
}

/* ── Tab ─────────────────────────────────────────────────────────────────── */

export function ActionTrackerTab({ project, initialSourceRef }: { project?: string; initialSourceRef?: string }) {
  const { actions, removeAction, removeActionUpdate } = useActions();
  const { currentUser } = useCurrentUser();
  const { projects } = useProjects();
  const { respTypes } = useResponsibilities();
  const navigate = useNavigate();
  const back = useBackParam();
  const pmo = !project;
  const projectNames = useMemo(() => projects.map((p) => p.name), [projects]);
  const [query, setQuery] = useState("");
  const [proj, setProj] = useState("all");
  const [ptype, setPtype] = useState("all");
  const [source, setSource] = useState("all");
  const [sourceRef, setSourceRef] = useState(initialSourceRef ?? "all");
  const [resp, setResp] = useState("all");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ActionItem | null>(null);
  const [pendingDeleteUpdate, setPendingDeleteUpdate] = useState<{ a: ActionItem; u: ActionUpdate } | null>(null);

  const scoped = project ? actions.filter((a) => a.project === project) : actions;
  const today = todayIso();
  const weekEnd = addDays(today, 7);
  const kpis = useMemo(() => ({
    open: scoped.filter((a) => a.status === "Open" || a.status === "In Progress").length,
    overdue: scoped.filter((a) => isActionOverdue(a, today)).length,
    week: scoped.filter((a) => (a.status === "Open" || a.status === "In Progress") && a.dueDate >= today && a.dueDate <= weekEnd).length,
    done: scoped.filter((a) => a.status === "Done").length,
    mine: scoped.filter((a) => a.owner === currentUser.name && a.status !== "Done" && a.status !== "Cancelled").length,
  }), [scoped, today, weekEnd, currentUser.name]);

  const q = query.trim().toLowerCase();
  const list = scoped
    .filter((a) => !q || a.title.toLowerCase().includes(q))
    .filter((a) => proj === "all" || a.project === proj)
    .filter((a) => ptype === "all" || projects.find((p) => p.name === a.project)?.businessLine === ptype)
    .filter((a) => source === "all" || a.source === source)
    .filter((a) => sourceRef === "all" || a.sourceRef === sourceRef)
    .filter((a) => resp === "all" || a.responsibility === resp)
    .filter((a) => owner === "all" || a.owner === owner)
    .filter((a) => status === "all" || (status === "Overdue" ? isActionOverdue(a) : a.status === status))
    .filter((a) => !onlyMine || a.owner === currentUser.name)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const pagination = usePagination(list, 10);
  const owners = Array.from(new Set(scoped.map((a) => a.owner)));
  const view = actions.find((a) => a.id === viewId) ?? null;

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t.search}
        filterGroups={[
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, { value: "Overdue", label: "Overdue" }, ...ACTION_STATUSES.map((v) => ({ value: v, label: v }))] },
          { key: "resp", label: "Responsibility", value: resp, onChange: setResp, options: [{ value: "all", label: "All parties" }, ...respTypes.map((v) => ({ value: v.name, label: v.name }))] },
          { key: "source", label: "Source", value: source, onChange: setSource, options: [{ value: "all", label: "All sources" }, ...ACTION_SOURCES.map((v) => ({ value: v, label: v }))] },
          { key: "sourceRef", label: t.linkedPlan, value: sourceRef, onChange: setSourceRef, options: [{ value: "all", label: t.allPlans }, ...Array.from(new Set(scoped.flatMap((a) => a.sourceRef ? [a.sourceRef] : []))).map((ref) => ({ value: ref, label: ref }))] },
          { key: "owner", label: "Owner", value: owner, onChange: setOwner, options: [{ value: "all", label: "All owners" }, ...owners.map((v) => ({ value: v, label: v }))] },
          ...(pmo ? [
            { key: "project", label: "Project", value: proj, onChange: setProj, options: [{ value: "all", label: "All projects" }, ...projectNames.map((v) => ({ value: v, label: v }))] },
            { key: "ptype", label: "Project type", value: ptype, onChange: setPtype, options: [{ value: "all", label: "All project types" }, ...Array.from(new Set(projects.map((p) => p.businessLine))).map((v) => ({ value: v, label: v }))] },
          ] : []),
        ]}
        trailing={
          <div className="flex items-center gap-2">
            <Button variant={onlyMine ? "primary" : "outline"} onClick={() => setOnlyMine((v) => !v)}>{t.mine}</Button>
            <Button variant="primary" onClick={() => navigate({ to: "/actions/new", search: { project, back } })}>{t.add}</Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: t.open, v: kpis.open, bar: "bg-rag-blue" },
          { l: t.overdue, v: kpis.overdue, bar: "bg-rag-red", onClick: () => setStatus("Overdue") },
          { l: t.dueWeek, v: kpis.week, bar: "bg-rag-amber" },
          { l: t.done, v: kpis.done, bar: "bg-rag-green" },
          { l: t.mine, v: kpis.mine, bar: "bg-accent", onClick: () => setOnlyMine(true) },
        ].map((m) => (
          <button key={m.l} type="button" onClick={m.onClick} disabled={!m.onClick} className="glass-card relative overflow-hidden p-4 pl-5 text-start disabled:cursor-default">
            <span className={cn("absolute inset-y-0 start-0 w-[3px]", m.bar)} />
            <div className="text-xs text-muted-foreground">{m.l}</div>
            <div className="mt-1 text-xl font-medium num-mono text-foreground">{m.v}</div>
          </button>
        ))}
      </div>

      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            {pmo && <StyledTableHead>Project</StyledTableHead>}
            <StyledTableHead>Action</StyledTableHead>
            <StyledTableHead>Source</StyledTableHead>
            <StyledTableHead>Owner</StyledTableHead>
            <StyledTableHead>Responsibility</StyledTableHead>
            <StyledTableHead>Due date</StyledTableHead>
            <StyledTableHead className="w-40 text-center">Status</StyledTableHead>
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <StyledTableBody>
          {pagination.pageItems.length === 0 && <EmptyRow colSpan={pmo ? 7 : 6} />}
          {pagination.pageItems.map((a) => (
            <StyledTableRow key={a.id} className="group cursor-pointer" onClick={() => setViewId(a.id)}>
              {pmo && <StyledTableCell className="text-sm text-muted-foreground">{a.project}</StyledTableCell>}
              <StyledTableCell className="font-medium text-foreground">{a.title}</StyledTableCell>
              <StyledTableCell><Badge variant="outline">{sourceLabel(a)}</Badge></StyledTableCell>
              <StyledTableCell className="text-sm">{a.owner}</StyledTableCell>
              <StyledTableCell><Pill label={a.responsibility} tone={respTone(a.responsibility, respTypes)} /></StyledTableCell>
              <StyledTableCell><DueCell a={a} /></StyledTableCell>
              <StyledTableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                <TableRowActions
                  showStatus
                  statusNode={<StatusCell a={a} />}
                  onStatus={() => navigate({ to: "/actions/$actionId", params: { actionId: a.id }, search: { back } })}
                  statusIcon={<ClipboardCheck size={15} />}
                  statusLabel={t.updateStatus}
                  onEdit={() => navigate({ to: "/actions/$actionId", params: { actionId: a.id }, search: { back } })}
                  onDelete={() => setPendingDelete(a)}
                />
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </StyledTableBody>
      </StyledTable>
      <TablePagination {...pagination} />

      <ActionDrawer
        action={view}
        onClose={() => setViewId(null)}
        onUpdate={(a) => { setViewId(null); navigate({ to: "/actions/$actionId", params: { actionId: a.id }, search: { back } }); }}
        onEdit={(a) => { setViewId(null); navigate({ to: "/actions/$actionId", params: { actionId: a.id }, search: { back } }); }}
        onEditUpdate={(a) => { setViewId(null); navigate({ to: "/actions/$actionId", params: { actionId: a.id }, search: { back } }); }}
        onDeleteUpdate={(a, u) => setPendingDeleteUpdate({ a, u })}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title="Delete this action?"
        description="The action and its comments will be permanently removed."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { if (pendingDelete) removeAction(pendingDelete.id); setPendingDelete(null); toast.success("Action deleted"); }}
      />
      <ConfirmDialog
        open={!!pendingDeleteUpdate}
        onOpenChange={(o) => { if (!o) setPendingDeleteUpdate(null); }}
        title="Delete this comment?"
        description="The comment will be removed from the action history. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { if (pendingDeleteUpdate) removeActionUpdate(pendingDeleteUpdate.a.id, pendingDeleteUpdate.u.id); setPendingDeleteUpdate(null); }}
      />
    </>
  );
}


/* ── Meeting batch ───────────────────────────────────────────────────────── */

export type ActionRow = { title: string; responsibility: ActionResponsibility; dueDate: string };
type Row = ActionRow;
export const emptyActionRow = (responsibility: ActionResponsibility = "Internal"): ActionRow => ({ title: "", responsibility, dueDate: "" });
/** Rows with a title; all of them must have a due date to be valid. */
export function filledActionRows(rows: ActionRow[]) { return rows.filter((r) => r.title.trim()); }
export function actionRowsValid(rows: ActionRow[]) { return filledActionRows(rows).every((r) => r.dueDate); }
export function cleanActionRows(rows: ActionRow[]) { return filledActionRows(rows).map((r) => ({ ...r, title: r.title.trim().slice(0, 150) })); }

/** Shared calendar-style action composer (meeting batch, risk mitigation, issue action plan). */
export function ActionRowsEditor({ rows, onChange, label = "Actions", hint }: { rows: ActionRow[]; onChange: (rows: ActionRow[]) => void; label?: string; hint?: string }) {
  const { respTypes } = useResponsibilities();
  const { isActive } = useOrgActive("responsibility-type");
  const committed = filledActionRows(rows);
  const freshDraft = () => emptyActionRow(defaultResponsibility(respTypes, isActive));
  const [draft, setDraft] = useState<Row>(freshDraft);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const upDraft = (patch: Partial<Row>) => setDraft((current) => ({ ...current, ...patch }));

  function resetDraft() {
    setDraft(freshDraft());
    setEditingIndex(null);
  }

  function commitDraft() {
    if (!draft.title.trim() || !draft.responsibility || !draft.dueDate) {
      toast.error(t.actionRowRequired);
      return;
    }
    const clean = { ...draft, title: draft.title.trim().slice(0, 150) };
    if (editingIndex === null) onChange([...committed, clean]);
    else onChange(committed.map((row, index) => index === editingIndex ? clean : row));
    resetDraft();
  }

  function editRow(index: number) {
    const row = committed[index];
    if (!row) return;
    setDraft({ ...row });
    setEditingIndex(index);
  }

  function deleteRow(index: number) {
    onChange(committed.filter((_, rowIndex) => rowIndex !== index));
    if (editingIndex === index) resetDraft();
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  }

  return (
    <div className="space-y-2">
      <div className="label-eyebrow">{label}</div>
      <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
        <Input aria-label={t.actionPlaceholder} maxLength={150} value={draft.title} onChange={(e) => upDraft({ title: e.target.value })} placeholder={t.actionPlaceholder} />
        <div className="grid grid-cols-[minmax(160px,1fr)_190px_36px] items-start gap-2">
          <Select value={draft.responsibility} onValueChange={(v) => upDraft({ responsibility: v as ActionResponsibility })}>
            <SelectTrigger aria-label={t.responsibility}><SelectValue placeholder={t.responsibility} /></SelectTrigger>
            <SelectContent>{respTypes.filter((s) => isActive(s.name) || s.name === draft.responsibility).map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <DatePicker value={draft.dueDate} onChange={(v) => upDraft({ dueDate: v })} placeholder={t.dueDate} />
          <Button type="button" variant="primary" size="icon" aria-label={editingIndex === null ? t.addActionRow : t.updateActionRow} title={editingIndex === null ? t.addActionRow : t.updateActionRow} onClick={commitDraft} className="h-9 w-9 shrink-0">
            {editingIndex === null ? <Plus size={16} /> : <Check size={16} />}
          </Button>
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-card">
        {committed.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">{t.noDraftActions}</div>
        ) : (
          <div className="divide-y divide-border/60">
            {committed.map((row, index) => (
              <div key={`${row.title}-${index}`} className={cn("group flex min-h-14 items-center gap-3 px-3 py-2 transition hover:bg-accent/5", editingIndex === index && "bg-accent/5")}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{row.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                    <span>{row.responsibility}</span><span aria-hidden="true">·</span><span className="num-mono">{formatDateWithYear(row.dueDate)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button type="button" variant="ghost" size="icon" aria-label={t.editActionRow} title={t.editActionRow} onClick={() => editRow(index)} className="h-7 w-7 text-accent-secondary"><EditAction size={14} /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={t.deleteActionRow} title={t.deleteActionRow} onClick={() => deleteRow(index)} className="h-7 w-7 text-muted-foreground hover:!bg-rag-red/15 hover:!text-rag-red"><DeleteAction size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}


/* ── Drawer ──────────────────────────────────────────────────────────────── */

function ActionDrawer({ action: a, onClose, onUpdate, onEdit, onEditUpdate, onDeleteUpdate }: {
  action: ActionItem | null; onClose: () => void; onUpdate: (a: ActionItem) => void; onEdit: (a: ActionItem) => void;
  onEditUpdate: (a: ActionItem, u: ActionUpdate) => void; onDeleteUpdate: (a: ActionItem, u: ActionUpdate) => void;
}) {
  const { respTypes } = useResponsibilities();
  if (!a) return <Sheet open={false} />;
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2"><StatusCell a={a} /><Pill label={a.responsibility} tone={respTone(a.responsibility, respTypes)} /></div>
          <SheetTitle className="mt-2 text-lg">{a.title}</SheetTitle>
          <SheetDescription className="text-xs">{a.id} · {sourceLabel(a)}</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[{ l: "Owner", v: a.owner }, { l: "Due date", v: formatDateWithYear(a.dueDate) }, { l: "Closed", v: formatDateWithYear(a.closedDate) }].map((k) => (
            <div key={k.l} className="px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 text-sm font-medium text-foreground">{k.v}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {a.source === "Meeting" && (
            <div><div className="label-eyebrow mb-1">Meeting</div><p className="text-sm text-foreground">{a.meetingName ?? "—"} · {formatDateWithYear(a.meetingDate)}</p></div>
          )}
          <div><div className="label-eyebrow mb-1">Description</div><p className="text-sm text-muted-foreground">{a.description || "No description."}</p></div>
          <Separator />
          <div>
            <div className="label-eyebrow mb-2">{t.commentsUpdates}</div>
            {a.updates.length === 0 && <p className="text-sm text-muted-foreground">No updates recorded yet.</p>}
            <div className="space-y-3">
              {a.updates.map((u) => (
                <div key={u.id} className="rounded-lg border border-border bg-[var(--field-bg-filled)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{u.by}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="num-mono text-[10px] text-muted-foreground">{formatDateTime(u.at)}</span>
                      <button type="button" aria-label="Edit comment" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => onEditUpdate(a, u)}><EditAction size={13} /></button>
                      <button type="button" aria-label="Delete comment" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeleteUpdate(a, u)}><DeleteAction size={13} /></button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{u.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border px-6 py-4">
          <Button variant="primary" className="flex-1" onClick={() => onUpdate(a)}>{t.updateStatus}</Button>
          <Button variant="outline" className="flex-1" onClick={() => onEdit(a)}>Edit action</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* Comments list: scrolling starts only once a third comment exists. The cap
   follows the real rendered height of the first two, so they never get cut. */
function CommentList({ updates, onEdit, onDelete }: { updates: ActionUpdate[]; onEdit: (u: ActionUpdate) => void; onDelete: (u: ActionUpdate) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cap, setCap] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    if (kids.length < 3) { setCap(null); return; }
    const measure = () => {
      setCap(Math.ceil(kids[1].getBoundingClientRect().bottom - el.getBoundingClientRect().top + el.scrollTop) + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    kids.slice(0, 2).forEach((k) => ro.observe(k));
    return () => ro.disconnect();
  }, [updates]);
  return (
    <div ref={ref} role="group" aria-label={t.commentsUpdates} className="space-y-3 overflow-y-auto overscroll-contain pr-1" style={cap ? { maxHeight: cap } : undefined}>
      {updates.map((u) => (
        <div key={u.id} className="rounded-lg border border-border bg-[var(--field-bg-filled)] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">{u.by}</span>
            <div className="flex items-center gap-1.5">
              <span className="num-mono text-[10px] text-muted-foreground">{formatDateTime(u.at)}</span>
              <button type="button" aria-label="Edit comment" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => onEdit(u)}><EditAction size={13} /></button>
              <button type="button" aria-label="Delete comment" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(u)}><DeleteAction size={13} /></button>
            </div>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{u.comment}</p>
        </div>
      ))}
    </div>
  );
}


/** Compact "done/total" indicator for register tables. */
export function ActionsCount({ source, sourceRef }: { source: "Risk" | "Issue"; sourceRef: string }) {
  const { actions } = useActions();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const linked = actions.filter((a) => a.source === source && a.sourceRef === sourceRef);
  if (!linked.length) return <span className="text-muted-foreground">—</span>;
  const done = linked.filter((a) => a.status === "Done").length;
  const over = linked.some((a) => isActionOverdue(a));
  const project = projects.find((p) => p.name === linked[0]?.project);
  if (!project) return <span className={cn("num-mono text-sm", over ? "text-rag-red" : "text-foreground")}>{done}/{linked.length}</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="link" className={cn("h-7 px-0 num-mono text-sm", over ? "text-rag-red" : "text-foreground")}
          aria-label={`${t.viewLinkedActions} · ${sourceRef} · ${done} of ${linked.length}`}
          onClick={(event) => {
            event.stopPropagation();
            navigate({ to: "/portfolio/$projectId", params: { projectId: project.id }, search: { tab: "Action Tracker", actionRef: sourceRef } });
          }}>
          {linked.length}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{`${done} ${t.doneWord} · ${linked.length}`}</TooltipContent>
    </Tooltip>
  );
}
