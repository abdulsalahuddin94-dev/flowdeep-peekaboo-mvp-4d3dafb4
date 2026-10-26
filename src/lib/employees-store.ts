import { useSyncExternalStore } from "react";
import { resources, projects } from "@/lib/mock-data";

export type EmploymentType = { id: string; name: string; active: boolean };
export type EmployeeAllocation = { id: string; project: string; role: string; percent: number; from: string; until: string; task?: string };
export type EmployeeLeave = { id: string; type: "Annual vacation" | "Sick leave" | "Unpaid leave"; from: string; until: string; days: number; status: "Approved" | "Pending" | "Rejected" };
export type Employee = { id: string; name: string; role: string; dept: string; email: string; salary: number; capacity: number; util: number; employmentTypeId: string; joinedOn: string; projects: string[]; tasks: string[]; allocations: EmployeeAllocation[]; leave: EmployeeLeave[]; vacationEntitlement: number; demo: boolean };
const projectIds = [["p-001", "p-003"], ["p-002", "p-016"], ["p-010"], ["p-008", "p-012"], ["p-009", "p-005"], ["p-015"], ["p-014"], []];
const taskNames = [["Solution Design", "Integration Blueprint"], ["Site Mobilisation"], ["Penetration Testing"], ["Field Survey", "Commissioning"], ["Model Training"], ["Budget Review"], ["Vendor Evaluation"], ["Source Mapping"]];
const salaries = [14500, 12800, 13200, 9800, 13900, 8700, 9200, 11000];
const types: EmploymentType[] = ["In source", "Out source", "Offshore"].map((name, i) => ({ id: `ET-${i + 1}`, name, active: true }));
const initialEmployees: Employee[] = resources.map((r, i) => {
  const names = (projectIds[i] ?? []).map((id) => projects.find((p) => p.id === id)?.name).filter((n): n is string => !!n);
  if (!names.length) names.push(...r.projects);
  return { ...r, id: `EMP-${String(i + 1).padStart(3, "0")}`, projects: names, email: `${r.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".")}@company.com`, salary: salaries[i] ?? 10000, employmentTypeId: types[i % 3]?.id ?? "ET-1", joinedOn: "2025-01-01", tasks: taskNames[i] ?? [], vacationEntitlement: 24, demo: true,
    allocations: names.map((project, j) => ({ id: `seed-${i}-${j}`, project, role: r.role, percent: j === 0 && names.length > 1 ? Math.round(r.util * .6) : names.length > 1 ? r.util - Math.round(r.util * .6) : r.util, from: "2026-01", until: "2026-12", task: taskNames[i]?.[j] })),
    leave: [{ id: `leave-${i}-1`, type: "Annual vacation", from: "2026-07-05", until: "2026-07-09", days: 5, status: "Approved" }, { id: `leave-${i}-2`, type: "Sick leave", from: "2026-09-14", until: "2026-09-14", days: 1, status: "Approved" }, { id: `leave-${i}-3`, type: "Annual vacation", from: "2026-12-06", until: "2026-12-10", days: 5, status: "Pending" }] };
});
const defaults = { employees: initialEmployees, employmentTypes: types };
let state = defaults;
let loaded = false;
const listeners = new Set<() => void>();
const storageKey = "pmo.employees.v1";
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null"); if (saved && Array.isArray(saved.employees) && Array.isArray(saved.employmentTypes)) state = saved; } catch { /* Retain demo records if local storage is unavailable. */ }
}
function subscribe(fn: () => void) { load(); listeners.add(fn); return () => { listeners.delete(fn); }; }
function save(next: typeof defaults) { state = next; try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep session data available. */ } listeners.forEach((fn) => fn()); }
export function useEmployees() {
  const data = useSyncExternalStore(subscribe, () => state, () => defaults);
  return { ...data,
    setEmployees: (update: Employee[] | ((prev: Employee[]) => Employee[])) => save({ ...state, employees: typeof update === "function" ? update(state.employees) : update }),
    addEmploymentType: (name: string) => save({ ...state, employmentTypes: [...state.employmentTypes, { id: `ET-${crypto.randomUUID()}`, name: name.trim(), active: true }] }),
    updateEmploymentType: (id: string, patch: Partial<Pick<EmploymentType, "name" | "active">>) => save({ ...state, employmentTypes: state.employmentTypes.map((t) => t.id === id ? { ...t, ...patch } : t) }),
    removeEmploymentType: (id: string) => { if (state.employees.some((e) => e.employmentTypeId === id)) return false; save({ ...state, employmentTypes: state.employmentTypes.filter((t) => t.id !== id) }); return true; },
  };
}
