import { test } from "node:test";
import assert from "node:assert/strict";
import { employeeLinks, openLinks, taskDateBlocked, isEmployeeAvailable } from "./employee-links";
import { SEED_EMPLOYEES } from "./employees-store";

const base = { ...SEED_EMPLOYEES[0]!, name: "Test Person", id: "EMP-X", trips: [] };
const req = (periodStart: string, periodEnd: string) => ({ id: "R", scope: "task", task: "Build", project: "P", role: "Dev", skill: "Mid", fte: 1, from: periodStart, until: periodEnd, periodStart, periodEnd, priority: "Low", status: "Fulfilled", submittedBy: "x", date: "", notes: "", assignedTo: "Test Person" }) as never;

test("delete is blocked by in-progress or upcoming work but not by past work", () => {
  const today = "2026-11-26";
  assert.equal(openLinks(employeeLinks(base, [req("2026-01-01", "2026-02-01")], [], today)).length, 0);
  assert.equal(openLinks(employeeLinks(base, [req("2026-11-01", "2026-12-01")], [], today))[0]?.timing, "current");
  const meeting = { id: "M", project: "P", title: "Sync", type: "Workshop", date: "2026-12-05", attendees: [{ id: "EMP-X", name: "Test Person", party: "Internal" }] } as never;
  assert.equal(openLinks(employeeLinks(base, [], [meeting], today))[0]?.timing, "future");
});

test("inactive or deleted employees are hidden from resource lists", () => {
  assert.equal(isEmployeeAvailable({ active: true }), true);
  assert.equal(isEmployeeAvailable({ active: false }), false);
  assert.equal(isEmployeeAvailable({ active: true, deleted: true }), false);
});

test("a finished task's dates lock only when its assignee is inactive", () => {
  const people = [{ name: "A", active: false }, { name: "B", active: true }];
  assert.equal(taskDateBlocked({ progress: 100, assignee: "A" }, people), true);
  assert.equal(taskDateBlocked({ progress: 60, assignee: "A" }, people), false);
  assert.equal(taskDateBlocked({ progress: 100, assignee: "B" }, people), false);
});
