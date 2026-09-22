import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { EmptyRegion } from "@/lib/empty-preview";
import { matchRelated, relatedProjectsGroup } from "@/components/ds/filters";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  StyledTable, StyledTableBody, StyledTableCell, StyledTableHead,
  StyledTableHeader, StyledTableHeaderRow, StyledTableRow,
} from "@/components/StyledTable";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { TableRowActions } from "@/components/TableRowActions";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resources, projects, departments } from "@/lib/mock-data";
import { useResourceRequests } from "@/lib/projects-store";
import type { ResourceRequest } from "@/lib/projects-store";
import { Upload, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, UserCheck } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Resources — Nexus PMO" },
      { name: "description", content: "Capacity planning, resource requests, utilization and skill demand." },
      { property: "og:title", content: "Resources — Nexus PMO" },
      { property: "og:description", content: "Plan resource capacity, allocations, utilization, and skill demand across projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Priority = "Critical" | "High" | "Medium" | "Low";
type PoolResource = typeof resources[number];

const PRIORITY_STYLE: Record<Priority, string> = {
  Critical: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  High: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Medium: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  Low: "border-border bg-secondary/40 text-muted-foreground",
};

const RES_TAB_LABELS: Record<string, string> = {
  requests: "Requests", people: "People", heatmap: "Utilization Heatmap",
  planning: "Manpower Planning", skills: "Skill Demand",
};

const SKILL_DEMAND = [
  { skill: "Cloud Architecture", department: "Engineering", demand: "High" as Priority, available: 12, required: 16, duration: "6 months" },
  { skill: "Industrial Control Systems", department: "Operations", demand: "Critical" as Priority, available: 4, required: 9, duration: "9 months" },
  { skill: "Data Engineering", department: "Data & Analytics", demand: "Medium" as Priority, available: 9, required: 11, duration: "4 months" },
  { skill: "Cyber Security", department: "Technology", demand: "Critical" as Priority, available: 3, required: 7, duration: "12 months" },
  { skill: "Project Management", department: "PMO", demand: "Medium" as Priority, available: 22, required: 24, duration: "Ongoing" },
  { skill: "Procurement / Contracts", department: "Procurement", demand: "Low" as Priority, available: 6, required: 6, duration: "3 months" },
];

const MANPOWER_PLAN = [
  { role: "Solution Architect", department: "Engineering", demand: 4, supply: 2, action: "Hire 2 / partner" },
  { role: "QA Engineer", department: "Technology", demand: 8, supply: 6, action: "Hire 1 / subcontract 1" },
  { role: "Field Engineer", department: "Operations", demand: 6, supply: 7, action: "Capacity available" },
  { role: "Security Lead", department: "Technology", demand: 2, supply: 1, action: "Critical hire" },
];

function ResourcesPage() {
  const { tab = "requests" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [pool, setPool] = useState<PoolResource[]>(resources.map((r) => ({ ...r })));
  const { resourceRequests: requests, updateResourceRequest } = useResourceRequests();

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const avgUtilization = pool.length ? Math.round(pool.reduce((sum, r) => sum + r.util, 0) / pool.length) : 0;
  const capacityGap = MANPOWER_PLAN.reduce((sum, row) => sum + Math.max(0, row.demand - row.supply), 0);

  function addToPool(entry: PoolResource) {
    setPool((prev) => [...prev, entry]);
  }

  function fulfillRequest(id: string, assignedTo: string, alloc: number) {
    const req = requests.find((r) => r.id === id);
    const person = pool.find((p) => p.name === assignedTo);
    const utilBefore = person?.util;
    const utilAfter = utilBefore == null ? undefined : Math.min(utilBefore + alloc, 200);
    if (person) {
      setPool((prev) => prev.map((p) => (p.name === assignedTo ? { ...p, util: utilAfter ?? p.util } : p)));
    }
    updateResourceRequest(id, {
      status: "Fulfilled", assignedTo, allocation: alloc,
      utilBefore, utilAfter, decidedOn: new Date().toISOString().slice(0, 10),
    });
    toast.success(`${req?.role} assigned to ${req?.project}`, {
      description: `${assignedTo} · ${alloc}% allocation · ${req?.from} → ${req?.until}`,
    });
  }

  function declineRequest(id: string, reason: string) {
    const req = requests.find((r) => r.id === id);
    updateResourceRequest(id, {
      status: "Declined", declineReason: reason,
      decidedOn: new Date().toISOString().slice(0, 10),
    });
    toast.success(`Request ${id} declined`, { description: req?.project });
  }

  return (
    <div>
      <PageHeader
        title="Resources"
        current={RES_TAB_LABELS[tab] ?? "Requests"}
        actions={
          <>
            <Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Import Excel</Button>
            <AddResourceDialog onAdd={addToPool} />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Headcount" value={pool.length} className="p-4" />
        <KpiCard label="Avg utilization" value={`${avgUtilization}%`} accent={avgUtilization > 90 ? "amber" : "teal"} className="p-4" />
        <KpiCard label="Open requests" value={pendingCount} accent={pendingCount ? "amber" : undefined} className="p-4" />
        <KpiCard label="Capacity gap" value={`-${capacityGap}`} accent={capacityGap ? "red" : "green"} className="p-4" />
      </div>

      <Tabs value={tab} onValueChange={(value) => navigate({ search: { tab: value } })}>
        <TabsContent value="requests" className="mt-0">
          <EmptyRegion id="resources-requests">
            <RequestsTable requests={requests} pool={pool} onFulfill={fulfillRequest} onDecline={declineRequest} />
          </EmptyRegion>
        </TabsContent>
        <TabsContent value="people" className="mt-0">
          <PeopleTable pool={pool} setPool={setPool} />
        </TabsContent>
        <TabsContent value="heatmap" className="mt-0">
          <HeatmapView pool={pool} />
        </TabsContent>
        <TabsContent value="planning" className="mt-0">
          <PlanningTable />
        </TabsContent>
        <TabsContent value="skills" className="mt-0">
          <SkillsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsTable({ requests, pool, onFulfill, onDecline }: {
  requests: ResourceRequest[];
  pool: PoolResource[];
  onFulfill: (id: string, assignedTo: string, alloc: number) => void;
  onDecline: (id: string, reason: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => (!q || r.role.toLowerCase().includes(q) || r.skill.toLowerCase().includes(q) || r.project.toLowerCase().includes(q)))
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => priority === "all" || r.priority === priority);
  }, [priority, query, requests, status]);
  const pagination = usePagination(filtered, 10);
  const selected = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search role, skill or project…" filterGroups={[
        { key: "status", label: "Status", value: status, onChange: setStatus, options: [
          { value: "all", label: "All statuses" }, { value: "Pending", label: "Pending" },
          { value: "Fulfilled", label: "Fulfilled" }, { value: "Declined", label: "Declined" },
        ] },
        { key: "priority", label: "Priority", value: priority, onChange: setPriority, options: [
          { value: "all", label: "All priorities" }, ...(["Critical", "High", "Medium", "Low"] as Priority[]).map((v) => ({ value: v, label: v })),
        ] },
      ]} />
        <StyledTable wrapperClassName="">
          <StyledTableHeader><StyledTableHeaderRow>
            <StyledTableHead>Role / Skill</StyledTableHead><StyledTableHead>Project</StyledTableHead>
            <StyledTableHead>FTE</StyledTableHead><StyledTableHead>Period</StyledTableHead>
            <StyledTableHead>Priority</StyledTableHead><StyledTableHead>Submitted by</StyledTableHead>
            <StyledTableHead className="w-44 text-center">Status</StyledTableHead>
          </StyledTableHeaderRow></StyledTableHeader>
          <StyledTableBody>
            {pagination.pageItems.length === 0 ? <EmptyRow colSpan={7} /> : pagination.pageItems.map((req) => (
                <StyledTableRow
                  key={req.id}
                  className="group cursor-pointer"
                  onClick={() => setOpenId(req.id)}
                >
                  <StyledTableCell><div className="font-medium text-foreground">{req.role}</div><div className="text-xs text-muted-foreground">{req.skill}</div></StyledTableCell>
                  <StyledTableCell>{req.project}</StyledTableCell>
                  <StyledTableCell className="num-mono">{req.fte}</StyledTableCell>
                  <StyledTableCell className="num-mono text-xs text-muted-foreground">{req.from} → {req.until}</StyledTableCell>
                  <StyledTableCell><Badge variant="outline" className={PRIORITY_STYLE[req.priority]}>{req.priority}</Badge></StyledTableCell>
                  <StyledTableCell><div>{req.submittedBy}</div><div className="text-xs text-muted-foreground">{/^\d{4}-\d{2}-\d{2}$/.test(req.date) ? formatDateWithYear(req.date) : req.date}</div></StyledTableCell>
                  <StyledTableCell className="max-w-64">
                    {req.status === "Fulfilled" ? (
                      <>
                        <div className="text-foreground">{req.assignedTo ?? "—"}</div>
                        {req.allocation != null && (
                          <div className="num-mono text-xs text-muted-foreground">
                            {req.allocation}% allocation{req.utilAfter != null ? ` · utilization ${req.utilAfter}%` : ""}
                          </div>
                        )}
                      </>
                    ) : req.status === "Declined" ? (
                      <div className="truncate text-xs text-rag-red" title={req.declineReason}>{req.declineReason ?? "Declined"}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting decision</span>
                    )}
                  </StyledTableCell>
                  <StyledTableCell onClick={(e) => e.stopPropagation()}>
                    <TableRowActions
                      alwaysVisible={false}
                      statusNode={<Badge variant="outline" className={statusTone(req.status)}>{req.status}</Badge>}
                      extraActions={req.status === "Pending" ? <><FulfillDialog req={req} pool={pool} onFulfill={onFulfill} compact /><DeclineDialog req={req} onDecline={onDecline} compact /></> : undefined}
                    />
                  </StyledTableCell>
                </StyledTableRow>
              ))}
          </StyledTableBody>
        </StyledTable>
      <TablePagination {...pagination} itemLabel="requests" demoPages={1} />
      <RequestSheet req={selected} onClose={() => setOpenId(null)} />
    </>
  );
}

function statusTone(status: ResourceRequest["status"]) {
  return status === "Fulfilled"
    ? "border-rag-green/50 bg-rag-green/10 text-rag-green"
    : status === "Declined"
      ? "border-rag-red/50 bg-rag-red/10 text-rag-red"
      : "border-rag-amber/50 bg-rag-amber/10 text-rag-amber";
}

function DrawerRow({ label, value, valueClass = "" }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right text-foreground ${valueClass}`}>{value}</span>
    </div>
  );
}

/** Request detail drawer: full request data plus the recorded decision outcome. */
function RequestSheet({ req, onClose }: { req: ResourceRequest | null; onClose: () => void }) {
  return (
    <Sheet open={!!req} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-[480px] max-w-full flex-col rounded-l-lg border-l border-border bg-drawer p-0 sm:max-w-[480px]">
        {req && (
          <>
            <SheetHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
              <div className="flex items-center gap-2">
                <span className="num-mono text-xs text-muted-foreground">{req.id}</span>
                <Badge variant="outline" className={statusTone(req.status)}>{req.status}</Badge>
                <Badge variant="outline" className={PRIORITY_STYLE[req.priority]}>{req.priority}</Badge>
              </div>
              <SheetTitle className="mt-2 text-lg">{req.role} <span className="text-sm font-normal text-muted-foreground">({req.skill})</span></SheetTitle>
              <SheetDescription className="sr-only">Resource request details and decision outcome.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request</h4>
                <DrawerRow label="Project" value={req.project} />
                <DrawerRow label="FTE" value={req.fte} valueClass="num-mono" />
                <DrawerRow label="Period" value={`${req.from} → ${req.until}`} valueClass="num-mono" />
                <DrawerRow label="Submitted by" value={req.submittedBy} />
                <DrawerRow label="Submitted" value={/^\d{4}-\d{2}-\d{2}$/.test(req.date) ? formatDateWithYear(req.date) : req.date} />
                {req.notes && (
                  <p className="rounded-md border border-border bg-secondary/30 p-3 text-xs italic text-muted-foreground">"{req.notes}"</p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</h4>
                {req.status === "Pending" && (
                  <p className="text-sm text-muted-foreground">No decision taken yet. Fulfill or decline this request from the requests list.</p>
                )}

                {req.status === "Declined" && (
                  <>
                    {req.decidedOn && <DrawerRow label="Declined on" value={formatDateWithYear(req.decidedOn)} />}
                    <div className="rounded-md border border-rag-red/40 bg-rag-red/10 p-3">
                      <div className="text-xs font-medium text-rag-red">Decline reason</div>
                      <p className="mt-1 text-sm text-foreground">{req.declineReason ?? "—"}</p>
                    </div>
                  </>
                )}

                {req.status === "Fulfilled" && (
                  <>
                    <DrawerRow label="Assigned person" value={req.assignedTo ?? "—"} />
                    {req.allocation != null && (
                      <DrawerRow label="Allocation on this project" value={`${req.allocation}%`} valueClass="num-mono" />
                    )}
                    {req.decidedOn && <DrawerRow label="Assigned on" value={formatDateWithYear(req.decidedOn)} />}
                    {req.utilAfter != null && (
                      <div className="space-y-2 rounded-md border border-border bg-background/30 p-3 text-xs">
                        {req.utilBefore != null && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Utilization before assignment</span>
                              <span className="num-mono font-medium text-foreground">{req.utilBefore}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                              <div className="h-full rounded-full bg-accent/40" style={{ width: `${Math.min(req.utilBefore, 100)}%` }} />
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current utilization after this assignment</span>
                          <span className={`num-mono font-medium ${req.utilAfter > 100 ? "text-rag-red" : req.utilAfter > 80 ? "text-rag-amber" : "text-rag-green"}`}>{req.utilAfter}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                          <div className={`h-full rounded-full ${req.utilAfter > 100 ? "bg-rag-red" : req.utilAfter > 80 ? "bg-rag-amber" : "bg-accent"}`} style={{ width: `${Math.min(req.utilAfter, 100)}%` }} />
                        </div>
                        {req.utilAfter > 100 && <p className="text-rag-red">⚠ {req.assignedTo} is over-allocated</p>}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PeopleTable({ pool, setPool }: { pool: PoolResource[]; setPool: React.Dispatch<React.SetStateAction<PoolResource[]>> }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [related, setRelated] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((r) => !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q))
      .filter((r) => department === "all" || r.dept === department)
      .filter((r) => matchRelated(related, r.projects.length));
  }, [department, pool, query, related]);
  const pagination = usePagination(filtered, 10);

  return (
    <>
      <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search member or role…" filterGroups={[
        relatedProjectsGroup(related, setRelated),
        { key: "department", label: "Department", value: department, onChange: setDepartment, options: [{ value: "all", label: "All departments" }, ...departments.map((d) => ({ value: d.name, label: d.name }))] },
      ]} />
      <EmptyRegion id="resources-capacity">
          <StyledTable wrapperClassName="">
            <StyledTableHeader><StyledTableHeaderRow>
              <StyledTableHead>Member</StyledTableHead><StyledTableHead>Role</StyledTableHead><StyledTableHead>Department</StyledTableHead>
              <StyledTableHead>Capacity / wk</StyledTableHead><StyledTableHead>Utilization</StyledTableHead><StyledTableHead>Projects</StyledTableHead>
              <StyledTableHead className="w-44 text-center">Status</StyledTableHead>
            </StyledTableHeaderRow></StyledTableHeader>
            <StyledTableBody>
              {pagination.pageItems.length === 0 ? <EmptyRow colSpan={7} /> : pagination.pageItems.map((r) => {
                const state = r.util > 100 ? "Over-allocated" : r.util === 0 ? "Bench" : "Allocated";
                const tone = r.util > 100 ? "border-rag-red/50 bg-rag-red/10 text-rag-red" : r.util === 0 ? "border-border bg-secondary/40 text-muted-foreground" : "border-rag-green/50 bg-rag-green/10 text-rag-green";
                return (
                  <StyledTableRow key={r.name} className="group">
                    <StyledTableCell className="font-medium text-foreground"><div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-accent-dim text-[10px] text-accent">{r.name.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar>{r.name}</div></StyledTableCell>
                    <StyledTableCell>{r.role}</StyledTableCell><StyledTableCell className="text-muted-foreground">{r.dept}</StyledTableCell>
                    <StyledTableCell className="num-mono">{r.capacity}h</StyledTableCell>
                    <StyledTableCell className="w-48"><div className="flex items-center gap-2"><Progress value={Math.min(r.util, 100)} className={`h-1.5 ${r.util > 100 ? "[&>div]:bg-rag-red" : r.util > 90 ? "[&>div]:bg-rag-amber" : "[&>div]:bg-accent"}`} /><span className={`num-mono text-xs ${r.util > 100 ? "text-rag-red" : "text-foreground"}`}>{r.util}%</span></div></StyledTableCell>
                    <StyledTableCell className="max-w-56 truncate text-xs text-muted-foreground">{r.projects.length ? r.projects.join(", ") : "—"}</StyledTableCell>
                    <StyledTableCell><TableRowActions statusNode={<Badge variant="outline" className={tone}>{state}</Badge>} extraActions={<AssignDialog resource={r} compact onAssign={(projectName, alloc) => setPool((prev) => prev.map((x) => x.name === r.name ? { ...x, util: Math.min(x.util + alloc, 200), projects: x.projects.includes(projectName) ? x.projects : [...x.projects, projectName] } : x))} />} /></StyledTableCell>
                  </StyledTableRow>
                );
              })}
            </StyledTableBody>
          </StyledTable>
      </EmptyRegion>
      <TablePagination {...pagination} itemLabel="resources" demoPages={1} />
    </>
  );
}

function SkillsTable() {
  const [query, setQuery] = useState("");
  const [demand, setDemand] = useState("all");
  const [department, setDepartment] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SKILL_DEMAND.filter((row) => !q || row.skill.toLowerCase().includes(q) || row.department.toLowerCase().includes(q))
      .filter((row) => demand === "all" || row.demand === demand)
      .filter((row) => department === "all" || row.department === department);
  }, [demand, department, query]);
  const pagination = usePagination(filtered, 10);
  const skillDepartments = Array.from(new Set(SKILL_DEMAND.map((row) => row.department)));

  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search skill or department…" filterGroups={[
      { key: "demand", label: "Demand intensity", value: demand, onChange: setDemand, options: [{ value: "all", label: "All demand levels" }, ...(["Critical", "High", "Medium", "Low"] as Priority[]).map((v) => ({ value: v, label: v }))] },
      { key: "department", label: "Department", value: department, onChange: setDepartment, options: [{ value: "all", label: "All departments" }, ...skillDepartments.map((v) => ({ value: v, label: v }))] },
    ]} />
      <StyledTable wrapperClassName=""><StyledTableHeader><StyledTableHeaderRow>
        <StyledTableHead>Skill name</StyledTableHead><StyledTableHead>Department</StyledTableHead><StyledTableHead>Available</StyledTableHead><StyledTableHead>Required</StyledTableHead><StyledTableHead>Gap</StyledTableHead><StyledTableHead>Project duration</StyledTableHead><StyledTableHead className="text-center">Demand</StyledTableHead>
      </StyledTableHeaderRow></StyledTableHeader><StyledTableBody>
        {pagination.pageItems.length === 0 ? <EmptyRow colSpan={7} /> : pagination.pageItems.map((row) => <StyledTableRow key={row.skill} className="group">
          <StyledTableCell className="font-medium text-foreground">{row.skill}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.department}</StyledTableCell><StyledTableCell className="num-mono">{row.available}</StyledTableCell><StyledTableCell className="num-mono">{row.required}</StyledTableCell><StyledTableCell className={`num-mono ${row.required > row.available ? "text-rag-red" : "text-rag-green"}`}>{row.available - row.required}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.duration}</StyledTableCell><StyledTableCell className="text-center"><Badge variant="outline" className={PRIORITY_STYLE[row.demand]}>{row.demand}</Badge></StyledTableCell>
        </StyledTableRow>)}
      </StyledTableBody></StyledTable>
    <TablePagination {...pagination} itemLabel="skills" demoPages={1} />
  </>;
}

function PlanningTable() {
  const [query, setQuery] = useState("");
  const [gapFilter, setGapFilter] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MANPOWER_PLAN.filter((row) => !q || row.role.toLowerCase().includes(q) || row.department.toLowerCase().includes(q))
      .filter((row) => gapFilter === "all" || (gapFilter === "gap" ? row.demand > row.supply : row.demand <= row.supply));
  }, [gapFilter, query]);
  const pagination = usePagination(filtered, 10);
  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search role or department…" filterGroups={[{ key: "gap", label: "Capacity", value: gapFilter, onChange: setGapFilter, options: [{ value: "all", label: "All roles" }, { value: "gap", label: "Capacity gap" }, { value: "covered", label: "Capacity covered" }] }]} />
    <StyledTable wrapperClassName=""><StyledTableHeader><StyledTableHeaderRow><StyledTableHead>Role</StyledTableHead><StyledTableHead>Department</StyledTableHead><StyledTableHead>Demand (FTE)</StyledTableHead><StyledTableHead>Supply</StyledTableHead><StyledTableHead>Gap</StyledTableHead><StyledTableHead>Recommended action</StyledTableHead><StyledTableHead className="text-center">Status</StyledTableHead></StyledTableHeaderRow></StyledTableHeader><StyledTableBody>
      {pagination.pageItems.length === 0 ? <EmptyRow colSpan={7} /> : pagination.pageItems.map((row) => { const gap = row.demand - row.supply; return <StyledTableRow key={row.role} className="group"><StyledTableCell className="font-medium text-foreground">{row.role}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.department}</StyledTableCell><StyledTableCell className="num-mono">{row.demand}</StyledTableCell><StyledTableCell className="num-mono">{row.supply}</StyledTableCell><StyledTableCell className={`num-mono ${gap > 0 ? "text-rag-red" : "text-rag-green"}`}>{gap > 0 ? `+${gap}` : gap}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.action}</StyledTableCell><StyledTableCell className="text-center"><Badge variant="outline" className={gap > 0 ? "border-rag-red/40 bg-rag-red/10 text-rag-red" : "border-rag-green/40 bg-rag-green/10 text-rag-green"}>{gap > 0 ? "Action needed" : "Covered"}</Badge></StyledTableCell></StyledTableRow>; })}
    </StyledTableBody></StyledTable><TablePagination {...pagination} itemLabel="roles" demoPages={1} />
  </>;
}

function HeatmapView({ pool }: { pool: PoolResource[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return pool.filter((r) => !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)).filter((r) => department === "all" || r.dept === department); }, [department, pool, query]);
  return <><PageToolbar query={query} onQueryChange={setQuery} placeholder="Search member or role…" filterGroups={[{ key: "department", label: "Department", value: department, onChange: setDepartment, options: [{ value: "all", label: "All departments" }, ...departments.map((d) => ({ value: d.name, label: d.name }))] }]} /><div className="rounded-lg border border-border bg-surface p-5"><Heatmap pool={filtered} /></div></>;
}

function FulfillDialog({
  req,
  pool,
  onFulfill,
  compact = false,
}: {
  req: ResourceRequest;
  pool: PoolResource[];
  onFulfill: (id: string, assignedTo: string, alloc: number) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [alloc, setAlloc] = useState(50);
  const [personError, setPersonError] = useState("");

  const selectedPerson = pool.find((r) => r.name === personName);
  const projected = selectedPerson ? Math.min(selectedPerson.util + alloc, 200) : null;
  const projColor = projected == null ? "" : projected > 100 ? "text-rag-red" : projected > 80 ? "text-rag-amber" : "text-rag-green";

  function handleSave() {
    if (!personName) { setPersonError("Select a person to assign."); return; }
    onFulfill(req.id, personName, alloc);
    setOpen(false);
    setPersonName(""); setAlloc(50);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={compact ? "icon" : "sm"} variant="secondary" data-ds-size={compact ? "auto" : undefined} aria-label="Fulfill request" title="Fulfill request" className={compact ? "h-9 w-9 rounded-full border border-border/60 text-rag-green" : undefined}>
          <CheckCircle2 className={compact ? "h-4 w-4" : "mr-1 h-3.5 w-3.5"} />{compact ? null : "Fulfill"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fulfill resource request</DialogTitle>
        </DialogHeader>

        {/* Request summary */}
        <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <div className="font-medium text-foreground">{req.role} <span className="text-muted-foreground text-xs">({req.skill})</span></div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {req.project} · {req.fte} FTE · {req.from} → {req.until}
          </div>
          {req.notes && <div className="mt-1 text-xs italic text-muted-foreground">"{req.notes}"</div>}
        </div>

        <div className="grid gap-3">
          {/* Person picker */}
          <Field label="Assign person" htmlFor="fulfill-person" required error={personError}>
            <Select onValueChange={(value) => { setPersonName(value); setPersonError(""); }}>
              <SelectTrigger id="fulfill-person"><SelectValue placeholder="Select from resource pool…" /></SelectTrigger>
              <SelectContent>
                {pool.map((r) => (
                  <SelectItem key={r.name} value={r.name}>
                    <span className="flex items-center gap-2">
                      <span>{r.name}</span>
                      <span className="text-xs text-muted-foreground">— {r.role}</span>
                      <span className={`num-mono text-xs ml-auto ${r.util > 100 ? "text-rag-red" : r.util > 80 ? "text-rag-amber" : "text-rag-green"}`}>
                        {r.util}%
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Utilization preview */}
          {selectedPerson && (
            <div className="rounded-md border border-border bg-background/30 p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current utilization</span>
                <span className={`num-mono font-medium ${selectedPerson.util > 100 ? "text-rag-red" : selectedPerson.util > 80 ? "text-rag-amber" : "text-rag-green"}`}>
                  {selectedPerson.util}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className="h-full rounded-full bg-accent/40" style={{ width: `${Math.min(selectedPerson.util, 100)}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">After this assignment</span>
                <span className={`num-mono font-medium ${projColor}`}>{projected}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className={`h-full rounded-full ${(projected ?? 0) > 100 ? "bg-rag-red" : (projected ?? 0) > 80 ? "bg-rag-amber" : "bg-accent"}`}
                  style={{ width: `${Math.min(projected ?? 0, 100)}%` }} />
              </div>
              {(projected ?? 0) > 100 && (
                <p className="text-rag-red">⚠ This will over-allocate {selectedPerson.name}</p>
              )}
            </div>
          )}

          {/* Allocation slider */}
          <div>
            <div className="mb-1.5 flex justify-between">
              <Label>Allocation on this project</Label>
              <span className={`num-mono text-sm font-medium ${projColor || "text-foreground"}`}>{alloc}%</span>
            </div>
            <input
              type="range" min={10} max={100} step={5} value={alloc}
              onChange={(e) => setAlloc(Number(e.target.value))}
              className="w-full cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>10%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Confirm assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Decline dialog ────────────────────────────────────────────────────────────

function DeclineDialog({
  req,
  onDecline,
  compact = false,
}: {
  req: ResourceRequest;
  onDecline: (id: string, reason: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  function handleDecline() {
    if (!reason.trim()) { setReasonError("Reason is required."); return; }
    onDecline(req.id, reason);
    setOpen(false);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={compact ? "icon" : "sm"} variant="secondary" data-ds-size={compact ? "auto" : undefined} aria-label="Decline request" title="Decline request" className={compact ? "h-9 w-9 rounded-full border border-border/60 text-rag-red" : undefined}>
          <XCircle className={compact ? "h-4 w-4" : "mr-1 h-3.5 w-3.5"} />{compact ? null : "Decline"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Decline request</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <div className="font-medium text-foreground">{req.role} — {req.project}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Submitted by {req.submittedBy}</div>
        </div>
        <Field label="Reason" htmlFor="decline-reason" required error={reasonError}>
          <Textarea
            id="decline-reason"
            placeholder="Why can't this request be fulfilled? PM will be notified."
            value={reason}
            onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
            rows={3}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDecline}>
            <XCircle className="mr-1 h-3.5 w-3.5" />Confirm decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Resource dialog ───────────────────────────────────────────────────────

function AddResourceDialog({ onAdd }: { onAdd: (r: PoolResource) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName]       = useState("");
  const [role, setRole]       = useState("");
  const [dept, setDept]       = useState("");
  const [capacity, setCapacity] = useState("40");
  const [email, setEmail]     = useState("");
  const [errors, setErrors] = useState<{ name?: string; role?: string; dept?: string }>({});

  function handleSave() {
    const next = {
      name: name.trim() ? undefined : "Full name is required.",
      role: role.trim() ? undefined : "Job title / Role is required.",
      dept: dept ? undefined : "Department is required.",
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    onAdd({
      name:     name.trim(),
      role:     role.trim(),
      dept,
      util:     0,
      capacity: Number(capacity) || 40,
      projects: [],
    });
    toast.success(`${name.trim()} added to resource pool`, {
      description: `${role.trim()} · ${dept} · ${capacity}h / week`,
    });
    setOpen(false);
    setName(""); setRole(""); setDept(""); setCapacity("40"); setEmail("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary">
          <Plus className="mr-1 h-4 w-4" />Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add resource to pool</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Field className="col-span-2" label="Full name" htmlFor="resource-name" required error={errors.name}>
              <Input
                id="resource-name"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              />
            </Field>
            <Field className="col-span-2" label="Job title / Role" htmlFor="resource-role" required error={errors.role}>
              <Input
                id="resource-role"
                placeholder="e.g. Cloud Architect"
                value={role}
                onChange={(e) => { setRole(e.target.value); setErrors((p) => ({ ...p, role: undefined })); }}
              />
            </Field>
            <Field label="Department" htmlFor="resource-department" required error={errors.dept}>
              <Select onValueChange={(value) => { setDept(value); setErrors((p) => ({ ...p, dept: undefined })); }}>
                <SelectTrigger id="resource-department"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div>
              <Label>Capacity (hrs / week)</Label>
              <Input
                type="number"
                min={4} max={60} step={4}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                placeholder="alex.morgan@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Preview badge */}
          {name && role && dept && (
            <div className="flex items-center gap-3 rounded-md border border-accent/20 bg-accent-dim/20 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-dim text-sm font-medium text-accent">
                {name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{name}</div>
                <div className="text-xs text-muted-foreground">{role} · {dept} · {capacity}h/wk · 0% utilized</div>
              </div>
              <UserCheck className="ml-auto h-4 w-4 text-accent" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            <Plus className="mr-1 h-3.5 w-3.5" />Add to pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Direct-assign dialog (from People tab) ────────────────────────────────────

function AssignDialog({ resource, onAssign, compact = false }: { resource: PoolResource; onAssign?: (projectName: string, alloc: number) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [role, setRole] = useState(resource.role);
  const [alloc, setAlloc] = useState(50);
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [projectError, setProjectError] = useState("");

  const projected = Math.min(resource.util + alloc, 200);
  const projColor = projected > 100 ? "text-rag-red" : projected > 80 ? "text-rag-amber" : "text-rag-green";

  function handleSave() {
    if (!projectId) { setProjectError("Project is required."); return; }
    const proj = projects.find((p) => p.id === projectId);
    const projectName = proj?.name ?? projectId;
    onAssign?.(projectName, alloc);
    toast.success(`${resource.name} assigned to ${projectName} at ${alloc}%`);
    setOpen(false);
    setProjectId(""); setRole(resource.role); setAlloc(50); setFrom(""); setUntil("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={compact ? "icon" : "sm"} variant="secondary" data-ds-size={compact ? "auto" : undefined} aria-label="Assign to project" title="Assign to project" className={compact ? "h-9 w-9 rounded-full border border-border/60 text-accent-secondary" : undefined}><UserCheck className="h-4 w-4" />{compact ? null : "Assign"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign {resource.name} to project</DialogTitle>
        </DialogHeader>

        {/* Utilization preview */}
        <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current utilization</span>
            <span className={`num-mono font-medium ${resource.util > 100 ? "text-rag-red" : resource.util > 80 ? "text-rag-amber" : "text-rag-green"}`}>{resource.util}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
            <div className="h-full rounded-full bg-accent/30" style={{ width: `${Math.min(resource.util, 100)}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">After assignment</span>
            <span className={`num-mono font-medium ${projColor}`}>{projected}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/50">
            <div className={`h-full rounded-full ${projected > 100 ? "bg-rag-red" : projected > 80 ? "bg-rag-amber" : "bg-accent"}`} style={{ width: `${Math.min(projected, 100)}%` }} />
          </div>
          {projected > 100 && <p className="text-rag-red">⚠ This will over-allocate {resource.name}</p>}
        </div>

        <div className="grid gap-3">
          <Field label="Project" htmlFor="assignment-project" required error={projectError}>
            <Select onValueChange={(value) => { setProjectId(value); setProjectError(""); }}>
              <SelectTrigger id="assignment-project"><SelectValue placeholder="Select project…" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      {p.name}
                      <Badge variant="outline" className="ml-1 border-border bg-secondary/40 text-[10px]">{p.stage}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div>
            <Label>Role on this project</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Solution Architect" />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between">
              <Label>Allocation</Label>
              <span className={`num-mono text-sm font-medium ${projColor}`}>{alloc}%</span>
            </div>
            <input
              type="range" min={10} max={100} step={5} value={alloc}
              onChange={(e) => setAlloc(Number(e.target.value))}
              className="w-full cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>10%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>From</Label><Input type="month" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>Until</Label><Input type="month" value={until} onChange={(e) => setUntil(e.target.value)} /></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Confirm assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Utilization heatmap ───────────────────────────────────────────────────────

function Heatmap({ pool }: { pool: PoolResource[] }) {
  return (
    <>
      <div className="label-eyebrow mb-3">Team utilization · next 8 weeks</div>
      <div className="ml-32 mb-1 grid grid-cols-8 gap-1 text-[10px] text-muted-foreground">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="text-center">W{21 + i}</div>
        ))}
      </div>
      <div className="space-y-1">
        {pool.map((r, idx) => (
          <div key={r.name} className="flex items-center gap-2">
            <div className="w-32 truncate text-xs text-muted-foreground">{r.name}</div>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 8 }).map((_, i) => {
                const v = (r.util + idx * 4 + i * 9) % 130;
                const bg = v > 100 ? "bg-rag-red" : v > 80 ? "bg-orange-500" : v > 60 ? "bg-rag-amber" : "bg-rag-green/50";
                return <div key={i} className={`h-6 flex-1 rounded ${bg}`} title={`${v}%`} />;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-green/50" />&lt;60%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-amber" />60–80%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-orange-500" />80–100%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-red" />Over</span>
      </div>
    </>
  );
}
