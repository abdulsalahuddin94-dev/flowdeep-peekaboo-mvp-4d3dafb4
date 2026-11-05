import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { findCircularItems, findItemsOutsideProject } from "./schedule-validation";

describe("baseline schedule validations", () => {
  it("flags items in a dependency loop", () => {
    const items = [
      { name: "A", startDate: "", endDate: "", dependencies: [{ predecessor: "C" }] },
      { name: "B", startDate: "", endDate: "", dependencies: [{ predecessor: "A" }] },
      { name: "C", startDate: "", endDate: "", dependencies: [{ predecessor: "B" }] },
      { name: "D", startDate: "", endDate: "", dependencies: [{ predecessor: "A" }] },
    ];
    assert.deepEqual(findCircularItems(items), ["A", "B", "C"]);
  });

  it("flags items before project start or after project end", () => {
    const items = [
      { name: "Early", startDate: "2026-01-01", endDate: "2026-02-01" },
      { name: "Inside", startDate: "2026-02-01", endDate: "2026-05-01" },
      { name: "Late", startDate: "2026-05-01", endDate: "2026-07-01" },
    ];
    assert.deepEqual(findItemsOutsideProject(items, "2026-02-01", "2026-06-30"), ["Early", "Late"]);
  });
});
