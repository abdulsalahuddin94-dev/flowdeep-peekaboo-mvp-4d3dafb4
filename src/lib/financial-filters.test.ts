import { describe, expect, test } from "bun:test";
import { matchesProjectTypes } from "./financial-filters";

describe("Cash flow project type selection", () => {
  test("defaults to All when no types are selected", () => {
    expect(matchesProjectTypes([], "EPC")).toBe(true);
    expect(matchesProjectTypes([], "Maintenance")).toBe(true);
  });

  test("includes multiple selected types and excludes other types", () => {
    const selected = ["EPC", "Software Solutions"];
    expect(matchesProjectTypes(selected, "EPC")).toBe(true);
    expect(matchesProjectTypes(selected, "Software Solutions")).toBe(true);
    expect(matchesProjectTypes(selected, "Maintenance")).toBe(false);
  });
});