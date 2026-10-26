import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/lib/toast";
import { ArrowLeft } from "@/lib/icons";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import { useRiskRegister, type IssueRecord } from "@/lib/risk-store";
import { useActions } from "@/lib/action-store";
import { useResponsibilities, defaultResponsibility } from "@/lib/responsibility-store";
import type { IssueItem, IssuePriority, IssueStatus } from "@/lib/mock-data";
import { ISSUE_STATUSES, milestonesForProject } from "@/components/risk/RiskIssues";
import { ActionRowsEditor, emptyActionRow, actionRowsValid, cleanActionRows, type ActionRow } from "@/components/actions/ActionTracker";
import { LinkedActions } from "@/components/actions/ActionList";
import { useBackNav } from "@/lib/record-pages";

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Standalone issue form — replaces the "Log a new issue" / "Edit issue" popups,
 * from both the portfolio-wide Issues Log and a project's Risk & Issues tab.
 */
export function IssueFormPage({ issueId, lockedProject, back }: { issueId?: string; lockedProject?: string; back?: string }) {
  const { risks, issues, addIssue, updateIssue } = useRiskRegister();
  const { addActions } = useActions();
  const { currentUser } = useCurrentUser();
  const { projects } = useProjects();
  const { respTypes } = useResponsibilities();
  const goBack = useBackNav();

  const issue: IssueRecord | null = issueId ? issues.find((i) => i.id === issueId) ?? null : null;
  const projectOptions = Array.from(new Set([...projects.map((p) => p.name), ...issues.map((i) => i.project)]));

  const [title, setTitle] = useState(issue?.title ?? "");
  const [project, setProject] = useState(issue?.project ?? lockedProject ?? projectOptions[0] ?? "");
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority ?? "Medium");
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "Open");
  const impact = issue?.impact ?? 3;
  const [openDate, setOpenDate] = useState(issue?.openDate ?? todayISO());
  const [targetDate, setTargetDate] = useState(issue?.targetDate ?? "");
  const [actionRows, setActionRows] = useState<ActionRow[]>([emptyActionRow(defaultResponsibility(respTypes))]);
  const [riskId, setRiskId] = useState(issue?.riskId ?? "none");
  const [milestone, setMilestone] = useState(issue?.milestone ?? "none");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const milestoneList = milestonesForProject(project);
  const milestoneOptions = issue?.milestone && !milestoneList.includes(issue.milestone) ? [issue.milestone, ...milestoneList] : milestoneList;
  const riskOptions = risks.filter((r) => r.project === project);
  const fallback = lockedProject ? { to: "/portfolio" } : { to: "/risks", search: { tab: "issues" } };

  function submit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Issue title is required";
    if (!project) next.project = "Select the project this issue belongs to";
    if (!openDate) next.openDate = "Open date is required";
    if (!actionRowsValid(actionRows)) next.actions = "Each action needs a due date";
    if (targetDate && openDate && targetDate < openDate) next.targetDate = "Target date cannot be before the open date";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: Omit<IssueItem, "id"> = {
      project,
      title: title.trim(),
      owner: issue?.owner ?? "",
      priority,
      impact: Number(impact),
      status,
      raised: issue?.raised ?? "Today",
      openDate,
      targetDate: targetDate || undefined,
      closureDate: status === "Resolved" ? (issue?.closureDate ?? todayISO()) : undefined,
      action: issue?.action ?? "",
      riskId: riskId === "none" ? undefined : riskId,
      milestone: milestone === "none" ? undefined : milestone,
      resolution: issue?.resolution,
      attachment: issue?.attachment,
    };
    if (issue && issues.some((i) => i.id !== issue.id && i.title.trim().toLowerCase() === payload.title.trim().toLowerCase())) {
      toast.error(`Issue "${payload.title}" already exists`, { description: "Issue titles must be unique." });
      return;
    }
    if (issue) updateIssue(issue.id, payload);
    const iid = issue ? issue.id : addIssue({ ...payload, owner: payload.owner || currentUser.name });
    const rows = cleanActionRows(actionRows);
    if (rows.length) addActions(rows.map((a) => ({ ...a, owner: currentUser.name, project, source: "Issue" as const, sourceRef: iid, status: "Open" as const })));
    toast.done("Issue", issue ? "updated" : "logged");
    goBack(back, fallback);
  }

  return (
    <>
      <PageHeader
        title={issue ? "Edit issue" : "Log a new issue"}
        subtitle={lockedProject ? `Project: ${lockedProject}` : issue ? `${issue.id} · ${issue.project}` : "Record a realized event that requires immediate corrective action"}
        actions={<Button variant="outline" onClick={() => goBack(back, fallback)}><ArrowLeft size={15} />Back</Button>}
      />

      <div className="glass-card max-w-4xl p-6">
        <div className="space-y-4">
          {!lockedProject && (
            <Field label="Project" htmlFor="issue-project" error={errors.project}>
              <Select value={project} onValueChange={(v) => { setProject(v); setErrors((x) => ({ ...x, project: "" })); }}>
                <SelectTrigger id="issue-project"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Issue title" htmlFor="issue-title" error={errors.title}>
            <Input id="issue-title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); }} placeholder="What is blocking or going wrong?" />
          </Field>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Severity" htmlFor="issue-priority" className="min-w-0">
              <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                <SelectTrigger id="issue-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status" htmlFor="issue-status" className="min-w-0">
              <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
                <SelectTrigger id="issue-status"><SelectValue /></SelectTrigger>
                <SelectContent>{ISSUE_STATUSES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Open date" htmlFor="issue-open-date" error={errors.openDate} className="min-w-0">
              <DatePicker id="issue-open-date" value={openDate} onChange={(v) => { setOpenDate(v); setErrors((x) => ({ ...x, openDate: "" })); }} placeholder="Pick a date" />
            </Field>
            <Field label="Target closure date" htmlFor="issue-target-date" optional error={errors.targetDate} className="min-w-0">
              <DatePicker id="issue-target-date" value={targetDate} onChange={(v) => { setTargetDate(v); setErrors((x) => ({ ...x, targetDate: "" })); }} placeholder="Pick a date" min={openDate || undefined} />
            </Field>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Originating risk" htmlFor="issue-risk" optional hint="Leave empty when the issue was not foreseen as a risk." className="min-w-0">
              <Select value={riskId} onValueChange={setRiskId}>
                <SelectTrigger id="issue-risk"><SelectValue placeholder="No originating risk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No originating risk</SelectItem>
                  {riskOptions.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Linked milestone" htmlFor="issue-milestone" optional hint="Link the issue to the schedule milestone it affects." className="min-w-0">
              <Select value={milestone} onValueChange={setMilestone}>
                <SelectTrigger id="issue-milestone"><SelectValue placeholder="No linked milestone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked milestone</SelectItem>
                  {milestoneOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <ActionRowsEditor rows={actionRows} onChange={setActionRows} label={issue ? "Add actions" : "Action plan"}
            hint={errors.actions ?? (issue ? "Existing actions are tracked from the issue details and the Action Tracker." : "Optional — each action is tracked in the Action Tracker.")} />
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => goBack(back, fallback)}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{issue ? "Save Changes" : "Log Issue"}</Button>
        </div>
      </div>

      {issue && (
        <div className="glass-card mt-6 max-w-4xl p-5">
          <LinkedActions project={issue.project} source="Issue" sourceRef={issue.id} title="Action plan" />
        </div>
      )}
    </>
  );
}
