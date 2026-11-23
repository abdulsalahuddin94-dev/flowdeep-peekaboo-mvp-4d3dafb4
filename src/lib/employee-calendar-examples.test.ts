import { test } from "node:test";
import assert from "node:assert/strict";
import { addMeiCalendarExamples, SEED_EMPLOYEES } from "./employees-store";
import { workCalendars } from "./mock-data";

test("Mei has leave, a trip and a holiday in November 2026", () => {
  const mei = SEED_EMPLOYEES.find((employee) => employee.id === "EMP-003");
  assert.ok(mei);
  assert.equal(mei.leave.find((leave) => leave.id === "leave-mei-november")?.from, "2026-11-10");
  assert.equal(mei.leave.find((leave) => leave.id === "leave-mei-november-partial")?.hours, 2);
  assert.equal(mei.trips.find((trip) => trip.from === "2026-11-01")?.until, "2026-11-07");
  assert.equal(workCalendars.find((calendar) => calendar.id === mei.calendarId)?.holidays[0]?.date, "2026-11-26");
});

test("saved demo examples upgrade once without duplicating leave or changing other employees", () => {
  const mei = SEED_EMPLOYEES.find((employee) => employee.id === "EMP-003");
  const other = SEED_EMPLOYEES.find((employee) => employee.id === "EMP-001");
  assert.ok(mei);
  assert.ok(other);
  const saved = { ...mei, calendarId: "cal-eg", leave: [], salary: 12345 };
  const upgraded = addMeiCalendarExamples(saved);
  assert.equal(upgraded.salary, 12345);
  assert.equal(upgraded.calendarId, "cal-mei-demo");
  assert.equal(upgraded.leave.length, 2);
  assert.deepEqual(addMeiCalendarExamples(upgraded), upgraded);
  assert.equal(addMeiCalendarExamples(other), other);
  const real = { ...saved, demo: false };
  assert.equal(addMeiCalendarExamples(real), real);
});