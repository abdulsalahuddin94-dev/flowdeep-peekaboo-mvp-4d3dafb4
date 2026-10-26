import type { Employee } from "./employees-store";
export function employeeMonth(employee: Employee, month: string) {
  const salary = month < employee.joinedOn.slice(0, 7) ? 0 : employee.salary;
  const allocations = employee.allocations.filter((a) => (!a.from || a.from <= month) && (!a.until || a.until >= month));
  const utilization = allocations.reduce((sum, a) => sum + a.percent, 0);
  const denominator = Math.max(100, utilization);
  const charges = allocations.map((a) => ({ ...a, amount: Math.round(salary * a.percent / denominator * 100) / 100 }));
  const projectCost = Math.min(salary, charges.reduce((sum, a) => sum + a.amount, 0));
  return { salary, allocations, charges, projectCost, overhead: Math.max(0, salary - projectCost), utilization, allocatedHours: employee.capacity * utilization / 100 };
}
export function vacationBalance(employee: Employee, year: string) {
  const used = employee.leave.filter((l) => l.type === "Annual vacation" && l.status === "Approved" && l.from.startsWith(year)).reduce((sum, l) => sum + l.days, 0);
  const pending = employee.leave.filter((l) => l.type === "Annual vacation" && l.status === "Pending" && l.from.startsWith(year)).reduce((sum, l) => sum + l.days, 0);
  return { entitlement: employee.vacationEntitlement, used, pending, remaining: employee.vacationEntitlement - used };
}
