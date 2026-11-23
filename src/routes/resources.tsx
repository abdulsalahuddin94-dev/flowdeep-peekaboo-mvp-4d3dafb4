import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RequestPeriod } from "@/components/RequestPeriod";
import { matchesRequestEmployees } from "@/lib/request-employee-filter";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { EmptyRegion } from "@/lib/empty-preview";
import { jobRoleGroup, matchAnySelected, matchRelated, projectNameGroup, relatedProjectsGroup } from "@/components/ds/filters";
import { RelatedProjectsCount } from "@/components/ds/RelatedProjectsDialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  StyledTable, StyledTableBody, StyledTableCell, StyledTableHead,
  StyledTableHeader, StyledTableHeaderRow, StyledTableRow,
} from "@/components/StyledTable";
import { TablePagination, usePagination } from "@/components/TablePagination";
import { TableRowActions } from "@/components/TableRowActions";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { capacityOverrideMonths } from "@/lib/employee-finance";
import { ToggleActive } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { projects, departments } from "@/lib/mock-data";
import { useResourceRequests, useJobRoles, EMPLOYMENT_PERCENT, employmentFromFte, requestQuantity, requestAssignees, requestCoverage } from "@/lib/projects-store";
import type { ResourceRequest } from "@/lib/projects-store";
import { Upload, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, UserCheck, ChevronLeft, ChevronRight } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";
import { useEmployees, type Employee, SENIORITY_LEVELS, currentUtilization, periodUtilization, allocationPercent, monthRange, employeeShortTitle } from "@/lib/employees-store";
import { averageUtilization } from "@/lib/employee-finance";

/** Yearly average utilization (hours vs available capacity) — same formula as the employee profile KPI. */
const yearlyUtilization = (r: Employee) => averageUtilization(r, String(new Date().getFullYear()));
import { buildManpowerPlan, buildSkillDemand } from "@/lib/resource-demand";

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
type PoolResource = Employee;

const EMPLOYEE_FILTER_T = {
  en: { projects: "Assigned Projects", role: "Job role", seniority: "Seniority level", employment: "Employment type", department: "Department", status: "Status", allProjects: "All projects", allRoles: "All job roles", allLevels: "All levels", allEmployment: "All employment types", allDepartments: "All departments", allStatuses: "All statuses", active: "Active", inactive: "Inactive" },
  ar: { projects: "المشاريع المسندة", role: "الدور الوظيفي", seniority: "مستوى الخبرة", employment: "نوع التوظيف", department: "القسم", status: "الحالة", allProjects: "كل المشاريع", allRoles: "كل الأدوار الوظيفية", allLevels: "كل المستويات", allEmployment: "كل أنواع التوظيف", allDepartments: "كل الأقسام", allStatuses: "كل الحالات", active: "نشط", inactive: "غير نشط" },
};

/** Column labels for what a request covers. */
const COVERAGE_LABEL = { project: "Project", task: "Task", period: "Period" } as const;
const PRIORITY_STYLE: Record<Priority, string> = {
  Critical: "border-rag-red/40 bg-rag-red/10 text-rag-red",
  High: "border-rag-amber/40 bg-rag-amber/10 text-rag-amber",
  Medium: "border-rag-blue/40 bg-rag-blue/10 text-rag-blue",
  Low: "border-border bg-secondary/40 text-muted-foreground",
};

const RES_TAB_LABELS: Record<string, string> = {
  requests: "Requests", people: "Employees", heatmap: "Utilization Heatmap",
  planning: "Manpower Planning", skills: "Skill Demand",
};


function ResourcesPage() {
  const { tab = "requests" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { employees: pool, setEmployees: setPool } = useEmployees();
  const { resourceRequests: requests, updateResourceRequest } = useResourceRequests();

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const avgUtilization = pool.length ? Math.round(pool.reduce((sum, r) => sum + Math.min(yearlyUtilization(r), 100), 0) / pool.length) : 0;
  const manpower = useMemo(() => buildManpowerPlan(requests, pool), [requests, pool]);
  const skillDemand = useMemo(() => buildSkillDemand(requests, pool), [requests, pool]);
  const capacityGap = manpower.reduce((sum, row) => sum + Math.max(0, row.demand - row.supply), 0);


  /** Allocation is fixed by the request's employment (Full time 100% / Part time 50%) over the task/team period. */
  function fulfillRequest(id: string, names: string[]) {
    const req = requests.find((r) => r.id === id);
    if (!req || names.length === 0) return;
    const alloc = EMPLOYMENT_PERCENT[req.employment ?? employmentFromFte(req.fte)];
    const utilByPerson = { ...(req.utilByPerson ?? {}) };
    for (const n of names) {
      const person = pool.find((p) => p.name === n);
      if (person) { const b = periodUtilization(person.allocations, req.from, req.until).peak; utilByPerson[n] = { before: b, after: b + alloc }; }
    }
    setPool((prev) => prev.map((p) => {
      if (!names.includes(p.name)) return p;
      const allocations = [...p.allocations, { id: req.id, project: req.project, role: req.role, percent: alloc, from: req.from, until: req.until, task: req.task }];
      return {
        ...p, allocations, util: currentUtilization(allocations),
        projects: !p.projects.includes(req.project) ? [...p.projects, req.project] : p.projects,
        tasks: req.task && !p.tasks.includes(req.task) ? [...p.tasks, req.task] : p.tasks,
      };
    }));
    const assignees = [...requestAssignees(req), ...names];
    const qty = requestQuantity(req);
    const complete = assignees.length >= qty;
    const last = names[names.length - 1];
    updateResourceRequest(id, {
      status: complete ? "Fulfilled" : "Pending", assignedTo: last, assignees, allocation: alloc, utilByPerson,
      utilBefore: utilByPerson[last]?.before, utilAfter: utilByPerson[last]?.after, decidedOn: new Date().toISOString().slice(0, 10),
    });
    toast.success(`${req.role} assigned to ${req.project}`, {
      description: `${names.join(", ")} · ${assignees.length} of ${qty} filled${complete ? " — request fulfilled" : ""}`,
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
            <Button size="sm" variant="primary" onClick={() => navigate({ to: "/resources/employees/new" })}><Plus className="mr-1 h-4 w-4" />Add Employee</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Employees" value={pool.length} className="p-4" />
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
          <PlanningTable rows={manpower} />
        </TabsContent>
        <TabsContent value="skills" className="mt-0">
          <SkillsTable rows={skillDemand} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestsTable({ requests, pool, onFulfill, onDecline }: {
  requests: ResourceRequest[];
  pool: PoolResource[];
  onFulfill: (id: string, names: string[]) => void;
  onDecline: (id: string, reason: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState<string[]>([]);
  const filterText = { en: { project: "Project", role: "Role", employees: "Has employees", all: "All", with: "With employees", without: "Without employees" }, ar: { project: "المشروع", role: "الدور الوظيفي", employees: "وجود موظفين", all: "الكل", with: "بها موظفون", without: "بدون موظفين" } }.en;
  const projectOptions = [...new Set(requests.map((r) => r.project))].sort();
  const roleOptions = [...new Set(requests.map((r) => r.role))].sort();
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => (!q || r.role.toLowerCase().includes(q) || (r.task ?? "").toLowerCase().includes(q) || r.skill.toLowerCase().includes(q) || r.project.toLowerCase().includes(q)))
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => priority === "all" || r.priority === priority)
      .filter((r) => matchAnySelected(projectFilter, [r.project]) && matchAnySelected(roleFilter, [r.role]))
      .filter((r) => matchesRequestEmployees(r, employeeFilter));
  }, [priority, query, requests, status, projectFilter, roleFilter, employeeFilter]);
  const pagination = usePagination(filtered, 10);
  const selected = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search role, task or project…" filterGroups={[
        { key: "status", label: "Status", value: status, onChange: setStatus, options: [
          { value: "all", label: "All statuses" }, { value: "Pending", label: "Pending" },
          { value: "Fulfilled", label: "Fulfilled" }, { value: "Declined", label: "Declined" },
        ] },
        { key: "priority", label: "Priority", value: priority, onChange: setPriority, options: [
          { value: "all", label: "All priorities" }, ...(["Critical", "High", "Medium", "Low"] as Priority[]).map((v) => ({ value: v, label: v })),
        ] },
        { key: "project", label: filterText.project, mode: "multi", searchable: true, showAll: true, value: projectFilter, onChange: setProjectFilter, options: projectOptions.map((name) => ({ value: name, label: name })) },
        { key: "role", label: filterText.role, mode: "multi", searchable: true, showAll: true, value: roleFilter, onChange: setRoleFilter, options: roleOptions.map((name) => ({ value: name, label: name })) },
        { key: "employees", label: filterText.employees, mode: "multi", searchable: true, showAll: true, value: employeeFilter, onChange: setEmployeeFilter, options: [{ value: "all", label: filterText.all }, { value: "with", label: filterText.with }, { value: "without", label: filterText.without }] },
      ]} />
        <StyledTable wrapperClassName="">
          <StyledTableHeader><StyledTableHeaderRow>
            <StyledTableHead>Role / Skill</StyledTableHead><StyledTableHead>Task</StyledTableHead><StyledTableHead>Project</StyledTableHead>
            <StyledTableHead>Request for</StyledTableHead><StyledTableHead>Employment</StyledTableHead><StyledTableHead>Period</StyledTableHead>
            <StyledTableHead>Priority</StyledTableHead><StyledTableHead>Submitted On</StyledTableHead>
            <StyledTableHead className="w-44 text-center">Status</StyledTableHead>
          </StyledTableHeaderRow></StyledTableHeader>
          <StyledTableBody>
            {pagination.pageItems.length === 0 ? <EmptyRow colSpan={9} /> : pagination.pageItems.map((req) => (
                <StyledTableRow
                  key={req.id}
                  className="group cursor-pointer"
                  onClick={() => setOpenId(req.id)}
                >
                  <StyledTableCell><div className="font-medium text-foreground">{req.role}</div><div className="text-xs text-muted-foreground">{requestQuantity(req) > 1 ? <span className="num-mono">{requestQuantity(req)}x </span> : null}{req.skill}</div></StyledTableCell>
                  <StyledTableCell>{req.task ?? <span className="text-muted-foreground">—</span>}</StyledTableCell>
                  <StyledTableCell>{req.project}</StyledTableCell>
                  <StyledTableCell>{COVERAGE_LABEL[requestCoverage(req)]}</StyledTableCell>
                  <StyledTableCell>{req.employment ?? employmentFromFte(req.fte)}</StyledTableCell>
                  <StyledTableCell><RequestPeriod from={req.periodStart ?? req.from} until={req.periodEnd ?? req.until} durationHours={req.durationHours} /></StyledTableCell>
                  <StyledTableCell><Badge variant="outline" className={PRIORITY_STYLE[req.priority]}>{req.priority}</Badge></StyledTableCell>
                  <StyledTableCell><div>{req.submittedBy}</div><div className="text-xs text-muted-foreground">{/^\d{4}-\d{2}-\d{2}$/.test(req.date) ? formatDateWithYear(req.date) : req.date}</div></StyledTableCell>
                  <StyledTableCell onClick={(e) => e.stopPropagation()}>
                    {req.status === "Pending" ? (
                      <TableRowActions
                        alwaysVisible={false}
                        statusNode={<Badge variant="outline" className={statusTone(req.status)}>{req.status}</Badge>}
                        extraActions={<><FulfillDialog req={req} pool={pool} onFulfill={onFulfill} compact /><DeclineDialog req={req} onDecline={onDecline} compact /></>}
                      />
                    ) : (
                      <div className="flex h-9 items-center justify-center">
                        <Badge variant="outline" className={statusTone(req.status)}>{req.status}</Badge>
                      </div>
                    )}
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

/** Assigned people for a request; hovering or focusing a person swaps the allocation summary to them. */
function AssignedSection({ req }: { req: ResourceRequest }) {
  const { employees } = useEmployees();
  const navigate = useNavigate();
  const names = requestAssignees(req);
  const qty = Math.max(requestQuantity(req), names.length);
  const [active, setActive] = useState(names[0]);
  const tone = (v: number) => v > 100 ? "text-rag-red" : v > 80 ? "text-rag-amber" : "text-rag-green";
  const bar = (v: number) => v > 100 ? "bg-rag-red" : v > 80 ? "bg-rag-amber" : "bg-rag-green";
  const share = (req.employment ?? employmentFromFte(req.fte)) === "Part time" ? 50 : 100;
  const utilOf = (n: string) => req.utilByPerson?.[n] ?? (n === req.assignedTo && req.utilAfter != null ? { before: req.utilBefore ?? 0, after: req.utilAfter } : undefined);
  const cur = names.includes(active) ? active : names[0];
  const u = cur ? utilOf(cur) : undefined;
  const total = u?.after ?? share;
  return (
    <div className="space-y-3">
      {qty > 1 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Assigned</span><span className="num-mono">{names.length} / {qty}</span>
          </div>
          <Progress value={(names.length / qty) * 100} className="h-1.5" />
        </div>
      )}
      <ul className="space-y-1">
        {names.map((n) => {
          const emp = employees.find((e) => e.name === n);
          const pu = utilOf(n);
          return (
            <li key={n}>
              <button type="button" onMouseEnter={() => setActive(n)} onFocus={() => setActive(n)}
                onClick={() => emp && navigate({ to: "/resources/employees/$employeeId", params: { employeeId: emp.id } })}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-start transition-colors hover:bg-muted/60 ${n === cur && names.length > 1 ? "bg-muted/60" : ""}`}>
                <Avatar className="h-9 w-9">
                  {emp?.avatar && <AvatarImage src={emp.avatar} alt={n} />}
                  <AvatarFallback className="text-xs">{n.split(" ").map((x) => x[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{n}</span>
                  <span className="block truncate text-xs text-muted-foreground">{emp?.role ?? req.role}</span>
                </span>
                {pu && <span className={`num-mono text-sm ${tone(pu.after)}`}>{pu.after}%</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {req.decidedOn && <DrawerRow label="Assigned on" value={formatDateWithYear(req.decidedOn)} />}
      {cur && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          {names.length > 1 && <div className="text-xs text-muted-foreground">{cur}</div>}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Allocation on this project</span><span className="num-mono text-rag-green">{share}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-rag-green" style={{ width: `${share}%` }} /></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total utilization</span><span className={`num-mono ${tone(total)}`}>{total}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${bar(total)}`} style={{ width: `${Math.min(total, 100)}%` }} /></div>
          </div>
          {total > 100 && <p className="text-sm text-rag-red">{cur} is over-allocated by {total - 100}% in this period</p>}
        </div>
      )}
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
                <DrawerRow label="Task" value={req.task ?? "—"} />
                <DrawerRow label="Employment" value={req.employment ?? employmentFromFte(req.fte)} />
                {requestQuantity(req) > 1 && <DrawerRow label="Employees needed" value={`${requestAssignees(req).length} / ${requestQuantity(req)} filled`} valueClass="num-mono" />}
                <DrawerRow label="Period" value={<RequestPeriod from={req.periodStart ?? req.from} until={req.periodEnd ?? req.until} durationHours={req.durationHours} inline />} valueClass="num-mono" />
                <DrawerRow label="Submitted On" value={req.submittedBy} />
                <DrawerRow label="Submitted" value={/^\d{4}-\d{2}-\d{2}$/.test(req.date) ? formatDateWithYear(req.date) : req.date} />
                {req.notes && (
                  <p className="rounded-md border border-border bg-secondary/30 p-3 text-xs italic text-muted-foreground">"{req.notes}"</p>
                )}
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</h4>
                {req.status === "Pending" && (
                  <p className="text-sm text-muted-foreground">{requestAssignees(req).length > 0 ? "Partially filled. Assign the remaining people" : "No decision taken yet. Fulfill or decline"}{requestAssignees(req).length > 0 ? " from the requests list." : ""} this request from the requests list.</p>
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

                {req.status !== "Declined" && requestAssignees(req).length > 0 && <AssignedSection key={req.id} req={req} />}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const CAPACITY_T = {
  en: { set: "Set Capacity", start: "Start month", months: "Number of months", hours: "Capacity (hours)", days: "Working days in month", apply: "Apply", cancel: "Cancel", success: "Capacity plan applied", overwrite: "Overwrite existing capacity?", overwriteD: "Some selected employees already have capacity in this range. Applying will overwrite it.", confirm: "Overwrite", selectAll: "Select all visible employees", select: "Select employee" },
  ar: { set: "تحديد السعة", start: "شهر البداية", months: "عدد الأشهر", hours: "السعة (بالساعات)", days: "أيام العمل في الشهر", apply: "تطبيق", cancel: "إلغاء", success: "تم تطبيق خطة السعة", overwrite: "استبدال السعة الحالية؟", overwriteD: "بعض الموظفين المحددين لديهم سعة في هذه الفترة. سيتم استبدالها.", confirm: "استبدال", selectAll: "تحديد كل الموظفين الظاهرين", select: "تحديد الموظف" },
};

function PeopleTable({ pool, setPool }: { pool: PoolResource[]; setPool: (update: PoolResource[] | ((prev: PoolResource[]) => PoolResource[])) => void }) {
  const t = EMPLOYEE_FILTER_T.en;
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string[]>([]);
  const [seniority, setSeniority] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const navigate = useNavigate();
  const { employmentTypes, setMonthlyPlan } = useEmployees();
  const c = CAPACITY_T.en;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedEmployees = pool.filter((e) => selectedIds.has(e.id));
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [plan, setPlan] = useState({ start: "", months: "12", hours: "", days: "20" });
  function openCapacityPlan() {
    const now = new Date();
    setPlan({ start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, months: "12", hours: String(selectedEmployees[0]?.capacity || ""), days: "20" });
    setCapacityOpen(true);
  }
  function applyCapacityPlan() {
    for (const e of selectedEmployees) setMonthlyPlan(e.id, plan.start, Number(plan.months), { capacity: Number(plan.hours), workingDays: Number(plan.days) });
    setCapacityOpen(false); setOverwriteOpen(false); setSelectedIds(new Set());
    toast.success(c.success);
  }
  function requestCapacityPlan() {
    if (selectedEmployees.some((e) => capacityOverrideMonths(e, plan.start, Number(plan.months)).length > 0)) { setCapacityOpen(false); setOverwriteOpen(true); }
    else applyCapacityPlan();
  }
  const [employmentType, setEmploymentType] = useState<string[]>([]);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [jobRolesSelected, setJobRolesSelected] = useState<string[]>([]);
  const { jobRoles } = useJobRoles();
  const projectOptions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.name))).sort((a, b) => a.localeCompare(b)),
    [],
  );
  /** Lookup roles first, plus any role still carried by an employee so renamed/retired roles stay reachable. */
  const roleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const title of [...jobRoles.map((r) => r.title), ...pool.map((e) => e.role)]) {
      const key = title.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, title);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [jobRoles, pool]);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; name: string; active: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((r) => !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.tasks.some((t) => t.toLowerCase().includes(q)))
      .filter((r) => matchAnySelected(department, [r.dept]))
      .filter((r) => matchAnySelected(seniority, [r.seniority ?? ""]))
      .filter((r) => matchAnySelected(statuses, [r.active === false ? "inactive" : "active"]))
      .filter((r) => matchAnySelected(employmentType, [r.employmentTypeId]))
      .filter((r) => matchAnySelected(projectNames, r.projects))
      .filter((r) => matchAnySelected(jobRolesSelected, [r.role]));
  }, [department, jobRolesSelected, pool, projectNames, query, seniority, statuses, employmentType]);
  const pagination = usePagination(filtered, 10);
  const visibleSelected = pagination.pageItems.filter((e) => selectedIds.has(e.id)).length;
  const allVisibleSelected = pagination.pageItems.length > 0 && visibleSelected === pagination.pageItems.length;

  return (
    <>
      <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search employee, role or task…" trailing={<Button variant="outline" disabled={selectedEmployees.length === 0} onClick={openCapacityPlan}>{c.set}{selectedEmployees.length ? ` (${selectedEmployees.length})` : ""}</Button>} filterGroups={[
        { ...projectNameGroup(projectNames, setProjectNames, projectOptions), label: t.projects, searchable: true, showAll: true },
        { ...jobRoleGroup(jobRolesSelected, setJobRolesSelected, roleOptions), label: t.role, searchable: true, showAll: true },
        { key: "seniority", label: t.seniority, value: seniority, onChange: setSeniority, mode: "multi", searchable: true, showAll: true, options: [{ value: "all", label: t.allLevels }, ...SENIORITY_LEVELS.map((v) => ({ value: v, label: v }))] },
        { key: "employment-type", label: t.employment, value: employmentType, onChange: setEmploymentType, mode: "multi", searchable: true, showAll: true, options: [{ value: "all", label: t.allEmployment }, ...employmentTypes.map((v) => ({ value: v.id, label: v.name }))] },
        { key: "department", label: t.department, value: department, onChange: setDepartment, mode: "multi", searchable: true, showAll: true, options: [{ value: "all", label: t.allDepartments }, ...Array.from(new Set([...departments.map((d) => d.name), ...pool.map((e) => e.dept)])).map((name) => ({ value: name, label: name }))] },
        { key: "status", label: t.status, value: statuses, onChange: setStatuses, mode: "multi", searchable: false, options: [{ value: "all", label: t.allStatuses }, { value: "active", label: t.active }, { value: "inactive", label: t.inactive }] },
      ]} />
      <EmptyRegion id="resources-capacity">
          <StyledTable wrapperClassName="">
            <StyledTableHeader><StyledTableHeaderRow>
              <StyledTableHead className="w-10"><Checkbox aria-label={c.selectAll} disabled={pagination.pageItems.length === 0} checked={allVisibleSelected ? true : visibleSelected > 0 ? "indeterminate" : false} onCheckedChange={(checked) => setSelectedIds((prev) => { const next = new Set(prev); for (const e of pagination.pageItems) { if (checked === true) next.add(e.id); else next.delete(e.id); } return next; })} /></StyledTableHead>
              <StyledTableHead>Employee</StyledTableHead><StyledTableHead>Employee Number</StyledTableHead><StyledTableHead>Role</StyledTableHead><StyledTableHead>Employment type</StyledTableHead>
              <StyledTableHead>Assigned Projects</StyledTableHead><StyledTableHead>Utilization</StyledTableHead>
              <StyledTableHead className="w-32 text-center">Status</StyledTableHead>
            </StyledTableHeaderRow></StyledTableHeader>
            <StyledTableBody>
              {pagination.pageItems.length === 0 ? <EmptyRow colSpan={8} /> : pagination.pageItems.map((r) => (
                  <StyledTableRow key={r.id} className={cn("group cursor-pointer", r.active === false && "opacity-60")} onClick={() => navigate({ to: "/resources/employees/$employeeId", params: { employeeId: r.id } })}>
                    <StyledTableCell className="w-10" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Checkbox aria-label={`${c.select}: ${r.name}`} checked={selectedIds.has(r.id)} onCheckedChange={(checked) => setSelectedIds((prev) => { const next = new Set(prev); if (checked === true) next.add(r.id); else next.delete(r.id); return next; })} /></StyledTableCell>
                    <StyledTableCell className="font-medium text-foreground"><div className="flex items-center gap-2"><Avatar className="h-8 w-8">{r.avatar ? <AvatarImage src={r.avatar} alt={r.name} /> : null}<AvatarFallback className="bg-accent-dim text-[10px] text-accent">{r.name.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar><div className="min-w-0"><div className="truncate">{r.name}</div><div className="truncate text-xs font-normal text-muted-foreground">{r.dept}</div></div></div></StyledTableCell>
                    <StyledTableCell className="num-mono text-muted-foreground">{r.employeeNumber ? `#${r.employeeNumber}` : "—"}</StyledTableCell>
                    <StyledTableCell>{r.role}</StyledTableCell><StyledTableCell>{employmentTypes.find((v) => v.id === r.employmentTypeId)?.name ?? "—"}</StyledTableCell>
                    <StyledTableCell className="text-center"><RelatedProjectsCount label={r.name} caption="Assigned Projects" projects={r.projects.map((name) => ({ id: projects.find((p) => p.name === name)?.id ?? "", name }))} /></StyledTableCell>
                    {(() => { const u = yearlyUtilization(r); return <StyledTableCell className="w-48"><div className="flex items-center gap-2"><Progress value={Math.min(u, 100)} className={`h-1.5 ${u > 100 ? "[&>div]:bg-rag-red" : u > 90 ? "[&>div]:bg-rag-amber" : "[&>div]:bg-accent"}`} /><span className={`num-mono text-xs ${u > 100 ? "text-rag-red" : "text-foreground"}`}>{u}%</span></div></StyledTableCell>; })()}
                    <StyledTableCell onClick={(e) => e.stopPropagation()}>
                      <TableRowActions
                        isActive={r.active !== false}
                        onEdit={() => navigate({ to: "/resources/employees/new", search: { edit: r.id } })}
                        onToggleActive={() => setPendingToggle({ id: r.id, name: r.name, active: r.active !== false })}
                        onDelete={() => setPendingDelete({ id: r.id, name: r.name })}
                      />
                    </StyledTableCell>
                  </StyledTableRow>
              ))}
            </StyledTableBody>
          </StyledTable>
      </EmptyRegion>
      <TablePagination {...pagination} itemLabel="employees" demoPages={1} />

      <Dialog open={capacityOpen} onOpenChange={setCapacityOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={(e) => { e.preventDefault(); requestCapacityPlan(); }}>
            <DialogHeader><DialogTitle>{c.set}</DialogTitle></DialogHeader>
            <div className="my-4 grid grid-cols-2 gap-3">
              <Field label={c.start} htmlFor="bulk-cap-start" required><Input id="bulk-cap-start" type="month" required value={plan.start} onChange={(e) => setPlan((p) => ({ ...p, start: e.target.value }))} /></Field>
              <Field label={c.months} htmlFor="bulk-cap-months" required><Input id="bulk-cap-months" type="number" min={1} max={60} step={1} required value={plan.months} onChange={(e) => setPlan((p) => ({ ...p, months: e.target.value }))} /></Field>
              <div className="col-span-2"><Field label={c.hours} htmlFor="bulk-cap-hours" required><Input id="bulk-cap-hours" type="number" min={1} step="any" placeholder="e.g. 160" required value={plan.hours} onChange={(e) => setPlan((p) => ({ ...p, hours: e.target.value }))} /></Field></div>
              <div className="col-span-2"><Field label={c.days} htmlFor="bulk-cap-days" required><Input id="bulk-cap-days" type="number" min={1} max={31} step={1} required value={plan.days} onChange={(e) => setPlan((p) => ({ ...p, days: e.target.value }))} /></Field></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCapacityOpen(false)}>{c.cancel}</Button><Button type="submit">{c.apply}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={overwriteOpen} onOpenChange={setOverwriteOpen} tone="warning" title={c.overwrite} description={c.overwriteD} cancelLabel={c.cancel} confirmLabel={c.confirm} onConfirm={applyCapacityPlan} />

      <ConfirmDeleteDialog
        description="This employee will be removed from the resources pool."
        label={pendingDelete?.name}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          setPool((prev) => prev.filter((x) => x.id !== pendingDelete.id));
          toast.done("Employee", "deleted");
          setPendingDelete(null);
        }}
      />
      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(o) => !o && setPendingToggle(null)}
        tone={pendingToggle?.active ? "warning" : "success"}
        icon={({ className }) => <ToggleActive className={cn(className, pendingToggle?.active ? "" : "-scale-x-100")} />}
        title={`${pendingToggle?.active ? "Deactivate" : "Activate"} "${pendingToggle?.name ?? ""}"?`}
        description={`Are you sure you want to ${pendingToggle?.active ? "deactivate" : "activate"} this employee?`}
        cancelLabel="Cancel"
        confirmLabel={pendingToggle?.active ? "Deactivate" : "Activate"}
        onConfirm={() => {
          if (!pendingToggle) return;
          setPool((prev) => prev.map((x) => x.id === pendingToggle.id ? { ...x, active: !pendingToggle.active } : x));
          toast.done("Employee", pendingToggle.active ? "deactivated" : "activated");
          setPendingToggle(null);
        }}
      />
    </>
  );
}

function SkillsTable({ rows }: { rows: ReturnType<typeof buildSkillDemand> }) {
  const [query, setQuery] = useState("");
  const [demand, setDemand] = useState("all");
  const [department, setDepartment] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => !q || row.skill.toLowerCase().includes(q) || row.department.toLowerCase().includes(q))
      .filter((row) => demand === "all" || row.demand === demand)
      .filter((row) => department === "all" || row.department === department);
  }, [demand, department, query, rows]);
  const pagination = usePagination(filtered, 10);
  const skillDepartments = Array.from(new Set(rows.map((row) => row.department)));

  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search skill or department…" filterGroups={[
      { key: "demand", label: "Demand intensity", value: demand, onChange: setDemand, options: [{ value: "all", label: "All demand levels" }, ...(["Critical", "High", "Medium", "Low"] as Priority[]).map((v) => ({ value: v, label: v }))] },
      { key: "department", label: "Department", value: department, onChange: setDepartment, options: [{ value: "all", label: "All departments" }, ...skillDepartments.map((v) => ({ value: v, label: v }))] },
    ]} />
      <StyledTable wrapperClassName=""><StyledTableHeader><StyledTableHeaderRow>
        <StyledTableHead>Skill name</StyledTableHead><StyledTableHead>Department</StyledTableHead><StyledTableHead>Available (FTE)</StyledTableHead><StyledTableHead>Required (FTE)</StyledTableHead><StyledTableHead>Gap</StyledTableHead><StyledTableHead>Demand period</StyledTableHead><StyledTableHead className="text-center">Demand</StyledTableHead>
      </StyledTableHeaderRow></StyledTableHeader><StyledTableBody>
        {pagination.pageItems.length === 0 ? <EmptyRow colSpan={7} /> : pagination.pageItems.map((row) => <StyledTableRow key={row.skill} className="group">
          <StyledTableCell className="font-medium text-foreground">{row.skill}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.department}</StyledTableCell><StyledTableCell className="num-mono">{row.available}</StyledTableCell><StyledTableCell className="num-mono">{row.required}</StyledTableCell><StyledTableCell className={`num-mono ${row.required > row.available ? "text-rag-red" : "text-rag-green"}`}>{Math.round((row.available - row.required) * 10) / 10}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.duration}</StyledTableCell><StyledTableCell className="text-center"><Badge variant="outline" className={PRIORITY_STYLE[row.demand]}>{row.demand}</Badge></StyledTableCell>
        </StyledTableRow>)}
      </StyledTableBody></StyledTable>
    <TablePagination {...pagination} itemLabel="skills" demoPages={1} />
  </>;
}

function PlanningTable({ rows }: { rows: ReturnType<typeof buildManpowerPlan> }) {
  const [query, setQuery] = useState("");
  const [gapFilter, setGapFilter] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => !q || row.role.toLowerCase().includes(q) || row.department.toLowerCase().includes(q))
      .filter((row) => gapFilter === "all" || (gapFilter === "gap" ? row.demand > row.supply : row.demand <= row.supply));
  }, [gapFilter, query, rows]);
  const pagination = usePagination(filtered, 10);
  return <>
    <PageToolbar query={query} onQueryChange={setQuery} placeholder="Search role or department…" filterGroups={[{ key: "gap", label: "Capacity", value: gapFilter, onChange: setGapFilter, options: [{ value: "all", label: "All roles" }, { value: "gap", label: "Capacity gap" }, { value: "covered", label: "Capacity covered" }] }]} />
    <StyledTable wrapperClassName=""><StyledTableHeader><StyledTableHeaderRow><StyledTableHead>Role</StyledTableHead><StyledTableHead>Department</StyledTableHead><StyledTableHead>Demand (FTE)</StyledTableHead><StyledTableHead>Supply (FTE)</StyledTableHead><StyledTableHead>Gap</StyledTableHead><StyledTableHead>Recommended action</StyledTableHead><StyledTableHead className="text-center">Status</StyledTableHead></StyledTableHeaderRow></StyledTableHeader><StyledTableBody>
      {pagination.pageItems.length === 0 ? <EmptyRow colSpan={7} /> : pagination.pageItems.map((row) => { const gap = Math.round((row.demand - row.supply) * 10) / 10; return <StyledTableRow key={row.role} className="group"><StyledTableCell className="font-medium text-foreground">{row.role}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.department}</StyledTableCell><StyledTableCell className="num-mono">{row.demand}</StyledTableCell><StyledTableCell className="num-mono">{row.supply}</StyledTableCell><StyledTableCell className={`num-mono ${gap > 0 ? "text-rag-red" : "text-rag-green"}`}>{gap > 0 ? `+${gap}` : gap}</StyledTableCell><StyledTableCell className="text-muted-foreground">{row.action}</StyledTableCell><StyledTableCell className="text-center"><Badge variant="outline" className={gap > 0 ? "border-rag-red/40 bg-rag-red/10 text-rag-red" : "border-rag-green/40 bg-rag-green/10 text-rag-green"}>{gap > 0 ? "Action needed" : "Covered"}</Badge></StyledTableCell></StyledTableRow>; })}
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
  onFulfill: (id: string, names: string[]) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [personError, setPersonError] = useState("");
  const employment = req.employment ?? employmentFromFte(req.fte);
  const alloc = EMPLOYMENT_PERCENT[employment];
  const periodOf = (r: PoolResource) => periodUtilization(r.allocations, req.from, req.until).peak;
  const tone = (v: number) => v > 100 ? "text-rag-red" : v > 80 ? "text-rag-amber" : "text-rag-green";
  const remaining = Math.max(1, requestQuantity(req) - requestAssignees(req).length);
  const sameRole = (r: PoolResource) => r.role.trim().toLowerCase() === req.role.trim().toLowerCase();
  const candidates = pool.filter((r) => r.active !== false && sameRole(r) && !requestAssignees(req).includes(r.name));
  const [focusName, setFocusName] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const focused = pool.find((r) => r.name === (focusName && names.includes(focusName) ? focusName : names[names.length - 1]));
  const optionLabel = (r: PoolResource) => `${r.name} - ${employeeShortTitle(r)}`;
  const scrollCarousel = (dir: 1 | -1) => carouselRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  function handleSave() {
    if (names.length === 0) { setPersonError("Select at least one person to assign."); return; }
    onFulfill(req.id, names);
    setOpen(false);
    setNames([]);
    setFocusName(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={compact ? "icon" : "sm"} variant="secondary" data-ds-size={compact ? "auto" : undefined} aria-label="Fulfill request" title="Fulfill request" className={compact ? "h-9 w-9 rounded-full border border-border/60 text-rag-green" : undefined}>
          <CheckCircle2 className={compact ? "h-4 w-4" : "mr-1 h-3.5 w-3.5"} />{compact ? null : "Fulfill"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md min-w-0">
        <DialogHeader>
          <DialogTitle>Fulfill resource request</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
          <div className="font-medium text-foreground">{req.role} <span className="text-muted-foreground text-xs">({req.skill})</span></div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {req.project} · {COVERAGE_LABEL[requestCoverage(req)]} · <RequestPeriod from={req.periodStart ?? req.from} until={req.periodEnd ?? req.until} durationHours={req.durationHours} inline />
          </div>
          {req.notes && <div className="mt-1 text-xs italic text-muted-foreground">"{req.notes}"</div>}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3">
          <Field label={remaining > 1 ? `Assign people (up to ${remaining})` : "Assign person"} htmlFor="fulfill-person" required error={personError}>
            {remaining > 1 ? (
            <MultiSelectField
              id="fulfill-person"
              max={remaining}
              maxVisible={2}
              value={names}
              onChange={(v) => { setNames(v); setPersonError(""); if (v.length > names.length) setFocusName(v[v.length - 1]); }}
              placeholder={`Select ${req.role}s from resource pool…`}
              emptyText={`No available employees with the ${req.role} role.`}
              options={candidates.map((r) => ({ value: r.name, label: optionLabel(r) }))}
              renderOptionMeta={(o) => { const p = pool.find((r) => r.name === o.value); return p ? <span className={`num-mono shrink-0 text-xs ${tone(periodOf(p))}`}>{periodOf(p)}%</span> : null; }}
            />
            ) : (
            <Select value={names[0] ?? ""} onValueChange={(v) => { setNames([v]); setFocusName(v); setPersonError(""); }}>
              <SelectTrigger id="fulfill-person"><SelectValue placeholder={`Select a ${req.role} from resource pool…`} /></SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? <div className="px-3 py-2 text-sm text-muted-foreground">No available employees with the {req.role} role.</div> : candidates.map((r) => (
                  <SelectItem key={r.name} value={r.name}>{optionLabel(r)} <span className={`num-mono ${tone(periodOf(r))}`}>{periodOf(r)}%</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </Field>

          {names.length > 1 && (
            <div className="flex min-w-0 items-center gap-1">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Scroll left" onClick={() => scrollCarousel(-1)}><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Button>
              <div ref={carouselRef} className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth">
                {names.map((n) => { const active = n === focused?.name; const p = pool.find((r) => r.name === n); const over100 = p ? periodOf(p) + alloc > 100 : false; return (
                  <button key={n} type="button" onClick={() => setFocusName(n)} aria-pressed={active}
                    className={`h-7 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {n}{over100 && <span className="ms-1 text-rag-red">⚠</span>}
                  </button>
                ); })}
              </div>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Scroll right" onClick={() => scrollCarousel(1)}><ChevronRight className="h-4 w-4 rtl:rotate-180" /></Button>
            </div>
          )}
          <div className="flex items-center justify-between rounded-md border border-border bg-background/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Allocation on this project</span>
            <span className="font-medium text-foreground">{employment} · <span className="num-mono">{alloc}%</span></span>
          </div>
          {focused && (() => { const before = periodOf(focused); const projected = before + alloc; return (
            <div className="rounded-md border border-border bg-background/30 p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peak utilization in this period</span>
                <span className={`num-mono font-medium ${tone(before)}`}>{before}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className="h-full rounded-full bg-accent/40" style={{ width: `${Math.min(before, 100)}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">After this assignment</span>
                <span className={`num-mono font-medium ${tone(projected)}`}>{projected}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div className={`h-full rounded-full ${projected > 100 ? "bg-rag-red" : projected > 80 ? "bg-rag-amber" : "bg-accent"}`} style={{ width: `${Math.min(projected, 100)}%` }} />
              </div>
              {projected > 100 && <p className="text-rag-red">⚠ This will over-allocate {focused.name}</p>}
            </div>
          ); })()}
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

// ── Utilization heatmap ───────────────────────────────────────────────────────

/** Monthly allocation % per employee for the selected year, from the same allocations the profile uses. */
function Heatmap({ pool }: { pool: PoolResource[] }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const months = monthRange(`${year}-01`, 12);
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="label-eyebrow">Team utilization · {year}</div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>{[2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="ml-32 mb-1 grid grid-cols-12 gap-1 text-[10px] text-muted-foreground">
        {months.map((m) => <div key={m} className="text-center">{new Date(`${m}-01T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" })}</div>)}
      </div>
      <div className="space-y-1">
        {pool.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <div className="w-32 truncate text-xs text-muted-foreground">{r.name}</div>
            <div className="grid flex-1 grid-cols-12 gap-1">
              {months.map((m) => {
                const v = allocationPercent(r.allocations, m);
                const bg = v > 100 ? "bg-rag-red" : v > 80 ? "bg-orange-500" : v > 60 ? "bg-rag-amber" : v > 0 ? "bg-rag-green/50" : "bg-secondary/40";
                return <div key={m} className={`flex h-6 items-center justify-center rounded text-[10px] num-mono text-foreground ${bg}`} aria-label={`${r.name} ${m}: ${v}%`}>{v > 0 ? `${v}%` : ""}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-secondary/40" />Not allocated</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-green/50" />&le;60%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-amber" />60–80%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-orange-500" />80–100%</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-rag-red" />Over</span>
      </div>
    </>
  );
}
