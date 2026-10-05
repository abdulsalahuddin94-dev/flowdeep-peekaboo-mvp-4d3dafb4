import { useMemo, useState } from "react";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { TableRowActions } from "@/components/TableRowActions";
import { Pill } from "@/components/Pill";
import { usePagination, TablePagination } from "@/components/TablePagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormDialog } from "@/components/ui/form-dialog";
import { Field } from "@/components/ui/field";
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
import { EditAction, DeleteAction, ClipboardCheck, Plus } from "@/lib/icons";
import { formatDateWithYear } from "@/lib/date-format";
import { useCurrentUser } from "@/lib/projects-store";
import { useRiskRegister } from "@/lib/risk-store";
import {
  useActions, isActionOverdue, daysOverdue, ACTION_SOURCES, ACTION_RESPONSIBILITIES, ACTION_STATUSES,
  type ActionItem, type ActionSource, type ActionResponsibility, type ActionStatus, type ActionUpdate,
} from "@/lib/action-store";

export const T = {
  en: {
    title: "Action Tracker", add: "Add Action", meeting: "Log meeting actions", search: "Search action…",
    open: "Open", overdue: "Overdue", dueWeek: "Due this week", done: "Done", mine: "My actions",
    commentsUpdates: "Comments & Updates", updateStatus: "Update action status",
    commentTrackerHint: "Comments are saved with this action and can be viewed in the Action Tracker.",
  },
  ar: {
    title: "متابعة الإجراءات", add: "إضافة إجراء", meeting: "تسجيل إجراءات الاجتماع", search: "ابحث عن إجراء…",
    open: "مفتوح", overdue: "متأخر", dueWeek: "مستحق هذا الأسبوع", done: "منجز", mine: "إجراءاتي",
    commentsUpdates: "التعليقات والتحديثات", updateStatus: "تحديث حالة الإجراء",
    commentTrackerHint: "يُحفظ التعليق مع هذا الإجراء ويمكن الرجوع إليه من متابعة الإجراءات.",
  },
};
const t = T.en;

const STATUS_TONE: Record<ActionStatus | "Overdue", string> = {
  Open: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  "In Progress": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Done: "border-rag-green/40 bg-rag-green/10 text-rag-green",
  Cancelled: "border-border bg-muted text-muted-foreground",
  Overdue: "border-rag-red/40 bg-rag-red/10 text-rag-red",
};
const RESP_TONE: Record<ActionResponsibility, string> = {
  Internal: "border-accent/40 bg-accent/10 text-accent",
  Client: "border-rag-teal/40 bg-rag-teal/10 text-rag-teal",
  Vendor: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
};
const COMMENT_MAX = 500;
const todayIso = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

function sourceLabel(a: ActionItem) {
  if (a.source === "Meeting") return a.meetingName ? `Meeting · ${a.meetingName}` : "Meeting";
  if (a.sourceRef) return `${a.source} · ${a.sourceRef}`;
  return a.source;
}

function StatusCell({ a }: { a: ActionItem }) {
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

export function ActionTrackerTab({ project }: { project: string }) {
  const { actions, addAction, updateAction, removeAction, logActionUpdate, editActionUpdate, removeActionUpdate } = useActions();
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [resp, setResp] = useState("all");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ActionItem | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [statusFor, setStatusFor] = useState<ActionItem | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<ActionUpdate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ActionItem | null>(null);
  const [pendingDeleteUpdate, setPendingDeleteUpdate] = useState<{ a: ActionItem; u: ActionUpdate } | null>(null);

  const scoped = actions.filter((a) => a.project === project);
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
    .filter((a) => source === "all" || a.source === source)
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

      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t.search}
        filterGroups={[
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, { value: "Overdue", label: "Overdue" }, ...ACTION_STATUSES.map((v) => ({ value: v, label: v }))] },
          { key: "resp", label: "Responsibility", value: resp, onChange: setResp, options: [{ value: "all", label: "All parties" }, ...ACTION_RESPONSIBILITIES.map((v) => ({ value: v, label: v }))] },
          { key: "source", label: "Source", value: source, onChange: setSource, options: [{ value: "all", label: "All sources" }, ...ACTION_SOURCES.map((v) => ({ value: v, label: v }))] },
          { key: "owner", label: "Owner", value: owner, onChange: setOwner, options: [{ value: "all", label: "All owners" }, ...owners.map((v) => ({ value: v, label: v }))] },
        ]}
        trailing={
          <div className="flex items-center gap-2">
            <Button variant={onlyMine ? "primary" : "outline"} onClick={() => setOnlyMine((v) => !v)}>{t.mine}</Button>
            <Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.add}</Button>
          </div>
        }
      />

      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            <StyledTableHead>Action</StyledTableHead>
            <StyledTableHead>Source</StyledTableHead>
            <StyledTableHead>Owner</StyledTableHead>
            <StyledTableHead>Responsibility</StyledTableHead>
            <StyledTableHead>Due date</StyledTableHead>
            <StyledTableHead className="w-40 text-center">Status</StyledTableHead>
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <StyledTableBody>
          {pagination.pageItems.length === 0 && <EmptyRow colSpan={6} />}
          {pagination.pageItems.map((a) => (
            <StyledTableRow key={a.id} className="group cursor-pointer" onClick={() => setViewId(a.id)}>
              <StyledTableCell className="font-medium text-foreground">{a.title}</StyledTableCell>
              <StyledTableCell><Badge variant="outline">{sourceLabel(a)}</Badge></StyledTableCell>
              <StyledTableCell className="text-sm">{a.owner}</StyledTableCell>
              <StyledTableCell><Pill label={a.responsibility} tone={RESP_TONE[a.responsibility]} /></StyledTableCell>
              <StyledTableCell><DueCell a={a} /></StyledTableCell>
              <StyledTableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                <TableRowActions
                  showStatus
                  statusNode={<StatusCell a={a} />}
                  onStatus={() => { setEditingUpdate(null); setStatusFor(a); }}
                  statusIcon={<ClipboardCheck size={15} />}
                  statusLabel={t.updateStatus}
                  onEdit={() => { setEditing(a); setFormOpen(true); }}
                  onDelete={() => setPendingDelete(a)}
                />
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </StyledTableBody>
      </StyledTable>
      <TablePagination {...pagination} />

      <ActionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={project}
        initial={editing}
        onSave={(v) => {
          if (editing) { updateAction(editing.id, v); toast.success("Action updated"); }
          else { addAction(v); toast.success("Action added"); }
          setFormOpen(false);
        }}
      />
      <ActionDrawer
        action={view}
        onClose={() => setViewId(null)}
        onUpdate={(a) => { setEditingUpdate(null); setStatusFor(a); }}
        onEdit={(a) => { setViewId(null); setEditing(a); setFormOpen(true); }}
        onEditUpdate={(a, u) => { setEditingUpdate(u); setStatusFor(a); }}
        onDeleteUpdate={(a, u) => setPendingDeleteUpdate({ a, u })}
      />
      <ActionStatusDialog
        action={statusFor}
        editing={editingUpdate}
        onClose={() => { setStatusFor(null); setEditingUpdate(null); }}
        onSave={(comment, st) => {
          if (!statusFor) return;
          if (editingUpdate) {
            editActionUpdate(statusFor.id, editingUpdate.id, comment);
            if (st !== statusFor.status) logActionUpdate(statusFor.id, { comment, by: currentUser.name, status: st });
          } else logActionUpdate(statusFor.id, { comment, by: currentUser.name, status: st });
          toast.success("Action updated");
          setStatusFor(null); setEditingUpdate(null);
        }}
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
        description="This comment will be permanently removed from the action history."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { if (pendingDeleteUpdate) removeActionUpdate(pendingDeleteUpdate.a.id, pendingDeleteUpdate.u.id); setPendingDeleteUpdate(null); }}
      />
    </>
  );
}

/* ── Form ────────────────────────────────────────────────────────────────── */

type ActionDraft = Omit<ActionItem, "id" | "updates">;

export function ActionFormDialog({ open, onOpenChange, project, initial, fixedSource, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; project: string; initial?: ActionItem | null;
  fixedSource?: { source: ActionSource; sourceRef: string };
  onSave: (v: ActionDraft) => void;
}) {
  const { risks, issues } = useRiskRegister();
  const { users } = useCurrentUser();
  const blank = (): ActionDraft => ({
    project, title: "", description: "", source: fixedSource?.source ?? "General", sourceRef: fixedSource?.sourceRef,
    owner: "", responsibility: "Internal", dueDate: "", status: "Open",
  });
  const [d, setD] = useState<ActionDraft>(blank);
  const [key, setKey] = useState("");
  const k = `${open}-${initial?.id ?? "new"}`;
  if (k !== key) { setKey(k); if (open) setD(initial ? { ...initial } : blank()); }

  const refs = d.source === "Risk" ? risks.filter((r) => r.project === project).map((r) => ({ v: r.id, l: `${r.id} · ${r.title}` }))
    : d.source === "Issue" ? issues.filter((i) => i.project === project).map((i) => ({ v: i.id, l: `${i.id} · ${i.title}` })) : [];
  const valid = d.title.trim() && d.owner.trim() && d.dueDate && (d.source !== "Risk" && d.source !== "Issue" || d.sourceRef);
  const up = (p: Partial<ActionDraft>) => setD((x) => ({ ...x, ...p }));

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={initial ? "Edit action" : "Add action"} size="lg" submitDisabled={!valid} submitLabel={initial ? "Save" : "Add action"}
      onSubmit={() => { if (valid) onSave({ ...d, title: d.title.trim().slice(0, 150), description: d.description?.trim().slice(0, 500) }); }}>
      <Field label="Action" htmlFor="act-title"><Input id="act-title" maxLength={150} value={d.title} onChange={(e) => up({ title: e.target.value })} placeholder="e.g. Share updated cutover plan" /></Field>
      <Field label="Description" htmlFor="act-desc" optional><Textarea id="act-desc" maxLength={500} value={d.description ?? ""} onChange={(e) => up({ description: e.target.value })} /></Field>
      {!fixedSource && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source">
            <Select value={d.source} onValueChange={(v) => up({ source: v as ActionSource, sourceRef: undefined })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACTION_SOURCES.map((s) => <SelectItem key={s} value={s}>{s === "Meeting" ? "Progress meeting" : s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {(d.source === "Risk" || d.source === "Issue") && (
            <Field label={`Linked ${d.source.toLowerCase()}`}>
              <Select value={d.sourceRef ?? ""} onValueChange={(v) => up({ sourceRef: v })}>
                <SelectTrigger><SelectValue placeholder={`Select ${d.source.toLowerCase()}`} /></SelectTrigger>
                <SelectContent>{refs.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          {d.source === "Meeting" && (
            <Field label="Meeting name" htmlFor="act-meet"><Input id="act-meet" maxLength={100} value={d.meetingName ?? ""} onChange={(e) => up({ meetingName: e.target.value })} /></Field>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Owner" htmlFor="act-owner">
          <Input id="act-owner" list="act-owner-list" maxLength={80} value={d.owner} onChange={(e) => up({ owner: e.target.value })} placeholder="Name" />
          <datalist id="act-owner-list">{users.map((u) => <option key={u.id} value={u.name} />)}</datalist>
        </Field>
        <Field label="Responsibility">
          <Select value={d.responsibility} onValueChange={(v) => up({ responsibility: v as ActionResponsibility })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ACTION_RESPONSIBILITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Due date"><DatePicker value={d.dueDate} onChange={(v) => up({ dueDate: v })} /></Field>
      </div>
    </FormDialog>
  );
}

/* ── Meeting batch ───────────────────────────────────────────────────────── */

export type ActionRow = { title: string; owner: string; responsibility: ActionResponsibility; dueDate: string };
type Row = ActionRow;
export const emptyActionRow = (): ActionRow => ({ title: "", owner: "", responsibility: "Internal", dueDate: "" });
/** Rows with a title; all of them must have owner + due date to be valid. */
export function filledActionRows(rows: ActionRow[]) { return rows.filter((r) => r.title.trim()); }
export function actionRowsValid(rows: ActionRow[]) { return filledActionRows(rows).every((r) => r.owner.trim() && r.dueDate); }
export function cleanActionRows(rows: ActionRow[]) { return filledActionRows(rows).map((r) => ({ ...r, title: r.title.trim().slice(0, 150), owner: r.owner.trim() })); }

/** Shared action-by-row editor (meeting batch, risk mitigation, issue action plan). */
export function ActionRowsEditor({ rows, onChange, label = "Actions", hint, ownerOptions }: { rows: ActionRow[]; onChange: (rows: ActionRow[]) => void; label?: string; hint?: string; ownerOptions?: string[] }) {
  const listId = ownerOptions?.length ? `owners-${label.replace(/\W/g, "")}` : undefined;
  const up = (i: number, p: Partial<Row>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="label-eyebrow">{label}</div>
        <Button type="button" variant="secondary" size="icon" aria-label={`Add ${label.toLowerCase()} row`} title={`Add ${label.toLowerCase()} row`} data-ds-size="auto" onClick={() => onChange([...rows, emptyActionRow()])} className="h-7 w-7 shrink-0 rounded-full border border-border/60 text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"><Plus size={14} /></Button>
      </div>
      {/* 4 rows visible (4×36px + 3×8px gaps = 168px); scrolls beyond that */}
      <div className="max-h-[168px] space-y-2 overflow-y-auto pr-1">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_120px_150px_36px] gap-2">
            <Input aria-label="Action" maxLength={150} value={r.title} onChange={(e) => up(i, { title: e.target.value })} placeholder="Action" />
            <Input aria-label="Owner" list={listId} maxLength={80} value={r.owner} onChange={(e) => up(i, { owner: e.target.value })} placeholder="Owner" />
            <Select value={r.responsibility} onValueChange={(v) => up(i, { responsibility: v as ActionResponsibility })}>
              <SelectTrigger aria-label="Responsibility"><SelectValue /></SelectTrigger>
              <SelectContent>{ACTION_RESPONSIBILITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <DatePicker value={r.dueDate} onChange={(v) => up(i, { dueDate: v })} placeholder="Due date" />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove row" disabled={rows.length === 1} onClick={() => onChange(rows.filter((_, j) => j !== i))}><DeleteAction size={14} /></Button>
          </div>
        ))}
      </div>
      {listId && <datalist id={listId}>{ownerOptions!.map((o) => <option key={o} value={o} />)}</datalist>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── Status update ───────────────────────────────────────────────────────── */

function ActionStatusDialog({ action, editing, onClose, onSave }: { action: ActionItem | null; editing: ActionUpdate | null; onClose: () => void; onSave: (comment: string, status: ActionStatus) => void }) {
  const [comment, setComment] = useState("");
  const [st, setSt] = useState<ActionStatus>("Open");
  const [key, setKey] = useState("");
  const k = `${action?.id ?? ""}-${editing?.id ?? ""}`;
  if (k !== key) { setKey(k); if (action) { setComment(editing?.comment ?? ""); setSt(action.status); } }
  const valid = comment.trim().length > 0;
  return (
    <FormDialog open={!!action} onOpenChange={(o) => { if (!o) onClose(); }} title={editing ? "Edit comment" : t.updateStatus} description={action?.title} submitDisabled={!valid} submitLabel="Save update"
      onSubmit={() => { if (valid) onSave(comment.trim().slice(0, COMMENT_MAX), st); }}>
      <Field label="Status">
        <Select value={st} onValueChange={(v) => setSt(v as ActionStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ACTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Comment" htmlFor="act-comment">
        <Textarea id="act-comment" maxLength={COMMENT_MAX} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What progressed on this action?" />
        <p className="mt-1 text-xs text-muted-foreground">{t.commentTrackerHint}</p>
        <div className="mt-1 text-end text-[11px] text-muted-foreground num-mono">{comment.length}/{COMMENT_MAX}</div>
      </Field>
    </FormDialog>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */

function ActionDrawer({ action: a, onClose, onUpdate, onEdit, onEditUpdate, onDeleteUpdate }: {
  action: ActionItem | null; onClose: () => void; onUpdate: (a: ActionItem) => void; onEdit: (a: ActionItem) => void;
  onEditUpdate: (a: ActionItem, u: ActionUpdate) => void; onDeleteUpdate: (a: ActionItem, u: ActionUpdate) => void;
}) {
  if (!a) return <Sheet open={false} />;
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2"><StatusCell a={a} /><Pill label={a.responsibility} tone={RESP_TONE[a.responsibility]} /></div>
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
                      <span className="num-mono text-[10px] text-muted-foreground">{formatDateWithYear(u.at)}</span>
                      <button type="button" aria-label="Edit comment" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => onEditUpdate(a, u)}><EditAction size={13} /></button>
                      <button type="button" aria-label="Delete comment" className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeleteUpdate(a, u)}><DeleteAction size={13} /></button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{u.comment}</p>
                  {u.statusChange && <Badge variant="outline" className="mt-2">Status {u.statusChange[0]} → {u.statusChange[1]}</Badge>}
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

/* ── Linked actions (Risk / Issue drawers) ──────────────────────────────── */

export function LinkedActions({ project, source, sourceRef, title }: { project: string; source: "Risk" | "Issue"; sourceRef: string; title: string }) {
  const { actions, addAction, updateAction, removeAction, logActionUpdate } = useActions();
  const { currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ActionItem | null>(null);
  const [statusFor, setStatusFor] = useState<ActionItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ActionItem | null>(null);
  const linked = actions.filter((a) => a.source === source && a.sourceRef === sourceRef);
  const done = linked.filter((a) => a.status === "Done").length;
  const overdue = linked.filter((a) => isActionOverdue(a)).length;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="label-eyebrow">{title} <span className="num-mono normal-case text-muted-foreground">· {done}/{linked.length} done{overdue ? ` · ${overdue} overdue` : ""}</span></div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Add action"
          title="Add action"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      {linked.length === 0 && <p className="text-sm text-muted-foreground">No actions yet. Tracked in the project's Action Tracker.</p>}
      <div className="space-y-2">
        {linked.map((a) => (
          <div
            key={a.id}
            role="button"
            tabIndex={0}
            aria-label={`Update ${a.title}`}
            onClick={() => setStatusFor(a)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setStatusFor(a);
              }
            }}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-[var(--field-bg-filled)] px-3 py-2 text-start transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="min-w-0">
              <div className="truncate text-sm text-foreground">{a.title}</div>
              <div className="text-[11px] text-muted-foreground">{a.owner} · <span className={cn("num-mono", isActionOverdue(a) && "text-rag-red")}>{formatDateWithYear(a.dueDate)}</span></div>
            </div>
            <div className="relative flex min-h-7 min-w-[72px] shrink-0 items-center justify-end">
              <div className="transition-opacity group-hover:opacity-0 group-focus-within:opacity-0"><StatusCell a={a} /></div>
              <div className="absolute end-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full"
                  aria-label={`Edit ${a.title}`}
                  title="Edit action"
                  onClick={(event) => { event.stopPropagation(); setEditing(a); }}
                >
                  <EditAction size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Delete ${a.title}`}
                  title="Delete action"
                  onClick={(event) => { event.stopPropagation(); setPendingDelete(a); }}
                >
                  <DeleteAction size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ActionFormDialog
        open={open || !!editing}
        onOpenChange={(nextOpen) => { if (!nextOpen) { setOpen(false); setEditing(null); } }}
        project={project}
        initial={editing}
        fixedSource={{ source, sourceRef }}
        onSave={(values) => {
          if (editing) {
            updateAction(editing.id, values);
            toast.success("Action updated");
          } else {
            addAction(values);
            toast.success("Action added to Action Tracker");
          }
          setOpen(false);
          setEditing(null);
        }}
      />
      <ActionStatusDialog
        action={statusFor}
        editing={null}
        onClose={() => setStatusFor(null)}
        onSave={(comment, st) => {
          if (!statusFor) return;
          logActionUpdate(statusFor.id, { comment, by: currentUser.name, status: st });
          toast.success("Action updated");
          setStatusFor(null);
        }}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(nextOpen) => { if (!nextOpen) setPendingDelete(null); }}
        title="Delete this action?"
        description="This action and its update history will be permanently removed from the Action Tracker."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          if (pendingDelete) {
            removeAction(pendingDelete.id);
            toast.success("Action deleted");
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

/** Compact "done/total" indicator for register tables. */
export function ActionsCount({ source, sourceRef }: { source: "Risk" | "Issue"; sourceRef: string }) {
  const { actions } = useActions();
  const linked = actions.filter((a) => a.source === source && a.sourceRef === sourceRef);
  if (!linked.length) return <span className="text-muted-foreground">—</span>;
  const done = linked.filter((a) => a.status === "Done").length;
  const over = linked.some((a) => isActionOverdue(a));
  return <span className={cn("num-mono text-sm", over ? "text-rag-red" : "text-foreground")}>{done}/{linked.length}</span>;
}
