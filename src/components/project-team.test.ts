import { test } from "node:test";
import assert from "node:assert/strict";
import { projectTeam, isWorkingNow, teamEmptyVariant, taskRoleRequestDefaults } from "./ProjectTeamTab";
import { EMPLOYMENT_PERCENT, requestCoverage, type ResourceRequest } from "@/lib/projects-store";

const base = { skill: "Mid" as const, fte: 1, from: "", until: "", priority: "Low" as const, submittedBy: "", date: "", notes: "" };

test("Full time is 100% and Part time is 50%", () => {
  assert.equal(EMPLOYMENT_PERCENT["Full time"], 100);
  assert.equal(EMPLOYMENT_PERCENT["Part time"], 50);
});

test("WBS role requests default to one employee for the opening task", () => {
  const value = taskRoleRequestDefaults("Site device rollout");
  assert.equal(value.coverage, "task");
  assert.equal(value.task, "Site device rollout");
  assert.equal(value.quantity, 1);
});

test("only fulfilled requests add the employee to the team", () => {
  const team = projectTeam("P", [
    { ...base, id: "1", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Ann", employment: "Part time" },
    { ...base, id: "2", project: "P", role: "Dev", status: "Pending" },
  ]);
  assert.deepEqual(team, [{ name: "Ann", role: "QA", employment: "Part time", coverage: "project", taskOnly: false, window: undefined }]);
});

test("partially filled multi-headcount request already adds its assignees to the team", () => {
  const team = projectTeam("P", [
    { ...base, id: "1", project: "P", role: "QA", status: "Pending", quantity: 3, assignees: ["Ann", "Bob"], employment: "Full time" },
  ]);
  assert.deepEqual(team, [
    { name: "Ann", role: "QA", employment: "Full time", coverage: "project", taskOnly: false, window: undefined },
    { name: "Bob", role: "QA", employment: "Full time", coverage: "project", taskOnly: false, window: undefined },
  ]);
});

test("member is inactive once their tasks have ended", () => {
  const items = [{ name: "T", kind: "Task", startDate: "2026-01-01", endDate: "2026-02-01", assignee: "Ann", progress: 50 }];
  assert.equal(isWorkingNow("Ann", items, new Date("2026-01-15")), true);
  assert.equal(isWorkingNow("Ann", items, new Date("2026-03-01")), false);
});

test("Request for column reads task, project or period", () => {
  const taskReq: ResourceRequest = { ...base, id: "1", project: "P", role: "QA", status: "Pending", scope: "task", task: "T" };
  const projectReq: ResourceRequest = { ...base, id: "2", project: "P", role: "QA", status: "Pending", scope: "team" };
  const periodReq: ResourceRequest = { ...base, id: "3", project: "P", role: "QA", status: "Pending", scope: "team", coverage: "period", from: "2026-01-01", until: "2026-03-01" };
  assert.equal(requestCoverage(taskReq), "task");
  assert.equal(requestCoverage(projectReq), "project");
  assert.equal(requestCoverage(periodReq), "period");
});

test("member card coverage follows the request that placed them", () => {
  const team = projectTeam("P", [
    { ...base, id: "1", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Ann", employment: "Full time", coverage: "period", from: "2026-01-01", until: "2026-03-01" },
    { ...base, id: "2", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Bob", employment: "Full time", scope: "task", task: "T" },
  ]);
  assert.equal(team.find((m) => m.name === "Ann")?.coverage, "period");
  assert.equal(team.find((m) => m.name === "Bob")?.coverage, "task");
});

test("widest coverage wins when one person arrives through several requests", () => {
  const team = projectTeam("P", [
    { ...base, id: "1", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Ann", employment: "Full time", scope: "task", task: "T" },
    { ...base, id: "2", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Ann", employment: "Full time", coverage: "project" },
  ]);
  assert.equal(team.length, 1);
  assert.equal(team[0]?.coverage, "project");
  assert.equal(team[0]?.taskOnly, false);
});

test("Team empty state waits on Resources while a request is open", () => {
  assert.equal(teamEmptyVariant([]), "none");
  assert.equal(teamEmptyVariant([{ ...base, id: "1", project: "P", role: "QA", status: "Pending" }]), "waiting");
  assert.equal(teamEmptyVariant([{ ...base, id: "1", project: "P", role: "QA", status: "Fulfilled", assignedTo: "Ann" }]), "none");
  assert.equal(teamEmptyVariant([{ ...base, id: "1", project: "P", role: "QA", status: "Declined" }]), "none");
});
