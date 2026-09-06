import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RagBadge, RagDot } from "@/components/RagBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, LayoutGrid, List, GanttChartSquare, Search, Filter, X, Clock, EditAction, DeleteAction, ChevronDown } from "@/lib/icons";
import { TableRowActions } from "@/components/TableRowActions";

import { TablePagination, usePagination } from "@/components/TablePagination";
import { EmptyRegion } from "@/lib/empty-preview";
import { projects, pipelineItems, projectDurationDays, type Project, type Rag } from "@/lib/mock-data";
import { useProjects, useCalendars, useApprovals, useTags } from "@/lib/projects-store";
import { DRAFT_KEY, type FormState } from "@/components/project/ProjectFormPage";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio/")({
  component: PortfolioPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Portfolio — Nexus PMO" },
      { name: "description", content: "All active projects, governance, and business case intake across the enterprise portfolio." },
      { property: "og:title", content: "Portfolio — Nexus PMO" },
      { property: "og:description", content: "Manage active projects, governance signals, and business case intake across the portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const VIEWS = ["grid", "list", "gantt"] as const;
type View = typeof VIEWS[number];

const ALL_RAGS = [
  { v: "green", l: "On Track" }, { v: "amber", l: "At Risk" },
  { v: "red", l: "Off-Track" },   { v: "blue", l: "Not Started" }, { v: "grey", l: "On Hold" },
] as const;
const ALL_STAGES = ["Initiation", "Planning", "Execution", "Monitoring", "Closure"] as const;
const ALL_TAGS    = Array.from(new Set(projects.flatMap((p) => p.tags)));
const ALL_DEPTS   = Array.from(new Set(projects.flatMap((p) => p.department)));
const ALL_CLIENTS = Array.from(new Set(projects.map((p) => p.client).filter(Boolean))) as string[];

function PortfolioPage() {
  const { projects: projectList } = useProjects();
  const { tab } = Route.useSearch();
  return (
    <div>
      <PageHeader
        title="Portfolio"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="primary">
              <Link to="/portfolio/new"><Plus className="mr-1 h-4 w-4" />New Project</Link>
            </Button>
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

  /** The single autosaved "new project" draft, if any — surfaced as a card so it isn't silently lost. */
  const [draft, setDraft] = useState<FormState | null>(null);
  useEffect(() => {
    function readDraft() {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        const parsed = raw ? (JSON.parse(raw) as FormState) : null;
        setDraft(parsed && (parsed.projectType || parsed.name) ? parsed : null);
      } catch { setDraft(null); }
    }
    readDraft();
    window.addEventListener("focus", readDraft);
    return () => window.removeEventListener("focus", readDraft);
  }, []);
  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setDraft(null);
    toast.success("Draft discarded");
  }

  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "draft">("");
  const [ragFilter, setRagFilter]   = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter]   = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [baseFilter, setBaseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  /** Project base is derived: internal projects have no external client. */
  const projectBase = (p: Project) => (!p.client || p.client === "Internal" ? "internal" : "external");
  const projectYear = (p: Project) => {
    const m = /(\d{4})/.exec(p.endDate ?? "");
    return m ? m[1] : "";
  };
  const yearOptions = useMemo(
    () => Array.from(new Set(projectList.map(projectYear).filter(Boolean))).sort(),
    [projectList],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(projectList.map((p) => p.businessLine).filter(Boolean))).sort(),
    [projectList],
  );


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


  const list = useMemo(() => {
    let l = projectList;
    if (statusFilter === "draft") return [];
    if (restrict) l = l.slice(0, 6);
    if (query) l = l.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (ragFilter.length > 0) l = l.filter((p) => ragFilter.includes(p.rag));
    if (stageFilter.length > 0) l = l.filter((p) => stageFilter.includes(p.stage));
    if (tagFilter.length > 0) l = l.filter((p) => p.tags.some((t) => tagFilter.includes(t)));
    if (deptFilter.length > 0) l = l.filter((p) => p.department.some((d) => deptFilter.includes(d)));
    if (clientFilter) l = l.filter((p) => p.client === clientFilter);
    if (yearFilter) l = l.filter((p) => projectYear(p) === yearFilter);
    if (baseFilter) l = l.filter((p) => projectBase(p) === baseFilter);
    if (typeFilter.length > 0) l = l.filter((p) => typeFilter.includes(p.businessLine));
    if (onlyPending) l = l.filter((p) => (pendingByProject.get(p.name) ?? 0) > 0);
    return l;
  }, [projectList, query, restrict, statusFilter, ragFilter, stageFilter, tagFilter, deptFilter, clientFilter, yearFilter, baseFilter, typeFilter, onlyPending, pendingByProject]);

  const pagination = usePagination(list, 10);

  const projectsAwaiting = projectList.filter((p) => (pendingByProject.get(p.name) ?? 0) > 0);
  const pendingTotal = projectsAwaiting.reduce((s, p) => s + (pendingByProject.get(p.name) ?? 0), 0);

  function clearAll() { setStatusFilter(""); setRagFilter([]); setStageFilter([]); setTagFilter([]); setDeptFilter([]); setClientFilter(""); setYearFilter(""); setBaseFilter(""); setTypeFilter([]); }

  const panelActiveCount = typeFilter.length + ragFilter.length + stageFilter.length + tagFilter.length
    + deptFilter.length + (clientFilter ? 1 : 0) + (yearFilter ? 1 : 0) + (baseFilter ? 1 : 0);

  const filterChipClass = "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors";
  const filterChipState = (selected: boolean) => selected
    ? "border-accent bg-accent-dim text-accent"
    : "border-border bg-secondary/50 text-muted-foreground hover:border-accent/50 hover:text-foreground";
  const toggleMulti = (value: string, current: string[], setValue: (next: string[]) => void) => {
    setValue(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };


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

      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-[240px] sm:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by project name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFilterOpen((o) => !o)}
          className={cn("gap-2 px-4", (panelActiveCount > 0 || filterOpen) && "border-accent text-accent")}
          aria-expanded={filterOpen}
        >
          <Filter className="h-4 w-4" />
          Filter
          {panelActiveCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-dim px-1.5 text-[11px]">{panelActiveCount}</span>}
          <ChevronDown className={cn("ml-1 h-3.5 w-3.5 transition-transform duration-200", filterOpen && "rotate-180")} />
        </Button>
        <div className="ml-auto flex h-9 overflow-hidden rounded-md border border-border bg-secondary/40">
          {([["grid", LayoutGrid], ["list", List], ["gantt", GanttChartSquare]] as const).map(([k, Icon]) => (
            <button key={k} onClick={() => setView(k as View)} className={`p-2 ${view === k ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
        </div>

        {panelActiveCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-foreground">Applied Filters:</span>
            {[
              ...typeFilter.map((value) => ({ key: `type-${value}`, label: value, remove: () => setTypeFilter((items) => items.filter((item) => item !== value)) })),
              ...deptFilter.map((value) => ({ key: `dept-${value}`, label: value, remove: () => setDeptFilter((items) => items.filter((item) => item !== value)) })),
              ...ragFilter.map((value) => ({ key: `rag-${value}`, label: ALL_RAGS.find((item) => item.v === value)?.l ?? value, remove: () => setRagFilter((items) => items.filter((item) => item !== value)) })),
              ...stageFilter.map((value) => ({ key: `stage-${value}`, label: value, remove: () => setStageFilter((items) => items.filter((item) => item !== value)) })),
              ...tagFilter.map((value) => ({ key: `tag-${value}`, label: value, remove: () => setTagFilter((items) => items.filter((item) => item !== value)) })),
              ...(yearFilter ? [{ key: `year-${yearFilter}`, label: yearFilter, remove: () => setYearFilter("") }] : []),
              ...(clientFilter ? [{ key: `client-${clientFilter}`, label: clientFilter, remove: () => setClientFilter("") }] : []),
              ...(baseFilter ? [{ key: `base-${baseFilter}`, label: baseFilter === "internal" ? "Internal" : "External", remove: () => setBaseFilter("") }] : []),
            ].map((chip) => (
              <span key={chip.key} className="inline-flex h-7 items-center gap-1 rounded-full border border-accent/40 bg-accent-dim px-3 text-xs text-accent">
                {chip.label}
                <button type="button" aria-label={`Remove ${chip.label}`} onClick={chip.remove} className="text-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
            <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Clear Filters <X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {filterOpen && (
        <div className="mb-4 h-[220px] overflow-y-auto rounded-lg border border-border bg-surface px-4 py-3 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
          <div className="min-w-[720px] space-y-3 pr-3">
            {[
              { label: "Project Types", options: typeOptions, selected: typeFilter, toggle: (value: string) => toggleMulti(value, typeFilter, setTypeFilter) },
              { label: "Departments", options: ALL_DEPTS, selected: deptFilter, toggle: (value: string) => toggleMulti(value, deptFilter, setDeptFilter) },
            ].map((group) => (
              <div key={group.label} className="flex items-start gap-3">
                <span className="w-28 shrink-0 pt-1.5 text-xs font-medium text-foreground">{group.label}</span>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((value) => <button key={value} type="button" onClick={() => group.toggle(value)} className={cn(filterChipClass, filterChipState(group.selected.includes(value)))}>{value}</button>)}
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <span className="w-28 shrink-0 pt-1.5 text-xs font-medium text-foreground">RAG</span>
              <div className="flex flex-wrap gap-2">
                {ALL_RAGS.map(({ v, l }) => <button key={v} type="button" onClick={() => toggleMulti(v, ragFilter, setRagFilter)} className={cn(filterChipClass, filterChipState(ragFilter.includes(v)))}><RagDot rag={v as Rag} />{l}</button>)}
              </div>
            </div>
            {[
              { label: "Stage", options: ALL_STAGES as readonly string[], selected: stageFilter, toggle: (value: string) => toggleMulti(value, stageFilter, setStageFilter) },
              { label: "Tags", options: ALL_TAGS, selected: tagFilter, toggle: (value: string) => toggleMulti(value, tagFilter, setTagFilter) },
            ].map((group) => (
              <div key={group.label} className="flex items-start gap-3">
                <span className="w-28 shrink-0 pt-1.5 text-xs font-medium text-foreground">{group.label}</span>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((value) => <button key={value} type="button" onClick={() => group.toggle(value)} className={cn(filterChipClass, filterChipState(group.selected.includes(value)))}>{value}</button>)}
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <span className="w-28 shrink-0 pt-1.5 text-xs font-medium text-foreground">Years</span>
              <div className="flex flex-wrap gap-2">{yearOptions.map((value) => <button key={value} type="button" onClick={() => setYearFilter(yearFilter === value ? "" : value)} className={cn(filterChipClass, filterChipState(yearFilter === value))}>{value}</button>)}</div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-28 shrink-0 pt-1.5 text-xs font-medium text-foreground">Clients</span>
              <div className="flex flex-wrap gap-2">{ALL_CLIENTS.map((value) => <button key={value} type="button" onClick={() => setClientFilter(clientFilter === value ? "" : value)} className={cn(filterChipClass, filterChipState(clientFilter === value))}>{value}</button>)}</div>
            </div>
            <div className="flex items-start gap-3 pb-1">
              <span className="w-28 shrink-0 pt-1.5 text-xs font-medium text-foreground">Bases</span>
              <div className="flex flex-wrap gap-2">{[["internal", "Internal"], ["external", "External"]].map(([value, label]) => <button key={value} type="button" onClick={() => setBaseFilter(baseFilter === value ? "" : value)} className={cn(filterChipClass, filterChipState(baseFilter === value))}>{label}</button>)}</div>
            </div>
          </div>
        </div>
      )}

      {(() => { const showDraft = !!draft && statusFilter !== "active" && view === "grid" && pagination.page === 1; return (
      <EmptyRegion id="portfolio-projects">
      {list.length === 0 && !showDraft && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Filter className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === "draft" ? "No draft in progress." : "No projects match the current filters."}
          </p>
          <button className="text-xs text-accent hover:underline" onClick={clearAll}>Clear all filters</button>
        </div>
      )}

      {view === "grid" && (list.length > 0 || showDraft) && (
        <ProjectGrid
          items={pagination.pageItems}
          draft={showDraft ? draft : null}
          onResumeDraft={() => navigate({ to: "/portfolio/new" })}
          onDiscardDraft={discardDraft}
          pendingByProject={pendingByProject}
          onEdit={(p) => navigate({ to: "/portfolio/$projectId/edit", params: { projectId: p.id } })}
          onOpen={(p) => navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } })}
        />
      )}
      {view === "list" && list.length > 0 && <ProjectListView items={pagination.pageItems} pendingByProject={pendingByProject} onEdit={(p) => navigate({ to: "/portfolio/$projectId/edit", params: { projectId: p.id } })} onOpen={(p) => navigate({ to: "/portfolio/$projectId", params: { projectId: p.id } })} />}
      {view === "gantt" && list.length > 0 && <GanttView items={list} />}
      {view !== "gantt" && list.length > 0 && <TablePagination {...pagination} itemLabel="projects" />}
      </EmptyRegion>
      ); })()}
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

function ProjectGrid({
  items, onOpen, onEdit, pendingByProject,
}: {
  items: Project[]; onOpen: (p: Project) => void; onEdit?: (p: Project) => void; pendingByProject: Map<string, number>;
}) {
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
              {onEdit && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit ${p.name}`}
                  title="Edit project"
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onEdit(p); } }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 text-accent-secondary opacity-0 transition group-hover:opacity-100 hover:bg-secondary/60"
                >
                  <EditAction size={14} />
                </span>
              )}
            </div>
          </div>

          <h3 className="mt-2 line-clamp-2 text-base font-medium text-foreground group-hover:text-accent">{p.name}</h3>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{p.client && p.client !== "Internal" ? p.client : "Internal"}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground/70">{p.code}</span>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="num-mono text-foreground">{p.progress}%</span></div>
            <Progress value={p.progress} className="h-1.5" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><div className="label-eyebrow">Start</div><div className="text-foreground">{p.startDate}</div></div>
            <div><div className="label-eyebrow">End</div><div className="text-foreground">{p.endDate}</div></div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div><div className="label-eyebrow">Budget</div><div className="num-mono text-foreground">${p.budgetUsed.toFixed(1)}M / ${p.budgetTotal.toFixed(1)}M</div></div>
            <div><div className="label-eyebrow">Duration</div><div className="num-mono text-foreground">{(() => { const d = projectDurationDays(p); return d != null ? `${d}d` : "—"; })()}</div></div>
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
          <div className="mt-auto flex items-center justify-end border-t border-border pt-3">
            <span className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              {p.businessLine}
            </span>
          </div>
        </button>
        );
      })}
    </div>
  );
}

function ProjectListView({ items, onOpen, onEdit, pendingByProject }: { items: Project[]; onOpen: (p: Project) => void; onEdit?: (p: Project) => void; pendingByProject: Map<string, number> }) {
  return (
    <div className="">
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
          <TableHead className="w-6" /><TableHead>Project</TableHead><TableHead>Project Type</TableHead>
          <TableHead>PM</TableHead><TableHead>Department</TableHead><TableHead>Progress</TableHead>
          <TableHead>Budget</TableHead><TableHead>End</TableHead><TableHead>RAID</TableHead>
          <TableHead className="w-32 text-right" />
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
              <TableCell className="text-muted-foreground">{p.department.join(" · ")}</TableCell>
              <TableCell className="w-40"><div className="flex items-center gap-2"><Progress value={p.progress} className="h-1.5" /><span className="num-mono text-xs">{p.progress}%</span></div></TableCell>
              <TableCell className="num-mono text-xs">${p.budgetUsed.toFixed(1)}/${p.budgetTotal.toFixed(1)}M</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.endDate}</TableCell>
              <TableCell className="text-xs">{p.risks + p.issues}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <TableRowActions onEdit={onEdit ? () => onEdit(p) : undefined} />
              </TableCell>
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
              <p className="text-xs text-muted-foreground">{project.department.join(" · ")} · PM: {project.pm}</p>
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
          <TableHead>Project</TableHead><TableHead>Project Type</TableHead><TableHead>PM</TableHead>
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
          <div><Label>Project Type</Label>
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
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { toast.success("Business Case submitted for review"); setOpen(false); }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
