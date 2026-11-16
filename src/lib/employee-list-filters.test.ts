import { test } from "node:test";
import assert from "node:assert/strict";
import { jobRoleGroup, matchAnySelected, projectNameGroup } from "../components/ds/filters";

test("empty project or job role selection keeps every employee", () => {
  assert.equal(matchAnySelected([], ["ERP System Upgrade"]), true);
  assert.equal(matchAnySelected([], ["Solution Architect"]), true);
});

test("project filter keeps employees on any selected project", () => {
  const selected = ["ERP System Upgrade", "Security Hardening 2026"];
  assert.equal(matchAnySelected(selected, ["ERP System Upgrade"]), true);
  assert.equal(matchAnySelected(selected, ["BI Self-Service"]), false);
  assert.equal(matchAnySelected(selected, ["BI Self-Service", "ERP System Upgrade"]), true);
});

test("job role filter keeps employees whose role is selected", () => {
  assert.equal(matchAnySelected(["QA Engineer"], ["QA Engineer"]), true);
  assert.equal(matchAnySelected(["QA Engineer"], ["Data Engineer"]), false);
});

test("seniority filter accepts Mid and Senior together and excludes Junior", () => {
  assert.equal(matchAnySelected(["Mid", "Senior"], ["Mid"]), true);
  assert.equal(matchAnySelected(["Mid", "Senior"], ["Senior"]), true);
  assert.equal(matchAnySelected(["Mid", "Senior"], ["Junior"]), false);
});

test("department filter accepts Engineering and IT but excludes Finance", () => {
  assert.equal(matchAnySelected(["Engineering", "IT"], ["IT"]), true);
  assert.equal(matchAnySelected(["Engineering", "IT"], ["Finance"]), false);
});

test("employment type filter supports multiple types and all reset", () => {
  assert.equal(matchAnySelected(["ET-1", "ET-2"], ["ET-2"]), true);
  assert.equal(matchAnySelected(["ET-1", "ET-2"], ["ET-3"]), false);
  assert.equal(matchAnySelected([], ["ET-3"]), true);
});

test("status filter supports Active, Inactive and both statuses", () => {
  assert.equal(matchAnySelected(["inactive"], ["active"]), false);
  assert.equal(matchAnySelected(["inactive"], ["inactive"]), true);
  assert.equal(matchAnySelected(["active", "inactive"], ["active"]), true);
  assert.equal(matchAnySelected([], ["inactive"]), true);
});

test("project name group lists every project behind an all-projects reset", () => {
  const group = projectNameGroup([], () => {}, ["ERP System Upgrade", "BI Self-Service"]);
  assert.equal(group.mode, "multi");
  assert.equal(group.label, "Project name");
  assert.deepEqual(group.options.map((o) => o.value), ["all", "ERP System Upgrade", "BI Self-Service"]);
});

test("job role group lists every role behind an all-roles reset", () => {
  const group = jobRoleGroup([], () => {}, ["Project Manager", "QA Engineer"]);
  assert.equal(group.label, "Job role");
  assert.deepEqual(group.options.map((o) => o.label), ["All job roles", "Project Manager", "QA Engineer"]);
});
