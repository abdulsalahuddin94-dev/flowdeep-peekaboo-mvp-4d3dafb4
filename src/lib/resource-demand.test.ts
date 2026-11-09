import { test } from "node:test";
import assert from "node:assert/strict";
import { requestFte } from "./resource-demand";
import { periodUtilization } from "./employees-store";
import type { ResourceRequest } from "./projects-store";

const req = (employment: "Full time" | "Part time") => ({ employment, fte: 9 } as unknown as ResourceRequest);

test("Full time request counts as 1 FTE and Part time as 0.5", () => {
  assert.equal(requestFte(req("Full time")), 1);
  assert.equal(requestFte(req("Part time")), 0.5);
});

test("two Part time projects in the same month total 100% and average across the period", () => {
  const allocs = [
    { id: "a", project: "A", role: "x", percent: 50, from: "2026-01", until: "2026-12" },
    { id: "b", project: "B", role: "x", percent: 50, from: "2026-01", until: "2026-06" },
  ];
  assert.deepEqual(periodUtilization(allocs, "2026-01", "2026-12"), { peak: 100, average: 75 });
});
