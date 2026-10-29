import { test } from "node:test";
import { strict as assert } from "node:assert";
import { projectCashEvents, projectCashYears } from "./project-cash-flow";
import { cashSeries, cashYearNavigation } from "./financial-filters";

const today = "2026-10-29";
test("project timeline includes one, two or three years even without events", () => {
  assert.deepEqual(projectCashYears("2026-03-01", "2026-12-01", [], today), ["2026"]);
  assert.deepEqual(projectCashYears("2026-03-01", "2027-12-01", [], today), ["2026", "2027"]);
  const years = projectCashYears("2026-03-01", "2028-12-01", [], today);
  assert.deepEqual(years, ["2026", "2027", "2028"]);
  assert.equal(cashYearNavigation(years, "2026").previous, undefined);
  assert.equal(cashYearNavigation(years, "2027").next, "2028");
  assert.equal(cashYearNavigation(years, "2028").next, undefined);
});
test("forecast uses the project's planned amounts and milestone finish dates", () => {
  const events = projectCashEvents([{ b: 2, linkKind: "milestone", linkRef: "Delivery" }, { b: 9, linkKind: "fixed", linkRef: "" }], [{ plan: 5, ms: "Delivery", date: "2026-01-01", linkKind: "milestone" }], [{ name: "Delivery", endDate: "2027-03-01" }], today);
  assert.deepEqual(events, [{ due: "2027-03-01", inflow: 0, outflow: 2 }, { due: "2027-03-01", inflow: 5, outflow: 0 }]);
});
test("empty later project years retain twelve months and cumulative cash", () => {
  const data = cashSeries([{ due: "2026-12-01", inflow: 5, outflow: 2 }, { due: "2028-01-01", inflow: 0, outflow: 0 }], "monthly", "2027", today);
  assert.equal(data.length, 12);
  assert.equal(data[0]?.Cumulative, 3);
  assert.equal(data[11]?.Cumulative, 3);
});