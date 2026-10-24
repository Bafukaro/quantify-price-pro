import type { PhaseKey } from "@/components/three/BuildingModel";
import { materials, marketMedianForCity } from "@/data/priceDb";

export type ManualLine = { id: string; phase: PhaseKey; description: string; unit: string; quantity: number; materialId: string | null };
export function manualLinePrice(line: ManualLine, location?: string) {
  const material = materials.find((m) => m.id === line.materialId);
  // Do not multiply an incompatible material unit by the measured quantity.
  return material && material.unit === line.unit ? marketMedianForCity(material.id, location) : 0;
}
export function manualTotal(lines: ManualLine[], location?: string) {
  return lines.reduce((total, line) => total + line.quantity * manualLinePrice(line, location), 0);
}