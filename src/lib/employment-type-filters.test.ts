import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesEmploymentTypeEmployees } from "./employment-type-filters";

const employees = [
  { employmentTypeId: "ET-1", projects: ["ERP System Upgrade"], allocations: [] },
  { employmentTypeId: "ET-2", projects: [], allocations: [{ project: "Customer Portal v3" }] },
];
test("has employees excludes unused employment types", () => {
  assert.equal(matchesEmploymentTypeEmployees("ET-1", employees, "with", []), true);
  assert.equal(matchesEmploymentTypeEmployees("ET-3", employees, "with", []), false);
});
test("without employees includes only unused employment types", () => {
  assert.equal(matchesEmploymentTypeEmployees("ET-3", employees, "without", []), true);
  assert.equal(matchesEmploymentTypeEmployees("ET-1", employees, "without", []), false);
});
test("project filter finds types through assigned projects or allocations", () => {
  assert.equal(matchesEmploymentTypeEmployees("ET-1", employees, "all", ["ERP System Upgrade"]), true);
  assert.equal(matchesEmploymentTypeEmployees("ET-2", employees, "all", ["Customer Portal v3"]), true);
  assert.equal(matchesEmploymentTypeEmployees("ET-1", employees, "all", ["Customer Portal v3"]), false);
});
test("filters combine and empty selection includes unused types", () => {
  assert.equal(matchesEmploymentTypeEmployees("ET-3", employees, "all", []), true);
  assert.equal(matchesEmploymentTypeEmployees("ET-1", employees, "without", ["ERP System Upgrade"]), false);
});