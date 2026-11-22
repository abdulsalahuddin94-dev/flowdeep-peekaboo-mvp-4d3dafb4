import { test } from "node:test";
import { strict as assert } from "node:assert";
import { currentEmployeeMonth, stepEmployeeMonth } from "./employee-period";

test("employee salary defaults to the current month, November 2026", () => {
  assert.equal(currentEmployeeMonth(new Date(2026, 10, 22, 12, 44)), "2026-11");
});

test("monthly navigation crosses December and January without skipping months", () => {
  assert.equal(stepEmployeeMonth("2026-12", 1), "2027-01");
  assert.equal(stepEmployeeMonth("2027-01", -1), "2026-12");
});