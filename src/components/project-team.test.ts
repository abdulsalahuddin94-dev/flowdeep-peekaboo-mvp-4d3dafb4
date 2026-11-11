import { test } from "node:test";
import assert from "node:assert/strict";
import { projectTeam, isWorkingNow } from "./ProjectTeamTab";
import { EMPLOYMENT_PERCENT } from "@/lib/projects-store";

const base = { skill: "Mid" as const, fte: 1, from: "", until: "", priority: "Low" as const, submittedBy: "", date: "", notes: "" };

test("Full time is 100% and Part time is 50%", () => {
  assert.equal(EMPLOYMENT_PERCENT["Full time"], 100);
  assert.equal(EMPLOYMENT_PERCENT["Part time"], 50);
});

test("only fulfilled requests add the employee to the team", () => {
  const team = projectTeam("P", [
    { ...base, id: "1", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Ann", employment: "Part time" },
    { ...base, id: "2", project: "P", role: "Dev", status: "Pending" },
  ]);
  assert.deepEqual(team, [{ name: "Ann", role: "QA", employment: "Part time" }]);
});

test("partially filled multi-headcount request already adds its assignees to the team", () => {
  const team = projectTeam("P", [
    { ...base, id: "1", project: "P", role: "QA", status: "Pending", quantity: 3, assignees: ["Ann", "Bob"], employment: "Full time" },
  ]);
  assert.deepEqual(team, [
    { name: "Ann", role: "QA", employment: "Full time" },
    { name: "Bob", role: "QA", employment: "Full time" },
  ]);
});

test("member is inactive once their tasks have ended", () => {
  const items = [{ name: "T", kind: "Task", startDate: "2026-01-01", endDate: "2026-02-01", assignee: "Ann", progress: 50 }];
  assert.equal(isWorkingNow("Ann", items, new Date("2026-01-15")), true);
  assert.equal(isWorkingNow("Ann", items, new Date("2026-03-01")), false);
});
