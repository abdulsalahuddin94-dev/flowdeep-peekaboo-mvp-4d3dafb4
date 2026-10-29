import { test } from "node:test";
import { strict as assert } from "node:assert";
import { employeeMonth, vacationBalance } from "./employee-finance";
import type { Employee } from "./employees-store";
const employee: Employee = { id: "test", name: "Test", role: "Engineer", dept: "IT", email: "test@example.com", salary: 10000, capacity: 160, util: 60, employmentTypeId: "ET-1", joinedOn: "2026-01-01", projects: ["A"], tasks: [], allocations: [{ id: "a", project: "A", role: "Engineer", percent: 60, from: "2026-02", until: "2026-03" }], leave: [], trips: [], monthly: {}, vacationEntitlement: 24, demo: false };
test("monthly salary shows its project charge and unassigned balance", () => { const m = employeeMonth(employee, "2026-02"); assert.equal(m.salary, 10000); assert.equal(m.charges[0]?.amount, 6000); assert.equal(m.overhead, 4000); });
test("allocation only contributes within its assigned period", () => { assert.equal(employeeMonth(employee, "2026-04").projectCost, 0); });
test("over-allocation cannot charge more than the monthly salary", () => { const m = employeeMonth({ ...employee, allocations: [{ ...employee.allocations[0], id: "b", project: "B", role: "Engineer", percent: 150, from: "2026-02", until: "2026-03" }] }, "2026-02"); assert.equal(m.projectCost, 10000); assert.equal(m.utilization, 150); });
test("only approved vacation reduces the read-only balance", () => { assert.deepEqual(vacationBalance({ ...employee, leave: [{ id: "1", type: "Annual vacation", from: "2026-07-01", until: "2026-07-05", days: 5, status: "Approved" }, { id: "2", type: "Annual vacation", from: "2026-12-01", until: "2026-12-05", days: 5, status: "Pending" }] }, "2026"), { entitlement: 24, used: 5, pending: 5, remaining: 19 }); });
test("a per-month plan override replaces the base salary and capacity for that month only", () => {
  const e = { ...employee, monthly: { "2026-02": { salary: 12000, capacity: 80 } } };
  const overridden = employeeMonth(e, "2026-02");
  assert.equal(overridden.salary, 12000);
  assert.equal(overridden.capacity, 80);
  const plain = employeeMonth(e, "2026-03");
  assert.equal(plain.salary, 10000);
  assert.equal(plain.capacity, 160);
});
test("leave and business trips reduce the available capacity of their month", () => {
  const e = { ...employee,
    leave: [{ id: "1", type: "Annual vacation" as const, from: "2026-02-02", until: "2026-02-06", days: 5, status: "Approved" as const }],
    trips: [{ id: "t1", kind: "Business trip" as const, title: "Site visit", from: "2026-02-09", until: "2026-02-10", days: 2, status: "Planned" as const }] };
  const m = employeeMonth(e, "2026-02");
  assert.equal(m.absentDays, 7);
  assert.equal(m.availableCapacity, Math.round(160 * 15 / 22 * 10) / 10);
  // 60% of 160h = 96h against ~109.1h available → 88% effective, not 60%.
  assert.equal(m.allocatedHours, 96);
  assert.equal(m.effectiveUtilization, 88);
  assert.equal(employeeMonth(e, "2026-03").absentDays, 0);
});
test("effective utilization flags over-utilization when assigned hours exceed available capacity", () => {
  const e = { ...employee, allocations: [{ ...employee.allocations[0], percent: 120 }] };
  assert.equal(employeeMonth(e, "2026-02").effectiveUtilization, 120);
});
