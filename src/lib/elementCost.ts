import type { BoQSection } from "@/lib/boqSource";

export type ElementCostLine = { item: string; desc: string; un: string; preco: number; qty: number; cost: number };
export type ElementCost = { share: number; total: number; lines: ElementCostLine[] };

/**
 * Custo de UM elemento (expressID): cada linha do BoQ da fase é rateada pela
 * quota de volume do elemento na fase (fallback: área quando a fase não tem
 * volume). Soma de todos os elementos da fase = total da fase.
 */
export function elementCost(
  sec: BoQSection | undefined,
  el: { volumeM3: number; areaM2: number }
): ElementCost | null {
  if (!sec) return null;
  let share = 0;
  if (sec.volumeM3 > 0) share = el.volumeM3 / sec.volumeM3;
  else if (sec.areaM2 > 0) share = el.areaM2 / sec.areaM2;
  if (!isFinite(share) || share <= 0) return { share: 0, total: 0, lines: [] };
  const lines = sec.lines.map((l) => ({
    item: l.item,
    desc: l.desc,
    un: l.un,
    preco: l.preco,
    qty: l.qty * share,
    cost: l.qty * share * l.preco,
  }));
  return { share, total: lines.reduce((a, l) => a + l.cost, 0), lines };
}
