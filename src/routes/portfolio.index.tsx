import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge, RagDot } from "@/components/RagBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, LayoutGrid, List, GanttChartSquare, Search, Filter, X, Building2, Briefcase, Clock, ChevronDown } from "@/lib/icons";
import { FilterDrawer } from "@/components/FilterDrawer";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { projects, pipelineItems, type Project, type Rag } from "@/lib/mock-data";
import { useProjects, useCalendars, useApprovals, useTags } from "@/lib/projects-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio/")({
  component: PortfolioPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "Portfolio — Nexus PMO" }, { name: "description", content: "All active projects, governance, and business case intake across the enterprise portfolio." }] }),
});

const VIEWS = ["grid", "list", "gantt"] as const;
type View = typeof VIEWS[number];

const ALL_RAGS = [
  { v: "green", l: "On Track" }, { v: "amber", l: "At Risk" },
  { v: "red", l: "Off-Track" },   { v: "blue", l: "Not Started" }, { v: "grey", l: "On Hold" },
] as const;
const ALL_STAGES = ["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const;
const ALL_TAGS    = Array.from(new Set(projects.flatMap((p) => p.tags)));
const ALL_DEPTS   = Array.from(new Set(projects.map((p) => p.department)));
const ALL_CLIENTS = Array.from(new Set(projects.map((p) => p.client).filter(Boolean))) as string[];

function PortfolioPage() {
  const { projects: projectList, addProject } = useProjects();
  const { tab } = Route.useSearch();
  return (
    <div>
      <PageHeader
        title="Portfolio"
        actions={
          <div className="flex gap-2">
            <NewProjectDialog onAdd={addProject} />
          </div>
        }
      />
      {/* Portfolio subpages live in the sidebar (?tab=) — no in-page top tabs for MVP */}
      <div className="mt-5">
        <AllProjectsTab projectList={projectList} initialView={tab === "gantt" ? "gantt" : "grid"} />
      </div>
    </div>
  );
}

function AllProjectsTab({ restrict, projectList, initialView = "grid" }: { restrict?: boolean; projectList: Project[]; initialView?: View }) {
  const [view, setView]           = useState<View>(initialView);
  const [query, setQuery]         = useState("");
  const [active, setActive]       = useState<Project | null>(null);
  const navigate = useNavigate();
  const [ragFilter, setRagFilter]   = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter]   = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const { approvals } = useApprovals();
  const pendingByProject = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of approvals) {
      if (a.status !== "pending") continue;
      m.set(a.projectName, (m.get(a.projectName) ?? 0) + 1);
    }
    return m;
  }, [approvals]);
  const [onlyPending, setOnlyPending] = useState(false);

  const activeCount = ragFilter.length + stageFilter.length + tagFilter.length + (deptFilter ? 1 : 0) + (clientFilter ? 1 : 0);

  const list = useMemo(() => {
    let l = projectList;
    if (restrict) l = l.slice(0, 6);
    if (query) l = l.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (ragFilter.length > 0) l = l.filter((p) => ragFilter.includes(p.rag));
    if (stageFilter.length > 0) l = l.filter((p) => stageFilter.includes(p.stage));
    if (tagFilter.length > 0) l = l.filter((p) => p.tags.some((t) => tagFilter.includes(t)));
    if (deptFilter) l = l.filter((p) => p.department === deptFilter);
    if (clientFilter) l = l.filter((p) => p.client === clientFilter);
    if (onlyPending) l = l.filter((p) => (pendingByProject.get(p.name) ?? 0) > 0);
    return l;
  }, [projectList, query, restrict, ragFilter, stageFilter, tagFilter, deptFilter, clientFilter, onlyPending, pendingByProject]);

  const pagination = usePagination(list, 10);

  const projectsAwaiting = projectList.filter((p) => (pendingByProject.get(p.name) ?? 0) > 0);
  const pendingTotal = projectsAwaiting.reduce((s, p) => s + (pendingByProject.get(p.name) ?? 0), 0);

  function clearAll() { setRagFilter([]); setStageFilter([]); setTagFilter([]); setDeptFilter(""); setClientFilter(""); }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { l: "Active", v: projectList.length },
          { l: "On Track", v: projectList.filter((p) => p.rag === "green").length, c: "rag-green" },
          { l: "Budget Used", v: `$${projectList.reduce((s, p) => s + p.budgetUsed, 0).toFixed(1)}M / $${projectList.reduce((s, p) => s + p.budgetTotal, 0).toFixed(0)}M` },
          { l: "Off-Track", v: projectList.filter((p) => p.rag === "red").length, c: "rag-red", pulse: true },
        ].map((m) => (
          <div key={m.l} className="glass-card p-4">
            <div className="label-eyebrow">{m.l}</div>
            <div className="mt-1 flex items-center gap-2">
              {m.c && <span className={`h-2 w-2 rounded-full bg-${m.c} ${m.pulse ? "pulse-dot" : ""}`} />}
              <span className="text-xl font-medium num-mono text-foreground">{m.v}</span>
            </div>
          </div>
        ))}
        <button
          onClick={() => setOnlyPending((v) => !v)}
          className={cn(
            "glass-card p-4 text-left transition hover:ring-2 hover:ring-accent/40",
            onlyPending && "ring-2 ring-accent",
          )}
          title="Show only projects with pending approvals"
        >
          <div className="label-eyebrow flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Approvals</div>
          <div className="mt-1 flex items-center gap-2">
            {pendingTotal > 0 && <span className="h-2 w-2 rounded-full bg-rag-amber pulse-dot" />}
            <span className="text-xl font-medium num-mono text-foreground">{pendingTotal}</span>
            <span className="text-[11px] text-muted-foreground">
              {projectsAwaiting.length} project{projectsAwaiting.length === 1 ? "" : "s"}
            </span>
          </div>
        </button>
      </div>

      {pendingTotal > 0 && !onlyPending && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-rag-amber/30 bg-rag-amber/10 px-3 py-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-rag-amber" />
          <span className="text-foreground">
            {projectsAwaiting.length} project{projectsAwaiting.length === 1 ? "" : "s"} waiting on approvals
          </span>
          <span className="text-muted-foreground">
            {projectsAwaiting.slice(0, 3).map((p) => p.name).join(" · ")}
            {projectsAwaiting.length > 3 ? ` +${projectsAwaiting.length - 3} more` : ""}
          </span>
          <button onClick={() => setOnlyPending(true)} className="ml-auto text-accent hover:underline">Show only these</button>
          <Link to="/approvals" className="text-accent hover:underline">Open Approvals</Link>
        </div>
      )}
      {onlyPending && (
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-rag-amber/40 bg-rag-amber/10 px-2 py-0.5 text-[11px] text-rag-amber">
            Pending approvals only
            <button onClick={() => setOnlyPending(false)} className="ml-0.5 hover:text-foreground"><X className="h-3 w-3" /></button>
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-[220px] sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-md pl-9"
            aria-label="Search projects"
          />
        </div>
        <FilterDrawer
          groups={[
            { key: "rag", label: "RAG", multi: true, value: ragFilter, onChange: setRagFilter as never, options: ALL_RAGS.map(({ v, l }) => ({ value: v, label: l })) },
            { key: "stage", label: "Stage", multi: true, value: stageFilter, onChange: setStageFilter as never, options: ALL_STAGES.map((s) => ({ value: s, label: s })) },
            { key: "tags", label: "Tags", multi: true, value: tagFilter, onChange: setTagFilter as never, options: ALL_TAGS.map((t) => ({ value: t, label: t })) },
            { key: "dept", label: "Department", value: deptFilter, onChange: setDeptFilter as never, options: ALL_DEPTS.map((d) => ({ value: d, label: d })) },
            { key: "client", label: "Client", value: clientFilter, onChange: setClientFilter as never, options: ALL_CLIENTS.map((c) => ({ value: c, label: c })) },
          ]}
        />
        <div className="ml-auto flex h-9 overflow-hidden rounded-md border border-border bg-secondary/40">
          {([["grid", LayoutGrid], ["list", List], ["gantt", GanttChartSquare]] as const).map(([k, Icon]) => (
            <button key={k} onClick={() => setView(k as View)} className={`p-2 ${view === k ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      </div>
      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ragFilter.map((v) => {
            const label = ALL_RAGS.find((r) => r.v === v)?.l ?? v;
            return (
              <span key={v} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
                {label}<button onClick={() => setRagFilter((p) => p.filter((x) => x !== v))} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
              </span>
            );
          })}
          {stageFilter.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              {s}<button onClick={() => setStageFilter((p) => p.filter((x) => x !== s))} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {tagFilter.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              {t}<button onClick={() => setTagFilter((p) => p.filter((x) => x !== t))} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {deptFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              Dept: {deptFilter}<button onClick={() => setDeptFilter("")} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          )}
          {clientFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-dim/20 px-2 py-0.5 text-[11px] text-accent">
              Client: {clientFilter}<button onClick={() => setClientFilter("")} className="ml-0.5 hover:text-rag-red"><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      )}

      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Filter className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No projects match the current filters.</p>
          <button className="text-xs text-accent hover:underline" onClick={clearAll}>Clear all filters</button>
        </div>
      )}

      {view === "grid" && list.length > 0 && <ProjectGrid items={pagination.pageItems} pendingByProject={pendingByProject} onOpen={(p) => navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } })} />}
      {view === "list" && list.length > 0 && <ProjectListView items={pagination.pageItems} pendingByProject={pendingByProject} onOpen={(p) => navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } })} />}
      {view === "gantt" && list.length > 0 && <GanttView items={list} />}
      {view !== "gantt" && list.length > 0 && <TablePagination {...pagination} itemLabel="projects" />}
    </>
  );
}

function PendingApprovalsChip({ count, projectName, className }: { count: number; projectName: string; className?: string }) {
  const navigate = useNavigate();
  if (!count) return null;
  return (
    <span
      role="button"
      tabIndex={0}
      title={`${count} pending approval${count === 1 ? "" : "s"} — open Approvals`}
      onClick={(e) => { e.stopPropagation(); navigate({ to: "/approvals", search: { project: projectName } }); }}
      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); navigate({ to: "/approvals", search: { project: projectName } }); } }}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-rag-amber text-[10px] font-semibold text-black hover:bg-rag-amber/90",
        className,
      )}
    >
      {count}
    </span>
  );
}

function ProjectGrid({ items, onOpen, pendingByProject }: { items: Project[]; onOpen: (p: Project) => void; pendingByProject: Map<string, number> }) {
  const { tags: orgTags } = useTags();
  const colorOf = (name: string) => orgTags.find((t) => t.name === name)?.color;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => {
        const pending = pendingByProject.get(p.name) ?? 0;
        return (
        <button
          key={p.id}
          onClick={() => onOpen(p)}
          className="glass-card group flex flex-col p-4 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <RagBadge rag={p.rag} />
            <div className="flex items-center gap-1.5">
              <PendingApprovalsChip count={pending} projectName={p.name} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.stage}</span>
            </div>
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-medium text-foreground group-hover:text-accent">{p.name}</h3>
          <div className="mt-1 text-xs text-muted-foreground">{p.businessLine} · {p.department}</div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="num-mono text-foreground">{p.progress}%</span></div>
            <Progress value={p.progress} className="h-1.5" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><div className="label-eyebrow">Budget</div><div className="num-mono text-foreground">${p.budgetUsed.toFixed(1)}M / ${p.budgetTotal.toFixed(1)}M</div></div>
            <div><div className="label-eyebrow">End</div><div className="text-foreground">{p.endDate}</div></div>
          </div>
          {p.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags.map((tag) => {
                const c = colorOf(tag);
                return (
                  <span
                    key={tag}
                    className="rounded-full border px-1.5 py-px text-[10px]"
                    style={c
                      ? { color: c, borderColor: `${c}55`, backgroundColor: `${c}1f` }
                      : undefined}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </button>
        );
      })}
    </div>
  );
}

function ProjectListView({ items, onOpen, pendingByProject }: { items: Project[]; onOpen: (p: Project) => void; pendingByProject: Map<string, number> }) {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead className="w-6" /><TableHead>Project</TableHead><TableHead>Business Line</TableHead>
          <TableHead>PM</TableHead><TableHead>Department</TableHead><TableHead>Progress</TableHead>
          <TableHead>Budget</TableHead><TableHead>End</TableHead><TableHead>RAID</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id} onClick={() => onOpen(p)} className="cursor-pointer bg-table-row-bg hover:bg-table-row-hover border-0">
              <TableCell><RagDot rag={p.rag} /></TableCell>
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <span>{p.name}</span>
                  <PendingApprovalsChip count={pendingByProject.get(p.name) ?? 0} projectName={p.name} />
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{p.businessLine}</TableCell>
              <TableCell>{p.pm}</TableCell>
              <TableCell className="text-muted-foreground">{p.department}</TableCell>
              <TableCell className="w-40"><div className="flex items-center gap-2"><Progress value={p.progress} className="h-1.5" /><span className="num-mono text-xs">{p.progress}%</span></div></TableCell>
              <TableCell className="num-mono text-xs">${p.budgetUsed.toFixed(1)}/${p.budgetTotal.toFixed(1)}M</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.endDate}</TableCell>
              <TableCell className="text-xs">{p.risks + p.issues}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GanttView({ items }: { items: Project[] }) {
  const ragColor: Record<Rag, string> = {
    green: "bg-rag-green/15 border-rag-green/70",
    amber: "bg-rag-amber/20 border-rag-amber/70",
    red: "bg-rag-red/20 border-rag-red/70",
    blue: "bg-rag-blue/20 border-rag-blue/70",
    grey: "bg-rag-grey/15 border-rag-grey/60",
  };
  return (
    <div className="glass-card overflow-x-auto p-4">
      <div className="mb-2 grid grid-cols-[180px_repeat(12,minmax(40px,1fr))] gap-1 text-[10px] text-muted-foreground">
        <div></div>
        {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => (
          <div key={i} className="text-center">{m}</div>
        ))}
      </div>
      {items.map((p, i) => {
        const start = (i * 7) % 9;
        const length = 3 + (i % 6);
        return (
          <div key={p.id} className="grid grid-cols-[180px_repeat(12,minmax(40px,1fr))] items-center gap-1 py-1 text-xs">
            <div className="truncate pr-2 text-foreground">{p.name}</div>
            {Array.from({ length: 12 }).map((_, c) => (
              <div key={c} className="h-6">
                {c >= start && c < start + length && (
                  <div className={cn("h-full rounded-md border", ragColor[p.rag])} />
                )}
              </div>
            ))}
          </div>
        );
      })}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="text-xs font-medium text-foreground">Status:</span>
        {ALL_RAGS.map(({ v, l }) => (
          <span key={v} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", `bg-rag-${v}`)} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectSlideOver({ project, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <Sheet open={!!project} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto bg-surface text-foreground sm:max-w-[480px]">
        {project && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2"><RagBadge rag={project.rag} /><span className="text-xs text-muted-foreground">{project.stage}</span></div>
              <h2 className="mt-2 text-lg font-medium">{project.name}</h2>
              <p className="text-xs text-muted-foreground">{project.department} · PM: {project.pm}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-background/30 p-3">
                <div className="label-eyebrow">Completion</div>
                <div className="mt-1 text-2xl font-medium num-mono">{project.progress}%</div>
                <Progress value={project.progress} className="mt-1 h-1.5" />
              </div>
              <div className="rounded-md border border-border bg-background/30 p-3">
                <div className="label-eyebrow">Budget burn</div>
                <div className="mt-1 num-mono">${project.budgetUsed.toFixed(1)}M / ${project.budgetTotal.toFixed(1)}M</div>
                <div className="mt-1 text-xs text-rag-amber">▲ +4% vs plan</div>
              </div>
            </div>

            <div>
              <div className="label-eyebrow mb-2">Top risks (3)</div>
              <ul className="space-y-2 text-sm">
                {[
                  { t: "Vendor delivery delay", s: 8, st: "Open", c: "red" },
                  { t: "Scope creep risk", s: 6, st: "Mitig.", c: "amber" },
                  { t: "Key resource gap", s: 5, st: "Open", c: "amber" },
                ].map((r, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md border border-border bg-background/30 p-2">
                    <span className={`h-2 w-2 rounded-full bg-rag-${r.c} ${r.c === "red" ? "pulse-dot" : ""}`} />
                    <span className="flex-1">{r.t}</span>
                    <Badge variant="outline" className="border-border bg-secondary/40 text-[10px]">Score {r.s}</Badge>
                    <span className="text-xs text-muted-foreground">{r.st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="label-eyebrow mb-2">Last status report</div>
              <div className="rounded-md border border-border bg-background/30 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Week 18 · Sara · 3 days ago</div>
                <p className="mt-1 text-foreground">Integration layer testing delayed by 1 week. Fallback plan in review with IT Director. No impact on go-live yet.</p>
                <button className="mt-2 text-xs text-accent hover:underline">View full ↗</button>
              </div>
            </div>

            <div>
              <div className="label-eyebrow mb-2">Next milestone</div>
              <div className="rounded-md border border-border bg-background/30 p-3 text-sm">
                <div className="text-foreground">UAT Sign-off</div>
                <div className="text-xs text-muted-foreground">Due {project.endDate} · ⏳ 18 days remaining</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/portfolio/$projectId" params={{ projectId: project.id }}>Open Full Project →</Link>
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ArchivedTab() {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead>Project</TableHead><TableHead>Business Line</TableHead><TableHead>PM</TableHead>
          <TableHead>Closure</TableHead><TableHead>Final RAG</TableHead><TableHead>Budget vs Actual</TableHead><TableHead>Outcome</TableHead><TableHead />
        </TableRow></TableHeader>
        <TableBody>
          {[
            { n: "Tablet Rollout 2025", bl: "Software", pm: "Mei Chen", c: "Dec 2025", r: "green" as const, b: "+2%", o: "Closed — success" },
            { n: "North Site Upgrade", bl: "EPC", pm: "John Smith", c: "Oct 2025", r: "amber" as const, b: "+11%", o: "Closed — partial" },
            { n: "POS Modernization", bl: "Software", pm: "Priya Iyer", c: "Aug 2025", r: "red" as const, b: "+24%", o: "Cancelled" },
          ].map((r) => (
            <TableRow key={r.n} className="bg-table-row-bg hover:bg-table-row-hover border-0">
              <TableCell className="font-medium text-foreground">{r.n}</TableCell>
              <TableCell className="text-muted-foreground">{r.bl}</TableCell>
              <TableCell>{r.pm}</TableCell>
              <TableCell className="text-xs">{r.c}</TableCell>
              <TableCell><RagBadge rag={r.r} /></TableCell>
              <TableCell className="num-mono text-xs">{r.b}</TableCell>
              <TableCell className="text-xs">{r.o}</TableCell>
              <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BusinessCasesTab() {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead>#</TableHead><TableHead>Project</TableHead><TableHead>Pillar</TableHead>
          <TableHead>Submitted</TableHead><TableHead>Score</TableHead>
          <TableHead>Est. ROI</TableHead><TableHead>Stage</TableHead><TableHead />
        </TableRow></TableHeader>
        <TableBody>
          {pipelineItems.map((b) => (
            <TableRow key={b.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
              <TableCell className="num-mono text-xs text-muted-foreground">{b.id}</TableCell>
              <TableCell className="font-medium text-foreground">{b.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{b.pillar}</TableCell>
              <TableCell className="text-xs">{b.submittedBy} · {b.date}</TableCell>
              <TableCell>
                <span className={`num-mono rounded px-1.5 py-0.5 text-xs ${
                  b.score >= 71 ? "bg-rag-green/10 text-rag-green" : b.score >= 41 ? "bg-rag-amber/10 text-rag-amber" : "bg-rag-red/10 text-rag-red"
                }`}>{b.score}</span>
              </TableCell>
              <TableCell className="num-mono text-xs">{b.roi}</TableCell>
              <TableCell><StageBadge stage={b.stage} /></TableCell>
              <TableCell><Button size="sm" variant="outline">Review</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    "Submitted": "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
    "Under Review": "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
    "Approved": "border-rag-green/40 bg-rag-green/10 text-rag-green",
    "Rejected": "border-rag-red/40 bg-rag-red/10 text-rag-red",
  };
  return <Badge variant="outline" className={map[stage] ?? ""}>{stage}</Badge>;
}

function GovernanceTab() {
  const entries = [
    { d: "May 18", actor: "A. Khoury", action: "Approved", target: "BC-015 Customer Loyalty Platform", note: "Pillar: Growth · Score 88" },
    { d: "May 14", actor: "M. Cole", action: "Deferred", target: "BC-014 Legacy Decommissioning", note: "Revisit Q3 with revised ROI" },
    { d: "May 12", actor: "A. Khoury", action: "Requested revision", target: "BC-016 Internal Audit Tooling", note: "Add risk mitigation plan" },
    { d: "May 09", actor: "Board", action: "Approved budget", target: "Coastal Refinery Expansion", note: "+$2.4M change order" },
    { d: "May 03", actor: "Finance", action: "Locked baseline", target: "ERP Upgrade", note: "Baseline v3 frozen" },
  ];
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Date</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
        <TableBody>{entries.map((e, i) => (
          <TableRow key={i} className="bg-table-row-bg hover:bg-table-row-hover border-0">
            <TableCell className="text-xs text-muted-foreground">{e.d}</TableCell>
            <TableCell>{e.actor}</TableCell>
            <TableCell><Badge variant="outline" className="border-accent/40 bg-accent-dim text-accent">{e.action}</Badge></TableCell>
            <TableCell className="text-foreground">{e.target}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{e.note}</TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </div>
  );
}

function NewProjectDialog({ onAdd }: { onAdd: (p: Project) => void }) {
  const { calendars } = useCalendars();
  const { tags: orgTags } = useTags();
  const [open, setOpen] = useState(false);
  const [projectType, setProjectType] = useState<"capital" | "commercial" | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [businessLine, setBusinessLine] = useState("Software Solutions");
  const [department, setDepartment] = useState("Engineering");
  const [client, setClient] = useState("Internal");
  const [stage, setStage] = useState<Project["stage"]>("Initiation");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [revenue, setRevenue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [calendarId, setCalendarId] = useState<string>(calendars[0]?.id ?? "");

  function reset() { setName(""); setCode(""); setBudget(""); setRevenue(""); setStartDate(""); setDuration(""); setEndDate(""); setSelectedTags([]); setProjectType(null); }

  /** Auto-generated, editable project code. Prefix follows the selected type. */
  function autoCode(type: "capital" | "commercial") {
    const prefix = type === "capital" ? "CAP" : "COM";
    return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  }
  const isAutoCode = (v: string) => /^(CAP|COM)-\d{4}-\d{4}$/.test(v.trim());
  function pickType(t: "capital" | "commercial") {
    setProjectType(t);
    /* Keep everything the user already typed; only the code prefix follows the type. */
    setCode((prev) => (!prev.trim() || isAutoCode(prev) ? autoCode(t) : prev));
  }

  const DAY = 86_400_000;
  /** Duration is calendar days, inclusive of both start and end. */
  function addDays(iso: string, days: number) {
    return new Date(new Date(`${iso}T00:00:00`).getTime() + days * DAY).toISOString().slice(0, 10);
  }
  function diffDays(a: string, b: string) {
    return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY) + 1;
  }

  function onStartChange(v: string) {
    setStartDate(v);
    if (!v) return;
    const d = parseInt(duration, 10);
    if (d > 0) { setEndDate(addDays(v, d - 1)); return; }
    if (endDate) { const n = diffDays(v, endDate); setDuration(n > 0 ? String(n) : ""); }
  }
  function onDurationChange(v: string) {
    setDuration(v);
    const d = parseInt(v, 10);
    if (startDate && d > 0) setEndDate(addDays(startDate, d - 1));
  }
  function onEndChange(v: string) {
    setEndDate(v);
    if (startDate && v) { const n = diffDays(startDate, v); setDuration(n > 0 ? String(n) : ""); }
  }

  function handleCreate() {
    if (!name.trim()) { toast.error("Project name is required"); return; }
    const finalClient = projectType === "capital" ? "Internal" : client;
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      businessLine,
      department,
      client: finalClient,
      pm: "Unassigned",
      pmAvatar: "—",
      progress: 0,
      budgetUsed: 0,
      budgetTotal: parseFloat(budget) || 0,
      endDate: endDate ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "TBD",
      rag: "blue" as Rag,
      risks: 0,
      issues: 0,
      stage,
      tags: selectedTags,
      ragNote: "New",
      calendarId: calendarId || undefined,
    };
    onAdd(newProject);
    toast.success(`Project "${newProject.name}" created`);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-1 h-4 w-4" />New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a project directly in the portfolio. For new initiatives requiring approval, use Submit Business Case instead.</DialogDescription>
        </DialogHeader>
        {!projectType ? (
          <ProjectTypePicker onPick={pickType} />
        ) : (
        <>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex overflow-hidden rounded-md border border-border bg-secondary/20 p-1">
            {([["capital", "Capital / Internal"], ["commercial", "Commercial / External"]] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => pickType(k)}
                aria-selected={projectType === k}
                className={cn(
                  "flex-1 rounded-[6px] px-3 py-1.5 text-xs font-medium transition",
                  projectType === k
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className={projectType === "commercial" ? "" : "col-span-2"}>
            <Label>Project name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ERP Integration Phase 2" />
          </div>
          {projectType === "commercial" && (
            <div>
              <Label>Client</Label>
              <Select value={client} onValueChange={setClient}>
                <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACME Energy">ACME Energy</SelectItem>
                  <SelectItem value="Northwind Logistics">Northwind Logistics</SelectItem>
                  <SelectItem value="Global Tech">Global Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2">
            <Label>Project code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Auto-generated" />
          </div>
          <div>
            <Label>Business Line</Label>
            <Select value={businessLine} onValueChange={setBusinessLine}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Software Solutions", "EPC", "Consultation", "Maintenance"].map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Engineering", "IT", "Operations", "R&D", "Finance"].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as Project["stage"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start date</Label>
            <DatePicker value={startDate} onChange={onStartChange} placeholder="Pick start date" />
          </div>
          <div>
            <Label>Duration (days)</Label>
            <Input type="number" min="1" step="1" value={duration} onChange={(e) => onDurationChange(e.target.value)} placeholder="e.g. 120" />
          </div>
          <div>
            <Label>Target end date</Label>
            <DatePicker value={endDate} onChange={onEndChange} min={startDate || undefined} placeholder="Pick end date" />
          </div>
          <div>
            <Label>Budget total ($M)</Label>
            <Input type="number" min="0" step="0.1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 2.5" />
          </div>
          {projectType === "commercial" && (
            <div>
              <Label>Expected Revenue ($M)</Label>
              <Input type="number" min="0" step="0.1" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="e.g. 3.0" />
            </div>
          )}
          <div className="col-span-2">
            <Label>Working Calendar</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger><SelectValue placeholder="Select a calendar…" /></SelectTrigger>
              <SelectContent>
                {calendars.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">Working days and holidays applied to this project's schedule. Manage calendars in Organization → Calendars.</p>
          </div>
          <div className="col-span-2">
            <Label>Tags (optional)</Label>
            <TagPicker options={orgTags} value={selectedTags} onChange={setSelectedTags} />
            <p className="mt-1 text-[11px] text-muted-foreground">Tags come from Organization → Tags &amp; Classifications.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate}>Create Project</Button>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProjectTypePicker({ onPick }: { onPick: (t: "capital" | "commercial") => void }) {
  return <ProjectTypePickerInner onPick={onPick} />;
}

function TagPicker({
  options,
  value,
  onChange,
}: {
  options: { name: string; color: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const colorOf = (n: string) => options.find((t) => t.name === n)?.color ?? "#94A3B8";
  const filtered = options;
  const toggle = (n: string) =>
    onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);

  const shown = value.slice(0, 4);
  const extra = value.length - shown.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-left text-sm"
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {value.length === 0 && <span className="text-muted-foreground">Select tags…</span>}
            {shown.map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                style={{ color: colorOf(n), borderColor: `${colorOf(n)}66`, backgroundColor: `${colorOf(n)}22` }}
              >
                {n}
                <X
                  className="h-3 w-3 opacity-70 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); toggle(n); }}
                />
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                +{extra} more
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No tags found</p>
          )}
          {filtered.map((t) => {
            const on = value.includes(t.name);
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => toggle(t.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              >
                <Checkbox checked={on} className="pointer-events-none rounded-[4px]" />
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="flex-1 truncate" style={{ color: t.color }}>{t.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
          <span className="text-[11px] text-muted-foreground">{value.length} selected</span>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} disabled={value.length === 0}>
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProjectTypePickerInner({ onPick }: { onPick: (t: "capital" | "commercial") => void }) {
  const cards = [
    {
      key: "capital" as const,
      label: "Capital / Internal",
      blurb: "Internally-funded initiatives",
      icon: Building2,
      color: "text-accent",
      ring: "ring-accent/40",
    },
    {
      key: "commercial" as const,
      label: "Commercial / External",
      blurb: "Client engagements, delivery projects, third-party bids won.",
      icon: Briefcase,
      color: "text-rag-blue",
      ring: "ring-rag-blue/40",
    },
  ];
  return (
    <div className="pt-2">
      <p className="mb-4 text-sm text-muted-foreground">Choose the type of project to tailor the intake form.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => onPick(c.key)}
              className={cn("glass-card group p-5 text-left transition hover:ring-2", c.ring)}
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50", c.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-base font-medium text-foreground">{c.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.blurb}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NewBusinessCaseDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary"><Plus className="mr-1 h-4 w-4" />New Business Case</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Business Case</DialogTitle>
          <DialogDescription>This will be reviewed by the Portfolio Director for approval.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Project name</Label><Input placeholder="e.g. Predictive Maintenance Platform" /></div>
          <div><Label>Business Line</Label>
            <Select defaultValue="sw"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sw">Software Solutions</SelectItem><SelectItem value="epc">EPC</SelectItem>
                <SelectItem value="cons">Consultation</SelectItem><SelectItem value="maint">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Strategic Pillar</Label>
            <Select defaultValue="growth"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Growth</SelectItem><SelectItem value="eff">Efficiency</SelectItem>
                <SelectItem value="inn">Innovation</SelectItem><SelectItem value="comp">Compliance</SelectItem>
                <SelectItem value="esg">ESG</SelectItem><SelectItem value="ops">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Est. budget (CapEx)</Label><Input placeholder="$" /></div>
          <div><Label>Est. budget (OpEx)</Label><Input placeholder="$" /></div>
          <div className="col-span-2"><Label>Strategic objective</Label><Textarea placeholder="Why are we doing this?" /></div>
          <div className="col-span-2"><Label>Expected ROI</Label><Input placeholder="$ value or %" /></div>
          <div className="col-span-2"><Label>Tags (optional)</Label><Input placeholder="Strategic, Compliance…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Save draft</Button>
          <Button variant="primary" onClick={() => { toast.success("Business Case submitted for review"); setOpen(false); }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
