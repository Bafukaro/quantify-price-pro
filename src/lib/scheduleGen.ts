import type { PhaseKey } from "@/components/three/BuildingModel";
import { buildDetailedBoQ } from "@/lib/detailedBoq";
import type { DetailedPhase } from "@/lib/detailedBoq";
import type { ElementGroup } from "@/workers/ifcWorker";

/**
 * Cronograma dinâmico gerado a partir das quantidades reais do modelo
 * (mesma fonte do BoQ), com rendimentos de produção moçambicanos e
 * tempos de cura REBAP (Art. 68): sapatas 28 dias · pilares 7 dias · laje 14 dias.
 */

export type GenPhase = "Preliminares" | "Fundação" | "Estrutura" | "Alvenaria" | "Cobertura" | "Instalações" | "Acabamentos";

export type GeneratedTask = {
  name: string;
  phase: GenPhase;
  /** Semana de início (0-based). */
  startWeek: number;
  /** Duração em semanas. */
  durWeeks: number;
  kind: "trabalho" | "cura";
  critical: boolean;
  targetQty: number;
  unit: string;
  /** Justificação visível (rendimento / regra aplicada). */
  why: string;
};

export type GenResult = { tasks: GeneratedTask[]; warnings: string[] };

// ---- Rendimentos de produção (Moçambique — mão-de-obra local) ----
const R = {
  excavM3Day: 4, // escavação manual 4 m³/dia (cuadrilha de 2)
  blocosDay: 200, // blocos/dia por equipa de alvenaria
  chapasM2Day: 60, // chapa IBR m²/dia (equipa de cobertura)
  intPtsDay: 10, // pontos/dia por electricista+ajudante
  intHidPtsDay: 5, // pontos/dia por canalizador+ajudante
  pintM2Day: 90, // m²/dia por pintor
  rebocM2Day: 25, // reboco m²/dia por equipa
  pavM2Day: 20, // pavimento m²/dia por equipa
  vigaMetroDay: 6, // m lineares de viga/dia
  pilBetM3Day: 2, // betão de pilares m³/dia
  cofrM2Day: 20, // cofragem m²/dia
  açoKgDay: 150, // armadura kg/dia (pilpode armação)
  lajeBetM3Day: 6, // betão de laje m³/dia
  cimentoTonsDay: 5, // descarga/movimentação cimento t/dia
};
const WD = 6; // dias úteis por semana

const weeksFor = (qty: number, perDay: number, minW = 1, maxW = 12) =>
  Math.max(minW, Math.min(maxW, Math.ceil(qty / (perDay * WD))));

// ---- helpers de extração das quantidades ----

type PhaseQty = { volumeM3: number; areaM2: number; elements: number };

function groupQty(lines: { materials: { item: string; qty: number }[] }[], re: RegExp) {
  let qty = 0;
  let unit = "";
  for (const l of lines)
    for (const m of l.materials)
      if (re.test(m.item)) {
        qty += m.qty;
        unit = m.item;
      }
  return { qty, unit };
}

function findMaterial(phases: DetailedPhase[], phase: PhaseKey, re: RegExp) {
  const sec = phases.find((p) => p.phase === phase);
  if (!sec) return { qty: 0, un: "" };
  let qty = 0;
  let un = "";
  for (const l of sec.lines)
    for (const m of l.materials)
      if (re.test(m.item)) {
        qty += m.qty;
        un = m.un;
      }
  return { qty, un };
}

function steelKg(phases: DetailedPhase[], phase: PhaseKey) {
  const a = findMaterial(phases, phase, /^A500 \u00d8 8mm/);
  const b = findMaterial(phases, phase, /^A500 \u00d8 12mm/);
  return a.qty + b.qty;
}

/** Contagem de pilares + volume de betão de pilares a partir dos grupos IFC. */
function pilarStats(groups: ElementGroup[]) {
  let count = 0;
  let vol = 0;
  for (const g of groups)
    if (g.ifcClass === "IfcColumn") {
      count += g.count;
      vol += g.volumeM3;
    }
  return { count, vol };
}

/** Contagem de lajes + volume + área a partir dos grupos IFC. */
function lajeStats(groups: ElementGroup[]) {
  let count = 0;
  let vol = 0;
  let area = 0;
  for (const g of groups)
    if (g.ifcClass === "IfcSlab") {
      count += g.count;
      vol += g.volumeM3;
      area += g.areaM2 / 2;
    }
  return { count, vol, area };
}

/** Blocos a partir das paredes modeladas (0,35 blocos/m² de parede → fase Alvenaria). */
function blocosStats(groups: ElementGroup[]) {
  let count = 0;
  let area = 0;
  for (const g of groups)
    if (g.ifcClass === "IfcWall" || g.ifcClass === "IfcWallStandardCase") {
      count += g.count;
      area += g.areaM2 / 2;
    }
  return { count, area };
}

/**
 * Gera o cronograma completo. `byPhase` vem de projects.quantities.byPhase
 * (quantidades reais agregadas por fase); `groups` são os grupos de elementos
 * IFC com dimensões reais (mesma fonte do BoQ detalhado).
 */
export function generateDynamicSchedule(opts: {
  groups: ElementGroup[];
  byPhase: Partial<Record<PhaseKey, PhaseQty>>;
}): GenResult {
  const { groups, byPhase } = opts;
  const det = buildDetailedBoQ(groups);
  const warnings: string[] = [];
  const tasks: GeneratedTask[] = [];
  const push = (t: GeneratedTask) => void tasks.push(t);

  const fund = byPhase.fundacao ?? { volumeM3: 0, areaM2: 0, elements: 0 };
  const alv = byPhase.alvenaria ?? { volumeM3: 0, areaM2: 0, elements: 0 };
  const cob = byPhase.cobertura ?? { volumeM3: 0, areaM2: 0, elements: 0 };
  const inst = byPhase.instalacoes ?? { volumeM3: 0, areaM2: 0, elements: 0 };
  const acab = byPhase.acabamentos ?? { volumeM3: 0, areaM2: 0, elements: 0 };

  const pil = pilarStats(groups);
  const laje = lajeStats(groups);
  const walls = blocosStats(groups);

  // ---- Semana 0 — Preliminares ----
  push({
    name: "Mobilização e limpeza do estaleiro",
    phase: "Preliminares",
    startWeek: 0,
    durWeeks: 1,
    kind: "trabalho",
    critical: false,
    targetQty: 0,
    unit: "un",
    why: "Duração fixa de estaleiro — 1 semana",
  });
  push({
    name: "Instalação de estaleiro e ligações provisórias",
    phase: "Preliminares",
    startWeek: 0,
    durWeeks: 1,
    kind: "trabalho",
    critical: false,
    targetQty: 0,
    unit: "un",
    why: "Em paralelo com a mobilização",
  });

  // ---- Fundação ----
  const escQty = Math.round(fund.volumeM3 * 1.3); // escavação ≈ volume da fundação × 1,3 (taludes/empotramento)
  const escW = weeksFor(escQty, R.excavM3Day);
  push({
    name: `Escavação manual (${escQty.toLocaleString("pt-PT")} m³)`,
    phase: "Fundação",
    startWeek: 1,
    durWeeks: escW,
    kind: "trabalho",
    critical: true,
    targetQty: escQty,
    unit: "m³",
    why: `${escQty} m³ ÷ ${R.excavM3Day} m³/dia × ${WD} d/sem = ${escW} sem`,
  });

  const sapVol = Math.max(0, fund.volumeM3);
  const sapBet = findMaterial(det, "fundacao", /^Betão/);
  const sapAco = steelKg(det, "fundacao");
  const sapW = weeksFor(Math.max(sapVol, 1), R.vigaMetroDay * 2, 1, 8);
  const sapStart = 1 + escW;
  push({
    name: `Sapatas — cofragem, armadura e betonagem (${sapVol.toFixed(1)} m³)`,
    phase: "Fundação",
    startWeek: sapStart,
    durWeeks: sapW,
    kind: "trabalho",
    critical: true,
    targetQty: Number(sapVol.toFixed(1)),
    unit: "m³",
    why: sapBet.qty
      ? `Betão ${sapBet.qty.toFixed(1)} m³ + aço ${Math.round(sapAco)} kg — rendimento ${R.vigaMetroDay * 2} m³/dia eq.`
      : `Volume de fundação extraído do modelo (${sapVol.toFixed(1)} m³)`,
  });
  // Cura REBAP Art. 68 — sapatas: 28 dias
  push({
    name: "Cura REBAP Art. 68 — sapatas (28 dias)",
    phase: "Fundação",
    startWeek: sapStart + sapW,
    durWeeks: 4,
    kind: "cura",
    critical: true,
    targetQty: 0,
    unit: "dias",
    why: "REBAP Art. 68 — cura mínima de betão em elementos de fundação: 28 dias",
  });
  const aposSapatas = sapStart + sapW + 4;

  // ---- Estrutura — pilares ----
  const pilW = weeksFor(Math.max(pil.count, 1), 6, 1, 12); // ~6 pilares/semana
  push({
    name: `Pilares (${pil.count} un) — cofragem, armação e betonagem`,
    phase: "Estrutura",
    startWeek: aposSapatas,
    durWeeks: pilW,
    kind: "trabalho",
    critical: true,
    targetQty: pil.count,
    unit: "un",
    why: `${pil.count} pilares ÷ 6 pilares/sem = ${pilW} sem`,
  });
  // Cura REBAP — pilares: 7 dias
  push({
    name: "Cura REBAP Art. 68 — pilares (7 dias)",
    phase: "Estrutura",
    startWeek: aposSapatas + pilW,
    durWeeks: 1,
    kind: "cura",
    critical: true,
    targetQty: 0,
    unit: "dias",
    why: "REBAP Art. 68 — cura mínima de pilares antes da desforma: 7 dias",
  });
  const aposPilares = aposSapatas + pilW + 1;

  // ---- Estrutura — laje ----
  const lajeW = weeksFor(Math.max(laje.count, 1), 3, 1, 8); // ~3 lajes/semana (cofr.+arm.+betão)
  push({
    name: `Laje (${laje.count} un · ${laje.vol.toFixed(1)} m³) — cofragem, armação e betonagem`,
    phase: "Estrutura",
    startWeek: aposPilares,
    durWeeks: lajeW,
    kind: "trabalho",
    critical: true,
    targetQty: laje.count,
    unit: "un",
    why: `${laje.count} lajes ÷ 3 lajes/sem = ${lajeW} sem`,
  });
  // Cura REBAP — laje: 14 dias
  push({
    name: "Cura REBAP Art. 68 — laje (14 dias)",
    phase: "Estrutura",
    startWeek: aposPilares + lajeW,
    durWeeks: 2,
    kind: "cura",
    critical: true,
    targetQty: 0,
    unit: "dias",
    why: "REBAP Art. 68 — cura mínima de laje antes de carregamento: 14 dias",
  });
  const aposLaje = aposPilares + lajeW + 2;

  // ---- Alvenaria ----
  const blocosMat = findMaterial(det, "alvenaria", /Bloco/);
  const blocos = Math.round(blocosMat.qty || walls.area * 12.5); // fallback: ~12,5 blocos/m²
  const alvW = weeksFor(Math.max(blocos, 1), R.blocosDay);
  push({
    name: `Alvenaria (${blocos.toLocaleString("pt-PT")} blocos)`,
    phase: "Alvenaria",
    startWeek: aposLaje,
    durWeeks: alvW,
    kind: "trabalho",
    critical: true,
    targetQty: blocos,
    unit: "un",
    why: blocosMat.qty
      ? `${blocos} blocos ÷ ${R.blocosDay} blocos/dia × ${WD} d/sem = ${alvW} sem`
      : `${walls.area.toFixed(0)} m² de paredes × 12,5 blocos/m² ÷ ${R.blocosDay}/dia = ${alvW} sem`,
  });
  const aposAlvenaria = aposLaje + alvW;

  // ---- Cobertura ----
  const cobM2 = Math.round(cob.areaM2);
  const cobW = weeksFor(Math.max(cobM2, 1), R.chapasM2Day);
  push({
    name: `Cobertura IBR (${cobM2.toLocaleString("pt-PT")} m²)`,
    phase: "Cobertura",
    startWeek: aposAlvenaria,
    durWeeks: cobW,
    kind: "trabalho",
    critical: true,
    targetQty: cobM2,
    unit: "m²",
    why: `${cobM2} m² ÷ ${R.chapasM2Day} m²/dia × ${WD} d/sem = ${cobW} sem`,
  });

  // ---- Instalações (não críticas — correm em paralelo) ----
  const ptsEl = Math.round(inst.elements || 0);
  const elW = weeksFor(Math.max(ptsEl, 1), R.intPtsDay);
  push({
    name: `Instalação eléctrica (${ptsEl} pontos)`,
    phase: "Instalações",
    startWeek: aposLaje,
    durWeeks: elW,
    kind: "trabalho",
    critical: false,
    targetQty: ptsEl,
    unit: "pt",
    why: `${ptsEl} pontos ÷ ${R.intPtsDay} pt/dia × ${WD} d/sem = ${elW} sem — em paralelo com alvenaria`,
  });
  const hidW = Math.max(1, Math.round(elW / 2));
  push({
    name: "Instalação hidráulica",
    phase: "Instalações",
    startWeek: aposLaje + 1,
    durWeeks: hidW,
    kind: "trabalho",
    critical: false,
    targetQty: 0,
    unit: "un",
    why: `≈ metade da duração eléctrica (${R.intHidPtsDay} pt/dia) — em paralelo`,
  });

  // ---- Acabamentos ----
  const rebocoM2 = Math.round((alv.areaM2 || walls.area) * 2);
  const rebW = weeksFor(Math.max(rebocoM2, 1), R.rebocM2Day);
  push({
    name: `Reboco interior (${rebocoM2.toLocaleString("pt-PT")} m²)`,
    phase: "Acabamentos",
    startWeek: aposAlvenaria,
    durWeeks: rebW,
    kind: "trabalho",
    critical: false,
    targetQty: rebocoM2,
    unit: "m²",
    why: `${rebocoM2} m² ÷ ${R.rebocM2Day} m²/dia × ${WD} d/sem = ${rebW} sem`,
  });
  const pintM2 = rebocoM2;
  const pintW = weeksFor(Math.max(pintM2, 1), R.pintM2Day);
  const pavM2 = Math.round(acab.areaM2 || laje.area);
  const pavW = weeksFor(Math.max(pavM2, 1), R.pavM2Day);
  push({
    name: `Pavimentos (${pavM2.toLocaleString("pt-PT")} m²)`,
    phase: "Acabamentos",
    startWeek: aposAlvenaria + rebW,
    durWeeks: pavW,
    kind: "trabalho",
    critical: false,
    targetQty: pavM2,
    unit: "m²",
    why: `${pavM2} m² ÷ ${R.pavM2Day} m²/dia × ${WD} d/sem = ${pavW} sem`,
  });
  push({
    name: `Pintura (${pintM2.toLocaleString("pt-PT")} m²)`,
    phase: "Acabamentos",
    startWeek: aposAlvenaria + rebW + Math.max(0, pavW - 1),
    durWeeks: pintW,
    kind: "trabalho",
    critical: true,
    targetQty: pintM2,
    unit: "m²",
    why: `${pintM2} m² ÷ ${R.pintM2Day} m²/dia × ${WD} d/sem = ${pintW} sem`,
  });
  const fimTrabalhos = aposAlvenaria + rebW + Math.max(pavW, pintW);

  // ---- Fecho ----
  push({
    name: "Limpeza final, ensaios e entrega",
    phase: "Acabamentos",
    startWeek: fimTrabalhos,
    durWeeks: 2,
    kind: "trabalho",
    critical: true,
    targetQty: 0,
    unit: "un",
    why: "Ensaios finais + vistoria — 2 semanas",
  });

  // ---- Avisos de cobertura ----
  if (pil.count === 0) warnings.push("Pilares não encontrados no modelo — duração assumida (1 un/semana).");
  if (laje.count === 0) warnings.push("Lajes não encontradas no modelo — duração assumida.");
  if (!blocosMat.qty) warnings.push("Blocos estimados por área de paredes (12,5 blocos/m²) — receita de alvenaria sem linha de blocos.");
  const estrVol = (byPhase.pilares?.volumeM3 ?? 0) + (byPhase.lajes?.volumeM3 ?? 0);
  if (estrVol === 0 && fund.volumeM3 === 0) warnings.push("Quantidades de estrutura/fundação ausentes — verifique o modelo carregado.");

  return { tasks: tasks.sort((a, b) => a.startWeek - b.startWeek), warnings };
}
