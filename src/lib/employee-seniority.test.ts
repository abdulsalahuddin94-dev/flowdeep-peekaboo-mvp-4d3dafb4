import { test } from "node:test";
import assert from "node:assert/strict";
import { SENIORITY_LEVELS, SEED_EMPLOYEES } from "./employees-store";

test("seniority levels are the four used on resource requests", () => {
  assert.deepEqual([...SENIORITY_LEVELS], ["Junior", "Mid", "Senior", "Lead"]);
});

test("every demo employee carries a valid seniority level", () => {
  assert.ok(SEED_EMPLOYEES.length > 0, "demo employees are seeded");
  for (const e of SEED_EMPLOYEES) {
    assert.ok(
      (SENIORITY_LEVELS as readonly string[]).includes(e.seniority ?? ""),
      `${e.name} has seniority "${e.seniority}"`,
    );
  }
});
