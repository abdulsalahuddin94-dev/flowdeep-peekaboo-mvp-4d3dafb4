import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useEmployees } from "@/lib/employees-store";
import { PLAN_CACHE } from "@/lib/plan-cache";
import { seedMilestones } from "@/lib/plan-seeds";
import { employeeMonth, vacationBalance } from "@/lib/employee-finance";
import { useProjects, useResourceRequests } from "@/lib/projects-store";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateWithYear } from "@/lib/date-format";
export const Route = createFileRoute("/resources_/employees/$employeeId")({
  component: EmployeeDetails,
  head: ({ params }) => ({ meta: [{ title: `Employee ${params.employeeId} — Nexus PMO` }, { name: "description", content: "Employee profile, monthly salary, project cost allocation, assigned tasks, capacity and leave." }, { property: "og:title", content: `Employee ${params.employeeId} — Nexus PMO` }, { property: "og:description", content: "Read-only employee information, salary allocation, projects, tasks and vacation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});
export const T = {
 en: { employees: "Employees", overview: "Overview", allocation: "Projects & allocation", tasks: "Assigned tasks", salary: "Salary by month", leave: "Leave & vacation", type: "Employment type", capacity: "Capacity / week", utilization: "Utilization", monthly: "Monthly salary", projects: "Assigned projects", vacation: "Vacation remaining", demo: "Demo data", details: "Employee information", email: "Email", role: "Role", department: "Department", joined: "Joining date", id: "Employee ID", year: "Year", month: "Month", project: "Project", period: "Period", hours: "Hours / week", cost: "Salary charged", overhead: "Unassigned / overhead", total: "Total salary", projectCost: "Project charges", empty: "No records", entitlement: "Annual entitlement", used: "Vacation used", pending: "Vacation pending", balance: "Days remaining", from: "From", until: "Until", days: "Days", status: "Status", leaveType: "Leave type", task: "Task", date: "Assignment period", missing: "Employee not found", budget: "Monthly project cost", profile: "Profile", charges: "Project salary breakdown" },
 ar: { employees: "الموظفون", overview: "نظرة عامة", allocation: "المشاريع والتخصيص", tasks: "المهام المسندة", salary: "الراتب حسب الشهر", leave: "الإجازات", type: "نوع التوظيف", capacity: "السعة الأسبوعية", utilization: "الاستغلال", monthly: "الراتب الشهري", projects: "المشاريع المسندة", vacation: "رصيد الإجازات", demo: "بيانات تجريبية", details: "بيانات الموظف", email: "البريد الإلكتروني", role: "الدور", department: "القسم", joined: "تاريخ الانضمام", id: "رقم الموظف", year: "السنة", month: "الشهر", project: "المشروع", period: "الفترة", hours: "الساعات الأسبوعية", cost: "الراتب المحمل", overhead: "غير مخصص / مصاريف عامة", total: "إجمالي الراتب", projectCost: "تكاليف المشاريع", empty: "لا توجد سجلات", entitlement: "الاستحقاق السنوي", used: "الإجازات المستخدمة", pending: "الإجازات المعلقة", balance: "الأيام المتبقية", from: "من", until: "إلى", days: "الأيام", status: "الحالة", leaveType: "نوع الإجازة", task: "المهمة", date: "فترة التخصيص", missing: "الموظف غير موجود", budget: "تكلفة المشاريع الشهرية", profile: "الملف الشخصي", charges: "توزيع الراتب على المشاريع" },
};
const t = T.en;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
function DataTable({ headers, rows, onRowClick }: { headers: string[]; rows: ReactNode[][]; onRowClick?: (index: number) => void }) {
  return <StyledTable className="[&_th]:whitespace-normal [&_th]:text-xs [&_td]:py-4"><StyledTableHeader><StyledTableHeaderRow>{headers.map((h) => <StyledTableHead key={h}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader><StyledTableBody>{rows.length ? rows.map((row, i) => <StyledTableRow key={i} onClick={onRowClick ? () => onRowClick(i) : undefined} className={onRowClick ? "cursor-pointer" : undefined}>{row.map((value, j) => <StyledTableCell key={j} className="whitespace-normal break-words text-sm">{value}</StyledTableCell>)}</StyledTableRow>) : <StyledTableRow><StyledTableCell colSpan={headers.length} className="py-8 text-center text-muted-foreground">{t.empty}</StyledTableCell></StyledTableRow>}</StyledTableBody></StyledTable>;
}
function EmployeeDetails() {
 const { employeeId } = Route.useParams(); const { employees, employmentTypes } = useEmployees(); const { projects } = useProjects(); const { resourceRequests } = useResourceRequests();
 const employee = employees.find((e) => e.id === employeeId);
 const [tab, setTab] = useState("overview"); const [year, setYear] = useState("2026"); const [selectedMonth, setSelectedMonth] = useState("2026-10"); const [salaryMonth, setSalaryMonth] = useState<string | null>(null);
 const projectLink = (name: string) => { const p = projects.find((v) => v.name === name); return p ? <Link to="/portfolio/$projectId" params={{ projectId: p.id }} className="text-accent hover:underline">{name}</Link> : name; };
 if (!employee) return <><Button asChild variant="outline"><Link to="/resources" search={{ tab: "people" }}><ChevronLeft className="h-4 w-4" />{t.employees}</Link></Button><h1 className="mt-6 text-xl">{t.missing}</h1></>;
 const monthly = employeeMonth(employee, selectedMonth); const vacation = vacationBalance(employee, year);
 const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
 const years = Array.from(new Set(["2025", "2026", "2027", employee.joinedOn.slice(0, 4), ...employee.allocations.flatMap((a) => [a.from.slice(0, 4), a.until.slice(0, 4)]).filter(Boolean)])).sort();
 const requestTasks = resourceRequests.filter((r) => r.status === "Fulfilled" && r.assignedTo === employee.name && r.task).map((r) => ({ task: r.task ?? "", project: r.project, period: `${monthLabel(r.from)} → ${monthLabel(r.until)}` }));
 const assignmentTasks = employee.allocations.filter((a) => a.task).map((a) => ({ task: a.task ?? "", project: a.project, period: `${monthLabel(a.from)} → ${monthLabel(a.until)}` }));
 const scheduleTasks = projects.filter((p) => employee.projects.includes(p.name)).flatMap((p) => {
   const cached = PLAN_CACHE.get(p.id) as { milestones?: ReturnType<typeof seedMilestones> } | undefined;
   const items = cached?.milestones ?? (employee.demo ? seedMilestones(p) : []);
   return items.filter((item) => item.kind === "Task" && !items.some((child) => child.parent === item.name) && item.assignee?.split(",").some((name) => name.trim() === employee.name)).map((item) => ({ task: item.name, project: p.name, period: `${formatDateWithYear(item.startDate)} → ${formatDateWithYear(item.endDate)}` }));
 });
 const tasks = [...scheduleTasks, ...assignmentTasks, ...requestTasks]; employee.tasks.forEach((task) => { if (!tasks.some((v) => v.task === task)) tasks.push({ task, project: "—", period: "—" }); });
 const uniqueTasks = tasks.filter((v, i) => tasks.findIndex((a) => a.task === v.task && a.project === v.project) === i);
 const profile = [[t.id, employee.id], [t.email, employee.email], [t.role, employee.role], [t.department, employee.dept], [t.type, employmentTypes.find((v) => v.id === employee.employmentTypeId)?.name ?? "—"], [t.joined, formatDateWithYear(employee.joinedOn)]];
 return <div className="min-w-0 space-y-8">
  <div className="space-y-5">
   <Button asChild variant="ghost" className="h-9 px-0 text-muted-foreground"><Link to="/resources" search={{ tab: "people" }}><ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t.employees}</Link></Button>
   <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
    <Avatar className="h-16 w-16 shrink-0"><AvatarFallback className="bg-accent-dim text-xl font-medium text-accent">{employee.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
    <div className="min-w-0 space-y-2">
     <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><h1 className="break-words text-2xl font-semibold text-foreground">{employee.name}</h1><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{profile[4]?.[1]}</Badge>{employee.demo && <Badge variant="secondary">{t.demo}</Badge>}</div></div>
     <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"><span>{employee.role}</span><span aria-hidden="true">·</span><span>{employee.dept}</span></div>
    </div>
   </header>
  </div>
  <dl className="glass-card grid items-stretch p-0 sm:grid-cols-2 xl:grid-cols-5">
   {[[t.monthly, new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(employee.salary)], [t.capacity, `${employee.capacity}h`], [t.utilization, `${monthly.utilization}%`], [t.projects, employee.projects.length], [t.vacation, `${vacation.remaining}d`]].map(([label, value], i) => <div key={label} className={`flex min-w-0 flex-col justify-center border-border px-5 py-4 ${i < 4 ? "border-b xl:border-b-0 xl:border-e" : ""}`}><dt className="label-eyebrow">{label}</dt><dd className={`mt-2 break-words text-2xl font-semibold tabular-nums ${label === t.utilization ? monthly.utilization > 100 ? "text-rag-red" : "text-accent" : "text-foreground"}`}>{value}</dd></div>)}
  </dl>
  <Tabs value={tab} onValueChange={setTab} className="min-w-0 space-y-7">
   <div className="grid min-w-0 grid-cols-1 items-end gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
    <TabsList className="h-auto min-w-0 flex-wrap gap-x-6 gap-y-1 overflow-visible"><TabsTrigger value="overview" className="shrink-0 px-0">{t.overview}</TabsTrigger><TabsTrigger value="allocation" className="shrink-0 px-0">{t.allocation}</TabsTrigger><TabsTrigger value="tasks" className="shrink-0 px-0">{t.tasks}</TabsTrigger><TabsTrigger value="salary" className="shrink-0 px-0">{t.salary}</TabsTrigger><TabsTrigger value="leave" className="shrink-0 px-0">{t.leave}</TabsTrigger></TabsList>
    <div className="flex shrink-0 items-center gap-3 xl:pb-1"><span className="text-xs text-muted-foreground">{t.year}</span><Select value={year} onValueChange={(v) => { setYear(v); setSelectedMonth(`${v}-${selectedMonth.slice(5)}`); }}><SelectTrigger aria-label={t.year} className="w-28"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
   </div>
   <TabsContent value="overview" className="mt-0 grid min-w-0 gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
    <section className="min-w-0 xl:border-e xl:border-border xl:pe-8"><h2 className="mb-5 text-base font-semibold">{t.details}</h2><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-1">{profile.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1.5 break-words text-sm font-medium leading-relaxed">{value}</dd></div>)}</dl></section>
    <section className="min-w-0"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">{t.allocation}</h2><span className="text-xs text-muted-foreground">{monthLabel(selectedMonth)}</span></div><DataTable headers={[t.project, t.role, t.allocation, t.hours, t.cost]} rows={monthly.charges.map((a) => [projectLink(a.project), a.role, `${a.percent}%`, `${(employee.capacity * a.percent / 100).toFixed(1)}h`, money(a.amount)])} /><div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-xs"><span className="text-muted-foreground">{t.utilization} · {monthly.allocatedHours.toFixed(1)}h / {employee.capacity}h</span><span className="font-medium text-foreground">{monthly.utilization}%</span><Progress value={Math.min(100, monthly.utilization)} className={`col-span-2 h-1.5 ${monthly.utilization > 100 ? "[&>div]:bg-rag-red" : ""}`} /></div></section>
   </TabsContent>
   <TabsContent value="allocation" className="mt-0 space-y-4"><div className="flex items-center gap-3"><Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger aria-label={t.month} className="w-44"><SelectValue /></SelectTrigger><SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}</SelectContent></Select><span className="text-sm text-muted-foreground">{monthly.allocatedHours.toFixed(1)}h / {employee.capacity}h</span></div><Progress value={Math.min(100, monthly.utilization)} className={monthly.utilization > 100 ? "[&>div]:bg-rag-red" : ""} /><DataTable headers={[t.project, t.role, t.period, t.allocation, t.hours, t.budget]} rows={employee.allocations.map((a) => [projectLink(a.project), a.role, `${monthLabel(a.from)} → ${monthLabel(a.until)}`, `${a.percent}%`, `${(employee.capacity * a.percent / 100).toFixed(1)}h`, money(monthly.charges.find((c) => c.id === a.id)?.amount ?? 0)])} /></TabsContent>
   <TabsContent value="tasks" className="mt-0"><DataTable headers={[t.task, t.project, t.date]} rows={uniqueTasks.map((v) => [v.task, projectLink(v.project), v.period])} /></TabsContent>
   <TabsContent value="salary" className="mt-0 space-y-6"><DataTable headers={[t.month, t.total, t.projectCost, t.overhead]} onRowClick={(i) => { const m = months[i]; setSelectedMonth(m); setSalaryMonth(m); }} rows={months.map((m) => { const values = employeeMonth(employee, m); return [<span className={m === selectedMonth ? "font-medium text-accent" : undefined}>{monthLabel(m)}</span>, money(values.salary), money(values.projectCost), money(values.overhead)]; })} /></TabsContent>
   <TabsContent value="leave" className="mt-0 space-y-6"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><KpiCard label={t.entitlement} value={`${vacation.entitlement}d`} /><KpiCard label={t.used} value={`${vacation.used}d`} /><KpiCard label={t.pending} value={`${vacation.pending}d`} accent="amber" /><KpiCard label={t.balance} value={`${vacation.remaining}d`} accent="teal" /></div><DataTable headers={[t.leaveType, t.from, t.until, t.days, t.status]} rows={employee.leave.filter((l) => l.from.startsWith(year)).map((l) => [l.type, formatDateWithYear(l.from), formatDateWithYear(l.until), l.days, <Badge variant="outline" className={l.status === "Approved" ? "text-rag-green" : l.status === "Rejected" ? "text-rag-red" : "text-rag-amber"}>{l.status}</Badge>])} /></TabsContent>
  </Tabs>
  <Dialog open={!!salaryMonth} onOpenChange={(open) => { if (!open) setSalaryMonth(null); }}>
   <DialogContent className="max-w-md">
    <DialogHeader><DialogTitle>{t.charges} · {monthLabel(salaryMonth ?? selectedMonth)}</DialogTitle></DialogHeader>
    <DataTable headers={[t.project, t.allocation, t.cost]} rows={[...monthly.charges.map((a) => [projectLink(a.project), `${a.percent}%`, money(a.amount)]), [t.overhead, "—", money(monthly.overhead)], [t.total, "—", money(monthly.salary)]]} />
   </DialogContent>
  </Dialog>
 </div>;
}
