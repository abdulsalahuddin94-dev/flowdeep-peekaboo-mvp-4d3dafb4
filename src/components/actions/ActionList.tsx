import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { formatDateWithYear } from "@/lib/date-format";
import { useActions, isActionOverdue } from "@/lib/action-store";
import { useProjects } from "@/lib/projects-store";
import { StatusCell, T as actionT } from "@/components/actions/ActionTracker";
import { useBackParam } from "@/lib/record-pages";

/**
 * Actions linked to one risk, issue or meeting. Quick view only — every row
 * opens the standalone Action details page, where edit, status and comments
 * live together instead of stacking popups over the source drawer.
 */
export function LinkedActions({ project, source, sourceRef, title, meetingMeta, onAdd }: {
  project: string;
  source: "Risk" | "Issue" | "Meeting";
  sourceRef: string;
  title: string;
  meetingMeta?: { meetingName?: string; meetingDate?: string };
  /** Overrides where the "+" goes — used where a batch composer already exists. */
  onAdd?: () => void;
}) {
  const { actions } = useActions();
  const navigate = useNavigate();
  const back = useBackParam();
  const linked = source === "Meeting"
    ? actions.filter((a) => a.meetingId === sourceRef)
    : actions.filter((a) => a.source === source && a.sourceRef === sourceRef);
  const done = linked.filter((a) => a.status === "Done").length;
  const overdue = linked.filter((a) => isActionOverdue(a)).length;

  function addAction() {
    if (onAdd) { onAdd(); return; }
    navigate({
      to: "/actions/new",
      search: {
        project,
        source,
        ref: sourceRef,
        meetingName: meetingMeta?.meetingName,
        meetingDate: meetingMeta?.meetingDate,
        back,
      },
    });
  }

  function openAction(id: string) {
    navigate({ to: "/actions/$actionId", params: { actionId: id }, search: { back } });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="label-eyebrow">
          {title} <span className="num-mono normal-case text-muted-foreground">· {done}/{linked.length} done{overdue ? ` · ${overdue} overdue` : ""}</span>
        </div>
        <Button variant="outline" size="icon" aria-label="Add action" title="Add action" onClick={addAction}>
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
            aria-label={`View ${a.title}`}
            onClick={() => openAction(a.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openAction(a.id);
              }
            }}
            className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-[var(--field-bg-filled)] px-3 py-2 text-start transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="min-w-0">
              <div className="truncate text-sm text-foreground">{a.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {a.owner} · <span className={cn("num-mono", isActionOverdue(a) && "text-rag-red")}>{formatDateWithYear(a.dueDate)}</span>
              </div>
            </div>
            <div className="shrink-0"><StatusCell a={a} /></div>
          </div>
        ))}
      </div>
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
          aria-label={`${actionT.viewLinkedActions} · ${sourceRef} · ${done} of ${linked.length}`}
          onClick={(event) => {
            event.stopPropagation();
            navigate({ to: "/portfolio/$projectId", params: { projectId: project.id }, search: { tab: "Action Tracker", actionRef: sourceRef } });
          }}>
          {linked.length}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{`${done} ${actionT.doneWord} · ${linked.length}`}</TooltipContent>
    </Tooltip>
  );
}
