import { test } from "node:test";
import assert from "node:assert/strict";
import { requestPeriod } from "./request-period";

test("same-day five hours thirty minutes shows date and duration", () => {
  assert.deepEqual(requestPeriod("2026-07-05T09:00:00", "2026-07-05T14:30:00").lines, ["2026-07-05", "5h 30m"]);
});
test("eleven hours on the same date does not create a second date", () => {
  assert.deepEqual(requestPeriod("2026-07-05T08:00:00", "2026-07-05T19:00:00").lines, ["2026-07-05", "11h"]);
});
test("two hours crossing midnight shows both actual dates", () => {
  assert.deepEqual(requestPeriod("2026-07-05T23:00:00", "2026-07-06T01:00:00").lines, ["2026-07-05", "2026-07-06"]);
});
for (const hours of [16, 40, 43]) {
  test(`${hours} work hours retain recorded dates and full hours for details`, () => {
    const period = requestPeriod("2026-07-05", "2026-07-12", hours);
    assert.deepEqual(period.lines, ["2026-07-05", "2026-07-12"]);
    assert.equal(period.duration, `${hours}h`);
  });
}
test("date-only values do not invent hours", () => {
  assert.equal(requestPeriod("2026-07-05", "2026-07-05").duration, undefined);
});
test("legacy month ranges retain their precision", () => {
  assert.deepEqual(requestPeriod("2026-12", "2027-04").lines, ["2026-12", "2027-04"]);
});