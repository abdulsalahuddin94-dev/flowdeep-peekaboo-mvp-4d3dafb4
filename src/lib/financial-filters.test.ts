import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { matchesProjectTypes } from "./financial-filters";

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