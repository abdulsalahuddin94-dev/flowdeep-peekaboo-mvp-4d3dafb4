import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "@/lib/toast";
import { ArrowLeft } from "@/lib/icons";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import { useActions } from "@/lib/action-store";
import { useResponsibilities, defaultResponsibility } from "@/lib/responsibility-store";
import { useOrgActive } from "@/lib/org-active";
import { useMeetingTypes } from "@/lib/meeting-types-store";
import { useMeetings, type Meeting } from "@/lib/meeting-store";
import { ActionRowsEditor, emptyActionRow, filledActionRows, actionRowsValid, cleanActionRows, type ActionRow } from "@/components/actions/ActionTracker";
import { LinkedActions } from "@/components/actions/ActionList";
import { AttendeesEditor } from "@/components/actions/Meetings";
import { useBackNav } from "@/lib/record-pages";

/**
 * Standalone meeting form — replaces the "New meeting" / "Edit meeting" popups.
 * The actions agreed in the meeting are composed on the same page instead of a
 * second popup, and existing ones open the Action details page.
 */
export function MeetingFormPage({ meetingId, lockedProject, back }: { meetingId?: string; lockedProject?: string; back?: string }) {
  const { meetings, addMeeting, updateMeeting } = useMeetings();
  const { meetingTypes } = useMeetingTypes();
  const { addActions } = useActions();
  const { currentUser } = useCurrentUser();
  const { projects } = useProjects();
  const { respTypes } = useResponsibilities();
  const { isActive } = useOrgActive("responsibility-type");
  const goBack = useBackNav();

  const meeting: Meeting | null = meetingId ? meetings.find((m) => m.id === meetingId) ?? null : null;
  const activeTypes = meetingTypes.filter((v) => v.active);
  const projectOptions = projects.map((p) => p.name);

  const [d, setD] = useState({
    project: meeting?.project ?? lockedProject ?? projectOptions[0] ?? "",
    title: meeting?.title ?? "",
    type: meeting?.type ?? activeTypes[0]?.name ?? "",
    date: meeting?.date ?? new Date().toISOString().slice(0, 10),
    time: meeting?.time ?? "",
    location: meeting?.location ?? "",
    notes: meeting?.notes ?? "",
    attendees: meeting?.attendees.map((a) => ({ ...a })) ?? [],
  });
  const [rows, setRows] = useState<ActionRow[]>([emptyActionRow(defaultResponsibility(respTypes, isActive))]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const up = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));

  const typeValid = activeTypes.some((v) => v.name === d.type) || meeting?.type === d.type;
  const valid = d.project && d.title.trim() && d.type && typeValid && d.date;
  const fallback = lockedProject ? { to: "/portfolio" } : { to: "/meetings" };

  function submit() {
    if (!valid) {
      setErrors({ title: d.title.trim() ? "" : "Meeting name is required", date: d.date ? "" : "Date is required" });
      return;
    }
    const payload = {
      project: d.project,
      title: d.title.trim().slice(0, 100),
      type: d.type,
      date: d.date,
      time: d.time || undefined,
      location: d.location.trim() || undefined,
      notes: d.notes.trim().slice(0, 1000) || undefined,
      attendees: d.attendees.map((a) => ({ ...a, name: a.name.trim(), organization: a.organization?.trim() })),
    };
    const id = meeting ? (updateMeeting(meeting.id, payload, currentUser.name), meeting.id) : addMeeting(payload, currentUser.name);
    const newRows = cleanActionRows(rows);
    if (newRows.length) {
      addActions(newRows.map((r) => ({
        ...r, owner: currentUser.name, project: payload.project, source: "Meeting" as const,
        meetingId: id, meetingName: payload.title, meetingDate: payload.date, status: "Open" as const,
      })));
    }
    toast.done("Meeting", meeting ? "updated" : "created");
    goBack(back, fallback);
  }

  return (
    <>
      <PageHeader
        title={meeting ? "Edit meeting" : "New meeting"}
        subtitle={lockedProject ? `Project: ${lockedProject}` : meeting ? `${meeting.id} · ${meeting.project}` : "Record the meeting, its attendees and the actions it produced"}
        actions={<Button variant="outline" onClick={() => goBack(back, fallback)}><ArrowLeft size={15} />Back</Button>}
      />

      <div className="glass-card max-w-4xl p-6">
        <div className="space-y-4">
          {!lockedProject && (
            <Field label="Project" htmlFor="mt-project">
              <Select value={d.project} onValueChange={(v) => up({ project: v })}>
                <SelectTrigger id="mt-project" aria-label="Project"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Meeting name" htmlFor="mt-title" error={errors.title}>
              <Input id="mt-title" maxLength={100} value={d.title} onChange={(e) => { up({ title: e.target.value }); setErrors((x) => ({ ...x, title: "" })); }} placeholder="e.g. Weekly progress meeting" />
            </Field>
            <Field label="Meeting type">
              <Select value={d.type} onValueChange={(v) => up({ type: v })}>
                <SelectTrigger aria-label="Meeting type"><SelectValue placeholder="Select meeting type" /></SelectTrigger>
                <SelectContent>
                  {meeting?.type && !activeTypes.some((v) => v.name === meeting.type) && <SelectItem value={meeting.type}>{meeting.type}</SelectItem>}
                  {activeTypes.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date" error={errors.date}><DatePicker value={d.date} onChange={(v) => { up({ date: v }); setErrors((x) => ({ ...x, date: "" })); }} /></Field>
            <Field label="Time (optional)">
              <TimePicker value={d.time} onChange={(v) => up({ time: v })} placeholder="HH:mm (24-hour)" />
            </Field>
            <Field label="Location or link (optional)" htmlFor="mt-loc" className="col-span-2">
              <Input id="mt-loc" maxLength={200} value={d.location} onChange={(e) => up({ location: e.target.value })} placeholder="e.g. Board room / Teams" />
            </Field>
          </div>

          <AttendeesEditor attendees={d.attendees} onChange={(attendees) => up({ attendees })} />

          <Field label="Agenda / notes (optional)" htmlFor="mt-notes">
            <Textarea id="mt-notes" maxLength={1000} value={d.notes} onChange={(e) => up({ notes: e.target.value })} placeholder="Agenda, decisions, or minutes" />
          </Field>

          <ActionRowsEditor rows={rows} onChange={setRows} label="Actions"
            hint="Actions are added to the project's Action Tracker and stay linked to this meeting." />
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => goBack(back, fallback)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!valid || filledActionRows(rows).length > 0 && !actionRowsValid(rows)}>
            {meeting ? "Save changes" : "Create meeting"}
          </Button>
        </div>
      </div>

      {meeting && (
        <div className="glass-card mt-6 max-w-4xl p-5">
          <LinkedActions project={meeting.project} source="Meeting" sourceRef={meeting.id} title="Actions"
            meetingMeta={{ meetingName: meeting.title, meetingDate: meeting.date }} />
        </div>
      )}
    </>
  );
}
