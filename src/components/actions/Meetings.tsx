import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/lib/toast";
import { DeleteAction, Plus } from "@/lib/icons";
import { formatDateWithYear } from "@/lib/date-format";
import { useCurrentUser } from "@/lib/projects-store";
import { useActions, isActionOverdue } from "@/lib/action-store";
import { useResponsibilities, defaultResponsibility } from "@/lib/responsibility-store";
import { useOrgActive } from "@/lib/org-active";
import {
  useMeetings, meetingStatus, ATTENDEE_PARTIES, MEETING_TYPES,
  type Meeting, type Attendee, type AttendeeParty, type MeetingType, type MeetingStatus,
} from "@/lib/meeting-store";
import { ActionRowsEditor, emptyActionRow, filledActionRows, actionRowsValid, cleanActionRows, type ActionRow } from "@/components/actions/ActionTracker";

export const T = {
  en: {
    add: "New meeting", search: "Search meeting…", addActions: "Add actions", edit: "Edit meeting",
    attendees: "Attendees", actions: "Actions", noActions: "No actions yet. Add the actions agreed in this meeting.",
    actionsHint: "Actions are added to the project's Action Tracker and stay linked to this meeting.",
  },
  ar: {
    add: "اجتماع جديد", search: "ابحث عن اجتماع…", addActions: "إضافة إجراءات", edit: "تعديل الاجتماع",
    attendees: "الحضور", actions: "الإجراءات", noActions: "لا توجد إجراءات بعد. أضف الإجراءات المتفق عليها في هذا الاجتماع.",
    actionsHint: "تُضاف الإجراءات إلى متابعة الإجراءات الخاصة بالمشروع وتبقى مرتبطة بهذا الاجتماع.",
  },
};
const t = T.en;

const STATUS_TONE: Record<MeetingStatus, string> = {
  Scheduled: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  Held: "border-rag-green/40 bg-rag-green/10 text-rag-green",
  Cancelled: "border-border bg-muted text-muted-foreground",
};
const PARTY_TONE: Record<AttendeeParty, string> = {
  Internal: "border-accent/40 bg-accent/10 text-accent",
  Client: "border-rag-teal/40 bg-rag-teal/10 text-rag-teal",
  Vendor: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Stakeholder: "border-border bg-muted text-muted-foreground",
  Other: "border-border bg-muted text-muted-foreground",
};
/** Action responsibility follows the owner's party, mapped via Organization → Responsibility Types. */


export function MeetingsTab({ project }: { project: string }) {
  const { meetings, addMeeting, updateMeeting, removeMeeting } = useMeetings();
  const { actions, addActions } = useActions();
  const { currentUser } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [party, setParty] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [actionsFor, setActionsFor] = useState<Meeting | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Meeting | null>(null);

  const scoped = meetings.filter((m) => m.project === project);
  const q = query.trim().toLowerCase();
  const list = scoped
    .filter((m) => !q || m.title.toLowerCase().includes(q))
    .filter((m) => status === "all" || meetingStatus(m) === status)
    .filter((m) => type === "all" || m.type === type)
    .filter((m) => party === "all" || m.attendees.some((a) => a.party === party))
    .sort((a, b) => b.date.localeCompare(a.date));
  const pagination = usePagination(list, 10);
  const actionsOf = (id: string) => actions.filter((a) => a.meetingId === id);
  const view = meetings.find((m) => m.id === viewId) ?? null;

  return (
    <>
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t.search}
        filterGroups={[
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, ...(["Scheduled", "Held", "Cancelled"] as const).map((v) => ({ value: v, label: v }))] },
          { key: "type", label: "Meeting type", value: type, onChange: setType, options: [{ value: "all", label: "All types" }, ...MEETING_TYPES.map((v) => ({ value: v, label: v }))] },
          { key: "party", label: "Attendee party", value: party, onChange: setParty, options: [{ value: "all", label: "All parties" }, ...ATTENDEE_PARTIES.map((v) => ({ value: v, label: v }))] },
        ]}
        trailing={<Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.add}</Button>}
      />

      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            <StyledTableHead>Meeting</StyledTableHead>
            <StyledTableHead>Type</StyledTableHead>
            <StyledTableHead>Date</StyledTableHead>
            <StyledTableHead>Attendees</StyledTableHead>
            <StyledTableHead>Actions</StyledTableHead>
            <StyledTableHead className="w-40 text-center">Status</StyledTableHead>
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <StyledTableBody>
          {pagination.pageItems.length === 0 && <EmptyRow colSpan={6} />}
          {pagination.pageItems.map((m) => {
            const acts = actionsOf(m.id);
            const done = acts.filter((a) => a.status === "Done").length;
            const overdue = acts.filter((a) => isActionOverdue(a)).length;
            const st = meetingStatus(m);
            return (
              <StyledTableRow key={m.id} className="group cursor-pointer" onClick={() => setViewId(m.id)}>
                <StyledTableCell className="font-medium text-foreground">{m.title}</StyledTableCell>
                <StyledTableCell className="text-sm text-muted-foreground">{m.type}</StyledTableCell>
                <StyledTableCell className="num-mono text-sm">{formatDateWithYear(m.date)}{m.time ? ` · ${m.time}` : ""}</StyledTableCell>
                <StyledTableCell><AttendeeSummary attendees={m.attendees} /></StyledTableCell>
                <StyledTableCell className="text-sm">
                  {acts.length === 0 ? <span className="text-muted-foreground">—</span> : (
                    <span className="num-mono">{done}/{acts.length} done{overdue ? <span className="text-rag-red"> · {overdue} overdue</span> : null}</span>
                  )}
                </StyledTableCell>
                <StyledTableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    showStatus
                    statusNode={<Pill label={st} tone={STATUS_TONE[st]} />}
                    onStatus={() => setActionsFor(m)}
                    statusIcon={<Plus size={15} />}
                    statusLabel={t.addActions}
                    onEdit={() => { setEditing(m); setFormOpen(true); }}
                    onDelete={() => setPendingDelete(m)}
                  />
                </StyledTableCell>
              </StyledTableRow>
            );
          })}
        </StyledTableBody>
      </StyledTable>
      <TablePagination {...pagination} />

      <MeetingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={project}
        initial={editing}
        onSave={(v, thenAddActions) => {
          if (editing) { updateMeeting(editing.id, v, currentUser.name); toast.success("Meeting updated"); setFormOpen(false); return; }
          const id = addMeeting(v, currentUser.name);
          toast.success("Meeting created");
          setFormOpen(false);
          if (thenAddActions) setActionsFor({ ...v, id });
        }}
      />
      <MeetingActionsDialog
        meeting={actionsFor}
        onClose={() => setActionsFor(null)}
        onSave={(m, rows) => {
          addActions(rows.map((r) => ({ ...r, project, source: "Meeting" as const, meetingId: m.id, meetingName: m.title, meetingDate: m.date, status: "Open" as const })));
          toast.success(`${rows.length} ${rows.length === 1 ? "action" : "actions"} added to the Action Tracker`);
          setActionsFor(null);
        }}
      />
      <MeetingDrawer
        meeting={view}
        actions={view ? actionsOf(view.id) : []}
        onClose={() => setViewId(null)}
        onAddActions={(m) => setActionsFor(m)}
        onEdit={(m) => { setViewId(null); setEditing(m); setFormOpen(true); }}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title="Delete this meeting?"
        description="The meeting record will be removed. Its actions stay in the Action Tracker."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { if (pendingDelete) removeMeeting(pendingDelete.id, currentUser.name); setPendingDelete(null); toast.success("Meeting deleted"); }}
      />
    </>
  );
}

function AttendeeSummary({ attendees }: { attendees: Attendee[] }) {
  const counts = ATTENDEE_PARTIES.map((p) => ({ p, n: attendees.filter((a) => a.party === p).length })).filter((x) => x.n);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {counts.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
      {counts.map(({ p, n }) => <Pill key={p} label={`${n} ${p}`} tone={PARTY_TONE[p]} />)}
    </div>
  );
}

/* ── Create / edit ───────────────────────────────────────────────────────── */

type MeetingDraft = Omit<Meeting, "id">;
const uid = () => `at-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function MeetingFormDialog({ open, onOpenChange, project, initial, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; project: string; initial: Meeting | null;
  onSave: (v: MeetingDraft, thenAddActions: boolean) => void;
}) {
  const { users } = useCurrentUser();
  const blank = (): MeetingDraft => ({ project, title: "", type: "Progress meeting", date: new Date().toISOString().slice(0, 10), time: "", location: "", notes: "", attendees: [] });
  const [d, setD] = useState<MeetingDraft>(blank);
  const [addAfter, setAddAfter] = useState(true);
  const [was, setWas] = useState(false);
  if (open !== was) {
    setWas(open);
    if (open) { setD(initial ? { ...initial, attendees: initial.attendees.map((a) => ({ ...a })) } : blank()); setAddAfter(!initial); }
  }
  const up = (p: Partial<MeetingDraft>) => setD((x) => ({ ...x, ...p }));
  const upA = (id: string, p: Partial<Attendee>) => up({ attendees: d.attendees.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  const names = d.attendees.map((a) => a.name.trim().toLowerCase()).filter(Boolean);
  const dupes = names.length !== new Set(names).size;
  const valid = d.title.trim() && d.date && d.attendees.length > 0 && d.attendees.every((a) => a.name.trim()) && !dupes;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? t.edit : t.add}
      size="xl"
      submitDisabled={!valid}
      submitLabel={initial ? "Save changes" : "Create meeting"}
      onSubmit={() => {
        if (!valid) return;
        onSave({ ...d, title: d.title.trim().slice(0, 100), location: d.location?.trim(), notes: d.notes?.trim().slice(0, 1000), attendees: d.attendees.map((a) => ({ ...a, name: a.name.trim(), organization: a.organization?.trim() })) }, addAfter);
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Meeting name" htmlFor="mt-title"><Input id="mt-title" maxLength={100} value={d.title} onChange={(e) => up({ title: e.target.value })} placeholder="e.g. Weekly progress meeting" /></Field>
        <Field label="Meeting type">
          <Select value={d.type} onValueChange={(v) => up({ type: v as MeetingType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MEETING_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Date"><DatePicker value={d.date} onChange={(v) => up({ date: v })} /></Field>
        <Field label="Time (optional)" htmlFor="mt-time"><Input id="mt-time" type="time" value={d.time ?? ""} onChange={(e) => up({ time: e.target.value })} /></Field>
        <Field label="Location or link (optional)" htmlFor="mt-loc" className="col-span-2"><Input id="mt-loc" maxLength={200} value={d.location ?? ""} onChange={(e) => up({ location: e.target.value })} placeholder="e.g. Board room / Teams" /></Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="label-eyebrow">{t.attendees} <span className="num-mono normal-case text-muted-foreground">· {d.attendees.length}</span></div>
          <Button type="button" variant="secondary" size="icon" aria-label="Add attendee" title="Add attendee" data-ds-size="auto"
            onClick={() => up({ attendees: [...d.attendees, { id: uid(), name: "", party: "Internal" }] })}
            className="h-7 w-7 shrink-0 rounded-full border border-border/60 text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"><Plus size={14} /></Button>
        </div>
        {d.attendees.length === 0 && <p className="text-sm text-muted-foreground">Add at least one attendee — employees, client, vendor, external stakeholders, or anyone else.</p>}
        <div className="max-h-[168px] space-y-2 overflow-y-auto pr-1">
          {d.attendees.map((a) => (
            <div key={a.id} className="grid grid-cols-[140px_1fr_1fr_36px] gap-2">
              <Select value={a.party} onValueChange={(v) => upA(a.id, { party: v as AttendeeParty, name: "", organization: "" })}>
                <SelectTrigger aria-label="Party"><SelectValue /></SelectTrigger>
                <SelectContent>{ATTENDEE_PARTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              {a.party === "Internal" ? (
                <Select value={a.name || undefined} onValueChange={(v) => upA(a.id, { name: v })}>
                  <SelectTrigger aria-label="Employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input aria-label="Name" maxLength={80} value={a.name} onChange={(e) => upA(a.id, { name: e.target.value })} placeholder="Full name" />
              )}
              <Input aria-label="Organization" maxLength={80} value={a.party === "Internal" ? "" : a.organization ?? ""} disabled={a.party === "Internal"}
                onChange={(e) => upA(a.id, { organization: e.target.value })} placeholder={a.party === "Internal" ? "Our organization" : "Organization (optional)"} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove attendee" onClick={() => up({ attendees: d.attendees.filter((x) => x.id !== a.id) })}><DeleteAction size={14} /></Button>
            </div>
          ))}
        </div>
        {dupes && <p className="text-xs text-destructive">Each attendee can be added once.</p>}
      </div>

      <Field label="Agenda / notes (optional)" htmlFor="mt-notes">
        <Textarea id="mt-notes" maxLength={1000} value={d.notes ?? ""} onChange={(e) => up({ notes: e.target.value })} placeholder="Agenda, decisions, or minutes" />
      </Field>
      {initial ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={!!d.cancelled} onCheckedChange={(v) => up({ cancelled: v === true })} /> Mark meeting as cancelled
        </label>
      ) : (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={addAfter} onCheckedChange={(v) => setAddAfter(v === true)} /> Add actions right after creating
        </label>
      )}
    </FormDialog>
  );
}

/* ── Add actions ─────────────────────────────────────────────────────────── */

function MeetingActionsDialog({ meeting, onClose, onSave }: { meeting: Meeting | null; onClose: () => void; onSave: (m: Meeting, rows: ActionRow[]) => void }) {
  const { respTypes } = useResponsibilities();
  const { isActive } = useOrgActive("responsibility-type");
  const def = defaultResponsibility(respTypes, isActive);
  const [rows, setRows] = useState<ActionRow[]>([emptyActionRow(def)]);
  const [key, setKey] = useState("");
  if ((meeting?.id ?? "") !== key) { setKey(meeting?.id ?? ""); setRows([emptyActionRow(def), emptyActionRow(def)]); }
  const owners = meeting?.attendees.map((a) => a.name) ?? [];
  // Pick responsibility from the attendee's party when the owner is an attendee.
  const handle = (next: ActionRow[]) => setRows(next.map((r, i) => {
    const prev = rows[i];
    const att = meeting?.attendees.find((a) => a.name === r.owner);
    const mapped = att ? PARTY_RESP[att.party] : undefined;
    return att && mapped && prev?.owner !== r.owner ? { ...r, responsibility: mapped } : r;
  }));
  const filled = filledActionRows(rows);
  const valid = filled.length > 0 && actionRowsValid(rows);
  return (
    <FormDialog open={!!meeting} onOpenChange={(o) => { if (!o) onClose(); }} title={t.addActions}
      description={meeting ? `${meeting.title} · ${formatDateWithYear(meeting.date)}` : undefined}
      size="xl" submitDisabled={!valid} submitLabel={`Add ${filled.length || ""} actions`}
      onSubmit={() => { if (meeting && valid) onSave(meeting, cleanActionRows(rows)); }}>
      <ActionRowsEditor rows={rows} onChange={handle} ownerOptions={owners} hint={t.actionsHint} />
    </FormDialog>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */

function MeetingDrawer({ meeting: m, actions, onClose, onAddActions, onEdit }: {
  meeting: Meeting | null; actions: ReturnType<typeof useActions>["actions"]; onClose: () => void; onAddActions: (m: Meeting) => void; onEdit: (m: Meeting) => void;
}) {
  if (!m) return <Sheet open={false} />;
  const st = meetingStatus(m);
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2"><Pill label={st} tone={STATUS_TONE[st]} /><Pill label={m.type} tone="border-border bg-muted text-muted-foreground" /></div>
          <SheetTitle className="mt-2 text-lg">{m.title}</SheetTitle>
          <SheetDescription className="text-xs">{m.id}</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[{ l: "Date", v: formatDateWithYear(m.date) }, { l: "Time", v: m.time || "—" }, { l: "Location", v: m.location || "—" }].map((k) => (
            <div key={k.l} className="min-w-0 px-4 py-3">
              <div className="label-eyebrow text-[10px]">{k.l}</div>
              <div className="mt-0.5 truncate text-sm font-medium text-foreground" title={k.v}>{k.v}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div>
            <div className="label-eyebrow mb-2">{t.attendees} <span className="num-mono normal-case text-muted-foreground">· {m.attendees.length}</span></div>
            <div className="space-y-1.5">
              {m.attendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-foreground">{a.name}</div>
                    {a.organization && <div className="truncate text-xs text-muted-foreground">{a.organization}</div>}
                  </div>
                  <Pill label={a.party} tone={PARTY_TONE[a.party]} />
                </div>
              ))}
            </div>
          </div>
          {m.notes && <div><div className="label-eyebrow mb-1">Agenda / notes</div><p className="whitespace-pre-line text-sm text-muted-foreground">{m.notes}</p></div>}
          <Separator />
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="label-eyebrow">{t.actions} <span className="num-mono normal-case text-muted-foreground">· {actions.filter((a) => a.status === "Done").length}/{actions.length} done</span></div>
              <Button type="button" variant="secondary" size="icon" aria-label={t.addActions} title={t.addActions} data-ds-size="auto" onClick={() => onAddActions(m)}
                className="h-7 w-7 shrink-0 rounded-full border border-border/60 text-accent-secondary hover:!bg-[var(--btn-secondary-bg-hover)]"><Plus size={14} /></Button>
            </div>
            {actions.length === 0 && <p className="text-sm text-muted-foreground">{t.noActions}</p>}
            <div className="space-y-2">
              {actions.map((a) => {
                const od = isActionOverdue(a);
                return (
                  <div key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-foreground">{a.title}</span>
                      <Pill label={od ? "Overdue" : a.status} tone={od ? "border-rag-red/40 bg-rag-red/10 text-rag-red" : a.status === "Done" ? "border-rag-green/40 bg-rag-green/10 text-rag-green" : a.status === "In Progress" ? "border-rag-amber/40 bg-rag-amber/10 text-rag-amber" : a.status === "Cancelled" ? "border-border bg-muted text-muted-foreground" : "border-rag-blue/40 bg-rag-blue/10 text-rag-blue"} className="shrink-0" />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{a.owner} · Due <span className="num-mono">{formatDateWithYear(a.dueDate)}</span></div>
                  </div>
                );
              })}
            </div>
            {actions.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Update progress on these actions from the Action Tracker.</p>}
          </div>
        </div>
        <div className="flex gap-2 border-t border-border px-6 py-4">
          <Button variant="primary" className="flex-1" onClick={() => onAddActions(m)}>{t.addActions}</Button>
          <Button variant="outline" className="flex-1" onClick={() => onEdit(m)}>{t.edit}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
