import type { Employee } from "./employees-store";

/** Working days used to prorate absence against monthly capacity. */
const WORKING_DAYS_PER_MONTH = 22;

function overlapDays(from: string, until: string, month: string): number {
  const [y, m] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 0));
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${until}T00:00:00Z`);
  const a = start > monthStart ? start : monthStart;
  const b = end < monthEnd ? end : monthEnd;
  if (b < a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

/** Salary, capacity and project charges for one "YYYY-MM" month, honouring per-month plan overrides. */
export function employeeMonth(employee: Employee, month: string) {
  const override = employee.monthly?.[month] ?? {};
  const baseSalary = month < employee.joinedOn.slice(0, 7) ? 0 : employee.salary;
  const salary = override.salary ?? baseSalary;
  const capacity = override.capacity ?? employee.capacity;
  const allocations = employee.allocations.filter((a) => (!a.from || a.from <= month) && (!a.until || a.until >= month));
  const utilization = allocations.reduce((sum, a) => sum + a.percent, 0);
  const denominator = Math.max(100, utilization);
  const charges = allocations.map((a) => ({ ...a, amount: Math.round(salary * a.percent / denominator * 100) / 100 }));
  const projectCost = Math.min(salary, charges.reduce((sum, a) => sum + a.amount, 0));
  // Leave and business trips/training reduce the hours available this month.
  const absentDays = Math.min(WORKING_DAYS_PER_MONTH,
    employee.leave.filter((l) => l.status !== "Rejected").reduce((sum, l) => sum + overlapDays(l.from, l.until, month), 0)
    + employee.trips.reduce((sum, t) => sum + overlapDays(t.from, t.until, month), 0));
  const availableCapacity = Math.round(capacity * (WORKING_DAYS_PER_MONTH - absentDays) / WORKING_DAYS_PER_MONTH * 10) / 10;
  const allocatedHours = capacity * utilization / 100;
  const effectiveUtilization = availableCapacity > 0 ? Math.round(allocatedHours / availableCapacity * 100) : (allocatedHours > 0 ? 999 : 0);
  return { salary, capacity, allocations, charges, projectCost, overhead: Math.max(0, salary - projectCost), utilization, allocatedHours, absentDays, availableCapacity, effectiveUtilization };
}

export function vacationBalance(employee: Employee, year: string) {
  const used = employee.leave.filter((l) => l.type === "Annual vacation" && l.status === "Approved" && l.from.startsWith(year)).reduce((sum, l) => sum + l.days, 0);
  const pending = employee.leave.filter((l) => l.type === "Annual vacation" && l.status === "Pending" && l.from.startsWith(year)).reduce((sum, l) => sum + l.days, 0);
  return { entitlement: employee.vacationEntitlement, used, pending, remaining: employee.vacationEntitlement - used };
}
