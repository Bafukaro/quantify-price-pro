import type { PhaseKey } from "@/components/three/BuildingModel";
import { phase3DInfo } from "@/data/mock";
import { setPriceCity } from "@/data/priceDb";
import { aggregateByPhase, phaseDesc, phaseLabel, phaseLines, PHASES } from "@/lib/phaseQuantities";
import type { StoredMeshInfo, PriceOverride } from "@/data/projects";
import type { RebarTakeoff } from "@/lib/rebar";

export type BoQLine = {
  item: string;
  desc: string;
  un: string;
  qty: number;
  preco: number;
  priced: boolean;
  materialId: string | null;
  isSteel: boolean;
  /** Presente quando o preço foi substituído manualmente pelo engenheiro. */
  edited?: PriceOverride;
};

/** Chave estável de uma linha do BoQ por fase: "<fase>::<artigo>". */
export const boqLineKey = (phase: string, item: string) => `${phase}::${item}`;
/** Chave de um material do BoQ detalhado: "det::<artigo>::<material>". */
export const boqDetailMatKey = (code: string, item: string) => `det::${code}::${item}`;

export type BoQSection = {
  key: PhaseKey;
  label: string;
  desc: string;
  lines: BoQLine[];
  total: number;
  volumeM3: number;
  areaM2: number;
  elements: number;
  invalid: number;
};

export type BoQSource = {
  sections: Record<PhaseKey, BoQSection>;
  order: PhaseKey[];
  hasReal: boolean;
  elementsTotal: number;
  invalidTotal: number;
  /** Takeoff de armadura extraído do IFC (IfcReinforcingBar) — null quando não modelada. */
  rebar: RebarTakeoff | null;
  /** Rótulo honesto da origem dos números — usado no ecrã E nas exportações. */
  originLabel: string;
};

/**
 * ÚNICA fonte de verdade para o BoQ: quantidades reais extraídas do modelo
 * carregado (com overrides manuais) ou, na sua ausência, os valores de caso de
 * estudo — nunca uma mistura das duas.
 */
export function buildBoQSource(opts: {
  location?: string;
  meshes: StoredMeshInfo[];
  overrides: Record<string, PhaseKey>;
  rebar?: RebarTakeoff | null;
  priceOverrides?: Record<string, PriceOverride>;
}): BoQSource {
  setPriceCity(opts.location);
  const po = opts.priceOverrides ?? {};
  const hasReal = opts.meshes.length > 0;
  const { byPhase, elementsTotal, invalidTotal } = aggregateByPhase(opts.meshes as any, opts.overrides);
  const sections = {} as Record<PhaseKey, BoQSection>;
  for (const p of PHASES) {
    const q = byPhase[p];
    const lines: BoQLine[] = hasReal
      ? phaseLines(p, q).map((l) => {
          const ov = po[boqLineKey(p, l.item)];
          return {
            item: l.item,
            desc: l.desc,
            un: l.un,
            qty: l.qty,
            preco: ov ? ov.price : l.preco,
            priced: l.priced || !!ov,
            materialId: l.materialId,
            isSteel: l.isSteel,
            edited: ov,
          };
        })
      : phase3DInfo[p].items.map((i) => {
          const ov = po[boqLineKey(p, i.item)];
          return {
            ...i,
            preco: ov ? ov.price : i.preco,
            priced: true,
            materialId: null,
            isSteel: false,
            edited: ov,
          };
        });
    sections[p] = {
      key: p,
      label: hasReal ? phaseLabel(p) : phase3DInfo[p].label,
      desc: hasReal ? phaseDesc(p) : phase3DInfo[p].desc,
      lines,
      total: lines.reduce((a, l) => a + l.qty * l.preco, 0),
      volumeM3: q.volumeM3,
      areaM2: q.areaM2 / 2,
      elements: q.elements,
      invalid: q.invalid,
    };
  }
  return {
    sections,
    order: PHASES,
    hasReal,
    elementsTotal,
    invalidTotal,
    rebar: opts.rebar ?? null,
    originLabel: hasReal
      ? `Quantidades extraídas do modelo 3D carregado (${elementsTotal} elementos) × preços da Base de Preços`
      : "CASO DE ESTUDO — sem modelo 3D carregado (valores de referência, não extraídos)",
  };
}

export const boqGrandTotal = (src: BoQSource) =>
  src.order.reduce((a, p) => a + src.sections[p].total, 0);
