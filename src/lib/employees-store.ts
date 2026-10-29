import { useSyncExternalStore } from "react";
import { resources, projects } from "@/lib/mock-data";

export type EmploymentType = { id: string; name: string; active: boolean };
export type EmployeeAllocation = { id: string; project: string; role: string; percent: number; from: string; until: string; task?: string };
export type EmployeeLeave = { id: string; type: "Annual vacation" | "Sick leave" | "Unpaid leave"; from: string; until: string; days: number; status: "Approved" | "Pending" | "Rejected" };
export type EmployeeTrip = { id: string; kind: "Business trip" | "Training"; title: string; from: string; until: string; days: number; status: "Planned" | "Completed" };
/** Per-month overrides keyed by "YYYY-MM"; months without an entry fall back to the employee's base salary/capacity. */
export type EmployeeMonthPlan = { salary?: number; capacity?: number };
export type Employee = { id: string; name: string; role: string; dept: string; email: string; salary: number; capacity: number; util: number; employmentTypeId: string; joinedOn: string; projects: string[]; tasks: string[]; allocations: EmployeeAllocation[]; leave: EmployeeLeave[]; trips: EmployeeTrip[]; monthly: Record<string, EmployeeMonthPlan>; vacationEntitlement: number; demo: boolean };

/** Default monthly capacity in hours when nothing is set (≈ 40h/week). */
export const DEFAULT_MONTHLY_CAPACITY = 160;

const projectIds = [["p-001", "p-003"], ["p-002", "p-016"], ["p-010"], ["p-008", "p-012"], ["p-009", "p-005"], ["p-015"], ["p-014"], []];
const taskNames = [["Solution Design", "Integration Blueprint"], ["Site Mobilisation"], ["Penetration Testing"], ["Field Survey", "Commissioning"], ["Model Training"], ["Budget Review"], ["Vendor Evaluation"], ["Source Mapping"]];
const salaries = [14500, 12800, 13200, 9800, 13900, 8700, 9200, 11000];
const types: EmploymentType[] = ["In source", "Out source", "Offshore"].map((name, i) => ({ id: `ET-${i + 1}`, name, active: true }));

/** Demo monthly plans: a mid-year raise and a part-time month so per-month values are visible. */
function seedMonthly(i: number, base: number): Record<string, EmployeeMonthPlan> {
  const plan: Record<string, EmployeeMonthPlan> = {};
  const raised = Math.round(base * 1.08);
  for (let m = 7; m <= 12; m++) plan[`2026-${String(m).padStart(2, "0")}`] = { salary: raised };
  if (i % 3 === 0) plan["2026-08"] = { ...plan["2026-08"], capacity: 80 };
  return plan;
}

function seedTrips(i: number): EmployeeTrip[] {
  return [
    { id: `trip-${i}-1`, kind: "Business trip", title: "Client site visit — Riyadh", from: "2026-05-11", until: "2026-05-14", days: 4, status: "Completed" },
    { id: `trip-${i}-2`, kind: "Training", title: "PMP certification bootcamp", from: "2026-11-02", until: "2026-11-06", days: 5, status: "Planned" },
  ];
}

const initialEmployees: Employee[] = resources.map((r, i) => {
  const names = (projectIds[i] ?? []).map((id) => projects.find((p) => p.id === id)?.name).filter((n): n is string => !!n);
  if (!names.length) names.push(...r.projects);
  const base = salaries[i] ?? 10000;
  return { ...r, id: `EMP-${String(i + 1).padStart(3, "0")}`, projects: names, email: `${r.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".")}@company.com`, salary: base, capacity: DEFAULT_MONTHLY_CAPACITY, employmentTypeId: types[i % 3]?.id ?? "ET-1", joinedOn: "2025-01-01", tasks: taskNames[i] ?? [], vacationEntitlement: 24, demo: true,
    monthly: seedMonthly(i, base),
    trips: seedTrips(i),
    allocations: names.map((project, j) => ({ id: `seed-${i}-${j}`, project, role: r.role, percent: j === 0 && names.length > 1 ? Math.round(r.util * .6) : names.length > 1 ? r.util - Math.round(r.util * .6) : r.util, from: "2026-01", until: "2026-12", task: taskNames[i]?.[j] })),
    leave: [{ id: `leave-${i}-1`, type: "Annual vacation", from: "2026-07-05", until: "2026-07-09", days: 5, status: "Approved" }, { id: `leave-${i}-2`, type: "Sick leave", from: "2026-09-14", until: "2026-09-14", days: 1, status: "Approved" }, { id: `leave-${i}-3`, type: "Annual vacation", from: "2026-12-06", until: "2026-12-10", days: 5, status: "Pending" }] };
});
const defaults = { employees: initialEmployees, employmentTypes: types };
let state = defaults;
let loaded = false;
const listeners = new Set<() => void>();
const storageKey = "pmo.employees.v2";
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
    removeTrip: (id: string, tripId: string) =>
      updateEmployee(id, (e) => ({ trips: e.trips.filter((t) => t.id !== tripId) })),
    addEmploymentType: (name: string) => save({ ...state, employmentTypes: [...state.employmentTypes, { id: `ET-${crypto.randomUUID()}`, name: name.trim(), active: true }] }),
    updateEmploymentType: (id: string, patch: Partial<Pick<EmploymentType, "name" | "active">>) => save({ ...state, employmentTypes: state.employmentTypes.map((t) => t.id === id ? { ...t, ...patch } : t) }),
    removeEmploymentType: (id: string) => { if (state.employees.some((e) => e.employmentTypeId === id)) return false; save({ ...state, employmentTypes: state.employmentTypes.filter((t) => t.id !== id) }); return true; },
  };
}
