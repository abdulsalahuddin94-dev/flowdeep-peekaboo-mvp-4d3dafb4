import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { matchesProjectTypes, cashYears, cashYearNavigation, cashSeries, financialDemoDate } from "./financial-filters";

test("financial demo event dates span three years, 2026 through 2028", () => {
  const dates = Array.from({ length: 12 }, (_, project) =>
    Array.from({ length: 4 }, (_, item) => financialDemoDate(((project * 2 + item * 3) % 36) + 1, 5)),
  ).flat();
  assert.deepEqual([...new Set(dates.map((date) => date.slice(0, 4)))].sort(), ["2026", "2027", "2028"]);
  assert.equal(financialDemoDate(25, 5), "2028-01-05");
});

describe("Cash flow project type selection", () => {
  test("defaults to All when no types are selected", () => {
    assert.equal(matchesProjectTypes([], "EPC"), true);
    assert.equal(matchesProjectTypes([], "Maintenance"), true);
  });

  test("includes multiple selected types and excludes other types", () => {
    const selected = ["EPC", "Software Solutions"];
    assert.equal(matchesProjectTypes(selected, "EPC"), true);
    assert.equal(matchesProjectTypes(selected, "Software Solutions"), true);
    assert.equal(matchesProjectTypes(selected, "Maintenance"), false);
  });
});

const events = [
  { due: "2026-12-01", inflow: 10, outflow: 4 },
  { due: "2027-01-01", inflow: 5, outflow: 2 },
  { due: "2028-03-01", inflow: 8, outflow: 1 },
];
describe("Cash flow year navigation", () => {
  const years = cashYears(events);
  test("first year has only the forward arrow", () => {
    assert.deepEqual(cashYearNavigation(years, "2026"), { year: "2026", previous: undefined, next: "2027" });
  });
  test("middle year has both arrows", () => {
    assert.deepEqual(cashYearNavigation(years, "2027"), { year: "2027", previous: "2026", next: "2028" });
  });
  test("last year has only the back arrow", () => {
    assert.deepEqual(cashYearNavigation(years, "2028"), { year: "2028", previous: "2027", next: undefined });
  });
  test("yearly shows all years", () => {
    assert.deepEqual(cashSeries(events, "yearly", "2026", "2026-10-26").map((row) => row.key), ["2026", "2027", "2028"]);
  });
  test("drilling into a year shows its twelve months and carries cumulative net", () => {
    const months = cashSeries(events, "monthly", "2027", "2026-10-26");
    assert.equal(months.length, 12);
    assert.equal(months[0]?.key, "2027-01");
    assert.equal(months[0]?.Inflow, 5);
    assert.equal(months[0]?.Outflow, -2);
    assert.equal(months[0]?.Cumulative, 9);
    assert.equal(months[11]?.key, "2027-12");
  });
});