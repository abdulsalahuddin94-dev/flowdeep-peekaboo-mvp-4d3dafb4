import { describe, expect, it } from "vitest";
import { deletedItemsWithLateActuals } from "./cr-conflicts";

describe("deleted schedule item conflict", () => {
  const cost = [{ linkKind: "milestone", linkRef: "Design", actuals: [{ date: "2026-11-10" }] }];
  it("blocks when a deleted item received actuals after submission", () => {
    expect(deletedItemsWithLateActuals(["Design"], "2026-11-01", cost, [])).toEqual(["Design"]);
  });
  it("does not block when actuals predate submission", () => {
    expect(deletedItemsWithLateActuals(["Design"], "2026-11-20", cost, [])).toEqual([]);
  });
});
