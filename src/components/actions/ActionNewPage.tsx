import { useState } from "react";
import { RecordPageHeader, T as recordT } from "@/components/ds/RecordPageHeader";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDialog } from "@/components/ui/form-dialog";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import { useRiskRegister } from "@/lib/risk-store";
import { useActions, ACTION_SOURCES, type ActionSource, type ActionResponsibility } from "@/lib/action-store";
import { useResponsibilities, defaultResponsibility } from "@/lib/responsibility-store";
import { useOrgActive } from "@/lib/org-active";
import { useBackNav } from "@/lib/record-pages";

export const T = {
  en: { add: "Add action", linkedPlan: "Linked plan", actionPlaceholder: "Action", responsibility: "Responsibility", dueDate: "Due date", linkedRiskHint: "Actions stay linked to this risk.", linkedIssueHint: "Actions stay linked to this issue.", linkedMeetingHint: "Actions stay linked to this meeting." },
  ar: { add: "إضافة إجراء", linkedPlan: "الخطة المرتبطة", actionPlaceholder: "الإجراء", responsibility: "المسؤولية", dueDate: "تاريخ الاستحقاق", linkedRiskHint: "تظل الإجراءات مرتبطة بهذا الخطر.", linkedIssueHint: "تظل الإجراءات مرتبطة بهذه المشكلة.", linkedMeetingHint: "تظل الإجراءات مرتبطة بهذا الاجتماع." },
};
const t = T.en;

type ActionNewProps = { project?: string; source?: string; sourceRef?: string; meetingName?: string; meetingDate?: string; back?: string; onClose?: () => void };

export function ActionAddDialog({ open, onOpenChange, ...props }: ActionNewProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <FormDialog open={open} onOpenChange={onOpenChange} title={t.add} size="lg" hideFooter asForm={false}>
    {open && <ActionNewPage {...props} onClose={() => onOpenChange(false)} />}
  </FormDialog>;
}

/**
 * Standalone "add action" page. Opened from the Action Tracker toolbar or from
 * a risk, issue or meeting drawer — the source stays locked when it was opened
 * from there, so the action always lands linked to the right record.
 */
export function ActionNewPage({ project, source, sourceRef, meetingName, meetingDate, back, onClose }: ActionNewProps) {
  const { addAction } = useActions();
  const { risks, issues } = useRiskRegister();
  const { currentUser } = useCurrentUser();
  const { projects } = useProjects();
  const { respTypes } = useResponsibilities();
  const { isActive } = useOrgActive("responsibility-type");
  const goBack = useBackNav();

  const lockedSource = (ACTION_SOURCES as string[]).includes(source ?? "") ? source as ActionSource : undefined;
  const projectNames = projects.map((p) => p.name);

  const [d, setD] = useState({
    project: project ?? projectNames[0] ?? "",
    title: "",
    description: "",
    source: lockedSource ?? "General" as ActionSource,
    sourceRef: lockedSource === "Meeting" ? undefined : sourceRef,
    meetingName: meetingName ?? "",
    meetingDate: meetingDate ?? "",
    owner: currentUser.name,
    responsibility: defaultResponsibility(respTypes, isActive),
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const up = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));

  const refs = d.source === "Risk" ? risks.filter((r) => r.project === d.project).map((r) => ({ v: r.id, l: `${r.id} · ${r.title}` }))
    : d.source === "Issue" ? issues.filter((i) => i.project === d.project).map((i) => ({ v: i.id, l: `${i.id} · ${i.title}` })) : [];

  const needsRef = (d.source === "Risk" || d.source === "Issue") && !d.sourceRef;
  const valid = d.title.trim() && d.dueDate && d.project && !needsRef;
  const fallback = { to: project ? "/portfolio" : "/action-tracker" };
  const close = () => onClose ? onClose() : goBack(back, fallback);

  function submit() {
    if (!valid) {
      setErrors({ title: d.title.trim() ? "" : "Action title is required", dueDate: d.dueDate ? "" : "Due date is required" });
      return;
    }
    const base = {
      project: d.project,
      title: d.title.trim().slice(0, 150),
      description: d.description.trim().slice(0, 1000),
      owner: d.owner.trim() || currentUser.name,
      responsibility: d.responsibility,
      dueDate: d.dueDate,
      status: "Open" as const,
      source: d.source,
    };
    addAction(d.source === "Meeting"
      ? { ...base, meetingId: sourceRef, meetingName: d.meetingName || undefined, meetingDate: d.meetingDate || undefined }
      : { ...base, sourceRef: d.sourceRef });
    toast.success("Action added");
    close();
  }

  return (
    <>
      {!onClose && <RecordPageHeader kind="action" back={back}
        title="Add action"
        subtitle={project ? `Project: ${project}` : "Any project in the portfolio"}
      />}

      <div className={onClose ? "w-full" : "glass-card w-full p-6"}>
        <div className="space-y-4">
          {!project && (
            <Field label="Project" htmlFor="act-project" error={errors.project}>
              <Select value={d.project} onValueChange={(v) => { up({ project: v, sourceRef: undefined }); setErrors((x) => ({ ...x, project: "" })); }}>
                <SelectTrigger id="act-project"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projectNames.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}

          {lockedSource && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="label-eyebrow mb-2">{t.linkedPlan}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill label={lockedSource} tone="border-border bg-muted text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {lockedSource === "Meeting"
                    ? `${meetingName ?? sourceRef}${meetingDate ? ` · ${formatDateWithYear(meetingDate)}` : ""}`
                    : sourceRef}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {lockedSource === "Risk" ? t.linkedRiskHint : lockedSource === "Issue" ? t.linkedIssueHint : t.linkedMeetingHint}
              </p>
            </div>
          )}

          <Field label={t.actionPlaceholder} htmlFor="act-title" error={errors.title}>
            <Input id="act-title" maxLength={150} value={d.title}
              onChange={(e) => { up({ title: e.target.value }); setErrors((x) => ({ ...x, title: "" })); }}
              placeholder="e.g. Share updated cutover plan" />
          </Field>

          <Field label="Description" htmlFor="act-desc" optional>
            <Textarea id="act-desc" maxLength={1000} value={d.description} onChange={(e) => up({ description: e.target.value })}
              placeholder="What this action covers" />
          </Field>

          {!lockedSource && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Source">
                <Select value={d.source} onValueChange={(v) => up({ source: v as ActionSource, sourceRef: undefined })}>
                  <SelectTrigger aria-label="Source"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              {(d.source === "Risk" || d.source === "Issue") && (
                <Field label={`Linked ${d.source.toLowerCase()}`} error={needsRef ? "Select the record this action belongs to" : ""}>
                  <Select value={d.sourceRef ?? ""} onValueChange={(v) => up({ sourceRef: v })}>
                    <SelectTrigger><SelectValue placeholder={`Select ${d.source.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{refs.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
              {d.source === "Meeting" && (
                <Field label="Meeting name" htmlFor="act-meet">
                  <Input id="act-meet" maxLength={100} value={d.meetingName} onChange={(e) => up({ meetingName: e.target.value })} />
                </Field>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Owner" htmlFor="act-owner">
              <Input id="act-owner" maxLength={80} value={d.owner} onChange={(e) => up({ owner: e.target.value })} />
            </Field>
            <Field label={t.responsibility}>
              <Select value={d.responsibility} onValueChange={(v) => up({ responsibility: v as ActionResponsibility })}>
                <SelectTrigger aria-label={t.responsibility}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {respTypes.filter((s) => isActive(s.name) || s.name === d.responsibility).map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.dueDate} error={errors.dueDate}>
              <DatePicker value={d.dueDate} onChange={(v) => { up({ dueDate: v }); setErrors((x) => ({ ...x, dueDate: "" })); }} />
            </Field>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={close}>{recordT.en.cancel}</Button>
          <Button variant="primary" onClick={submit} disabled={!valid}>{recordT.en.save}</Button>
        </div>
      </div>
    </>
  );
}
