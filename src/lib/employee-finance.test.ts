import { test } from "node:test";
import { strict as assert } from "node:assert";
import { employeeMonth, vacationBalance } from "./employee-finance";
import type { Employee } from "./employees-store";
const employee: Employee = { id: "test", name: "Test", role: "Engineer", dept: "IT", email: "test@example.com", salary: 10000, capacity: 40, util: 60, employmentTypeId: "ET-1", joinedOn: "2026-01-01", projects: ["A"], tasks: [], allocations: [{ id: "a", project: "A", role: "Engineer", percent: 60, from: "2026-02", until: "2026-03" }], leave: [], vacationEntitlement: 24, demo: false };
test("monthly salary shows its project charge and unassigned balance", () => { const m = employeeMonth(employee, "2026-02"); assert.equal(m.salary, 10000); assert.equal(m.charges[0]?.amount, 6000); assert.equal(m.overhead, 4000); });
test("allocation only contributes within its assigned period", () => { assert.equal(employeeMonth(employee, "2026-04").projectCost, 0); });
test("over-allocation cannot charge more than the monthly salary", () => { const m = employeeMonth({ ...employee, allocations: [{ ...employee.allocations[0], id: "b", project: "B", role: "Engineer", percent: 150, from: "2026-02", until: "2026-03" }] }, "2026-02"); assert.equal(m.projectCost, 10000); assert.equal(m.utilization, 150); });
test("only approved vacation reduces the read-only balance", () => { assert.deepEqual(vacationBalance({ ...employee, leave: [{ id: "1", type: "Annual vacation", from: "2026-07-01", until: "2026-07-05", days: 5, status: "Approved" }, { id: "2", type: "Annual vacation", from: "2026-12-01", until: "2026-12-05", days: 5, status: "Pending" }] }, "2026"), { entitlement: 24, used: 5, pending: 5, remaining: 19 }); });
