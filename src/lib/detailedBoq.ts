import type { PhaseKey } from "@/components/three/BuildingModel";
import type { ElementGroup } from "@/workers/ifcWorker";
import { PHASES, phaseLabel, phaseLines, type QtyLine } from "@/lib/phaseQuantities";
import { boqDetailMatKey } from "@/lib/boqSource";
import type { PriceOverride } from "@/data/projects";

/**
 * BoQ DETALHADO — transforma os grupos de elementos extraídos do IFC
 * (classe + dimensões reais do bounding box) em artigos de medição legíveis:
 * nº de pilares por secção e altura, espessura e área de lajes, espessura/altura
 * e nº de blocos de alvenaria, área de cobertura, vãos, etc.
 *
 * As sub-linhas de materiais reutilizam exactamente as mesmas receitas e preços
 * usados no BoQ por fase — logo os totais batem certo com o resumo.
 */

export type DetailedLine = {
  code: string;
  phase: PhaseKey;
  ifcClass: string;
  /** artigo descritivo, ex. "Pilar em betão armado 0,30×0,30 m · h=3,00 m" */
  desc: string;
  /** unidade do artigo (un, m², m³, m) */
  un: string;
  /** quantidade do artigo na unidade acima */
  qty: number;
  count: number;
  volumeM3: number;
  areaM2: number;
  /** dados dimensionais úteis para conferência */
  dims: { thicknessM?: number; heightM?: number; lengthM?: number; widthM?: number; section?: string };
  /** nota de medição derivada (ex. nº de blocos) */
  note?: string;
  materials: QtyLine[];
  total: number;
  mixed: boolean;
};

export type DetailedPhase = {
  phase: PhaseKey;
  label: string;
  lines: DetailedLine[];
  count: number;
  volumeM3: number;
  areaM2: number;
  total: number;
};

const CLASS_PHASE: { rx: RegExp; phase: PhaseKey }[] = [
  { rx: /FOOTING|PILE|FOUNDATION/i, phase: "fundacao" },
  { rx: /COLUMN/i, phase: "pilares" },
  { rx: /ROOF/i, phase: "cobertura" },
  { rx: /SLAB|PLATE|BEAM|STAIRFLIGHT|STAIR/i, phase: "lajes" },
  { rx: /WALL|CURTAINWALL/i, phase: "alvenaria" },
  {
    rx: /FAN|DUCT|DAMPER|AIRTERMINAL|CABLESEGMENT|CABLECARRIER|FLOWSEGMENT|FLOWTERMINAL|SANITARYTERMINAL|VALVE|WIRINGTERMINAL/i,
    phase: "instalacoes",
  },
  { rx: /DOOR|WINDOW|COVERING|FURNISH|RAILING|FLOWFITTING/i, phase: "acabamentos" },
];

export function phaseOfClass(ifcClass: string): PhaseKey {
  for (const r of CLASS_PHASE) if (r.rx.test(ifcClass)) return r.phase;
  return "acabamentos";
}

const n2 = (v: number) => v.toFixed(2).replace(".", ",");
const pretty = (c: string) =>
  c.replace(/^IFC/i, "").replace(/STANDARDCASE|ELEMENTEDCASE/i, "").toLowerCase();

const CLASS_LABEL: Record<string, string> = {
  ifccolumn: "Pilar em betão armado",
  ifcbeam: "Viga em betão armado",
  ifcslab: "Laje maciça em betão armado",
  ifcroof: "Cobertura",
  ifcroofslab: "Laje de cobertura",
  ifcfooting: "Sapata de fundação",
  ifcpile: "Estaca",
  ifcwall: "Parede em alvenaria de bloco",
  ifcwallstandardcase: "Parede em alvenaria de bloco",
  ifccurtainwall: "Fachada em parede-cortina",
  ifcdoor: "Porta",
  ifcwindow: "Janela / vão envidraçado",
  ifcstair: "Escada",
  ifcstairflight: "Lance de escada",
  ifcrailing: "Guarda / corrimão",
  ifccovering: "Revestimento",
  ifcmember: "Elemento estrutural linear",
  ifcplate: "Painel / chapa",
};

/** Constrói o artigo detalhado de um grupo de elementos. */
function describe(g: ElementGroup) {
  const key = g.ifcClass.toLowerCase();
  const base = CLASS_LABEL[key] ?? `Elemento ${pretty(g.ifcClass)}`;
  const dx = g.dx, dy = g.dy, dz = g.dz;
  const horiz = [dx, dz].sort((a, b) => a - b);
  const all = [dx, dy, dz].sort((a, b) => a - b);
  const areaFace = g.areaM2 / 2; // sólido fechado → conta as duas faces

  if (/COLUMN|PILE/i.test(g.ifcClass)) {
    return {
      desc: `${base} ${n2(horiz[0])}×${n2(horiz[1])} m · h=${n2(dy)} m`,
      un: "un",
      qty: g.count,
      dims: { section: `${n2(horiz[0])}×${n2(horiz[1])} m`, heightM: dy },
      note: `${n2(g.volumeM3)} m³ de betão · ${n2(g.count * dy)} m de desenvolvimento vertical`,
    };
  }
  if (/BEAM|MEMBER/i.test(g.ifcClass)) {
    return {
      desc: `${base} ${n2(all[0])}×${n2(all[1])} m · L=${n2(all[2])} m`,
      un: "m",
      qty: g.count * all[2],
      dims: { section: `${n2(all[0])}×${n2(all[1])} m`, lengthM: all[2] },
      note: `${g.count} elementos · ${n2(g.volumeM3)} m³ de betão`,
    };
  }
  if (/SLAB|PLATE/i.test(g.ifcClass)) {
    const esp = Math.max(0.01, all[0]);
    const area = g.volumeM3 > 0 ? g.volumeM3 / esp : areaFace / 2;
    return {
      desc: `${base} · esp. ${n2(esp)} m · ${n2(area)} m²`,
      un: "m²",
      qty: area,
      dims: { thicknessM: esp, lengthM: all[2], widthM: all[1] },
      note: `${g.count} painéis · esp. ${n2(esp)} m · área ${n2(area)} m² · ${n2(g.volumeM3)} m³ de betão · cofragem ≈${n2(area)} m²`,
    };
  }
  if (/FOOTING/i.test(g.ifcClass)) {
    return {
      desc: `${base} ${n2(horiz[0])}×${n2(horiz[1])}×${n2(dy)} m`,
      un: "un",
      qty: g.count,
      dims: { section: `${n2(horiz[0])}×${n2(horiz[1])} m`, heightM: dy },
      note: `${g.count} sapatas · ${n2(g.volumeM3)} m³ de betão de fundação`,
    };
  }
  if (/WALL/i.test(g.ifcClass)) {
    const esp = Math.max(0.01, horiz[0]);
    const compr = horiz[1];
    const area = g.volumeM3 > 0 ? g.volumeM3 / esp : g.count * compr * dy;
    // blocos 190×190×390 assentes: ~12,5 un/m² (com juntas de 10 mm)
    const blocos = Math.ceil(area * 12.5);
    // tijolo furado 200×100×50 assente ao alto: ~50 un/m²
    const tijolos = Math.ceil(area * 50);
    return {
      desc: `${base} · esp. ${n2(esp)} m · h=${n2(dy)} m · ${n2(area)} m²`,
      un: "m²",
      qty: area,
      dims: { thicknessM: esp, heightM: dy, lengthM: compr },
      note: `${g.count} paredes · h=${n2(dy)} m · esp. ${n2(esp)} m · ≈${blocos.toLocaleString("pt-PT")} blocos 19×19×39 (ou ≈${tijolos.toLocaleString("pt-PT")} tijolos 20×10×5) · argamassa ≈${n2(area * 0.02)} m³`,
    };
  }
  if (/ROOF/i.test(g.ifcClass)) {
    const areaPlanta = areaFace;
    const areaChapa = areaPlanta * 1.15; // 15% de sobreposição/recorte
    // chapa de zinco ondulada 2,00 × 0,90 m → 1,80 m² brutos
    const chapas = Math.ceil(areaChapa / 1.8);
    // ripas/madres a 0,60 m de espaçamento
    const madres = Math.ceil(areaPlanta / 0.6);
    const parafusos = Math.ceil(chapas * 12);
    return {
      desc: `${base} · ${n2(areaPlanta)} m² em planta · esp. ${n2(all[0])} m`,
      un: "m²",
      qty: areaPlanta,
      dims: { thicknessM: all[0], heightM: dy },
      note: `${g.count} elementos de cobertura · ≈${chapas.toLocaleString("pt-PT")} chapas de zinco 2,00×0,90 m (15% sobreposição) · ≈${n2(madres * 0.6)} m de madres/ripas · ≈${parafusos.toLocaleString("pt-PT")} parafusos com anilha`,
    };
  }

  if (/DOOR|WINDOW/i.test(g.ifcClass)) {
    return {
      desc: `${base} ${n2(Math.max(dx, dz))}×${n2(dy)} m`,
      un: "un",
      qty: g.count,
      dims: { widthM: Math.max(dx, dz), heightM: dy },
      note: `${n2(g.count * Math.max(dx, dz) * dy)} m² de vão`,
    };
  }
  if (/COVERING|RAILING|STAIR/i.test(g.ifcClass)) {
    return {
      desc: `${base}${/COVERING/i.test(g.ifcClass) ? ` · esp. ${n2(all[0])} m` : ""}`,
      un: /COVERING/i.test(g.ifcClass) ? "m²" : "un",
      qty: /COVERING/i.test(g.ifcClass) ? areaFace : g.count,
      dims: { thicknessM: all[0], heightM: dy },
      note: `${g.count} elementos`,
    };
  }
  return {
    desc: `${base} ${n2(dx)}×${n2(dy)}×${n2(dz)} m`,
    un: "un",
    qty: g.count,
    dims: { heightM: dy },
    note: `${n2(g.volumeM3)} m³`,
  };
}

/** Agrupa por fase e devolve o BoQ detalhado pronto para ecrã/exportação. */
export function buildDetailedBoQ(
  groups: ElementGroup[],
  overridePhase?: (ifcClass: string) => PhaseKey | undefined,
  priceOverrides?: Record<string, PriceOverride>
): DetailedPhase[] {
  const byPhase = new Map<PhaseKey, DetailedLine[]>();
  const sorted = [...groups].sort((a, b) => b.volumeM3 - a.volumeM3 || b.count - a.count);

  sorted.forEach((g) => {
    const phase = overridePhase?.(g.ifcClass) ?? phaseOfClass(g.ifcClass);
    const d = describe(g);
    const materials = phaseLines(phase, {
      meshes: 1,
      elements: g.count,
      volumeM3: g.volumeM3,
      areaM2: g.areaM2,
      invalid: 0,
    });
    const list = byPhase.get(phase) ?? [];
    list.push({
      code: "",
      phase,
      ifcClass: g.ifcClass,
      desc: d.desc + (g.mixed ? " (dimensões variadas)" : ""),
      un: d.un,
      qty: d.qty,
      count: g.count,
      volumeM3: g.volumeM3,
      areaM2: g.areaM2 / 2,
      dims: d.dims,
      note: d.note,
      materials,
      total: materials.reduce((a, m) => a + m.qty * m.preco, 0),
      mixed: g.mixed,
    });
    byPhase.set(phase, list);
  });

  return PHASES.filter((p) => (byPhase.get(p)?.length ?? 0) > 0).map((p, pi) => {
    const lines = (byPhase.get(p) ?? []).map((l, i) => {
      const code = `${pi + 1}.${i + 1}`;
      // Aplica substituições manuais de preço (persistidas no projecto).
      const materials = l.materials.map((m) => {
        const ov = priceOverrides?.[boqDetailMatKey(code, m.item)];
        return ov ? { ...m, preco: ov.price, priced: true } : m;
      });
      return {
        ...l,
        code,
        materials,
        total: materials.reduce((a, m) => a + m.qty * m.preco, 0),
      };
    });
    return {
      phase: p,
      label: phaseLabel(p),
      lines,
      count: lines.reduce((a, l) => a + l.count, 0),
      volumeM3: lines.reduce((a, l) => a + l.volumeM3, 0),
      areaM2: lines.reduce((a, l) => a + l.areaM2, 0),
      total: lines.reduce((a, l) => a + l.total, 0),
    };
  });
}

export const detailedGrandTotal = (phases: DetailedPhase[]) =>
  phases.reduce((a, p) => a + p.total, 0);
