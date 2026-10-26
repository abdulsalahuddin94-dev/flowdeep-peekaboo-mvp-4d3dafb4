import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { topShareSlices } from "./financial-filters";

const row = (name: string, Profit: number) => ({ name, Revenue: Profit * 4, Profit, margin: 25 });

describe("topShareSlices", () => {
  it("keeps every type when there are 4 or fewer", () => {
    const r = topShareSlices([1, 2, 3, 4].map((n) => row(`T${n}`, n)));
    assert.equal(r.slices.length, 4);
    assert.equal(r.others.length, 0);
  });
  it("shows the 4 largest plus one Others slice summing the rest", () => {
    const r = topShareSlices(Array.from({ length: 50 }, (_, i) => row(`T${i}`, i + 1)));
    assert.equal(r.slices.length, 5);
    assert.equal(r.slices[0].name, "T49");
    assert.equal(r.slices[4].name, "Others · 46");
    assert.equal(r.slices[4].Profit, 1081);
  });
});
