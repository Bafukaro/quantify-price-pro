import type { MeshInfo } from "@/components/three/UploadedModel";
import type { PhaseKey } from "@/components/three/BuildingModel";
import { marketMedian, materials } from "@/data/priceDb";

export type PhaseQty = {
  meshes: number;
  elements: number;
  volumeM3: number;
  areaM2: number;
  invalid: number;
};

export const EMPTY_QTY: PhaseQty = { meshes: 0, elements: 0, volumeM3: 0, areaM2: 0, invalid: 0 };

export const PHASES: PhaseKey[] = [
  "fundacao",
  "pilares",
  "lajes",
  "alvenaria",
  "cobertura",
  "acabamentos",
];

/** Agrega quantidades reais extraídas da malha, por fase construtiva (com overrides manuais). */
export function aggregateByPhase(
  meshes: MeshInfo[],
  overrides: Record<string, PhaseKey> = {}
): { byPhase: Record<PhaseKey, PhaseQty>; invalidTotal: number; elementsTotal: number } {
  const byPhase = Object.fromEntries(
    PHASES.map((p) => [p, { ...EMPTY_QTY }])
  ) as Record<PhaseKey, PhaseQty>;
  let invalidTotal = 0;
  let elementsTotal = 0;
  for (const m of meshes) {
    const phase = overrides[m.id] ?? m.phase;
    const b = byPhase[phase];
    if (!b) continue;
    const els = m.elementCount ?? 1;
    b.meshes += 1;
    b.elements += els;
    elementsTotal += els;
    if (m.valid) {
      b.volumeM3 += m.volumeM3 ?? 0;
      b.areaM2 += m.areaM2 ?? 0;
    } else {
      b.invalid += els;
      invalidTotal += els;
    }
  }
  return { byPhase, invalidTotal, elementsTotal };
}

/** Área de projecção útil: a área de superfície de um sólido fechado conta ambas as faces. */
const faceArea = (areaM2: number) => areaM2 / 2;

export type QtyLine = {
  item: string;
  desc: string;
  un: string;
  qty: number;
  preco: number;
  materialId: string;
  priced: boolean;
  basis: string;
  /** linha de aço — sujeita a rótulo "estimativa por rácio" quando não há armadura modelada */
  isSteel: boolean;
};

type Recipe = { materialId: string; desc: string; factor: number; basis: "volume" | "area" };

const RECIPES: Record<PhaseKey, { label: string; desc: string; recipes: Recipe[] }> = {
  fundacao: {
    label: "Fundação",
    desc: "Sapatas e vigas de fundação — betão armado C25/30",
    recipes: [
      { materialId: "m-cimento-42-5n-saco-50kg", desc: "Cimento 42,5N (7 sacos/m³ betão)", factor: 7, basis: "volume" },
      { materialId: "m-areia-de-rio-lavada", desc: "Areia de rio lavada (0,50 m³/m³)", factor: 0.5, basis: "volume" },
      { materialId: "m-brita-19-mm", desc: "Brita 19 mm (0,85 m³/m³)", factor: 0.85, basis: "volume" },
      { materialId: "m-aco-a500-10", desc: "Aço A500 NR (90 kg/m³)", factor: 90, basis: "volume" },
    ],
  },
  pilares: {
    label: "Pilares",
    desc: "Pilares em betão armado — taxa de armadura elevada",
    recipes: [
      { materialId: "m-cimento-42-5n-saco-50kg", desc: "Cimento 42,5N (8 sacos/m³)", factor: 8, basis: "volume" },
      { materialId: "m-areia-de-rio-lavada", desc: "Areia de rio lavada (0,45 m³/m³)", factor: 0.45, basis: "volume" },
      { materialId: "m-brita-19-mm", desc: "Brita 19 mm (0,85 m³/m³)", factor: 0.85, basis: "volume" },
      { materialId: "m-aco-a500-10", desc: "Aço A500 NR (130 kg/m³)", factor: 130, basis: "volume" },
    ],
  },
  lajes: {
    label: "Lajes",
    desc: "Lajes maciças em betão armado",
    recipes: [
      { materialId: "m-cimento-42-5n-saco-50kg", desc: "Cimento 42,5N (7,5 sacos/m³)", factor: 7.5, basis: "volume" },
      { materialId: "m-areia-de-rio-lavada", desc: "Areia de rio lavada (0,50 m³/m³)", factor: 0.5, basis: "volume" },
      { materialId: "m-brita-19-mm", desc: "Brita 19 mm (0,85 m³/m³)", factor: 0.85, basis: "volume" },
      { materialId: "m-aco-a500-10", desc: "Aço A500 NR (110 kg/m³)", factor: 110, basis: "volume" },
    ],
  },
  alvenaria: {
    label: "Alvenaria",
    desc: "Paredes em bloco de cimento + argamassa de assentamento",
    recipes: [
      { materialId: "m-bloco-de-cimento-190190390-200-mm", desc: "Bloco de cimento 190×190×390 (55 un/m³)", factor: 55, basis: "volume" },
      { materialId: "m-cimento-42-5n-saco-50kg", desc: "Cimento p/ argamassa (2 sacos/m³)", factor: 2, basis: "volume" },
      { materialId: "m-areia-fina-para-reboco", desc: "Areia fina p/ reboco (0,25 m³/m³)", factor: 0.25, basis: "volume" },
    ],
  },
  cobertura: {
    label: "Cobertura",
    desc: "Chapa metálica sobre estrutura de madeira",
    recipes: [
      { materialId: "m-chapa-ibr-0-5-mm", desc: "Chapa IBR 0,5 mm (1,15 m²/m² c/ sobreposição)", factor: 1.15, basis: "area" },
      { materialId: "m-madeira-estrutural-pinho-3876-38114", desc: "Madeira estrutural (2,5 m/m²)", factor: 2.5, basis: "area" },
    ],
  },
  acabamentos: {
    label: "Acabamentos",
    desc: "Pinturas, revestimentos e vãos",
    recipes: [
      { materialId: "m-tinta-pva-interior-20l-true-colour", desc: "Tinta PVA interior 20L (1 balde / 50 m²)", factor: 1 / 50, basis: "area" },
      { materialId: "m-azulejo-ceramico-parede", desc: "Revestimento cerâmico (1,05 m²/m²)", factor: 1.05, basis: "area" },
    ],
  },
};

export const phaseLabel = (p: PhaseKey) => RECIPES[p].label;
export const phaseDesc = (p: PhaseKey) => RECIPES[p].desc;

/** Converte quantidade geométrica real em linhas de orçamento com preço da Base de Preços. */
export function phaseLines(phase: PhaseKey, qty: PhaseQty): QtyLine[] {
  const { recipes } = RECIPES[phase];
  const area = faceArea(qty.areaM2);
  return recipes.map((r, i) => {
    const mat = materials.find((m) => m.id === r.materialId);
    const preco = mat ? marketMedian(r.materialId) : 0;
    const base = r.basis === "volume" ? qty.volumeM3 : area;
    return {
      item: `${phase.slice(0, 2).toUpperCase()}.${i + 1}`,
      desc: r.desc,
      un: mat?.unit ?? "un",
      qty: base * r.factor,
      preco,
      materialId: r.materialId,
      priced: !!mat && preco > 0,
      isSteel: /aco|aço/i.test(r.materialId),
      basis: r.basis === "volume" ? `${qty.volumeM3.toFixed(2)} m³ extraídos` : `${area.toFixed(2)} m² extraídos`,
    };
  });
}

export function phaseTotal(phase: PhaseKey, qty: PhaseQty): number {
  return phaseLines(phase, qty).reduce((a, l) => a + l.qty * l.preco, 0);
}
