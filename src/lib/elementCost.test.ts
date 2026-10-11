import { describe, it, expect } from "vitest";
import { elementCost } from "./elementCost";

const sec: any = {
  volumeM3: 10, areaM2: 50,
  lines: [{ item: "1", desc: "Betão", un: "m³", qty: 10, preco: 1000 }, { item: "2", desc: "Aço", un: "kg", qty: 1000, preco: 100 }],
};

describe("elementCost", () => {
  it("rateia cada linha pela quota de volume do elemento", () => {
    const c = elementCost(sec, { volumeM3: 2, areaM2: 0 })!;
    expect(c.share).toBeCloseTo(0.2);
    expect(c.lines[0].cost).toBeCloseTo(2000);
    expect(c.lines[1].cost).toBeCloseTo(20000);
    expect(c.total).toBeCloseTo(22000);
  });
  it("usa a área quando a fase não tem volume", () => {
    const c = elementCost({ ...sec, volumeM3: 0 }, { volumeM3: 0, areaM2: 5 })!;
    expect(c.share).toBeCloseTo(0.1);
  });
});
