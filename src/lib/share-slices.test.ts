import { describe, expect, it } from "vitest";
import { topShareSlices } from "./financial-filters";

const row = (name: string, Profit: number) => ({ name, Revenue: Profit * 4, Profit, margin: 25 });

describe("topShareSlices", () => {
  it("keeps every type when there are 6 or fewer", () => {
    const r = topShareSlices([1, 2, 3, 4, 5, 6].map((n) => row(`T${n}`, n)));
    expect(r.slices).toHaveLength(6);
    expect(r.others).toHaveLength(0);
  });
  it("shows the 6 largest plus one Others slice summing the rest", () => {
    const r = topShareSlices(Array.from({ length: 50 }, (_, i) => row(`T${i}`, i + 1)));
    expect(r.slices).toHaveLength(7);
    expect(r.slices[0].name).toBe("T49");
    expect(r.slices[6].name).toBe("Others · 44");
    expect(r.slices[6].Profit).toBe(990);
  });
});
