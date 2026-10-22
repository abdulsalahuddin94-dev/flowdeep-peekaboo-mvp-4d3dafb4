import { useMemo } from "react";
import type { Project, WorkCalendar } from "@/lib/mock-data";
import type { Milestone } from "@/routes/portfolio.$projectId";
import { projectDurationDays } from "@/lib/mock-data";
import { computePlannedProgress } from "@/components/ProjectSchedule";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, ShieldAlert } from "@/lib/icons";
import { formatDateWithYear } from "@/lib/date-format";
import { cn } from "@/lib/utils";

/** Stage-gate segments shown in the header card; kept in sync with the project page. */
export const PLANNING_STAGES = [
  { n: 1, name: "Initiation", state: "done" as const },
  { n: 2, name: "Planning", state: "active" as const },
  { n: 3, name: "Execution", state: "todo" as const },
  { n: 4, name: "Monitoring", state: "todo" as const },
  { n: 5, name: "Closure", state: "todo" as const },
];

type ProjectOverviewHeaderProps = {
  project: Project;
  projectCalendar?: WorkCalendar;
  /** Weighted planned-vs-actual summary; falls back to the project's stored progress. */
  scheduleSummary?: { actual: number; planned: number };
  pendingApprovalCount?: number;
  onPendingClick?: () => void;
  onStageGateClick?: () => void;
};

/**
 * Project overview header — name + pills, client/calendar/code meta line and the
 * six quick-stat cards (Timeline, Budget, Stage Gate, Progress, Issues, Risks).
 * Same layout as the project detail page header.
 */
export function ProjectOverviewHeader({
  project,
  projectCalendar,
  scheduleSummary,
  pendingApprovalCount = 0,
  onPendingClick,
  onStageGateClick,
}: ProjectOverviewHeaderProps) {
  const summary = useMemo(() => {
    if (scheduleSummary) return scheduleSummary;
    return { actual: project.progress, planned: project.progress };
  }, [scheduleSummary, project.progress]);

  const durationDays = projectDurationDays(project);
  const budgetUsedPct = project.budgetTotal > 0
    ? Math.min(100, Math.round((project.budgetUsed / project.budgetTotal) * 100))
    : 0;
  const currentStage = PLANNING_STAGES.find((s) => s.state === "active") ?? PLANNING_STAGES[0];

  return (
    <section className="mb-5 rounded-lg bg-card p-5" aria-label="Project overview information">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-foreground">{project.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {project.client && (
              <span className="inline-flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[10px] font-semibold text-accent">
                  {project.client.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </span>
                {project.client}
              </span>
            )}
            {projectCalendar && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-muted-foreground" />
                {projectCalendar.name}
              </span>
            )}
            <span className="num-mono text-p-neutral-500"># {project.code}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {project.tags.slice(0, 1).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          {pendingApprovalCount > 0 && (
            <button type="button" onClick={onPendingClick} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Badge variant="outline" className="cursor-pointer border-rag-amber/30 bg-rag-amber/10 text-rag-amber hover:bg-rag-amber/20">{pendingApprovalCount} Pending Approvals</Badge>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex h-16 flex-col justify-center gap-1.5 rounded-lg bg-[var(--field-bg-filled)] px-4">
          <div className="text-xs text-muted-foreground">Timeline</div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="num-mono text-sm font-medium text-accent">{durationDays != null ? `${durationDays}d` : "—"}</span>
            <span className="num-mono text-[10px] text-muted-foreground">({formatDateWithYear(project.startDate)} → {formatDateWithYear(project.endDate)})</span>
          </div>
        </div>

        <div className="flex h-16 flex-col justify-center gap-1.5 rounded-lg bg-[var(--field-bg-filled)] px-4">
          <div className="text-xs text-muted-foreground">Budget</div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="num-mono text-sm font-medium text-foreground">${project.budgetUsed.toFixed(2)}M / ${project.budgetTotal.toFixed(1)}M</span>
            <span className="text-[10px] text-muted-foreground">{budgetUsedPct}% used</span>
          </div>
        </div>

        <StageGateCard
          {...(onStageGateClick ? { type: "button" as const, variant: "ghost" as const, "data-ds-size": "auto" as const, onClick: onStageGateClick } : {})}
          className={cn(
            "group h-16 justify-center rounded-lg bg-[var(--field-bg-filled)] px-4 text-left",
            onStageGateClick && "hover:bg-[var(--field-bg-filled)]/80",
          )}
        >
          <div className="flex w-full min-w-0 flex-col gap-1.5">
            <div className="text-xs font-normal text-muted-foreground">Stage Gate</div>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm font-semibold text-foreground">{currentStage.name}</span>
              <div className="flex min-w-0 flex-1 items-center gap-1" aria-label={`Stage ${currentStage.n} of ${PLANNING_STAGES.length}`}>
                {PLANNING_STAGES.map((stage) => (
                  <span key={stage.n} className={cn("h-1 flex-1 rounded-full", stage.state === "done" ? "bg-accent" : stage.state === "active" ? "bg-accent/60" : "bg-secondary")} />
                ))}
              </div>
            </div>
          </div>
        </StageGateCard>

        <div className="flex h-16 flex-col justify-center gap-1.5 rounded-lg bg-[var(--field-bg-filled)] px-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Progress</div>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", summary.actual >= summary.planned ? "bg-rag-green/15 text-rag-green" : "bg-rag-amber/15 text-rag-amber")}>
              {summary.actual >= summary.planned ? "On plan" : `${summary.planned - summary.actual}% behind`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={summary.actual} className="h-1.5 flex-1" />
            <span className="num-mono text-lg font-semibold text-foreground">{summary.actual}%</span>
            <span className="text-xs text-muted-foreground">/ {summary.planned}%</span>
          </div>
        </div>

        <div className="flex h-16 items-center gap-3 rounded-lg bg-[var(--field-bg-filled)] px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rag-red/15 text-rag-red">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Issues</div>
            <div className="flex items-baseline gap-2">
              <span className="num-mono text-lg font-semibold text-rag-red">{String(project.issues).padStart(2, "0")}</span>
              <span className="text-xs text-muted-foreground">2 critical</span>
            </div>
          </div>
        </div>

        <div className="flex h-16 items-center gap-3 rounded-lg bg-[var(--field-bg-filled)] px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rag-amber/15 text-rag-amber">
            <ShieldAlert size={18} />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Risks</div>
            <div className="flex items-baseline gap-2">
              <span className="num-mono text-lg font-semibold text-rag-amber">{String(project.risks).padStart(2, "0")}</span>
              <span className="text-xs text-muted-foreground">1 escalated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
