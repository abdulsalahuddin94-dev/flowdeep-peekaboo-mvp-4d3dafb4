import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useEmployees, monthRange, type Employee, type EmployeeTrip, type EmployeeLeave } from "@/lib/employees-store";
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
import { AlertTriangle, ChevronLeft, Pencil, Plus, Trash2 } from "@/lib/icons";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";
export const Route = createFileRoute("/resources_/employees/$employeeId")({
  component: EmployeeDetails,
  head: ({ params }) => ({ meta: [{ title: `Employee ${params.employeeId} — Nexus PMO` }, { name: "description", content: "Employee profile, monthly salary, project cost allocation, assigned tasks, capacity and leave." }, { property: "og:title", content: `Employee ${params.employeeId} — Nexus PMO` }, { property: "og:description", content: "Read-only employee information, salary allocation, projects, tasks and vacation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});
export const T = {
 en: { employees: "Employees", overview: "Overview", allocation: "Projects & allocation", tasks: "Assigned tasks", salary: "Salary & capacity", leave: "Leave & trips", type: "Employment type", capacity: "Capacity / month", utilization: "Utilization", monthly: "Monthly salary", projects: "Assigned projects", vacation: "Vacation remaining", demo: "Demo data", details: "Employee information", email: "Email", role: "Role", department: "Department", joined: "Joining date", id: "Employee ID", year: "Year", month: "Month", project: "Project", period: "Period", hours: "Hours / month", cost: "Salary charged", overhead: "Unassigned / overhead", total: "Total salary", projectCost: "Project charges", empty: "No records", entitlement: "Annual entitlement", used: "Vacation used", pending: "Vacation pending", balance: "Days remaining", from: "From", until: "Until", days: "Days", status: "Status", leaveType: "Leave type", task: "Task", date: "Assignment period", missing: "Employee not found", budget: "Monthly project cost", profile: "Profile", charges: "Project salary breakdown", setPlan: "Set monthly plan", editMonth: "Edit month", startMonth: "Start month", planMonths: "Number of months", salaryValue: "Salary (USD)", capacityValue: "Capacity (hours)", apply: "Apply", cancel: "Cancel", save: "Save", trips: "Business trips & training", addEntry: "Add entry", kind: "Type", title: "Title", businessTrip: "Business trip", training: "Training", planned: "Planned", completed: "Completed", overUtil: "Over-utilization", overUtilDesc: "Assigned hours exceed the available capacity in", available: "Available", absence: "Absence days", monthlyUtil: "Monthly utilization by project", totalUtil: "Total", leaveRecords: "Leave records", monthSummary: "Month summary", baseSalary: "Base salary", baseCapacity: "Base capacity", assigned: "Assigned", salarySplit: "Salary distribution", planApplied: "Monthly plan applied", monthUpdated: "Month updated", tripAdded: "Entry added", tripRemoved: "Entry removed", leaveAdded: "Leave added", leaveRemoved: "Leave removed", annualVacation: "Annual vacation", sickLeave: "Sick leave", unpaidLeave: "Unpaid leave", assignedHours: "Assigned hours" },
 ar: { employees: "الموظفون", overview: "نظرة عامة", allocation: "المشاريع والتخصيص", tasks: "المهام المسندة", salary: "الراتب والسعة", leave: "الإجازات والرحلات", type: "نوع التوظيف", capacity: "السعة الشهرية", utilization: "الاستغلال", monthly: "الراتب الشهري", projects: "المشاريع المسندة", vacation: "رصيد الإجازات", demo: "بيانات تجريبية", details: "بيانات الموظف", email: "البريد الإلكتروني", role: "الدور", department: "القسم", joined: "تاريخ الانضمام", id: "رقم الموظف", year: "السنة", month: "الشهر", project: "المشروع", period: "الفترة", hours: "الساعات الشهرية", cost: "الراتب المحمل", overhead: "غير مخصص / مصاريف عامة", total: "إجمالي الراتب", projectCost: "تكاليف المشاريع", empty: "لا توجد سجلات", entitlement: "الاستحقاق السنوي", used: "الإجازات المستخدمة", pending: "الإجازات المعلقة", balance: "الأيام المتبقية", from: "من", until: "إلى", days: "الأيام", status: "الحالة", leaveType: "نوع الإجازة", task: "المهمة", date: "فترة التخصيص", missing: "الموظف غير موجود", budget: "تكلفة المشاريع الشهرية", profile: "الملف الشخصي", charges: "توزيع الراتب على المشاريع", setPlan: "خطة شهرية", editMonth: "تعديل الشهر", startMonth: "شهر البداية", planMonths: "عدد الشهور", salaryValue: "الراتب (دولار)", capacityValue: "السعة (ساعات)", apply: "تطبيق", cancel: "إلغاء", save: "حفظ", trips: "رحلات العمل والتدريب", addEntry: "إضافة", kind: "النوع", title: "العنوان", businessTrip: "رحلة عمل", training: "تدريب", planned: "مخطط", completed: "مكتمل", overUtil: "تحميل زائد", overUtilDesc: "الساعات المسندة تتجاوز السعة المتاحة في", available: "المتاح", absence: "أيام الغياب", monthlyUtil: "الاستغلال الشهري حسب المشروع", totalUtil: "الإجمالي", leaveRecords: "سجل الإجازات", monthSummary: "ملخص الشهر", baseSalary: "الراتب الأساسي", baseCapacity: "السعة الأساسية", assigned: "المسند", salarySplit: "توزيع الراتب", planApplied: "تم تطبيق الخطة الشهرية", monthUpdated: "تم تحديث الشهر", tripAdded: "تمت الإضافة", tripRemoved: "تم الحذف", leaveAdded: "تمت إضافة الإجازة", leaveRemoved: "تم حذف الإجازة", annualVacation: "إجازة سنوية", sickLeave: "إجازة مرضية", unpaidLeave: "إجازة بدون أجر", assignedHours: "الساعات المسندة" },
};
const t = T.en;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const daysBetween = (from: string, until: string) => Math.max(1, Math.round((new Date(`${until}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000) + 1);
const utilColors = ["bg-accent", "bg-accent-secondary", "bg-rag-blue", "bg-rag-green", "bg-rag-amber"];
function DataTable({ headers, rows, onRowClick }: { headers: ReactNode[]; rows: ReactNode[][]; onRowClick?: (index: number) => void }) {
  return <StyledTable className="[&_th]:whitespace-normal [&_th]:text-xs [&_td]:py-4"><StyledTableHeader><StyledTableHeaderRow>{headers.map((h, i) => <StyledTableHead key={i}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader><StyledTableBody>{rows.length ? rows.map((row, i) => <StyledTableRow key={i} onClick={onRowClick ? () => onRowClick(i) : undefined} className={onRowClick ? "cursor-pointer" : undefined}>{row.map((value, j) => <StyledTableCell key={j} className="whitespace-normal break-words text-sm">{value}</StyledTableCell>)}</StyledTableRow>) : <StyledTableRow><StyledTableCell colSpan={headers.length} className="py-8 text-center text-muted-foreground">{t.empty}</StyledTableCell></StyledTableRow>}</StyledTableBody></StyledTable>;
}
function EmployeeDetails() {
 const { employeeId } = Route.useParams(); const { employees, employmentTypes, setMonthlyPlan, setMonthOverride, addTrip, removeTrip, addLeave, removeLeave } = useEmployees(); const { projects } = useProjects(); const { resourceRequests } = useResourceRequests();
 const employee = employees.find((e) => e.id === employeeId);
 const [tab, setTab] = useState("overview"); const [year, setYear] = useState("2026"); const [selectedMonth, setSelectedMonth] = useState("2026-10"); const [salaryMonth, setSalaryMonth] = useState<string | null>(null);
 const [planOpen, setPlanOpen] = useState(false); const [editMonth, setEditMonth] = useState<string | null>(null); const [tripOpen, setTripOpen] = useState(false); const [leaveOpen, setLeaveOpen] = useState(false);
 const projectLink = (name: string) => { const p = projects.find((v) => v.name === name); return p ? <Link to="/portfolio/$projectId" params={{ projectId: p.id }} className="text-accent hover:underline">{name}</Link> : name; };
 if (!employee) return <><Button asChild variant="outline"><Link to="/resources" search={{ tab: "people" }}><ChevronLeft className="h-4 w-4" />{t.employees}</Link></Button><h1 className="mt-6 text-xl">{t.missing}</h1></>;
 const monthly = employeeMonth(employee, selectedMonth); const vacation = vacationBalance(employee, year);
 const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
 const years = Array.from(new Set(["2025", "2026", "2027", employee.joinedOn.slice(0, 4), ...employee.allocations.flatMap((a) => [a.from.slice(0, 4), a.until.slice(0, 4)]).filter(Boolean)])).sort();
 const overMonths = months.filter((m) => employeeMonth(employee, m).effectiveUtilization > 100);
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
   {[[t.monthly, new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(monthly.salary)], [t.capacity, `${monthly.capacity}h`], [t.utilization, `${monthly.effectiveUtilization}%`], [t.projects, employee.projects.length], [t.vacation, `${vacation.remaining}d`]].map(([label, value], i) => <div key={label} className={`flex min-w-0 flex-col justify-center border-border px-5 py-4 ${i < 4 ? "border-b xl:border-b-0 xl:border-e" : ""}`}><dt className="label-eyebrow">{label}</dt><dd className={`mt-2 break-words text-2xl font-semibold tabular-nums ${label === t.utilization ? monthly.effectiveUtilization > 100 ? "text-rag-red" : "text-accent" : "text-foreground"}`}>{value}</dd></div>)}
  </dl>
  {overMonths.length > 0 && (
   <div className="flex items-start gap-3 rounded-lg border border-rag-red/40 bg-rag-red/10 px-4 py-3">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rag-red" />
    <div className="text-sm"><span className="font-medium text-rag-red">{t.overUtil}</span><span className="text-muted-foreground"> — {t.overUtilDesc} </span><span className="font-medium text-foreground">{overMonths.map(monthLabel).join(", ")}</span><span className="text-muted-foreground">.</span></div>
   </div>
  )}
  <Tabs value={tab} onValueChange={setTab} className="min-w-0 space-y-7">
   <div className="grid min-w-0 grid-cols-1 items-end gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
    <TabsList className="h-auto min-w-0 flex-wrap gap-x-6 gap-y-1 overflow-visible"><TabsTrigger value="overview" className="shrink-0 px-0">{t.overview}</TabsTrigger><TabsTrigger value="allocation" className="shrink-0 px-0">{t.allocation}</TabsTrigger><TabsTrigger value="tasks" className="shrink-0 px-0">{t.tasks}</TabsTrigger><TabsTrigger value="salary" className="shrink-0 px-0">{t.salary}</TabsTrigger><TabsTrigger value="leave" className="shrink-0 px-0">{t.leave}</TabsTrigger></TabsList>
    <div className="flex shrink-0 items-center gap-3 xl:pb-1"><span className="text-xs text-muted-foreground">{t.year}</span><Select value={year} onValueChange={(v) => { setYear(v); setSelectedMonth(`${v}-${selectedMonth.slice(5)}`); }}><SelectTrigger aria-label={t.year} className="w-28"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
   </div>
   <TabsContent value="overview" className="mt-0 space-y-8">
    <section className="min-w-0"><h2 className="mb-5 text-base font-semibold">{t.details}</h2><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{[...profile, [t.baseSalary, money(employee.salary)], [t.baseCapacity, `${employee.capacity}h`]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1.5 break-words text-sm font-medium leading-relaxed">{value}</dd></div>)}</dl></section>
    <div className="grid min-w-0 gap-8 xl:grid-cols-2">
     <section className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">{t.monthSummary}</h2><span className="text-xs text-muted-foreground">{monthLabel(selectedMonth)}</span></div>
      <div className="glass-card grid grid-cols-3 divide-x divide-border p-0 rtl:divide-x-reverse">
       {[[t.monthly, money(monthly.salary)], [t.available, `${monthly.availableCapacity}h`], [t.assigned, `${monthly.allocatedHours.toFixed(1)}h`]].map(([label, value]) => <div key={label} className="min-w-0 px-4 py-3"><div className="label-eyebrow">{label}</div><div className="mt-1.5 break-words text-lg font-semibold tabular-nums text-foreground">{value}</div></div>)}
      </div>
      <div className="space-y-2">
       <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{t.utilization}</span><span className={`font-medium ${monthly.effectiveUtilization > 100 ? "text-rag-red" : monthly.effectiveUtilization >= 80 ? "text-rag-amber" : "text-rag-green"}`}>{monthly.effectiveUtilization}%</span></div>
       <div className="relative h-3 w-full rounded-full bg-muted/40">
        <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${Math.min(100, monthly.utilization / Math.max(100, monthly.utilization) * 100)}%` }}>
         {monthly.charges.map((a, i) => <div key={a.id} className={utilColors[i % utilColors.length]} style={{ width: `${monthly.utilization > 0 ? a.percent / monthly.utilization * 100 : 0}%` }} />)}
        </div>
        {[80, 100].map((mark) => <div key={mark} className="absolute inset-y-[-3px] border-l border-foreground/30" style={{ left: `${mark / Math.max(100, monthly.utilization) * 100}%` }} />)}
       </div>
       <div className="relative h-4 text-[10px] text-muted-foreground">
        {[80, 100].map((mark) => <span key={mark} className="absolute -translate-x-1/2 rtl:translate-x-1/2" style={{ left: `${mark / Math.max(100, monthly.utilization) * 100}%` }}>{mark}%</span>)}
       </div>
       {monthly.absentDays > 0 && <p className="text-xs text-muted-foreground">{monthly.absentDays}d {t.absence.toLowerCase()} · {monthly.capacity}h → {monthly.availableCapacity}h {t.available.toLowerCase()}</p>}
      </div>
     </section>
     <section className="min-w-0 space-y-5">
      <h2 className="text-base font-semibold">{t.allocation}</h2>
      <DataTable headers={[t.project, t.role, t.allocation, t.hours, t.cost]} rows={monthly.charges.map((a) => [projectLink(a.project), a.role, `${a.percent}%`, `${(monthly.capacity * a.percent / 100).toFixed(1)}h`, money(a.amount)])} />
      <div className="space-y-2">
       <div className="text-xs text-muted-foreground">{t.salarySplit}</div>
       <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/40">
        {monthly.salary > 0 && monthly.charges.map((a, i) => <div key={a.id} className={utilColors[i % utilColors.length]} style={{ width: `${a.amount / monthly.salary * 100}%` }} />)}
        {monthly.salary > 0 && monthly.overhead > 0 && <div className="bg-muted" style={{ width: `${monthly.overhead / monthly.salary * 100}%` }} />}
       </div>
       <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {monthly.charges.map((a, i) => <li key={a.id} className="flex items-center gap-1.5"><span className={`h-2 w-2 shrink-0 rounded-full ${utilColors[i % utilColors.length]}`} />{a.project} · {money(a.amount)}</li>)}
        {monthly.overhead > 0 && <li className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full bg-muted" />{t.overhead} · {money(monthly.overhead)}</li>}
       </ul>
      </div>
     </section>
    </div>
   </TabsContent>
   <TabsContent value="allocation" className="mt-0 space-y-8">
    <section className="min-w-0">
     <h2 className="mb-5 text-base font-semibold">{t.projects}</h2>
     <DataTable headers={[t.project, t.role, t.period, t.allocation]} rows={employee.allocations.map((a) => [projectLink(a.project), a.role, `${monthLabel(a.from)} → ${monthLabel(a.until)}`, `${a.percent}%`])} />
    </section>
    <section className="min-w-0">
     <h2 className="mb-5 text-base font-semibold">{t.monthlyUtil}</h2>
     <DataTable
      headers={[t.month, t.projects, t.assignedHours, t.utilization]}
      rows={months.map((m) => { const v = employeeMonth(employee, m); return [
       <span className={m === selectedMonth ? "font-medium text-accent" : undefined}>{monthLabel(m)}</span>,
       v.allocations.length ? <span className="text-muted-foreground">{v.allocations.map((a) => `${a.project} · ${a.percent}%`).join(" · ")}</span> : <span className="text-muted-foreground">—</span>,
       <span className="num-mono">{v.allocatedHours.toFixed(1)}h / {v.availableCapacity}h{v.absentDays > 0 ? <span className="block text-xs text-muted-foreground">{v.absentDays}d {t.absence.toLowerCase()}</span> : null}</span>,
       <span className={`num-mono font-medium ${v.effectiveUtilization > 100 ? "text-rag-red" : "text-foreground"}`}>{v.effectiveUtilization}%</span>,
      ]; })}
      onRowClick={(i) => setSelectedMonth(months[i])}
     />
    </section>
   </TabsContent>
   <TabsContent value="tasks" className="mt-0"><DataTable headers={[t.task, t.project, t.date]} rows={uniqueTasks.map((v) => [v.task, projectLink(v.project), v.period])} /></TabsContent>
   <TabsContent value="salary" className="mt-0 space-y-6">
    <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{t.year} {year}</span><Button size="sm" variant="primary" onClick={() => setPlanOpen(true)}><Plus className="mr-1 h-4 w-4" />{t.setPlan}</Button></div>
    <DataTable
     headers={[t.month, t.total, t.capacity, t.projectCost, t.overhead, ""]}
     onRowClick={(i) => { const m = months[i]; setSelectedMonth(m); setSalaryMonth(m); }}
     rows={months.map((m) => { const values = employeeMonth(employee, m); return [
      <span className={m === selectedMonth ? "font-medium text-accent" : undefined}>{monthLabel(m)}</span>,
      money(values.salary),
      <span className="num-mono">{values.capacity}h{values.absentDays > 0 ? <span className="block text-xs text-muted-foreground">{values.availableCapacity}h {t.available.toLowerCase()} · {values.absentDays}d {t.absence.toLowerCase()}</span> : null}</span>,
      money(values.projectCost),
      money(values.overhead),
      <Button size="icon" variant="secondary" data-ds-size="auto" aria-label={t.editMonth} title={t.editMonth} className="h-9 w-9 rounded-full border border-border/60 text-accent" onClick={(e) => { e.stopPropagation(); setEditMonth(m); }}><Pencil className="h-4 w-4" /></Button>,
     ]; })}
    />
   </TabsContent>
   <TabsContent value="leave" className="mt-0 space-y-8">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><KpiCard label={t.entitlement} value={`${vacation.entitlement}d`} /><KpiCard label={t.used} value={`${vacation.used}d`} /><KpiCard label={t.pending} value={`${vacation.pending}d`} accent="amber" /><KpiCard label={t.balance} value={`${vacation.remaining}d`} accent="teal" /></div>
    <section className="min-w-0">
     <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-base font-semibold">{t.leaveRecords}</h2><Button size="sm" variant="outline" onClick={() => setLeaveOpen(true)}><Plus className="mr-1 h-4 w-4" />{t.addEntry}</Button></div>
     <DataTable
      headers={[t.leaveType, t.from, t.until, t.days, t.status, ""]}
      rows={employee.leave.filter((l) => l.from.startsWith(year)).map((l) => [
       l.type,
       formatDateWithYear(l.from),
       formatDateWithYear(l.until),
       l.days,
       <Badge variant="outline" className={l.status === "Approved" ? "text-rag-green" : l.status === "Rejected" ? "text-rag-red" : "text-rag-amber"}>{l.status}</Badge>,
       <Button size="icon" variant="dangerOutline" data-ds-size="auto" aria-label={t.leaveRemoved} title={t.leaveRemoved} className="h-9 w-9 rounded-full" onClick={() => { removeLeave(employee.id, l.id); toast.success(t.leaveRemoved); }}><Trash2 className="h-4 w-4" /></Button>,
      ])}
     />
    </section>
    <section className="min-w-0">
     <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-base font-semibold">{t.trips}</h2><Button size="sm" variant="outline" onClick={() => setTripOpen(true)}><Plus className="mr-1 h-4 w-4" />{t.addEntry}</Button></div>
     <DataTable
      headers={[t.kind, t.title, t.from, t.until, t.days, t.status, ""]}
      rows={employee.trips.map((trip) => [
       <Badge variant="outline" className={trip.kind === "Business trip" ? "text-rag-blue" : "text-accent-secondary"}>{trip.kind === "Business trip" ? t.businessTrip : t.training}</Badge>,
       trip.title,
       formatDateWithYear(trip.from),
       formatDateWithYear(trip.until),
       trip.days,
       <Badge variant="outline" className={trip.status === "Completed" ? "text-rag-green" : "text-rag-amber"}>{trip.status === "Completed" ? t.completed : t.planned}</Badge>,
       <Button size="icon" variant="dangerOutline" data-ds-size="auto" aria-label={t.tripRemoved} title={t.tripRemoved} className="h-9 w-9 rounded-full" onClick={() => { removeTrip(employee.id, trip.id); toast.success(t.tripRemoved); }}><Trash2 className="h-4 w-4" /></Button>,
      ])}
     />
    </section>
   </TabsContent>
  </Tabs>
  <Dialog open={!!salaryMonth} onOpenChange={(open) => { if (!open) setSalaryMonth(null); }}>
   <DialogContent className="max-w-md">
    <DialogHeader><DialogTitle>{t.charges} · {monthLabel(salaryMonth ?? selectedMonth)}</DialogTitle></DialogHeader>
    <DataTable headers={[t.project, t.allocation, t.cost]} rows={[...monthly.charges.map((a) => [projectLink(a.project), `${a.percent}%`, money(a.amount)]), [t.overhead, "—", money(monthly.overhead)], [t.total, "—", money(monthly.salary)]]} />
   </DialogContent>
  </Dialog>
  <MonthlyPlanDialog employee={employee} open={planOpen} onClose={() => setPlanOpen(false)} defaultStart={selectedMonth} onApply={(start, count, salary, capacity) => { setMonthlyPlan(employee.id, start, count, { salary, capacity }); setPlanOpen(false); toast.success(t.planApplied, { description: `${monthLabel(start)} · ${count} ${count === 1 ? "month" : "months"}` }); }} />
  <MonthEditDialog employee={employee} month={editMonth} onClose={() => setEditMonth(null)} onSave={(m, salary, capacity) => { setMonthOverride(employee.id, m, { salary, capacity }); setEditMonth(null); toast.success(t.monthUpdated, { description: monthLabel(m) }); }} />
  <TripDialog open={tripOpen} onClose={() => setTripOpen(false)} onAdd={(trip) => { addTrip(employee.id, trip); setTripOpen(false); toast.success(t.tripAdded, { description: trip.title }); }} />
  <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onAdd={(leave) => { addLeave(employee.id, leave); setLeaveOpen(false); toast.success(t.leaveAdded, { description: leave.type }); }} />
 </div>;
}

/** Bulk plan: apply one salary/capacity to a run of months (e.g. 9000 for the next 12 months). */
function MonthlyPlanDialog({ employee, open, onClose, defaultStart, onApply }: { employee: Employee; open: boolean; onClose: () => void; defaultStart: string; onApply: (start: string, months: number, salary: number, capacity: number) => void }) {
 const [start, setStart] = useState(defaultStart); const [count, setCount] = useState("12"); const [salary, setSalary] = useState(""); const [capacity, setCapacity] = useState("");
 const [errors, setErrors] = useState<{ start?: string; salary?: string; capacity?: string }>({});
 useEffect(() => { if (open) { setStart(defaultStart); setCount("12"); setSalary(String(employee.salary || "")); setCapacity(String(employee.capacity || "")); setErrors({}); } }, [open, defaultStart, employee.salary, employee.capacity]);
 function submit() {
  const next = { start: start ? undefined : "Start month is required.", salary: Number(salary) >= 0 && salary !== "" ? undefined : "Salary is required.", capacity: Number(capacity) > 0 ? undefined : "Capacity is required." };
  setErrors(next);
  if (Object.values(next).some(Boolean)) return;
  onApply(start, Math.max(1, Number(count) || 12), Number(salary), Number(capacity));
 }
 return <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-md">
   <DialogHeader><DialogTitle>{t.setPlan}</DialogTitle></DialogHeader>
   <div className="grid grid-cols-2 gap-3">
    <Field label={t.startMonth} htmlFor="plan-start" required error={errors.start}><Input id="plan-start" type="month" value={start} onChange={(e) => { setStart(e.target.value); setErrors((p) => ({ ...p, start: undefined })); }} /></Field>
    <Field label={t.planMonths} htmlFor="plan-count"><Input id="plan-count" type="number" min={1} max={60} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
    <Field label={t.salaryValue} htmlFor="plan-salary" required error={errors.salary}><Input id="plan-salary" type="number" min={0} placeholder="e.g. 9000" value={salary} onChange={(e) => { setSalary(e.target.value); setErrors((p) => ({ ...p, salary: undefined })); }} /></Field>
    <Field label={t.capacityValue} htmlFor="plan-capacity" required error={errors.capacity}><Input id="plan-capacity" type="number" min={1} placeholder="e.g. 160" value={capacity} onChange={(e) => { setCapacity(e.target.value); setErrors((p) => ({ ...p, capacity: undefined })); }} /></Field>
   </div>
   {start && <p className="text-xs text-muted-foreground">{monthLabel(start)} → {monthLabel(monthRange(start, Math.max(1, Number(count) || 12)).slice(-1)[0])}</p>}
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.apply}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}

/** Single-month override, e.g. a raise in one or two months. */
function MonthEditDialog({ employee, month, onClose, onSave }: { employee: Employee; month: string | null; onClose: () => void; onSave: (month: string, salary: number, capacity: number) => void }) {
 const values = month ? employeeMonth(employee, month) : null;
 const [salary, setSalary] = useState(""); const [capacity, setCapacity] = useState("");
 useEffect(() => { if (month && values) { setSalary(String(values.salary)); setCapacity(String(values.capacity)); } }, [month]);
 return <Dialog open={!!month} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-sm">
   <DialogHeader><DialogTitle>{t.editMonth} · {month ? monthLabel(month) : ""}</DialogTitle></DialogHeader>
   <div className="grid gap-3">
    <Field label={t.salaryValue} htmlFor="month-salary" required><Input id="month-salary" type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} /></Field>
    <Field label={t.capacityValue} htmlFor="month-capacity" required><Input id="month-capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>
   </div>
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={() => month && onSave(month, Number(salary) || 0, Number(capacity) || employee.capacity)}>{t.save}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}

function TripDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (trip: Omit<EmployeeTrip, "id">) => void }) {
 const [kind, setKind] = useState<EmployeeTrip["kind"]>("Business trip"); const [title, setTitle] = useState(""); const [from, setFrom] = useState(""); const [until, setUntil] = useState("");
 const [errors, setErrors] = useState<{ title?: string; from?: string; until?: string }>({});
 function submit() {
  const next = { title: title.trim() ? undefined : "Title is required.", from: from ? undefined : "Start date is required.", until: !until ? "End date is required." : from && until < from ? "End date must be on or after start date." : undefined };
  setErrors(next);
  if (Object.values(next).some(Boolean)) return;
  onAdd({ kind, title: title.trim(), from, until, days: daysBetween(from, until), status: "Planned" });
  setKind("Business trip"); setTitle(""); setFrom(""); setUntil(""); setErrors({});
 }
 return <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-md">
   <DialogHeader><DialogTitle>{t.addEntry} · {t.trips}</DialogTitle></DialogHeader>
   <div className="grid gap-3">
    <Field label={t.kind} htmlFor="trip-kind" required><Select value={kind} onValueChange={(v) => setKind(v as EmployeeTrip["kind"])}><SelectTrigger id="trip-kind"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Business trip">{t.businessTrip}</SelectItem><SelectItem value="Training">{t.training}</SelectItem></SelectContent></Select></Field>
    <Field label={t.title} htmlFor="trip-title" required error={errors.title}><Input id="trip-title" placeholder="e.g. Client site visit" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }} /></Field>
    <div className="grid grid-cols-2 gap-2">
     <Field label={t.from} htmlFor="trip-from" required error={errors.from}><Input id="trip-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setErrors((p) => ({ ...p, from: undefined })); }} /></Field>
     <Field label={t.until} htmlFor="trip-until" required error={errors.until}><Input id="trip-until" type="date" value={until} onChange={(e) => { setUntil(e.target.value); setErrors((p) => ({ ...p, until: undefined })); }} /></Field>
    </div>
   </div>
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.save}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}

function LeaveDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (leave: Omit<EmployeeLeave, "id">) => void }) {
 const [type, setType] = useState<EmployeeLeave["type"]>("Annual vacation"); const [status, setStatus] = useState<EmployeeLeave["status"]>("Approved"); const [from, setFrom] = useState(""); const [until, setUntil] = useState("");
 const [errors, setErrors] = useState<{ from?: string; until?: string }>({});
 function submit() {
  const next = { from: from ? undefined : "Start date is required.", until: !until ? "End date is required." : from && until < from ? "End date must be on or after start date." : undefined };
  setErrors(next);
  if (Object.values(next).some(Boolean)) return;
  onAdd({ type, from, until, days: daysBetween(from, until), status });
  setType("Annual vacation"); setStatus("Approved"); setFrom(""); setUntil(""); setErrors({});
 }
 return <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-md">
   <DialogHeader><DialogTitle>{t.addEntry} · {t.leaveRecords}</DialogTitle></DialogHeader>
   <div className="grid gap-3">
    <div className="grid grid-cols-2 gap-2">
     <Field label={t.leaveType} htmlFor="leave-type" required><Select value={type} onValueChange={(v) => setType(v as EmployeeLeave["type"])}><SelectTrigger id="leave-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Annual vacation">{t.annualVacation}</SelectItem><SelectItem value="Sick leave">{t.sickLeave}</SelectItem><SelectItem value="Unpaid leave">{t.unpaidLeave}</SelectItem></SelectContent></Select></Field>
     <Field label={t.status} htmlFor="leave-status" required><Select value={status} onValueChange={(v) => setStatus(v as EmployeeLeave["status"])}><SelectTrigger id="leave-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select></Field>
    </div>
    <div className="grid grid-cols-2 gap-2">
     <Field label={t.from} htmlFor="leave-from" required error={errors.from}><Input id="leave-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setErrors((p) => ({ ...p, from: undefined })); }} /></Field>
     <Field label={t.until} htmlFor="leave-until" required error={errors.until}><Input id="leave-until" type="date" value={until} onChange={(e) => { setUntil(e.target.value); setErrors((p) => ({ ...p, until: undefined })); }} /></Field>
    </div>
   </div>
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.save}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}
