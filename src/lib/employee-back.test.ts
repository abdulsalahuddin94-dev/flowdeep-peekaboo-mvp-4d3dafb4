import { test } from "node:test";
import assert from "node:assert/strict";
import { employeeBackTarget } from "./employee-back";

test("opening a profile from a project team goes back to that team", () => {
  assert.deepEqual(employeeBackTarget({ from: "team", projectId: "PRJ-001" }), { kind: "team", projectId: "PRJ-001" });
});

test("without a team origin the back link stays on the employee list", () => {
  assert.deepEqual(employeeBackTarget({}), { kind: "employees" });
  assert.deepEqual(employeeBackTarget({ from: "team" }), { kind: "employees" });
  assert.deepEqual(employeeBackTarget({ projectId: "PRJ-001" }), { kind: "employees" });
});
