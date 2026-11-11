import { test } from "node:test";
import assert from "node:assert/strict";
import { buildManpowerPlan, buildSkillDemand } from "./resource-demand";
import type { ResourceRequest } from "./projects-store";

const base = { skill: "Mid" as const, fte: 1, from: "2026-01", until: "2026-06", priority: "Medium" as const, submittedBy: "", date: "", notes: "" };

test("manpower demand multiplies by headcount; supply counts filled seats only", () => {
  const requests: ResourceRequest[] = [
    { ...base, id: "1", project: "P", role: "QA Engineer", status: "Pending", employment: "Full time", quantity: 3, assignees: ["Ann"] },
  ];
  const [row] = buildManpowerPlan(requests, []);
  assert.equal(row.demand, 3);
  assert.equal(row.supply, 1);
  assert.equal(row.action, "Fulfill 2 pending requests");
});

test("skill demand counts only the remaining seats of a pending request", () => {
  const requests: ResourceRequest[] = [
    { ...base, id: "1", project: "P", role: "QA Engineer", status: "Pending", employment: "Part time", quantity: 4, assignees: ["Ann", "Bob"] },
  ];
  const [row] = buildSkillDemand(requests, []);
  assert.equal(row.required, 1); // 2 remaining seats × 0.5 FTE
});

test("single-seat requests behave as before", () => {
  const requests: ResourceRequest[] = [
    { ...base, id: "1", project: "P", role: "QA Engineer", status: "Fulfilled", employment: "Full time", assignedTo: "Ann" },
  ];
  const [row] = buildManpowerPlan(requests, []);
  assert.equal(row.demand, 1);
  assert.equal(row.supply, 1);
  assert.equal(row.action, "Capacity covered");
});
