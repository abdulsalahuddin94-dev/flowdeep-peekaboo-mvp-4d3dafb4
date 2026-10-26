import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { topShareSlices } from "./financial-filters";

const row = (name: string, Profit: number) => ({ name, Revenue: Profit * 4, Profit, margin: 25 });

describe("topShareSlices", () => {
  it("keeps every type when there are 6 or fewer", () => {
    const r = topShareSlices([1, 2, 3, 4, 5, 6].map((n) => row(`T${n}`, n)));
    assert.equal(r.slices.length, 6);
    assert.equal(r.others.length, 0);
  });
  it("shows the 6 largest plus one Others slice summing the rest", () => {
    const r = topShareSlices(Array.from({ length: 50 }, (_, i) => row(`T${i}`, i + 1)));
    assert.equal(r.slices.length, 7);
    assert.equal(r.slices[0].name, "T49");
    assert.equal(r.slices[6].name, "Others · 44");
    assert.equal(r.slices[6].Profit, 990);
  });
});
