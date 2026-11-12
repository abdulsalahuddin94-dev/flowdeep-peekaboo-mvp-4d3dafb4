import { useSyncExternalStore } from "react";
import { resources, projects } from "@/lib/mock-data";

export type EmploymentType = { id: string; name: string; description?: string; active: boolean };
export type EmployeeAllocation = { id: string; project: string; role: string; percent: number; from: string; until: string; task?: string };
/** "Leave" spans whole days (from–until); "Partial" is a few hours on one day (`hours`). */
export type EmployeeLeave = { id: string; type: "Leave" | "Partial"; from: string; until: string; days: number; hours?: number; remark?: string };
/** `from`/`until` are the travel dates; `workFrom`/`workUntil` the days worked on site. Costs in USD. */
export type EmployeeTrip = { id: string; country: string; city: string; from: string; until: string; workFrom: string; workUntil: string; days: number; ticketsCost: number; visaCost: number; perDiemCost: number; /** Trips are planned from a project; the employee profile shows them read-only. */ project?: string; milestone?: string; purpose?: string; groupId?: string };
/** Per-month overrides keyed by "YYYY-MM"; months without an entry fall back to the employee's base salary/capacity. */
export type EmployeeMonthPlan = { salary?: number; capacity?: number };
export type Employee = { id: string; name: string; role: string; /** Junior / Mid / Senior / Lead — the same levels resource requests use. */ seniority?: string; dept: string; email: string; salary: number; capacity: number; util: number; employmentTypeId: string; joinedOn: string; projects: string[]; tasks: string[]; allocations: EmployeeAllocation[]; leave: EmployeeLeave[]; trips: EmployeeTrip[]; monthly: Record<string, EmployeeMonthPlan>; vacationEntitlement: number; demo: boolean; shortName?: string; employeeNumber?: string; nationalId?: string; phone?: string; birthDate?: string; gender?: string; tags?: string[]; avatar?: string; /** Missing means active (legacy rows predate status). */ active?: boolean };

/** Default monthly capacity in hours when nothing is set (≈ 40h/week). */
export const DEFAULT_MONTHLY_CAPACITY = 160;

/** Seniority levels, kept identical to the ones on resource requests. */
export const SENIORITY_LEVELS = ["Junior", "Mid", "Senior", "Lead"] as const;

/** Demo allocations follow fulfilled resource requests: Full time = 100%, Part time = 50%, dated by the task/team period.
 *  [project id or name, percent, from, until, task?] */
type SeedAlloc = [string, 100 | 50, string, string, string?];
const seedAllocs: SeedAlloc[][] = [
  [["p-001", 100, "2025-04", "2026-12", "Solution Design"], ["p-003", 50, "2027-01", "2027-06", "Integration Blueprint"]],
  [["p-002", 50, "2026-01", "2026-12", "Site Mobilisation"], ["p-001", 50, "2025-04", "2026-12"], ["p-016", 50, "2026-10", "2027-03"]],
  [["p-010", 50, "2026-02", "2026-12"], ["p-010", 50, "2026-08", "2026-08", "Penetration Testing"], ["p-001", 50, "2025-06", "2026-12"]],
  [["p-008", 50, "2026-01", "2026-12", "Field Survey"], ["p-012", 50, "2026-05", "2026-10", "Commissioning"], ["p-001", 50, "2025-06", "2026-12"]],
  [["p-009", 100, "2026-01", "2026-12", "Model Training"], ["p-005", 50, "2026-06", "2026-11"], ["p-001", 50, "2025-09", "2026-12"]],
  [["p-015", 50, "2026-01", "2026-12", "Budget Review"], ["p-001", 50, "2025-06", "2026-06"]],
  [["p-014", 100, "2026-04", "2027-03", "Vendor Evaluation"], ["p-001", 50, "2025-04", "2026-12"]],
  [["p-021", 50, "2026-03", "2026-12", "Source Mapping"], ["p-001", 50, "2025-09", "2026-12"]],
  [["p-001", 100, "2025-07", "2026-12", "System Testing"]],
  [["p-001", 100, "2025-05", "2026-12", "Data Migration"]],
  [["p-001", 50, "2025-08", "2026-12"]],
  [["p-001", 100, "2025-06", "2026-12", "Interfaces Build"]],
];
const salaries = [14500, 12800, 13200, 9800, 13900, 8700, 9200, 11000, 9500, 11800, 10400, 12200];
const types: EmploymentType[] = [
  { id: "ET-1", name: "In source", description: "Full-time employees hired directly on the company payroll.", active: true },
  { id: "ET-2", name: "Out source", description: "Contracted staff supplied by an external staffing partner.", active: true },
  { id: "ET-3", name: "Offshore", description: "Team members working remotely from an offshore delivery center.", active: true },
];

/** Demo monthly plans: a mid-year raise and a part-time month so per-month values are visible. */
function seedMonthly(i: number, base: number): Record<string, EmployeeMonthPlan> {
  const plan: Record<string, EmployeeMonthPlan> = {};
  const raised = Math.round(base * 1.08);
  for (let m = 7; m <= 12; m++) plan[`2026-${String(m).padStart(2, "0")}`] = { salary: raised };
  if (i % 3 === 0) plan["2026-08"] = { ...plan["2026-08"], capacity: 80 };
  return plan;
}

function seedTrips(i: number, project?: string): EmployeeTrip[] {
  return [
    { id: `trip-${i}-1`, country: "Saudi Arabia", city: "Riyadh", from: "2026-05-10", until: "2026-05-15", workFrom: "2026-05-11", workUntil: "2026-05-14", days: 6, ticketsCost: 1200, visaCost: 150, perDiemCost: 1600, project, purpose: "Client requirements workshop", groupId: "seed-trip-riyadh" },
    { id: `trip-${i}-2`, country: "United Arab Emirates", city: "Dubai", from: "2026-11-01", until: "2026-11-07", workFrom: "2026-11-02", workUntil: "2026-11-06", days: 7, ticketsCost: 900, visaCost: 0, perDiemCost: 2000, project, purpose: "On-site go-live support", groupId: "seed-trip-dubai" },
  ];
}

const initialEmployees: Employee[] = resources.map((r, i) => {
  const allocations: EmployeeAllocation[] = (seedAllocs[i] ?? []).map(([ref, percent, from, until, task], j) => ({ id: `seed-${i}-${j}`, project: projects.find((p) => p.id === ref)?.name ?? ref, role: r.role, percent, from, until, task }));
  const names = Array.from(new Set(allocations.map((a) => a.project)));
  const base = salaries[i] ?? 10000;
  return { ...r, id: `EMP-${String(i + 1).padStart(3, "0")}`, projects: names, email: `${r.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".")}@company.com`, salary: base, capacity: DEFAULT_MONTHLY_CAPACITY, employmentTypeId: types[i % 3]?.id ?? "ET-1", joinedOn: `${2019 + i % 6}-${String((i * 4) % 12 + 1).padStart(2, "0")}-${String((i * 9) % 27 + 1).padStart(2, "0")}`, tasks: allocations.flatMap((a) => a.task ? [a.task] : []), util: currentUtilization(allocations), vacationEntitlement: 24, demo: true,
    employeeNumber: String(8123456 - i * 100000), active: true, seniority: SENIORITY_LEVELS[i % SENIORITY_LEVELS.length],
    shortName: r.name.split(" ")[0], phone: `+966 5${(i + 1) % 10} ${String(312 + i * 47).padStart(3, "0")} ${String(4821 + i * 613).slice(-4)}`,
    nationalId: String(1087654321 - i * 1234567), birthDate: `${1984 + (i * 3) % 14}-${String((i * 5) % 12 + 1).padStart(2, "0")}-${String((i * 7) % 27 + 1).padStart(2, "0")}`,
    gender: i % 3 === 1 ? "Female" : "Male", tags: [["Senior", "Certified"], ["Remote"], ["Certified"], ["Field"], ["Senior"], ["Part-time"], ["Remote", "Certified"], []][i] ?? [],
    monthly: seedMonthly(i, base),
    trips: seedTrips(i, names[0]),
    allocations,
    leave: [
      { id: `leave-${i}-1`, type: "Leave", from: "2026-07-05", until: "2026-07-09", days: 5, remark: "Summer vacation" },
      { id: `leave-${i}-2`, type: "Leave", from: "2026-09-14", until: "2026-09-14", days: 1, remark: "Sick day" },
      { id: `leave-${i}-3`, type: "Partial", from: "2026-10-20", until: "2026-10-20", days: 0.25, hours: 2, remark: "Medical appointment" },
      { id: `leave-${i}-4`, type: "Leave", from: "2026-12-06", until: "2026-12-10", days: 5 },
    ] };
});
/** Demo Frontend Developer pool so a multi-person request can be filled in one go. */
const FRONTEND_DEMO = ["Rana Saleh", "Tariq Nasser", "Mona Adel", "Kareem Fawzy", "Salma Ibrahim"].map((name, k): Employee => {
  const i = initialEmployees.length + k;
  const allocations: EmployeeAllocation[] = k === 0 ? [{ id: `seed-fe-${k}`, project: "Customer Portal v3", role: "Frontend Developer", percent: 100, from: "2026-09", until: "2027-02" }] : k === 1 ? [{ id: `seed-fe-${k}`, project: "Customer Portal v3", role: "Frontend Developer", percent: 50, from: "2026-10", until: "2027-01" }] : [];
  return { id: `EMP-${String(i + 1).padStart(3, "0")}`, name, role: "Frontend Developer", seniority: SENIORITY_LEVELS[k % SENIORITY_LEVELS.length], dept: "Engineering", email: `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`, salary: 11000 + k * 500, capacity: DEFAULT_MONTHLY_CAPACITY, util: currentUtilization(allocations), employmentTypeId: types[k % 3]?.id ?? "ET-1", joinedOn: `${2021 + k % 4}-0${k + 2}-15`, projects: allocations.map((a) => a.project), tasks: [], allocations, leave: [], trips: [], monthly: {}, vacationEntitlement: 24, demo: true, employeeNumber: String(7200000 + k * 1111), active: true, shortName: name.split(" ")[0], gender: k % 2 ? "Male" : "Female", tags: [] };
});
initialEmployees.push(...FRONTEND_DEMO);
const defaults = { employees: initialEmployees, employmentTypes: types };
/** Demo seed rows, kept exported so tests can assert against them. */
export const SEED_EMPLOYEES = initialEmployees;
let state = defaults;
let loaded = false;
const listeners = new Set<() => void>();
// v3: leave lost its status (Leave / Partial + remark) and trips gained location, work dates and costs.
// v5: demo rows carry full profile data (phone, national ID, birth date, gender, tags).
// v7: allocations are only Full time (100%) / Part time (50%) from fulfilled requests; util derived from them.
// v8: ERP System Upgrade carries a 12-person demo team.
// v9: employment types carry demo descriptions.
// v10: seed allocations reference project ids instead of literal names.
// v11: employees carry a seniority level (Junior / Mid / Senior / Lead).
// v12: five demo Frontend Developers for the multi-person request example.
const storageKey = "pmo.employees.v12";
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null"); if (saved && Array.isArray(saved.employees) && Array.isArray(saved.employmentTypes)) state = saved; } catch { /* Retain demo records if local storage is unavailable. */ }
}
function subscribe(fn: () => void) { load(); listeners.add(fn); return () => { listeners.delete(fn); }; }
function save(next: typeof defaults) { state = next; try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep session data available. */ } listeners.forEach((fn) => fn()); }

/** Inclusive "YYYY-MM" range, e.g. monthRange("2026-01", 12) → all of 2026. */
export function monthRange(startMonth: string, count: number): string[] {
  const [y, m] = startMonth.split("-").map(Number);
  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Sum of allocation percentages active in a "YYYY-MM" month. */
export function allocationPercent(allocations: EmployeeAllocation[], month: string): number {
  return allocations.filter((a) => (!a.from || a.from <= month) && (!a.until || a.until >= month)).reduce((sum, a) => sum + a.percent, 0);
}
/** Inclusive "YYYY-MM" months between two months. */
export function monthsBetween(from: string, until: string): string[] {
  const [fy, fm] = from.split("-").map(Number); const [uy, um] = until.split("-").map(Number);
  return monthRange(from, (uy - fy) * 12 + (um - fm) + 1);
}
/** Peak and average allocation over a period, so a request's impact is judged across its whole task window. */
export function periodUtilization(allocations: EmployeeAllocation[], from: string, until: string, extra = 0) {
  const values = monthsBetween(from, until).map((m) => allocationPercent(allocations, m) + extra);
  return { peak: Math.max(0, ...values), average: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0 };
}
export function currentMonth(): string { return new Date().toISOString().slice(0, 7); }
/** Utilization shown in lists = allocation % in the current month, derived, never stored by hand. */
export function currentUtilization(allocations: EmployeeAllocation[]): number { return allocationPercent(allocations, currentMonth()); }

export function useEmployees() {
  const data = useSyncExternalStore(subscribe, () => state, () => defaults);
  const updateEmployee = (id: string, patch: Partial<Employee> | ((e: Employee) => Partial<Employee>)) =>
    save({ ...state, employees: state.employees.map((e) => e.id === id ? { ...e, ...(typeof patch === "function" ? patch(e) : patch) } : e) });
  return { ...data,
    setEmployees: (update: Employee[] | ((prev: Employee[]) => Employee[])) => save({ ...state, employees: typeof update === "function" ? update(state.employees) : update }),
    updateEmployee,
    /** Bulk-apply salary/capacity to a run of months, e.g. "9000 for the next 12 months". */
    setMonthlyPlan: (id: string, startMonth: string, months: number, plan: EmployeeMonthPlan) =>
      updateEmployee(id, (e) => ({ monthly: { ...e.monthly, ...Object.fromEntries(monthRange(startMonth, months).map((m) => [m, { ...e.monthly[m], ...plan }])) } })),
    /** Override (or clear with undefined values) a single month. */
    setMonthOverride: (id: string, month: string, plan: EmployeeMonthPlan) =>
      updateEmployee(id, (e) => ({ monthly: { ...e.monthly, [month]: { ...e.monthly[month], ...plan } } })),
    addTrip: (id: string, trip: Omit<EmployeeTrip, "id">) =>
      updateEmployee(id, (e) => ({ trips: [...e.trips, { ...trip, id: `trip-${crypto.randomUUID()}` }] })),
    /** One project trip creates a linked record on each traveler so capacity and history stay per employee. */
    addProjectTrip: (travelerIds: string[], trip: Omit<EmployeeTrip, "id" | "groupId">) => {
      const groupId = `tripgrp-${crypto.randomUUID()}`;
      travelerIds.forEach((id) => updateEmployee(id, (e) => ({ trips: [...e.trips, { ...trip, groupId, id: `trip-${crypto.randomUUID()}` }] })));
    },
    removeTripGroup: (project: string, groupId: string) =>
      state.employees.forEach((e) => { if (e.trips.some((t) => (t.groupId ?? t.id) === groupId && t.project === project)) updateEmployee(e.id, (x) => ({ trips: x.trips.filter((t) => !((t.groupId ?? t.id) === groupId && t.project === project)) })); }),
    removeTrip: (id: string, tripId: string) =>
      updateEmployee(id, (e) => ({ trips: e.trips.filter((t) => t.id !== tripId) })),
    addLeave: (id: string, leave: Omit<EmployeeLeave, "id">) =>
      updateEmployee(id, (e) => ({ leave: [...e.leave, { ...leave, id: `leave-${crypto.randomUUID()}` }] })),
    removeLeave: (id: string, leaveId: string) =>
      updateEmployee(id, (e) => ({ leave: e.leave.filter((l) => l.id !== leaveId) })),
    addEmploymentType: (name: string, description = "") => save({ ...state, employmentTypes: [...state.employmentTypes, { id: `ET-${crypto.randomUUID()}`, name: name.trim(), description: description.trim(), active: true }] }),
    updateEmploymentType: (id: string, patch: Partial<Pick<EmploymentType, "name" | "description" | "active">>) => save({ ...state, employmentTypes: state.employmentTypes.map((t) => t.id === id ? { ...t, ...patch } : t) }),
    removeEmploymentType: (id: string) => { if (state.employees.some((e) => e.employmentTypeId === id)) return false; save({ ...state, employmentTypes: state.employmentTypes.filter((t) => t.id !== id) }); return true; },
  };
}
