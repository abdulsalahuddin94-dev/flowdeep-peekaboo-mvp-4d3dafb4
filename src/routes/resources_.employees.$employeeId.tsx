import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequestPeriod } from "@/components/RequestPeriod";
import { useEffect, useState, type ReactNode } from "react";
import { useEmployees, monthRange, type Employee, type EmployeeTrip, type EmployeeLeave } from "@/lib/employees-store";
import { PLAN_CACHE } from "@/lib/plan-cache";
import { seedMilestones } from "@/lib/plan-seeds";
import { employeeMonth, averageUtilization, capacityOverrideMonths } from "@/lib/employee-finance";
import { currentEmployeeMonth, stepEmployeeMonth } from "@/lib/employee-period";
import { useCalendars, useProjects, useResourceRequests } from "@/lib/projects-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { AlertTriangle, Phone, Mail, IdCard, CalendarDays, Briefcase, Building2, ChevronDown, ChevronLeft, DeleteAction, MoreHorizontal, Pencil, Plus, Search, ToggleActive, Trash2, X } from "@/lib/icons";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dollars } from "@/lib/money";
import { toast } from "@/lib/toast";
import { formatDateWithYear } from "@/lib/date-format";
import { Cell, Pie, PieChart } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { EmployeeWorkCalendar, type WorkEntry, type CalendarEvent } from "@/components/EmployeeWorkCalendar";
import { PageToolbar } from "@/components/ds/PageToolbar";
import { useMeetings } from "@/lib/meeting-store";
import { useActions } from "@/lib/action-store";
import { PeriodStepper } from "@/components/PeriodStepper";
import { employeeBackTarget } from "@/lib/employee-back";
import { EmptyState } from "@/components/ds/EmptyState";
import { EmptyRegion, useEmptyPreview } from "@/lib/empty-preview";
export const Route = createFileRoute("/resources_/employees/$employeeId")({
  component: EmployeeDetails,
  validateSearch: (search: Record<string, unknown>): { from?: string; projectId?: string } => ({
    from: typeof search.from === "string" ? search.from : undefined,
    projectId: typeof search.projectId === "string" ? search.projectId : undefined,
  }),
  head: ({ params }) => ({ meta: [{ title: `Employee ${params.employeeId} — Nexus PMO` }, { name: "description", content: "Employee profile, monthly salary, project allocation, assigned tasks, capacity, leave and trips." }, { property: "og:title", content: `Employee ${params.employeeId} — Nexus PMO` }, { property: "og:description", content: "Read-only employee information, salary allocation, projects, tasks and vacation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});
export const T = {
 en: { employees: "Employees", overview: "Employee Info", allocation: "Calendar", actionsTab: "Actions", dueDate: "Due date", actionsEmptyT: "No actions assigned yet", actionsEmptyD: "Actions owned by this employee in the Action Tracker appear here.", tasks: "Assigned tasks", salary: "Salary & capacity", leave: "Leave & trips", type: "Employment type", capacity: "Capacity / month", utilization: "Utilization for this month", avgUtil: "Yearly average utilization", monthly: "Monthly salary", projects: "Assigned projects", demo: "Demo data", details: "Employee information", email: "Email", role: "Role", seniority: "Seniority", department: "Department", joined: "Hiring date", phone: "Phone number", nationalId: "National ID", birth: "Date of birth", id: "Employee ID", year: "Year", month: "Month", project: "Project", period: "Period", hours: "Hours / month", cost: "Salary charged", overhead: "Unassigned / overhead", total: "Total salary", projectCost: "Project charges", empty: "No records", entitlement: "Annual entitlement", used: "Vacation used", pending: "Vacation pending", balance: "Days remaining", from: "From", until: "Until", days: "Days", status: "Status", leaveType: "Leave type", task: "Task", date: "Assignment period", missing: "Employee not found", budget: "Monthly project cost", profile: "Profile", charges: "Project salary breakdown", setPlan: "Set plan", editMonth: "Edit month", startMonth: "Start month", planMonths: "Number of months", salaryValue: "Salary (USD)", capacityValue: "Capacity (hours)", apply: "Apply", cancel: "Cancel", save: "Save", trips: "Business trips & training", addEntry: "Add entry", kind: "Type", title: "Title", businessTrip: "Business trip", training: "Training", planned: "Planned", completed: "Completed", overUtil: "Over-utilization", overUtilDesc: "Assigned hours exceed the available capacity in", available: "Available Capacity", absence: "Absence days", monthlyUtil: "Monthly utilization by project", totalUtil: "Total", leaveRecords: "Leave records", monthSummary: "Month summary", baseSalary: "Base salary", baseCapacity: "Base capacity", assigned: "Assigned", salarySplit: "Salary distribution", planApplied: "Monthly plan applied", monthUpdated: "Month updated", tripAdded: "Entry added", tripRemoved: "Entry removed", leaveAdded: "Leave added", leaveRemoved: "Leave removed", deleteLeaveT: "Delete this leave record?", deleteLeaveD: "This entry will be removed and the employee's capacity will be recalculated.", annualVacation: "Annual vacation", sickLeave: "Sick leave", unpaidLeave: "Unpaid leave", partialLeave: "Partial leave", leaveDate: "Date", leaveHours: "Hours", assignedHours: "Assigned hours", salaryTab: "Salary", capacityTab: "Capacity", tripsTab: "Trips", leaveOption: "Leave", partialOption: "Partial", remark: "Remark", remarkHint: "Optional note", leaveUsed: "Leave used", country: "Country", city: "City", destination: "Destination", travelDates: "Travel Dates", travelStart: "Travel start date", travelEnd: "Travel end date", workStart: "Trip work start date", workEnd: "Trip work end date", travel: "Travel", tripWork: "Trip work", tickets: "Tickets cost", visa: "Visa cost", perDiem: "Per diem cost", tripTotal: "Total cost", addTrip: "Add trip", searchTasks: "Search tasks", allProjects: "All projects", leaveAbsence: "Leave", allocated: "allocated", setCapacity: "Set capacity", editCapacity: "Edit capacity", editSalary: "Edit salary", salaryPlanApplied: "Salary plan applied", capacityPlanApplied: "Capacity plan applied", noTasks: "No tasks match these filters", resources: "Resources", breadcrumb: "Breadcrumb", workingDays: "Working days in month", workingDaysError: "Working days must be between 1 and 31.", tripsHint: "Trips are planned from the project's Trips tab", noCapacityTip: "This employee has assigned hours but no capacity this month, so no salary is charged to projects." },
 ar: { employees: "الموظفون", overview: "بيانات الموظف", allocation: "التقويم", actionsTab: "الإجراءات", dueDate: "تاريخ الاستحقاق", actionsEmptyT: "لا توجد إجراءات مسندة بعد", actionsEmptyD: "تظهر هنا الإجراءات التي يملكها هذا الموظف في متتبع الإجراءات.", tasks: "المهام المسندة", salary: "الراتب والسعة", leave: "الإجازات والرحلات", type: "نوع التوظيف", capacity: "السعة الشهرية", utilization: "الاستغلال لهذا الشهر", avgUtil: "متوسط الاستغلال السنوي", monthly: "الراتب الشهري", projects: "المشاريع المسندة", demo: "بيانات تجريبية", details: "بيانات الموظف", email: "البريد الإلكتروني", role: "الدور", seniority: "الخبرة", department: "القسم", joined: "تاريخ التعيين", phone: "رقم الهاتف", nationalId: "رقم الهوية", birth: "تاريخ الميلاد", id: "رقم الموظف", year: "السنة", month: "الشهر", project: "المشروع", period: "الفترة", hours: "الساعات الشهرية", cost: "الراتب المحمل", overhead: "غير مخصص / مصاريف عامة", total: "إجمالي الراتب", projectCost: "تكاليف المشاريع", empty: "لا توجد سجلات", entitlement: "الاستحقاق السنوي", used: "الإجازات المستخدمة", pending: "الإجازات المعلقة", balance: "الأيام المتبقية", from: "من", until: "إلى", days: "الأيام", status: "الحالة", leaveType: "نوع الإجازة", task: "المهمة", date: "فترة التخصيص", missing: "الموظف غير موجود", budget: "تكلفة المشاريع الشهرية", profile: "الملف الشخصي", charges: "توزيع الراتب على المشاريع", setPlan: "إعداد الخطة", editMonth: "تعديل الشهر", startMonth: "شهر البداية", planMonths: "عدد الشهور", salaryValue: "الراتب (دولار)", capacityValue: "السعة (ساعات)", apply: "تطبيق", cancel: "إلغاء", save: "حفظ", trips: "رحلات العمل والتدريب", addEntry: "إضافة", kind: "النوع", title: "العنوان", businessTrip: "رحلة عمل", training: "تدريب", planned: "مخطط", completed: "مكتمل", overUtil: "تحميل زائد", overUtilDesc: "الساعات المسندة تتجاوز السعة المتاحة في", available: "السعة المتاحة", absence: "أيام الغياب", monthlyUtil: "الاستغلال الشهري حسب المشروع", totalUtil: "الإجمالي", leaveRecords: "سجل الإجازات", monthSummary: "ملخص الشهر", baseSalary: "الراتب الأساسي", baseCapacity: "السعة الأساسية", assigned: "المسند", salarySplit: "توزيع الراتب", planApplied: "تم تطبيق الخطة الشهرية", monthUpdated: "تم تحديث الشهر", tripAdded: "تمت الإضافة", tripRemoved: "تم الحذف", leaveAdded: "تمت إضافة الإجازة", leaveRemoved: "تم حذف الإجازة", deleteLeaveT: "حذف سجل الإجازة هذا؟", deleteLeaveD: "سيتم حذف هذا السجل وإعادة احتساب سعة الموظف.", annualVacation: "إجازة سنوية", sickLeave: "إجازة مرضية", unpaidLeave: "إجازة بدون أجر", partialLeave: "إذن (إجازة جزئية)", leaveDate: "التاريخ", leaveHours: "الساعات", assignedHours: "الساعات المسندة", salaryTab: "الراتب", capacityTab: "السعة", tripsTab: "الرحلات", leaveOption: "إجازة", partialOption: "إذن (جزئي)", remark: "ملاحظة", remarkHint: "ملاحظة اختيارية", leaveUsed: "الإجازات المستخدمة", country: "الدولة", city: "المدينة", destination: "الوجهة", travelDates: "تواريخ السفر", travelStart: "تاريخ بداية السفر", travelEnd: "تاريخ نهاية السفر", workStart: "تاريخ بداية العمل في الرحلة", workEnd: "تاريخ نهاية العمل في الرحلة", travel: "السفر", tripWork: "العمل في الرحلة", tickets: "تكلفة التذاكر", visa: "تكلفة التأشيرة", perDiem: "تكلفة البدل اليومي", tripTotal: "إجمالي التكلفة", addTrip: "إضافة رحلة", searchTasks: "ابحث في المهام", allProjects: "كل المشاريع", leaveAbsence: "إجازة", allocated: "مخصص", setCapacity: "إعداد السعة", editCapacity: "تعديل السعة", editSalary: "تعديل الراتب", salaryPlanApplied: "تم تطبيق خطة الراتب", capacityPlanApplied: "تم تطبيق خطة السعة", noTasks: "لا توجد مهام تطابق الفلاتر", resources: "الموارد", breadcrumb: "مسار التنقل", workingDays: "عدد أيام العمل في الشهر", workingDaysError: "عدد الأيام يجب أن يكون بين 1 و 31.", tripsHint: "تتم إضافة الرحلات من تبويب الرحلات في المشروع", noCapacityTip: "لدى هذا الموظف ساعات مسندة ولكن بدون سعة في هذا الشهر، لذلك لا يُحمَّل راتب على المشاريع." },
};
const t = T.en;
// Header labels for the employee detail page (kept out of the long base rows above).
const H = {
  en: { pageTitle: "Employee Details", gender: "Gender", age: "Age", years: "Years old", backToEmployees: "Back to Employees", backToTeam: "Back to team", actions: "Employee actions", edit: "Edit", activate: "Activate", deactivate: "Deactivate", del: "Delete", active: "Active", inactive: "Inactive", sureToggle: "Are you sure?" },
  ar: { pageTitle: "بيانات الموظف", gender: "النوع", age: "العمر", years: "سنة", backToEmployees: "العودة إلى الموظفين", backToTeam: "العودة إلى الفريق", actions: "إجراءات الموظف", edit: "تعديل", activate: "تنشيط", deactivate: "إلغاء التنشيط", del: "حذف", active: "نشط", inactive: "غير نشط", sureToggle: "هل أنت متأكد؟" },
};
const th = H.en;
const C = {
 en: { overwriteCapacityT: "Overwrite existing capacity?", overwriteCapacityD: "Some selected months already have a capacity plan. Continuing will overwrite their capacity and working days.", affectedMonths: "Months that will be overwritten", overwrite: "Overwrite" },
 ar: { overwriteCapacityT: "استبدال السعة الحالية؟", overwriteCapacityD: "بعض الشهور المختارة لديها خطة سعة بالفعل. بالمتابعة سيتم استبدال السعة وعدد أيام العمل في هذه الشهور.", affectedMonths: "الشهور التي سيتم استبدالها", overwrite: "استبدال" },
};
const tc = C.en;
// Labels for the single period slot that sits under the tab line on every tab that carries one.
const PL = { en: { workCalendar: "Work calendar", monthlyCal: "Monthly Calendar", yearlyCal: "Yearly Calendar", monthly: "Monthly", yearly: "Yearly", previous: "Previous", next: "Next", close: "Dismiss" }, ar: { workCalendar: "تقويم العمل", monthlyCal: "التقويم الشهري", yearlyCal: "التقويم السنوي", monthly: "شهري", yearly: "سنوي", previous: "السابق", next: "التالي", close: "إغلاق" } };
const pl = PL.en;
const E = {
 en: { infoT: "No employee information yet", infoD: "Employee details will appear here once they are added.", salaryT: "No salary data yet", salaryD: "Set a monthly salary plan to see salary distribution and project charges.", capacityT: "No capacity data yet", capacityD: "Set a monthly capacity plan to track availability and utilization.", leaveT: "No leave records yet", leaveD: "Add annual, sick, unpaid or partial leave for this employee.", allocationT: "No project allocations yet", allocationD: "Assigned project work for this period will appear here.", tasksT: "No tasks assigned yet", tasksD: "Tasks assigned to this employee will appear here.", taskSearchD: "Try a different search term or clear your filters.", tripsT: "No trips yet", tripsD: "Business trips and training for this year will appear here." },
 ar: { infoT: "لا توجد بيانات للموظف بعد", infoD: "ستظهر بيانات الموظف هنا بعد إضافتها.", salaryT: "لا توجد بيانات راتب بعد", salaryD: "أعد خطة الراتب الشهرية لعرض توزيع الراتب وتكاليف المشاريع.", capacityT: "لا توجد بيانات سعة بعد", capacityD: "أعد خطة السعة الشهرية لمتابعة السعة المتاحة والاستغلال.", leaveT: "لا توجد سجلات إجازات بعد", leaveD: "أضف إجازة سنوية أو مرضية أو بدون أجر أو إذنًا جزئيًا لهذا الموظف.", allocationT: "لا يوجد تخصيص على المشاريع بعد", allocationD: "سيظهر هنا العمل المسند على المشاريع خلال هذه الفترة.", tasksT: "لا توجد مهام مسندة بعد", tasksD: "ستظهر هنا المهام المسندة إلى هذا الموظف.", taskSearchD: "جرّب كلمة بحث مختلفة أو امسح عوامل التصفية.", tripsT: "لا توجد رحلات بعد", tripsD: "ستظهر هنا رحلات العمل والتدريب لهذا العام." },
};
const te = E.en;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const daysBetween = (from: string, until: string) => Math.max(1, Math.round((new Date(`${until}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000) + 1);
const utilColors = ["bg-accent", "bg-rag-blue", "bg-rag-green", "bg-rag-amber", "bg-accent-secondary"];
const donutColors = ["var(--accent)", "var(--rag-blue)", "var(--rag-green)", "var(--rag-amber)", "var(--accent-secondary)"];
const donutOverheadColor = "var(--muted-foreground)";
function DataTable({ headers, rows, onRowClick }: { headers: ReactNode[]; rows: ReactNode[][]; onRowClick?: (index: number) => void }) {
  return <StyledTable className="[&_th]:whitespace-normal [&_th]:text-xs [&_td]:py-4"><StyledTableHeader><StyledTableHeaderRow>{headers.map((h, i) => <StyledTableHead key={i}>{h}</StyledTableHead>)}</StyledTableHeaderRow></StyledTableHeader><StyledTableBody>{rows.length ? rows.map((row, i) => <StyledTableRow key={i} onClick={onRowClick ? () => onRowClick(i) : undefined} className={onRowClick ? "cursor-pointer" : undefined}>{row.map((value, j) => <StyledTableCell key={j} className="whitespace-normal break-words text-sm">{value}</StyledTableCell>)}</StyledTableRow>) : <StyledTableRow><StyledTableCell colSpan={headers.length} className="py-8 text-center text-muted-foreground">{t.empty}</StyledTableCell></StyledTableRow>}</StyledTableBody></StyledTable>;
}
function EmployeeDetails() {
 const { employeeId } = Route.useParams(); const search = Route.useSearch(); const back = employeeBackTarget(search); const { employees, employmentTypes, setMonthlyPlan, setMonthOverride, addTrip, removeTrip, addLeave, removeLeave, setEmployees, updateEmployee } = useEmployees(); const { projects } = useProjects(); const { resourceRequests } = useResourceRequests();
 const employee = employees.find((e) => e.id === employeeId);
 const { meetings } = useMeetings(); const { actions } = useActions();
 const { enabled: emptyPreview } = useEmptyPreview();
 const [tab, setTab] = useState("overview"); const [capacityView, setCapacityView] = useState("capacity"); const [year, setYear] = useState("2026"); const [selectedMonth, setSelectedMonth] = useState("2026-10"); const [salaryMonth, setSalaryMonth] = useState<string | null>(null);
 // The work calendar's own period: which view and which month, driven from the shared slot under the tab line.
 const [calView, setCalView] = useState<"monthly" | "yearly">("monthly"); const [calMonth, setCalMonth] = useState(9); const [warnClosed, setWarnClosed] = useState(false); useEffect(() => setWarnClosed(false), [year]);
 const [planField, setPlanField] = useState<PlanField | null>(null); const [capacityOverwrite, setCapacityOverwrite] = useState<{ start: string; count: number; value: number; workingDays: number; months: string[] } | null>(null); const [editMonth, setEditMonth] = useState<{ month: string; field: PlanField } | null>(null); const [tripOpen, setTripOpen] = useState(false); const [leaveOpen, setLeaveOpen] = useState(false); const [leaveDelete, setLeaveDelete] = useState<EmployeeLeave | null>(null);
 const [taskQuery, setTaskQuery] = useState(""); const [taskProject, setTaskProject] = useState<string>(t.allProjects); const navigate = useNavigate(); const [deleteOpen, setDeleteOpen] = useState(false); const [toggleOpen, setToggleOpen] = useState(false);
 // Recharts generates different clip IDs on server vs client — render the donut only after mount.
 const [mounted, setMounted] = useState(false);
 useEffect(() => {
  const currentMonth = currentEmployeeMonth();
  setSelectedMonth(currentMonth);
  setYear(currentMonth.slice(0, 4));
  setCalMonth(Number(currentMonth.slice(5, 7)) - 1);
  setMounted(true);
 }, []);
 const projectLink = (name: string) => { const p = projects.find((v) => v.name === name); return p ? <Link to="/portfolio/$projectId" params={{ projectId: p.id }} className="text-accent hover:underline">{name}</Link> : name; };
 if (!employee) return <><Link to="/resources" search={{ tab: "people" }} className="mb-2 inline-flex items-center gap-2 text-sm text-breadcrumb-muted transition-colors hover:text-breadcrumb-hover"><ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t.employees}</Link><h1 className="mt-6 text-xl">{t.missing}</h1></>;
 const applyMonthlyPlan = (field: PlanField, start: string, count: number, value: number, workingDays?: number) => {
  setMonthlyPlan(employee.id, start, count, field === "capacity" ? { capacity: value, workingDays } : { salary: value });
  setPlanField(null);
  toast.success(field === "salary" ? t.salaryPlanApplied : t.capacityPlanApplied, { description: `${monthLabel(start)} · ${count} ${count === 1 ? "month" : "months"}` });
 };
 const requestMonthlyPlan = (field: PlanField, start: string, count: number, value: number, workingDays?: number) => {
  const months = field === "capacity" ? capacityOverrideMonths(employee, start, count) : [];
  if (months.length) {
   setPlanField(null);
   setCapacityOverwrite({ start, count, value, workingDays: workingDays ?? 20, months });
   return;
  }
  applyMonthlyPlan(field, start, count, value, workingDays);
 };
 const monthly = employeeMonth(employee, selectedMonth);
 const utilTone = monthly.effectiveUtilization > 100 ? "text-rag-red" : monthly.effectiveUtilization > 80 ? "text-rag-amber" : "text-accent";
 // Year view of the same number: the mean of the month's effective utilization across the hired months.
 const avgUtil = averageUtilization(employee, year);
 const avgTone = avgUtil > 100 ? "text-rag-red" : avgUtil > 80 ? "text-rag-amber" : "text-accent";
 const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
 const years = Array.from(new Set(["2025", "2026", "2027", year, employee.joinedOn.slice(0, 4), ...Object.keys(employee.monthly).map((m) => m.slice(0, 4)), ...employee.allocations.flatMap((a) => [a.from.slice(0, 4), a.until.slice(0, 4)]).filter(Boolean)])).sort();
 // One period control, pinned to the same slot under the tab line: a month stepper on the work calendar, a year stepper on the dated registers.
 const showPeriod = tab === "allocation" || tab === "salary" || tab === "capacity" || tab === "trips";
 const yi = years.indexOf(year);
 const isCalMonth = tab === "allocation" && calView === "monthly";
 const periodLabel = tab === "salary" ? monthLabel(selectedMonth) : isCalMonth ? new Date(Number(year), calMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : year;
 const canPrev = tab === "salary" || (isCalMonth ? yi > 0 || calMonth > 0 : yi > 0);
 const canNext = tab === "salary" || (isCalMonth ? yi < years.length - 1 || calMonth < 11 : yi < years.length - 1);
 const stepPeriod = (dir: 1 | -1) => {
  if (tab === "salary") {
   const month = stepEmployeeMonth(selectedMonth, dir);
   setSelectedMonth(month);
   setYear(month.slice(0, 4));
   return;
  }
  if (isCalMonth) {
   const ny = yi + Math.floor((calMonth + dir) / 12);
   if (ny < 0 || ny >= years.length) return;
   setCalMonth((calMonth + dir + 12) % 12);
   if (years[ny] !== year) setYear(years[ny]);
   return;
  }
  const n = yi + dir;
  if (n < 0 || n >= years.length) return;
  setYear(years[n]); setSelectedMonth(`${years[n]}-${selectedMonth.slice(5)}`);
 };

 const overMonths = months.filter((m) => employeeMonth(employee, m).effectiveUtilization > 100);
 const requestTasks = resourceRequests.filter((r) => r.status === "Fulfilled" && r.assignedTo === employee.name && r.task).map((r) => ({ task: r.task ?? "", project: r.project, period: r.periodStart ? <RequestPeriod from={r.periodStart} until={r.periodEnd ?? r.until} durationHours={r.durationHours} /> : `${monthLabel(r.from)} → ${monthLabel(r.until)}` }));
 const assignmentTasks = employee.allocations.filter((a) => a.task).map((a) => ({ task: a.task ?? "", project: a.project, period: `${monthLabel(a.from)} → ${monthLabel(a.until)}` }));
 const scheduleTasks = projects.filter((p) => employee.projects.includes(p.name)).flatMap((p) => {
   const cached = PLAN_CACHE.get(p.id) as { milestones?: ReturnType<typeof seedMilestones> } | undefined;
   const items = cached?.milestones ?? (employee.demo ? seedMilestones(p) : []);
   return items.filter((item) => item.kind === "Task" && !items.some((child) => child.parent === item.name) && item.assignee?.split(",").some((name) => name.trim() === employee.name)).map((item) => ({ task: item.name, project: p.name, period: `${formatDateWithYear(item.startDate)} → ${formatDateWithYear(item.endDate)}` }));
 });
 const workEntries: WorkEntry[] = projects.filter((p) => employee.projects.includes(p.name)).flatMap((p) => {
   const cached = PLAN_CACHE.get(p.id) as { milestones?: ReturnType<typeof seedMilestones> } | undefined;
   const items = cached?.milestones ?? (employee.demo ? seedMilestones(p) : []);
   const milestoneOf = (name?: string) => { let cur = items.find((i) => i.name === name); let top = cur; while (cur) { if (cur.kind === "Milestone") return cur.name; top = cur; cur = items.find((i) => i.name === cur?.parent); } return top?.name ?? "—"; };
   return items.filter((item) => item.kind === "Task" && item.startDate && item.endDate && !items.some((c) => c.parent === item.name) && item.assignee?.split(",").some((n) => n.trim() === employee.name)).map((item) => ({ project: p.name, milestone: item.parent ? milestoneOf(item.parent) : "—", task: item.name, from: item.startDate, until: item.endDate }));
 });
 employee.allocations.forEach((a) => { if (!workEntries.some((w) => w.project === a.project && w.from.slice(0, 4) <= a.until.slice(0, 4) && w.until.slice(0, 4) >= a.from.slice(0, 4))) { const [uy, um] = a.until.split("-").map(Number); workEntries.push({ project: a.project, milestone: "—", task: a.task ?? a.role, from: `${a.from}-01`, until: `${a.until}-${String(new Date(uy, um, 0).getDate()).padStart(2, "0")}` }); } });
 const { calendars } = useCalendars();
 const workCalendar = calendars.find((c) => c.id === (employee.calendarId ?? "cal-eg")) ?? calendars[0];
 const calendarLeave = employee.leave.map((v) => ({ from: v.from, until: v.until || v.from, label: v.type === "Partial" ? `${t.leaveAbsence} ${v.hours ?? ""}h` : t.leaveAbsence }));
 const tasks = [...scheduleTasks, ...assignmentTasks, ...requestTasks]; employee.tasks.forEach((task) => { if (!tasks.some((v) => v.task === task)) tasks.push({ task, project: "—", period: "—" }); });
 const uniqueTasks = tasks.filter((v, i) => tasks.findIndex((a) => a.task === v.task && a.project === v.project) === i);
 const taskProjects = Array.from(new Set(uniqueTasks.map((v) => v.project).filter((v) => v !== "—"))).sort();
 const visibleTasks = uniqueTasks.filter((v) => (taskProject === t.allProjects || v.project === taskProject) && v.task.toLowerCase().includes(taskQuery.trim().toLowerCase()));
 const profile: [string, string, typeof Phone][] = [[t.phone, employee.phone || "—", Phone], [t.email, employee.email, Mail], [t.nationalId, employee.nationalId || "—", IdCard], [t.birth, employee.birthDate ? formatDateWithYear(employee.birthDate) : "—", CalendarDays], [t.joined, formatDateWithYear(employee.joinedOn), CalendarDays], [t.id, employee.employeeNumber || employee.id, IdCard], [t.role, employee.role, Briefcase], [t.department, employee.dept, Building2], [t.type, employmentTypes.find((v) => v.id === employee.employmentTypeId)?.name ?? "—", Briefcase], ["Work calendar", workCalendar?.name ?? "—", CalendarDays]];
 const hasEmployeeInfo = profile.some(([, value]) => value.trim() !== "" && value !== "—");
 const hasSalaryData = months.some((m) => employeeMonth(employee, m).salary > 0);
 const hasCapacityData = months.some((m) => employeeMonth(employee, m).capacity > 0);
 const leaveRecords = employee.leave.filter((l) => l.from.startsWith(year));
 const allocationMonth = `${year}-${String(calMonth + 1).padStart(2, "0")}`;
 const allocationStart = calView === "yearly" ? `${year}-01-01` : `${allocationMonth}-01`;
 const allocationEnd = calView === "yearly" ? `${year}-12-31` : `${allocationMonth}-31`;
 const owns = (v: string) => { const n = v.trim().toLowerCase(); return n === employee.name.trim().toLowerCase() || n === employee.id.toLowerCase(); };
 const calendarEvents: CalendarEvent[] = [
  ...meetings.filter((m) => m.attendees.some((a) => owns(a.id) || owns(a.name))).map((m) => ({ id: `meeting-${m.id}`, kind: "meeting" as const, label: m.title, from: m.date, until: m.date, ...(m.time ? { time: m.time } : {}) })),
  ...employee.trips.map((trip) => ({ id: `trip-${trip.id}`, kind: "trip" as const, label: [trip.city, trip.country].filter(Boolean).join(", ") || trip.purpose || "Trip", from: trip.from, until: trip.until || trip.from })),
 ];
 const employeeActions = actions.filter((a) => owns(a.owner));
 const hasAllocation = [...workEntries, ...calendarEvents].some((entry) => entry.from <= allocationEnd && entry.until >= allocationStart);
 const yearTrips = employee.trips.filter((trip) => trip.from.startsWith(year) || trip.until.startsWith(year));
 return <div className="min-w-0 space-y-8">
  <div className="space-y-3">
   {back.kind === "team" ? <Link to="/portfolio/$projectId" params={{ projectId: back.projectId }} search={{ tab: "Team" }} className="inline-flex items-center text-sm text-breadcrumb-current transition-colors hover:text-breadcrumb-hover"><ChevronLeft className="mr-1 h-3 w-3 rtl:rotate-180" aria-hidden />{th.backToTeam}</Link> : <Link to="/resources" search={{ tab: "people" }} className="inline-flex items-center text-sm text-breadcrumb-current transition-colors hover:text-breadcrumb-hover"><ChevronLeft className="mr-1 h-3 w-3 rtl:rotate-180" aria-hidden />{th.backToEmployees}</Link>}
   <PageHeader
    title={th.pageTitle}
    actions={
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button size="icon" variant="outline" aria-label={th.actions} className="h-9 w-9 rounded-lg border-border"><MoreHorizontal size={16} className="rotate-90" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
       <DropdownMenuItem onClick={() => navigate({ to: "/resources/employees/new", search: { edit: employee.id } })}><Pencil size={14} className="mr-2" />{th.edit}</DropdownMenuItem>
       <DropdownMenuItem onClick={() => setToggleOpen(true)}><ToggleActive size={14} className="mr-2" />{employee.active !== false ? th.deactivate : th.activate}</DropdownMenuItem>
       <DropdownMenuItem className="text-rag-red focus:text-rag-red" onClick={() => setDeleteOpen(true)}><DeleteAction size={14} className="mr-2" />{th.del}</DropdownMenuItem>
      </DropdownMenuContent>
     </DropdownMenu>
    }
   />
   <header className="glass-card space-y-5 p-5">
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-5">
     <Avatar className="h-20 w-20 shrink-0">{employee.avatar ? <AvatarImage src={employee.avatar} alt={employee.name} /> : null}<AvatarFallback className="bg-accent-dim text-2xl font-medium text-accent">{employee.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
     <div className="min-w-0 space-y-2">
      <h1 className="break-words text-lg font-semibold text-foreground">{employee.name}{employee.shortName ? ` - (${employee.shortName})` : ""}</h1>
      <p className="text-sm text-muted-foreground">{employee.role}</p>
      <div className="flex flex-wrap items-center gap-2">
       {(employee.tags ?? []).filter((tag) => tag !== "Certified").map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
      </div>
     </div>
     <Badge variant={employee.active !== false ? "outline" : "secondary"} className={employee.active !== false ? "border-rag-green/50 bg-rag-green/10 text-rag-green" : "text-muted-foreground"}>{employee.active !== false ? th.active : th.inactive}</Badge>
    </div>
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
     {[
      { label: t.id, value: employee.employeeNumber ? `#${employee.employeeNumber}` : "—", tone: "text-accent", bar: false },
      { label: th.gender, value: employee.gender ?? "—", tone: "text-accent", bar: false },
      { label: th.age, value: employee.birthDate ? `${Math.floor((Date.now() - new Date(employee.birthDate).getTime()) / 31557600000)} ${th.years}` : "—", tone: "text-accent", bar: false },
      { label: t.monthly, value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(monthly.salary), tone: "text-accent", bar: false },
      { label: `${t.capacity} · ${monthLabel(selectedMonth)}`, value: `${monthly.availableCapacity}h / ${monthly.allocatedHours.toFixed(1)}h`, tone: utilTone, bar: false },
      { label: `${t.utilization} · ${monthLabel(selectedMonth)}`, value: `${monthly.effectiveUtilization}%`, tone: utilTone, bar: true },
      { label: t.projects, value: String(employee.projects.length), tone: "text-accent", bar: false },
      { label: t.avgUtil, value: `${avgUtil}%`, tone: avgTone, bar: false },
     ].map((card) => <div key={card.label} className="rounded-lg bg-muted/30 px-4 py-3"><dt className="text-xs text-muted-foreground">{card.label}</dt>{card.bar ? <dd className="mt-1 flex h-5 items-center gap-3"><span className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/40">{monthly.charges.map((a, j) => <span key={a.id} className={utilColors[j % utilColors.length]} style={{ width: `${a.percent / Math.max(100, monthly.utilization) * 100}%` }} />)}</span><span className={`shrink-0 text-sm font-semibold tabular-nums ${card.tone}`}>{card.value}</span></dd> : <dd className={`mt-1 truncate text-sm font-semibold tabular-nums ${card.tone}`}>{card.value}</dd>}</div>)}
    </dl>
   </header>
  </div>
  <Tabs value={tab} onValueChange={setTab} className="min-w-0 space-y-7">
   <div className="flex min-w-0 items-end justify-between gap-4 border-b border-border">
    <TabsList className="h-auto min-w-0 flex-wrap gap-x-6 gap-y-1 overflow-visible border-b-0">{([["overview", t.overview], ["salary", t.salaryTab], ["capacity", t.capacityTab], ["allocation", t.allocation], ["tasks", t.tasks], ["actions", t.actionsTab], ["trips", t.tripsTab]] as const).map(([value, label]) => value === "allocation" ? (
     <DropdownMenu key={value}>
      <DropdownMenuTrigger asChild>
       <span className="group inline-flex"><TabsTrigger value={value} onMouseDown={(e) => e.preventDefault()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.preventDefault(); }} className="shrink-0 gap-1.5 px-0">{label}<ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden /></TabsTrigger></span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
       {(["monthly", "yearly"] as const).map((v) => <DropdownMenuItem key={v} onSelect={() => { setCalView(v); setTab("allocation"); }} className={calView === v && tab === "allocation" ? "text-accent" : undefined}>{v === "monthly" ? pl.monthlyCal : pl.yearlyCal}</DropdownMenuItem>)}
      </DropdownMenuContent>
     </DropdownMenu>
    ) : <TabsTrigger key={value} value={value} className="shrink-0 px-0">{label}</TabsTrigger>)}</TabsList>
   </div>
   {showPeriod && (
    <div className="flex min-h-9 items-center justify-between gap-3">
     {tab === "allocation" ? <h2 className="text-base font-semibold">{pl.workCalendar}</h2> : tab === "trips" ? <h2 className="text-base font-semibold">{t.tripsTab}</h2> : <span aria-hidden />}
     <div className="flex items-center gap-4">
      <PeriodStepper label={periodLabel} onPrev={() => stepPeriod(-1)} onNext={() => stepPeriod(1)} prevDisabled={!canPrev} nextDisabled={!canNext} prevLabel={pl.previous} nextLabel={pl.next} picker={tab === "salary" ? { mode: "month", years, year: selectedMonth.slice(0, 4), month: Number(selectedMonth.slice(5)) - 1, onSelect: (y, m) => { setSelectedMonth(`${y}-${String(m + 1).padStart(2, "0")}`); setYear(y); } } : isCalMonth ? { mode: "month", years, year, month: calMonth, onSelect: (y, m) => { setYear(y); setCalMonth(m); } } : { mode: "year", years, year, onSelect: (y) => { setYear(y); setSelectedMonth(`${y}-${selectedMonth.slice(5)}`); } }} />
     </div>
    </div>
   )}
   <TabsContent value="overview" className="mt-0 min-w-0">
    <EmptyRegion id="employee-info">{hasEmployeeInfo ? <section className="rounded-[20px] border border-border/50 bg-card p-6 shadow-sm"><dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">{profile.map(([label, value, Ic]) => <div key={label} className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-primary"><Ic className="h-5 w-5" /></span><div className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground">{value}</dd></div></div>)}</dl></section> : <EmptyState art="people" title={te.infoT} description={te.infoD} />}</EmptyRegion>
   </TabsContent>
    <TabsContent value="allocation" className="mt-0">
     <EmptyRegion id="employee-allocation">{hasAllocation ? <EmployeeWorkCalendar workingDays={workCalendar?.workingDays} holidays={workCalendar?.holidays} events={calendarEvents} entries={workEntries} leave={calendarLeave} allocations={employee.allocations} year={year} view={calView} month={calMonth} monthStats={(m) => employeeMonth(employee, m)} /> : <EmptyState art="calendar" title={te.allocationT} description={te.allocationD} />}</EmptyRegion>
    </TabsContent>
   <TabsContent value="tasks" className="mt-0 space-y-5">
    <PageToolbar query={taskQuery} onQueryChange={setTaskQuery} placeholder={t.searchTasks} filterGroups={[{ key: "project", label: t.project, value: taskProject, onChange: setTaskProject, options: [{ value: t.allProjects, label: t.allProjects }, ...taskProjects.map((p) => ({ value: p, label: p }))] }]} />
    <EmptyRegion id="employee-tasks">{visibleTasks.length
     ? <DataTable headers={[t.task, t.project, t.date]} rows={visibleTasks.map((v) => [v.task, projectLink(v.project), v.period])} />
     : uniqueTasks.length ? <EmptyState art="search" title={t.noTasks} description={te.taskSearchD} /> : <EmptyState art="note" title={te.tasksT} description={te.tasksD} />}</EmptyRegion>
   </TabsContent>
   <TabsContent value="salary" className="mt-0 space-y-6">
    <EmptyRegion id="employee-salary">{hasSalaryData ? <>
     {mounted && monthly.salary > 0 && (<div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"><div className="rounded-[20px] border border-border/50 bg-card p-6 shadow-sm"><h3 className="mb-4 text-xs font-medium text-muted-foreground">{t.salarySplit}</h3><div className="grid items-center gap-6 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)]"><div className="relative mx-auto h-[220px] w-[220px] ">
         <PieChart width={220} height={220}>
          <Pie data={[...monthly.charges.map((a, i) => ({ name: a.project, value: a.amount, color: donutColors[i % donutColors.length] })), ...(monthly.overhead > 0 ? [{ name: t.overhead, value: monthly.overhead, color: donutOverheadColor }] : [])]} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={3} stroke="none" isAnimationActive={false}>
           {[...monthly.charges.map((a, i) => ({ color: donutColors[i % donutColors.length] })), ...(monthly.overhead > 0 ? [{ color: donutOverheadColor }] : [])].map((x, i) => <Cell key={i} fill={x.color} />)}
          </Pie>
         </PieChart>
         <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-muted-foreground">{t.total}</span><span className="text-lg font-semibold tabular-nums text-foreground">{money(monthly.salary)}</span></div>
        </div>
        <ul className="min-w-0 text-sm">{monthly.charges.map((a, i) => <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 py-2.5 last:border-b-0"><div className="flex min-w-0 items-center gap-2.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: donutColors[i % donutColors.length] }} /><span className="truncate text-foreground">{a.project}</span></div><span className="num-mono text-muted-foreground">{money(a.amount)}</span></li>)}{monthly.overhead > 0 && <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5"><div className="flex min-w-0 items-center gap-2.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: donutOverheadColor }} /><span className="truncate text-muted-foreground">{t.overhead}</span></div><span className="num-mono text-muted-foreground">{money(monthly.overhead)}</span></li>}</ul></div></div><div className="rounded-[20px] border border-border/50 bg-card p-6 shadow-sm"><h3 className="mb-4 text-xs font-medium text-muted-foreground">{t.monthSummary} · {monthLabel(selectedMonth)}</h3><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-border/50 bg-muted/20 p-4"><div className="text-xs text-muted-foreground">{t.total}</div><div className="mt-2 text-xl font-semibold tabular-nums text-foreground">{money(monthly.salary)}</div></div><div className="rounded-xl border border-border/50 bg-muted/20 p-4"><div className="text-xs text-muted-foreground">{t.projectCost}</div><div className="mt-2 text-xl font-semibold tabular-nums text-foreground">{money(monthly.projectCost)}</div><div className="mt-1 text-xs text-muted-foreground">{monthly.salary ? Math.round((monthly.projectCost / monthly.salary) * 100) : 0}%</div></div><div className="rounded-xl border border-border/50 bg-muted/20 p-4"><div className="text-xs text-muted-foreground">{t.overhead}</div><div className="mt-2 text-xl font-semibold tabular-nums text-foreground">{money(monthly.overhead)}</div><div className="mt-1 text-xs text-muted-foreground">{monthly.salary ? Math.round((monthly.overhead / monthly.salary) * 100) : 0}%</div></div><div className="rounded-xl border border-border/50 bg-muted/20 p-4"><div className="text-xs text-muted-foreground">{t.utilization}</div><div className="mt-2 text-xl font-semibold tabular-nums text-foreground"><span className={monthly.effectiveUtilization > 100 ? "text-rag-red" : undefined}>{monthly.effectiveUtilization}%</span></div></div></div></div></div>)}
    <div className="flex items-center justify-end gap-3"><Button size="sm" variant="primary" onClick={() => setPlanField("salary")}><Plus className="mr-1 h-4 w-4" />{t.setPlan}</Button></div>
    <DataTable
     headers={[t.month, t.monthly, t.projectCost, t.overhead, ""]}
     onRowClick={(i) => { const m = months[i]; setSelectedMonth(m); setSalaryMonth(m); }}
     rows={months.map((m) => { const values = employeeMonth(employee, m); return [
      <span className={m === selectedMonth ? "font-medium text-accent" : undefined}>{monthLabel(m)}</span>,
      money(values.salary),
      values.noCapacityWithHours ? <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild><span tabIndex={0} className="cursor-help font-medium text-destructive">{money(values.projectCost)}</span></TooltipTrigger><TooltipContent>{t.noCapacityTip}</TooltipContent></Tooltip></TooltipProvider> : money(values.projectCost),
      money(values.overhead),
      <EditMonthButton label={t.editSalary} onClick={() => setEditMonth({ month: m, field: "salary" })} />,
     ]; })}
    />
    </> : <EmptyState art="coins" title={te.salaryT} description={te.salaryD} ctaLabel={t.setPlan} onCta={() => setPlanField("salary")} />}</EmptyRegion>
   </TabsContent>
   <TabsContent value="capacity" className="mt-0 space-y-8">
    <Tabs value={capacityView} onValueChange={setCapacityView} className="space-y-6">
     <TabsList className="grid h-11 w-full grid-cols-2 gap-0 rounded-lg border border-border bg-[var(--field-bg-filled)] p-1">
      <TabsTrigger value="capacity" className="h-9 rounded-md border border-transparent bg-transparent px-4 text-xs text-muted-foreground data-[state=active]:border-accent/50 data-[state=active]:bg-accent/10 data-[state=active]:text-accent">{t.capacityTab}</TabsTrigger>
      <TabsTrigger value="leave" className="h-9 rounded-md border border-transparent bg-transparent px-4 text-xs text-muted-foreground data-[state=active]:border-accent/50 data-[state=active]:bg-accent/10 data-[state=active]:text-accent">{t.leaveRecords}</TabsTrigger>
     </TabsList>
     <TabsContent value="capacity" className="mt-0">
      <section className="min-w-0 space-y-5">
       <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">{t.capacityTab}</h2>{!emptyPreview && hasCapacityData && <Button size="sm" variant="primary" onClick={() => setPlanField("capacity")}><Plus className="mr-1 h-4 w-4" />{t.setCapacity}</Button>}</div>
       <EmptyRegion id="employee-capacity">{hasCapacityData ? <DataTable
        headers={[t.month, t.capacity, t.available, t.assignedHours, t.utilization, ""]}
        onRowClick={(i) => setSelectedMonth(months[i])}
        rows={months.map((m) => { const v = employeeMonth(employee, m); return [
         <span className={m === selectedMonth ? "font-medium text-accent" : undefined}>{monthLabel(m)}</span>,
         <span className="num-mono">{v.capacity}h</span>,
         <span className="num-mono">{v.availableCapacity}h</span>,
         <span className="num-mono">{v.allocatedHours.toFixed(1)}h</span>,
         <span className={`num-mono font-medium ${v.effectiveUtilization > 100 ? "text-rag-red" : "text-foreground"}`}>{v.effectiveUtilization}%</span>,
         <EditMonthButton label={t.editCapacity} onClick={() => setEditMonth({ month: m, field: "capacity" })} />,
        ]; })}
       /> : <EmptyState art="charts" title={te.capacityT} description={te.capacityD} ctaLabel={t.setCapacity} onCta={() => setPlanField("capacity")} />}</EmptyRegion>
      </section>
     </TabsContent>
     <TabsContent value="leave" className="mt-0">
      <section className="min-w-0">
       <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-base font-semibold">{t.leaveRecords}</h2>{!emptyPreview && leaveRecords.length > 0 && <Button size="sm" variant="outline" onClick={() => setLeaveOpen(true)}><Plus className="mr-1 h-4 w-4" />{t.addEntry}</Button>}</div>
       <EmptyRegion id="employee-leave">{leaveRecords.length ? <DataTable
        headers={[t.leaveType, t.from, t.until, t.days, t.remark, ""]}
        rows={leaveRecords.map((l) => [
         l.hours != null ? t.partialOption : t.leaveOption,
         formatDateWithYear(l.from),
         formatDateWithYear(l.until),
         l.hours != null ? `${l.hours}h` : l.days,
         <span className="text-muted-foreground">{l.remark || "—"}</span>,
         <Button size="icon" variant="dangerOutline" data-ds-size="auto" aria-label={t.deleteLeaveT} title={t.deleteLeaveT} className="h-9 w-9 rounded-full" onClick={() => setLeaveDelete(l)}><Trash2 className="h-4 w-4" /></Button>,
        ])}
       /> : <EmptyState art="calendar" title={te.leaveT} description={te.leaveD} ctaLabel={t.addEntry} onCta={() => setLeaveOpen(true)} />}</EmptyRegion>
      </section>
     </TabsContent>
    </Tabs>
   </TabsContent>
   <TabsContent value="actions" className="mt-0 min-w-0">
    <EmptyRegion id="employee-actions">{employeeActions.length ? <DataTable
     headers={["ID", t.title, t.project, t.dueDate, t.status]}
     rows={employeeActions.map((a) => [<span className="num-mono">{a.id}</span>, a.title, projectLink(a.project), a.dueDate ? formatDateWithYear(a.dueDate) : "—", <Badge variant="outline" className="rounded-full">{a.status}</Badge>])}
    /> : <EmptyState art="calendar" title={t.actionsEmptyT} description={t.actionsEmptyD} />}</EmptyRegion>
   </TabsContent>
   <TabsContent value="trips" className="mt-0 min-w-0">
    <EmptyRegion id="employee-trips">{yearTrips.length ? <DataTable
     headers={[t.project, t.destination, t.travelDates, t.tripWork, t.tickets, t.visa, t.perDiem, t.tripTotal]}
     rows={yearTrips.map((trip) => [
      trip.project ? projectLink(trip.project) : "—",
      <span className="flex flex-col"><span className="font-medium text-foreground">{trip.city}</span><span className="text-xs text-muted-foreground">{trip.country}</span></span>,
      <span className="flex flex-col whitespace-nowrap"><span>{formatDateWithYear(trip.from)}</span><span>{formatDateWithYear(trip.until)}</span></span>,
      <span className="flex flex-col whitespace-nowrap"><span>{formatDateWithYear(trip.workFrom)}</span><span>{formatDateWithYear(trip.workUntil)}</span></span>,
      <span className="num-mono">{dollars(trip.ticketsCost)}</span>,
      <span className="num-mono">{dollars(trip.visaCost)}</span>,
      <span className="num-mono">{dollars(trip.perDiemCost)}</span>,
      <span className="num-mono font-medium">{dollars(trip.ticketsCost + trip.visaCost + trip.perDiemCost)}</span>
     ])}
    /> : <EmptyState art="map" title={te.tripsT} description={te.tripsD} />}</EmptyRegion>
   </TabsContent>
  </Tabs>
  <Dialog open={!!salaryMonth} onOpenChange={(open) => { if (!open) setSalaryMonth(null); }}>
   <DialogContent className="max-w-md">
    <DialogHeader><DialogTitle>{t.charges} · {monthLabel(salaryMonth ?? selectedMonth)}</DialogTitle></DialogHeader>
    <DataTable headers={[t.project, t.allocation, t.cost]} rows={[...monthly.charges.map((a) => [projectLink(a.project), `${a.percent}%`, money(a.amount)]), [t.overhead, "—", money(monthly.overhead)], [t.total, "—", money(monthly.salary)]]} />
   </DialogContent>
  </Dialog>
  <MonthlyPlanDialog employee={employee} field={planField} onClose={() => setPlanField(null)} defaultStart={selectedMonth} onApply={requestMonthlyPlan} />
  <ConfirmDialog
   open={!!capacityOverwrite}
   onOpenChange={(open) => { if (!open) setCapacityOverwrite(null); }}
   tone="warning"
   title={tc.overwriteCapacityT}
   description={tc.overwriteCapacityD}
   cancelLabel={t.cancel}
   confirmLabel={tc.overwrite}
   onConfirm={() => {
    if (capacityOverwrite) applyMonthlyPlan("capacity", capacityOverwrite.start, capacityOverwrite.count, capacityOverwrite.value, capacityOverwrite.workingDays);
    setCapacityOverwrite(null);
   }}
  >
   {capacityOverwrite ? <div className="rounded-lg border border-border bg-card p-3 text-sm">
    <p className="text-xs font-medium text-muted-foreground">{tc.affectedMonths}</p>
    <p className="mt-2 leading-relaxed text-foreground">{capacityOverwrite.months.map(monthLabel).join(" · ")}</p>
   </div> : null}
  </ConfirmDialog>
  <MonthEditDialog employee={employee} edit={editMonth} onClose={() => setEditMonth(null)} onSave={(m, field, value) => { setMonthOverride(employee.id, m, { [field]: value }); setEditMonth(null); toast.success(t.monthUpdated, { description: monthLabel(m) }); }} />
  <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} onAdd={(leave) => { addLeave(employee.id, leave); setLeaveOpen(false); toast.success(t.leaveAdded, { description: leave.type === "Partial" ? t.partialOption : t.leaveOption }); }} />
  <ConfirmDialog
   open={toggleOpen}
   onOpenChange={setToggleOpen}
   tone={employee.active !== false ? "warning" : "success"}
   icon={({ className }) => <ToggleActive className={cn(className, employee.active !== false ? "" : "-scale-x-100")} />}
   title={`${employee.active !== false ? th.deactivate : th.activate} "${employee.name}"?`}
   description={th.sureToggle}
   cancelLabel={t.cancel}
   confirmLabel={employee.active !== false ? th.deactivate : th.activate}
   onConfirm={() => { updateEmployee(employee.id, { active: employee.active === false }); toast.done("Employee", employee.active !== false ? "deactivated" : "activated"); setToggleOpen(false); }}
  />
  <ConfirmDeleteDialog
   label={deleteOpen ? employee.name : undefined}
   description="This employee will be removed from the resources pool."
   onCancel={() => setDeleteOpen(false)}
   onConfirm={() => { setEmployees((prev) => prev.filter((x) => x.id !== employee.id)); toast.done("Employee", "deleted"); setDeleteOpen(false); navigate({ to: "/resources", search: { tab: "people" } }); }}
  />
  <ConfirmDialog
   open={!!leaveDelete}
   onOpenChange={(o) => { if (!o) setLeaveDelete(null); }}
   tone="danger"
   title={t.deleteLeaveT}
   description={t.deleteLeaveD}
   cancelLabel={t.cancel}
   confirmLabel={th.del}
   onConfirm={() => { if (leaveDelete) { removeLeave(employee.id, leaveDelete.id); toast.success(t.leaveRemoved); } setLeaveDelete(null); }}
  >
   {leaveDelete ? <ul className="space-y-1 rounded-lg border border-border bg-card p-3 text-sm">
    <li className="text-foreground">{leaveDelete.hours != null ? t.partialOption : t.leaveOption}</li>
    <li className="text-muted-foreground">{t.from} {formatDateWithYear(leaveDelete.from)} · {t.until} {formatDateWithYear(leaveDelete.until)}</li>
    <li className="text-muted-foreground">{leaveDelete.hours != null ? `${t.leaveHours}: ${leaveDelete.hours}h` : `${t.days}: ${leaveDelete.days}`}</li>
   </ul> : null}
  </ConfirmDialog>
 </div>;
}

type PlanField = "salary" | "capacity";
type MonthValues = ReturnType<typeof employeeMonth>;

function EditMonthButton({ label, onClick }: { label: string; onClick: () => void }) {
 return <Button size="icon" variant="secondary" data-ds-size="auto" aria-label={label} title={label} className="h-9 w-9 rounded-full border border-border/60 text-accent" onClick={(e) => { e.stopPropagation(); onClick(); }}><Pencil className="h-4 w-4" /></Button>;
}

/** One month of the year: utilization, assigned vs available hours, leave, and the projects behind it. */
function MonthCard({ month, values: v, selected, colorIndexOf, onSelect }: { month: string; values: MonthValues; selected: boolean; colorIndexOf: (project: string) => number; onSelect: () => void }) {
 const over = v.effectiveUtilization > 100;
 return <li>
  <button type="button" onClick={onSelect} aria-pressed={selected} className={`flex h-full w-full flex-col gap-3 rounded-xl border bg-card p-4 text-start transition-colors hover:border-accent/50 ${selected ? "border-accent" : over ? "border-rag-red/40" : "border-border"}`}>
   <div className="flex items-baseline justify-between gap-2">
    <span className={`text-sm font-semibold ${selected ? "text-accent" : "text-foreground"}`}>{new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "long" })}</span>
    <span className={`num-mono text-lg font-semibold ${over ? "text-rag-red" : "text-foreground"}`}>{v.effectiveUtilization}%</span>
   </div>
   <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted/40" aria-hidden="true">
    {v.allocations.map((a) => <div key={a.id} className={utilColors[colorIndexOf(a.project) % utilColors.length]} style={{ width: `${Math.min(100, a.percent / Math.max(100, v.utilization) * 100)}%` }} />)}
   </div>
   <div className="flex items-center justify-between text-xs text-muted-foreground">
    <span className="num-mono">{v.allocatedHours.toFixed(1)}h / {v.availableCapacity}h</span>
    {v.absentDays > 0 && <span>{v.absentDays}d {t.absence.toLowerCase()}</span>}
   </div>
   <ul className="space-y-1 border-t border-border/60 pt-3 text-xs">
    {v.allocations.length ? v.allocations.map((a) => <li key={a.id} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${utilColors[colorIndexOf(a.project) % utilColors.length]}`} /><span className="truncate text-foreground">{a.project}</span></span><span className="num-mono shrink-0 text-muted-foreground">{a.percent}%</span></li>) : <li className="text-muted-foreground">—</li>}
   </ul>
  </button>
 </li>;
}

/** Bulk plan: apply one salary or capacity value to a run of months (e.g. 9000 for the next 12 months). */
function MonthlyPlanDialog({ employee, field, onClose, defaultStart, onApply }: { employee: Employee; field: PlanField | null; onClose: () => void; defaultStart: string; onApply: (field: PlanField, start: string, months: number, value: number, workingDays?: number) => void }) {
 const [start, setStart] = useState(defaultStart); const [count, setCount] = useState("12"); const [value, setValue] = useState(""); const [days, setDays] = useState("20");
 const [errors, setErrors] = useState<{ start?: string; value?: string; days?: string }>({});
 const isSalary = field === "salary";
 useEffect(() => { if (field) { setStart(defaultStart); setCount("12"); setDays("20"); setValue(String((field === "salary" ? employee.salary : employee.capacity) || "")); setErrors({}); } }, [field, defaultStart, employee.salary, employee.capacity]);
 function submit() {
  if (!field) return;
  const n = Number(value);
  const next = { start: start ? undefined : "Start month is required.", value: value === "" ? (isSalary ? "Salary is required." : "Capacity is required.") : isSalary ? (n >= 0 ? undefined : "Salary can't be negative.") : (n > 0 ? undefined : "Capacity must be more than 0."), days: isSalary ? undefined : (Number(days) >= 1 && Number(days) <= 31 ? undefined : t.workingDaysError) };
  setErrors(next);
  if (Object.values(next).some(Boolean)) return;
  onApply(field, start, Math.max(1, Number(count) || 12), n, isSalary ? undefined : Number(days));
 }
 return <Dialog open={!!field} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-md">
   <DialogHeader><DialogTitle>{isSalary ? t.setPlan : t.setCapacity}</DialogTitle></DialogHeader>
   <div className="grid grid-cols-2 gap-3">
    <Field label={t.startMonth} htmlFor="plan-start" required error={errors.start}><Input id="plan-start" type="month" value={start} onChange={(e) => { setStart(e.target.value); setErrors((p) => ({ ...p, start: undefined })); }} /></Field>
    <Field label={t.planMonths} htmlFor="plan-count"><Input id="plan-count" type="number" min={1} max={60} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
    <div className="col-span-2"><Field label={isSalary ? t.salaryValue : t.capacityValue} htmlFor="plan-value" required error={errors.value}><Input id="plan-value" type="number" min={isSalary ? 0 : 1} placeholder={isSalary ? "e.g. 9000" : "e.g. 160"} value={value} onChange={(e) => { setValue(e.target.value); setErrors((p) => ({ ...p, value: undefined })); }} /></Field></div>
    {!isSalary && <div className="col-span-2"><Field label={t.workingDays} htmlFor="plan-days" required error={errors.days}><Input id="plan-days" type="number" min={1} max={31} value={days} onChange={(e) => { setDays(e.target.value); setErrors((p) => ({ ...p, days: undefined })); }} /></Field></div>}
   </div>
   {start && <p className="text-xs text-muted-foreground">{monthLabel(start)} → {monthLabel(monthRange(start, Math.max(1, Number(count) || 12)).slice(-1)[0])}</p>}
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.apply}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}

/** Single-month override of salary or capacity, e.g. a raise in one or two months. */
function MonthEditDialog({ employee, edit, onClose, onSave }: { employee: Employee; edit: { month: string; field: PlanField } | null; onClose: () => void; onSave: (month: string, field: PlanField, value: number) => void }) {
 const [value, setValue] = useState("");
 useEffect(() => { if (edit) { const v = employeeMonth(employee, edit.month); setValue(String(edit.field === "salary" ? v.salary : v.capacity)); } }, [edit]);
 const isSalary = edit?.field === "salary";
 return <Dialog open={!!edit} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-sm">
   <DialogHeader><DialogTitle>{isSalary ? t.editSalary : t.editCapacity} · {edit ? monthLabel(edit.month) : ""}</DialogTitle></DialogHeader>
   <Field label={isSalary ? t.salaryValue : t.capacityValue} htmlFor="month-value" required><Input id="month-value" type="number" min={isSalary ? 0 : 1} value={value} onChange={(e) => setValue(e.target.value)} /></Field>
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={() => edit && onSave(edit.month, edit.field, isSalary ? Number(value) || 0 : Number(value) || employee.capacity)}>{t.save}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}

type TripErrors = Partial<Record<"country" | "city" | "from" | "until" | "workFrom" | "workUntil", string>>;

function TripDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (trip: Omit<EmployeeTrip, "id">) => void }) {
 const empty = { country: "", city: "", from: "", until: "", workFrom: "", workUntil: "", ticketsCost: "", visaCost: "", perDiemCost: "" };
 const [form, setForm] = useState(empty);
 const [errors, setErrors] = useState<TripErrors>({});
 useEffect(() => { if (open) { setForm(empty); setErrors({}); } }, [open]);
 const set = (k: keyof typeof empty, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
 function submit() {
  const f = form;
  const next: TripErrors = {
   country: f.country.trim() ? undefined : "Country is required.",
   city: f.city.trim() ? undefined : "City is required.",
   from: f.from ? undefined : "Travel start date is required.",
   until: !f.until ? "Travel end date is required." : f.from && f.until < f.from ? "Must be on or after the travel start date." : undefined,
   workFrom: !f.workFrom ? "Work start date is required." : f.from && f.workFrom < f.from ? "Must be within the travel dates." : undefined,
   workUntil: !f.workUntil ? "Work end date is required." : f.workFrom && f.workUntil < f.workFrom ? "Must be on or after the work start date." : f.until && f.workUntil > f.until ? "Must be within the travel dates." : undefined,
  };
  setErrors(next);
  if (Object.values(next).some(Boolean)) return;
  onAdd({ country: f.country.trim(), city: f.city.trim(), from: f.from, until: f.until, workFrom: f.workFrom, workUntil: f.workUntil, days: daysBetween(f.from, f.until), ticketsCost: Number(f.ticketsCost) || 0, visaCost: Number(f.visaCost) || 0, perDiemCost: Number(f.perDiemCost) || 0 });
 }
 const date = (k: "from" | "until" | "workFrom" | "workUntil", label: string) => <Field label={label} htmlFor={`trip-${k}`} required error={errors[k]}><Input id={`trip-${k}`} type="date" value={form[k]} onChange={(e) => set(k, e.target.value)} /></Field>;
 const cost = (k: "ticketsCost" | "visaCost" | "perDiemCost", label: string) => <Field label={`${label} (USD)`} htmlFor={`trip-${k}`}><Input id={`trip-${k}`} type="number" min={0} placeholder="0" value={form[k]} onChange={(e) => set(k, e.target.value)} /></Field>;
 return <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-lg">
   <DialogHeader><DialogTitle>{t.addTrip}</DialogTitle></DialogHeader>
   <div className="grid grid-cols-2 gap-3">
    <Field label={t.country} htmlFor="trip-country" required error={errors.country}><Input id="trip-country" placeholder="e.g. Saudi Arabia" value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
    <Field label={t.city} htmlFor="trip-city" required error={errors.city}><Input id="trip-city" placeholder="e.g. Riyadh" value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
    {date("from", t.travelStart)}{date("until", t.travelEnd)}
    {date("workFrom", t.workStart)}{date("workUntil", t.workEnd)}
   </div>
   <div className="grid grid-cols-3 gap-3">{cost("ticketsCost", t.tickets)}{cost("visaCost", t.visa)}{cost("perDiemCost", t.perDiem)}</div>
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.save}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}

function LeaveDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (leave: Omit<EmployeeLeave, "id">) => void }) {
 const [type, setType] = useState<EmployeeLeave["type"]>("Leave"); const [from, setFrom] = useState(""); const [until, setUntil] = useState(""); const [hours, setHours] = useState("4"); const [remark, setRemark] = useState("");
 const [errors, setErrors] = useState<{ from?: string; until?: string; hours?: string }>({});
 useEffect(() => { if (open) { setType("Leave"); setFrom(""); setUntil(""); setHours("4"); setRemark(""); setErrors({}); } }, [open]);
 const partial = type === "Partial";
 function submit() {
  const note = remark.trim() || undefined;
  if (partial) {
   const h = Number(hours);
   const next = { from: from ? undefined : "Date is required.", hours: h > 0 && h < 8 ? undefined : "Hours must be between 1 and 7." };
   setErrors(next);
   if (Object.values(next).some(Boolean)) return;
   onAdd({ type, from, until: from, days: Math.round(h / 8 * 100) / 100, hours: h, remark: note });
   return;
  }
  const next = { from: from ? undefined : "Start date is required.", until: !until ? "End date is required." : from && until < from ? "End date must be on or after start date." : undefined };
  setErrors(next);
  if (Object.values(next).some(Boolean)) return;
  onAdd({ type, from, until, days: daysBetween(from, until), remark: note });
 }
 return <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
  <DialogContent className="max-w-md">
   <DialogHeader><DialogTitle>{t.addEntry} · {t.leaveRecords}</DialogTitle></DialogHeader>
   <div className="grid gap-3">
    <Field label={t.leaveType} htmlFor="leave-type" required><Select value={type} onValueChange={(v) => setType(v as EmployeeLeave["type"])}><SelectTrigger id="leave-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Leave">{t.leaveOption}</SelectItem><SelectItem value="Partial">{t.partialOption}</SelectItem></SelectContent></Select></Field>
    {partial ? <div className="grid grid-cols-2 gap-2">
     <Field label={t.leaveDate} htmlFor="leave-from" required error={errors.from}><Input id="leave-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setErrors((p) => ({ ...p, from: undefined })); }} /></Field>
     <Field label={t.leaveHours} htmlFor="leave-hours" required error={errors.hours}><Select value={hours} onValueChange={(v) => { setHours(v); setErrors((p) => ({ ...p, hours: undefined })); }}><SelectTrigger id="leave-hours"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 7].map((h) => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}</SelectContent></Select></Field>
    </div> : <div className="grid grid-cols-2 gap-2">
     <Field label={t.from} htmlFor="leave-from" required error={errors.from}><Input id="leave-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setErrors((p) => ({ ...p, from: undefined })); }} /></Field>
     <Field label={t.until} htmlFor="leave-until" required error={errors.until}><Input id="leave-until" type="date" value={until} onChange={(e) => { setUntil(e.target.value); setErrors((p) => ({ ...p, until: undefined })); }} /></Field>
    </div>}
    <Field label={t.remark} htmlFor="leave-remark"><Textarea id="leave-remark" rows={3} placeholder={t.remarkHint} value={remark} onChange={(e) => setRemark(e.target.value)} /></Field>
   </div>
   <DialogFooter><Button variant="outline" onClick={onClose}>{t.cancel}</Button><Button variant="primary" onClick={submit}>{t.save}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}
