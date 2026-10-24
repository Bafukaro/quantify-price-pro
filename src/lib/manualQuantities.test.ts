import { describe, it, expect } from "vitest";
import { buildBoQSource, boqGrandTotal } from "./boqSource";
import { generateManualSchedule } from "./scheduleGen";
import type { ManualLine } from "./manualQuantities";

const lines: ManualLine[] = [
  { id: "1", phase: "fundacao", description: "Brita", unit: "m³", quantity: 2, materialId: "m-brita-1" },
  { id: "2", phase: "pilares", description: "Aço", unit: "kg", quantity: 10, materialId: "m-aco-a500-10" },
  { id: "3", phase: "alvenaria", description: "Tijolos", unit: "un", quantity: 100, materialId: "m-tijolo-furado" },
];
describe("manual source rules", () => {
  it("uses only the three entered quantities and calculates phase and overall totals", () => {
    const source = buildBoQSource({ meshes: [], overrides: {}, quantitySource: "manual", manualLines: lines });
    expect(source.order.flatMap((p) => source.sections[p].lines)).toHaveLength(3);
    expect(source.sections.fundacao.total).toBe(4120);
    expect(source.sections.pilares.total).toBe(1450);
    expect(source.sections.alvenaria.total).toBe(2500);
    expect(boqGrandTotal(source)).toBe(8070);
  });
  it("does not substitute study values for an empty manual budget", () => {
    expect(boqGrandTotal(buildBoQSource({ meshes: [], overrides: {}, quantitySource: "manual" }))).toBe(0);
  });
  it("respects edited prices", () => {
    const source = buildBoQSource({ meshes: [], overrides: {}, quantitySource: "manual", manualLines: lines, priceOverrides: { "fundacao::1": { price: 1000, original: 2060, by: "", at: "", reason: "", supplier: "" } } });
    expect(source.sections.fundacao.total).toBe(2000);
  });
  it("keeps exact manual targets and units in schedule tasks", () => {
    expect(generateManualSchedule(lines).tasks.map((t) => [t.targetQty, t.unit])).toEqual([[2, "m³"], [10, "kg"], [100, "un"]]);
  });
});