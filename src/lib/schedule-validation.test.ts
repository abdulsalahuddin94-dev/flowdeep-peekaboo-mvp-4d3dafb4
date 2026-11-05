import { describe, expect, it } from "vitest";
import { findCircularItems, findItemsOutsideProject } from "./schedule-validation";

describe("baseline schedule validations", () => {
  it("flags items in a dependency loop", () => {
    const items = [
      { name: "A", startDate: "", endDate: "", dependencies: [{ predecessor: "C" }] },
      { name: "B", startDate: "", endDate: "", dependencies: [{ predecessor: "A" }] },
      { name: "C", startDate: "", endDate: "", dependencies: [{ predecessor: "B" }] },
      { name: "D", startDate: "", endDate: "", dependencies: [{ predecessor: "A" }] },
    ];
    expect(findCircularItems(items)).toEqual(["A", "B", "C"]);
  });

  it("flags items before project start or after project end", () => {
    const items = [
      { name: "Early", startDate: "2026-01-01", endDate: "2026-02-01" },
      { name: "Inside", startDate: "2026-02-01", endDate: "2026-05-01" },
      { name: "Late", startDate: "2026-05-01", endDate: "2026-07-01" },
    ];
    expect(findItemsOutsideProject(items, "2026-02-01", "2026-06-30")).toEqual(["Early", "Late"]);
  });
});
