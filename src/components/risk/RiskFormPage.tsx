import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ArrowLeft } from "@/lib/icons";
import { useCurrentUser, useProjects } from "@/lib/projects-store";
import { useRiskRegister, type RiskRecord } from "@/lib/risk-store";
import { useActions } from "@/lib/action-store";
import { useResponsibilities, defaultResponsibility } from "@/lib/responsibility-store";
import { useOrgActive } from "@/lib/org-active";
import type { RiskStatus } from "@/lib/mock-data";
import { SEVERITY_TONE, RISK_STATUSES, useSeverity, milestonesForProject } from "@/components/risk/RiskIssues";
import { ActionRowsEditor, emptyActionRow, actionRowsValid, cleanActionRows, type ActionRow } from "@/components/actions/ActionTracker";
import { LinkedActions } from "@/components/actions/ActionList";
import { useBackNav } from "@/lib/record-pages";

/**
 * Standalone risk form — replaces the "Log a new risk" / "Edit risk" popups.
 * Opened from the portfolio-wide register or from a project's Risk & Issues tab
 * (then `lockedProject` keeps it inside that project).
 */
export function RiskFormPage({ riskId, lockedProject, back }: { riskId?: string; lockedProject?: string; back?: string }) {
  const { risks, categories, addRisk, updateRisk } = useRiskRegister();
  const { addActions } = useActions();
  const { currentUser } = useCurrentUser();
  const { projects } = useProjects();
  const { respTypes } = useResponsibilities();
  const { isActive } = useOrgActive("risk-category");
  const { severityOf, rules } = useSeverity();
  const goBack = useBackNav();

  const risk: RiskRecord | null = riskId ? risks.find((r) => r.id === riskId) ?? null : null;
  const projectOptions = Array.from(new Set([...projects.map((p) => p.name), ...risks.map((r) => r.project)]));
  const activeCategories = categories.filter((c) => isActive(c.id)).map((c) => c.name);
  const categoryOptions = activeCategories.length > 0 ? activeCategories : categories.map((c) => c.name);

  const [title, setTitle] = useState(risk?.title ?? "");
  const [project, setProject] = useState(risk?.project ?? lockedProject ?? projectOptions[0] ?? "");
  const [category, setCategory] = useState(risk?.category ?? "");
  const [milestone, setMilestone] = useState(risk?.milestone ?? "none");
  const [prob, setProb] = useState(String(risk?.prob ?? 3));
  const [impact, setImpact] = useState(String(risk?.impact ?? 3));
  const [status, setStatus] = useState<RiskStatus>(risk?.status ?? "Open");
  const [actionRows, setActionRows] = useState<ActionRow[]>([emptyActionRow(defaultResponsibility(respTypes))]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const score = Number(prob) * Number(impact);
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(() => {
    setScoreLoading(true);
    setScoreResult(null);
    const request = window.setTimeout(() => {
      setScoreResult(score);
      setScoreLoading(false);
    }, 700);
    return () => window.clearTimeout(request);
  }, [score]);

  const statusOptions = RISK_STATUSES.includes(status) ? RISK_STATUSES : [...RISK_STATUSES, status];
  const milestoneList = milestonesForProject(project);
  const milestoneOptions = risk?.milestone && !milestoneList.includes(risk.milestone) ? [risk.milestone, ...milestoneList] : milestoneList;
  const fallback = lockedProject ? { to: "/portfolio" } : { to: "/risks", search: { tab: "register" } };

  function submit() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Risk title is required";
    if (!project) next.project = "Select the project this risk belongs to";
    if (!category) next.category = "Select a category";
    if (!actionRowsValid(actionRows)) next.actions = "Each action needs a due date";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      project,
      title: title.trim(),
      category,
      owner: risk?.owner ?? "",
      prob: Number(prob),
      impact: Number(impact),
      score,
      status,
      mitigation: risk?.mitigation ?? "",
      milestone: milestone === "none" ? undefined : milestone,
    };
    if (risk) updateRisk(risk.id, payload);
    const rid = risk ? risk.id : addRisk({ ...payload, owner: payload.owner || currentUser.name });
    const rows = cleanActionRows(actionRows);
    if (rows.length) addActions(rows.map((a) => ({ ...a, owner: currentUser.name, project, source: "Risk" as const, sourceRef: rid, status: "Open" as const })));
    toast.done("Risk", risk ? "updated" : "logged");
    goBack(back, fallback);
  }

  return (
    <>
      <PageHeader
        title={risk ? "Edit risk" : "Log a new risk"}
        subtitle={lockedProject ? `Project: ${lockedProject}` : risk ? `${risk.id} · ${risk.project}` : "Record a potential event, assess it, and define mitigation actions"}
        actions={<Button variant="outline" onClick={() => goBack(back, fallback)}><ArrowLeft size={15} />Back</Button>}
      />

      <div className="glass-card max-w-4xl p-6">
        <div className="space-y-4">
          {!lockedProject && (
            <Field label="Project" htmlFor="risk-project" error={errors.project}>
              <Select value={project} onValueChange={(v) => { setProject(v); setErrors((x) => ({ ...x, project: "" })); }}>
                <SelectTrigger id="risk-project"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projectOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Risk title" htmlFor="risk-title" error={errors.title}>
              <Input id="risk-title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); }} placeholder="Describe the risk in one line" />
            </Field>
            <Field label="Category" htmlFor="risk-category" error={errors.category} hint="Maintained in Organization → Risk Categories">
              <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((x) => ({ ...x, category: "" })); }}>
                <SelectTrigger id="risk-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field label="Linked milestone" htmlFor="risk-milestone" optional hint="Link the risk to the schedule milestone it threatens." className="min-w-0">
              <Select value={milestone} onValueChange={setMilestone}>
                <SelectTrigger id="risk-milestone"><SelectValue placeholder="No linked milestone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked milestone</SelectItem>
                  {milestoneOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status" htmlFor="risk-status" className="min-w-0">
              <Select value={status} onValueChange={(v) => setStatus(v as RiskStatus)}>
                <SelectTrigger id="risk-status"><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Probability" htmlFor="risk-prob" hint="1 – 5">
              <Select value={prob} onValueChange={setProb}>
                <SelectTrigger id="risk-prob"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} · {rules.risk.probabilityLabels[n - 1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Impact" htmlFor="risk-impact" hint="1 – 5">
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger id="risk-impact"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} · {rules.risk.impactLabels[n - 1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Score" hint="Probability × Impact">
              <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-[var(--field-bg-filled)] px-3" aria-live="polite" aria-busy={scoreLoading}>
                {scoreLoading || scoreResult === null ? (
                  <span role="status" className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-accent" aria-hidden="true" />
                    Calculating…
                  </span>
                ) : (
                  <>
                    <span className="num-mono text-sm text-foreground">{scoreResult}</span>
                    <Pill label={severityOf(scoreResult)} tone={SEVERITY_TONE[severityOf(scoreResult)]} />
                  </>
                )}
              </div>
            </Field>
          </div>

          <ActionRowsEditor rows={actionRows} onChange={setActionRows} label={risk ? "Add mitigation actions" : "Mitigation plan"}
            hint={errors.actions ?? (risk ? "Existing actions are tracked from the risk details and the Action Tracker." : "Optional — each action is tracked in the Action Tracker.")} />
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => goBack(back, fallback)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={scoreLoading}>{risk ? "Save Changes" : "Log Risk"}</Button>
        </div>
      </div>

      {risk && (
        <div className="glass-card mt-6 max-w-4xl p-5">
          <LinkedActions project={risk.project} source="Risk" sourceRef={risk.id} title="Mitigation actions" />
        </div>
      )}
    </>
  );
}
