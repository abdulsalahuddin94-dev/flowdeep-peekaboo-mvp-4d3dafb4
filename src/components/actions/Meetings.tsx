import { useState } from "react";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { TableRowActions } from "@/components/TableRowActions";
import { Pill } from "@/components/Pill";
import { usePagination, TablePagination } from "@/components/TablePagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow,
} from "@/components/StyledTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/lib/toast";
import { Check, DeleteAction, EditAction, Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { formatDateWithYear } from "@/lib/date-format";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import { useActions, isActionOverdue, ACTION_STATUSES } from "@/lib/action-store";
import { useMeetingTypes } from "@/lib/meeting-types-store";
import {
  useMeetings, meetingStatus, ATTENDEE_PARTIES,
  type Meeting, type Attendee, type AttendeeParty, type MeetingStatus,
} from "@/lib/meeting-store";
import { useNavigate } from "@tanstack/react-router";
import { LinkedActions } from "@/components/actions/ActionList";
import { ActionAddDialog } from "@/components/actions/ActionNewPage";
import { useBackParam } from "@/lib/record-pages";

export const T = {
  en: {
    add: "New meeting", search: "Search meeting…", addActions: "Add actions", edit: "Edit meeting",
    attendees: "Attendees", actions: "Actions", noActions: "No actions yet. Add the actions agreed in this meeting.",
    actionsHint: "Actions are added to the project's Action Tracker and stay linked to this meeting.",
    project: "Project",
  },
  ar: {
    add: "اجتماع جديد", search: "ابحث عن اجتماع…", addActions: "إضافة إجراءات", edit: "تعديل الاجتماع",
    attendees: "الحضور", actions: "الإجراءات", noActions: "لا توجد إجراءات بعد. أضف الإجراءات المتفق عليها في هذا الاجتماع.",
    actionsHint: "تُضاف الإجراءات إلى متابعة الإجراءات الخاصة بالمشروع وتبقى مرتبطة بهذا الاجتماع.",
    project: "المشروع",
  },
};
const t = T.en;

const STATUS_TONE: Record<MeetingStatus, string> = {
  Scheduled: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  Held: "border-rag-green/40 bg-rag-green/10 text-rag-green",
};
const PARTY_TONE: Record<AttendeeParty, string> = {
  Internal: "border-accent/40 bg-accent/10 text-accent",
  External: "border-rag-teal/40 bg-rag-teal/10 text-rag-teal",
};
/** Action responsibility follows the owner's party, mapped via Organization → Responsibility Types. */


export function MeetingsTab({ project }: { project?: string }) {
  const { meetings, removeMeeting } = useMeetings();
  const { meetingTypes } = useMeetingTypes();
  const { actions } = useActions();
  const { currentUser } = useCurrentUser();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const back = useBackParam();
  const pmo = !project;
  const projectNames = projects.map((p) => p.name);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [party, setParty] = useState("all");
  const [actionStatus, setActionStatus] = useState("all");
  const [proj, setProj] = useState("all");
  const [ptype, setPtype] = useState("all");
  const [viewId, setViewId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Meeting | null>(null);
  const [actionMeeting, setActionMeeting] = useState<Meeting | null>(null);

  const scoped = project ? meetings.filter((m) => m.project === project) : meetings;
  const q = query.trim().toLowerCase();
  const list = scoped
    .filter((m) => !q || m.title.toLowerCase().includes(q))
    .filter((m) => status === "all" || meetingStatus(m) === status)
    .filter((m) => proj === "all" || m.project === proj)
    .filter((m) => ptype === "all" || projects.find((p) => p.name === m.project)?.businessLine === ptype)
    .filter((m) => type === "all" || m.type === type)
    .filter((m) => party === "all" || m.attendees.some((a) => a.party === party))
    .filter((m) => actionStatus === "all" || actions.some((a) => a.meetingId === m.id && a.status === actionStatus))
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
          { key: "status", label: "Status", value: status, onChange: setStatus, options: [{ value: "all", label: "All statuses" }, ...(["Scheduled", "Held"] as const).map((v) => ({ value: v, label: v }))] },
          { key: "type", label: "Meeting type", value: type, onChange: setType, options: [{ value: "all", label: "All types" }, ...Array.from(new Set([...meetingTypes.map((v) => v.name), ...scoped.map((m) => m.type)])).map((v) => ({ value: v, label: v }))] },
          { key: "party", label: "Attendee party", value: party, onChange: setParty, options: [{ value: "all", label: "All parties" }, ...ATTENDEE_PARTIES.map((v) => ({ value: v, label: v }))] },
          { key: "action-status", label: "Action status", value: actionStatus, onChange: setActionStatus, options: [{ value: "all", label: "All actions" }, ...ACTION_STATUSES.map((v) => ({ value: v, label: v }))] },
          ...(pmo ? [
            { key: "project", label: "Project", value: proj, onChange: setProj, options: [{ value: "all", label: "All projects" }, ...projectNames.map((v) => ({ value: v, label: v }))] },
            { key: "ptype", label: "Project type", value: ptype, onChange: setPtype, options: [{ value: "all", label: "All project types" }, ...Array.from(new Set(projects.map((p) => p.businessLine))).map((v) => ({ value: v, label: v }))] },
          ] : []),
        ]}
        trailing={<Button variant="primary" onClick={() => navigate({ to: "/meetings/new", search: { project, back } })}>{t.add}</Button>}
      />

      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            {pmo && <StyledTableHead>{t.project}</StyledTableHead>}
            <StyledTableHead>Meeting</StyledTableHead>
            <StyledTableHead>Type</StyledTableHead>
            <StyledTableHead>Date</StyledTableHead>
            <StyledTableHead>Attendees</StyledTableHead>
            <StyledTableHead>Actions</StyledTableHead>
            <StyledTableHead className="w-40 text-center">Status</StyledTableHead>
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <StyledTableBody>
          {pagination.pageItems.length === 0 && <EmptyRow colSpan={pmo ? 7 : 6} />}
          {pagination.pageItems.map((m) => {
            const acts = actionsOf(m.id);
            const open = acts.filter((a) => a.status === "Open" || a.status === "In Progress").length;
            const overdue = acts.filter((a) => isActionOverdue(a)).length;
            const st = meetingStatus(m);
            return (
              <StyledTableRow key={m.id} className="group cursor-pointer" onClick={() => setViewId(m.id)}>
                {pmo && <StyledTableCell className="text-sm text-muted-foreground">{m.project}</StyledTableCell>}
                <StyledTableCell className="font-medium text-foreground">{m.title}</StyledTableCell>
                <StyledTableCell className="text-sm text-muted-foreground">{m.type}</StyledTableCell>
                <StyledTableCell className="num-mono text-sm">{formatDateWithYear(m.date)}{m.time ? ` · ${m.time}` : ""}</StyledTableCell>
                <StyledTableCell><AttendeeSummary attendees={m.attendees} /></StyledTableCell>
                <StyledTableCell className="text-sm">
                  {acts.length === 0 ? <span className="text-muted-foreground">—</span> : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="num-mono cursor-default" aria-label={`${acts.length} actions: ${open} open, ${overdue} overdue`}>{acts.length}</span>
                      </TooltipTrigger>
                      <TooltipContent>{`${open} open · ${overdue} overdue`}</TooltipContent>
                    </Tooltip>
                  )}
                </StyledTableCell>
                <StyledTableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    showStatus
                    statusNode={<Pill label={st} tone={STATUS_TONE[st]} />}
                    onStatus={() => setActionMeeting(m)}
                    statusIcon={<Plus size={15} />}
                    statusLabel={t.addActions}
                    onEdit={() => navigate({ to: "/meetings/$meetingId", params: { meetingId: m.id }, search: { project, back } })}
                    onDelete={() => setPendingDelete(m)}
                  />
                </StyledTableCell>
              </StyledTableRow>
            );
          })}
        </StyledTableBody>
      </StyledTable>
      <TablePagination {...pagination} />

      <MeetingDrawer
        meeting={view}
        onClose={() => setViewId(null)}
        onAddActions={setActionMeeting}
        onEdit={(m) => { setViewId(null); navigate({ to: "/meetings/$meetingId", params: { meetingId: m.id }, search: { project, back } }); }}
      />
      <ActionAddDialog open={!!actionMeeting} onOpenChange={(open) => { if (!open) setActionMeeting(null); }} project={actionMeeting?.project} source="Meeting" sourceRef={actionMeeting?.id} meetingName={actionMeeting?.title} meetingDate={actionMeeting?.date} />
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

const uid = () => `at-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/* ── Attendees composer (same pattern as risk/issue action rows) ─────────── */

export function AttendeesEditor({ attendees, onChange }: { attendees: Attendee[]; onChange: (a: Attendee[]) => void }) {
  const fresh = (): Attendee => ({ id: uid(), name: "", party: "Internal", organization: "" });

  const [draft, setDraft] = useState<Attendee>(fresh);
  const [editingId, setEditingId] = useState<string | null>(null);
  const upD = (p: Partial<Attendee>) => setDraft((x) => ({ ...x, ...p }));
  const reset = () => { setDraft(fresh()); setEditingId(null); };
  function commit() {
    const name = draft.name.trim();
    if (!name) { toast.error("Attendee name is required."); return; }
    if (attendees.some((a) => a.id !== editingId && a.name.trim().toLowerCase() === name.toLowerCase())) { toast.error("Each attendee can be added once."); return; }
    const clean = { ...draft, name, organization: draft.party === "External" ? draft.organization?.trim() : undefined };
    onChange(editingId ? attendees.map((a) => (a.id === editingId ? clean : a)) : [...attendees, clean]);
    reset();
  }
  return (
    <div className="space-y-2">
      <div className="label-eyebrow">{t.attendees} <span className="normal-case text-muted-foreground">(optional) · {attendees.length}</span></div>
      <div className="grid grid-cols-[130px_1fr_1fr_36px] items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3">
        <Select value={draft.party} onValueChange={(v) => upD({ party: v as AttendeeParty, name: "", organization: "" })}>
          <SelectTrigger aria-label="Party"><SelectValue /></SelectTrigger>
          <SelectContent>{ATTENDEE_PARTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Input aria-label="Name" maxLength={80} value={draft.name} onChange={(e) => upD({ name: e.target.value })} placeholder="Full name" />

        <Input aria-label="Organization" maxLength={80} value={draft.party === "Internal" ? "" : draft.organization ?? ""} disabled={draft.party === "Internal"}
          onChange={(e) => upD({ organization: e.target.value })} placeholder={draft.party === "Internal" ? "Our organization" : "Organization (optional)"} />
        <Button type="button" variant="primary" size="icon" aria-label={editingId ? "Update attendee" : "Add attendee"} title={editingId ? "Update attendee" : "Add attendee"} onClick={commit} className="h-9 w-9 shrink-0">
          {editingId ? <Check size={16} /> : <Plus size={16} />}
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
        {attendees.length === 0 ? (
          <div className="px-3 py-5 text-center text-xs text-muted-foreground">No attendees added yet.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {attendees.map((a) => (
              <div key={a.id} className={cn("group flex min-h-12 items-center gap-3 px-3 py-2 transition hover:bg-accent/5", editingId === a.id && "bg-accent/5")}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{a.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{a.party}{a.organization ? ` · ${a.organization}` : ""}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button type="button" variant="ghost" size="icon" aria-label="Edit attendee" title="Edit attendee" onClick={() => { setDraft({ ...a }); setEditingId(a.id); }} className="h-7 w-7 text-accent-secondary"><EditAction size={14} /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove attendee" title="Remove attendee" onClick={() => { onChange(attendees.filter((x) => x.id !== a.id)); if (editingId === a.id) reset(); }} className="h-7 w-7 text-muted-foreground hover:!bg-rag-red/15 hover:!text-rag-red"><DeleteAction size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ── Drawer ──────────────────────────────────────────────────────────────── */

function MeetingDrawer({ meeting: m, onClose, onAddActions, onEdit }: {
  meeting: Meeting | null; onClose: () => void; onAddActions: (m: Meeting) => void; onEdit: (m: Meeting) => void;
}) {
  if (!m) return <Sheet open={false} />;
  const st = meetingStatus(m);
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2"><Pill label={st} tone={STATUS_TONE[st]} /><Pill label={m.type} tone="border-border bg-muted text-muted-foreground" /></div>
          <SheetTitle className="mt-2 text-lg">{m.title}</SheetTitle>
          <SheetDescription className="sr-only">{m.type}</SheetDescription>
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
              {m.attendees.length === 0 && <p className="text-sm text-muted-foreground">No attendees recorded.</p>}
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
          <LinkedActions
            project={m.project}
            source="Meeting"
            sourceRef={m.id}
            title={t.actions}
            meetingMeta={{ meetingName: m.title, meetingDate: m.date }}
            onAdd={() => onAddActions(m)}
          />
        </div>
        <div className="flex gap-2 border-t border-border px-6 py-4">
          <Button variant="primary" className="flex-1" onClick={() => onAddActions(m)}>{t.addActions}</Button>
          <Button variant="outline" className="flex-1" onClick={() => onEdit(m)}>{t.edit}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
