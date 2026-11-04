import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { deletedItemsWithLateActuals } from "./cr-conflicts";

describe("deleted schedule item conflict", () => {
  const cost = [{ linkKind: "milestone", linkRef: "Design", actuals: [{ date: "2026-11-10" }] }];
  test("blocks when a deleted item received actuals after submission", () => {
    assert.deepEqual(deletedItemsWithLateActuals(["Design"], "2026-11-01", cost, []), ["Design"]);
  });
  test("does not block when actuals predate submission", () => {
    assert.deepEqual(deletedItemsWithLateActuals(["Design"], "2026-11-20", cost, []), []);
  });
});
