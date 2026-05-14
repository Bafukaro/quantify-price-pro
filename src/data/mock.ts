export const projects = [
  {
    id: "p-001",
    name: "Edifício Residencial Polana 12",
    location: "Maputo · Polana",
    client: "Imobiliária Costa do Sol, Lda.",
    totalMT: 18_540_000,
    spentPct: 42,
    phase: "Fase 2 — Alvenaria",
    updatedAt: "2026-05-04",
    phases: [
      { name: "Preliminares", pct: 100 },
      { name: "Estrutura", pct: 100 },
      { name: "Alvenaria", pct: 58 },
      { name: "Instalações", pct: 12 },
      { name: "Acabamentos", pct: 0 },
      { name: "Exteriores", pct: 0 },
    ],
    alerts: 3,
  },
  {
    id: "p-002",
    name: "Centro Logístico Beira",
    location: "Beira · Manga",
    client: "TransAfrica Cargo SA",
    totalMT: 24_900_000,
    spentPct: 67,
    phase: "Fase 3 — Instalações",
    updatedAt: "2026-05-05",
    phases: [
      { name: "Preliminares", pct: 100 },
      { name: "Estrutura", pct: 100 },
      { name: "Alvenaria", pct: 100 },
      { name: "Instalações", pct: 70 },
      { name: "Acabamentos", pct: 30 },
      { name: "Exteriores", pct: 10 },
    ],
    alerts: 1,
  },
  {
    id: "p-003",
    name: "Escola Primária Matola III",
    location: "Matola · Machava",
    client: "Município da Matola",
    totalMT: 8_120_000,
    spentPct: 15,
    phase: "Fase 1 — Estrutura",
    updatedAt: "2026-05-02",
    phases: [
      { name: "Preliminares", pct: 100 },
      { name: "Estrutura", pct: 28 },
      { name: "Alvenaria", pct: 0 },
      { name: "Instalações", pct: 0 },
      { name: "Acabamentos", pct: 0 },
      { name: "Exteriores", pct: 0 },
    ],
    alerts: 0,
  },
  {
    id: "p-004",
    name: "Clínica Privada Sommerschield",
    location: "Maputo · Sommerschield",
    client: "Saúde Atlântica Lda.",
    totalMT: 9_980_000,
    spentPct: 88,
    phase: "Fase 4 — Acabamentos",
    updatedAt: "2026-05-06",
    phases: [
      { name: "Preliminares", pct: 100 },
      { name: "Estrutura", pct: 100 },
      { name: "Alvenaria", pct: 100 },
      { name: "Instalações", pct: 100 },
      { name: "Acabamentos", pct: 75 },
      { name: "Exteriores", pct: 40 },
    ],
    alerts: 2,
  },
];

export const boqRows = {
  "Fase 0 — Preliminares": [
    { item: "0.1", desc: "Limpeza e desmatação do terreno", un: "m²", qty: 1240, p2019: 35, atual: 42, alert: false, materialId: null as string | null },
    { item: "0.2", desc: "Vedação provisória em chapa zincada", un: "m", qty: 180, p2019: 950, atual: 1180, alert: true, materialId: null },
    { item: "0.3", desc: "Instalação de estaleiro", un: "vg", qty: 1, p2019: 280000, atual: 320000, alert: false, materialId: null },
  ],
  "Fase 1 — Estrutura": [
    { item: "1.1", desc: "Betão armado em fundações C25/30", un: "m³", qty: 142, p2019: 8500, atual: 9800, alert: false, materialId: null },
    { item: "1.2", desc: "Aço A500 NR — varões nervurados", un: "kg", qty: 18450, p2019: 95, atual: 142, alert: true, materialId: "m-aco-a500-10" },
    { item: "1.3", desc: "Cofragem em madeira de pinho", un: "m²", qty: 980, p2019: 480, atual: 560, alert: false, materialId: null },
    { item: "1.4", desc: "Lajes maciças e², 18 cm", un: "m²", qty: 620, p2019: 2200, atual: 2680, alert: false, materialId: null },
  ],
  "Fase 2 — Alvenaria / Cobertura": [
    { item: "2.1", desc: "Tijolo cerâmico furado 11x20x30", un: "un", qty: 28400, p2019: 18, atual: 24, alert: false, materialId: "m-tijolo-furado" },
    { item: "2.2", desc: "Argamassa de assentamento 1:4", un: "m³", qty: 38, p2019: 5800, atual: 7100, alert: false, materialId: null },
    { item: "2.3", desc: "Chapa lacada para cobertura", un: "m²", qty: 410, p2019: 1100, atual: 1480, alert: true, materialId: null },
  ],
  "Fase 3 — Instalações": [
    { item: "3.1", desc: "Tubo PVC PN10 Ø 50mm", un: "m", qty: 320, p2019: 145, atual: 195, alert: false, materialId: "m-pvc-pn10-50" },
    { item: "3.2", desc: "Cabo eléctrico XV 3x2.5mm²", un: "m", qty: 880, p2019: 85, atual: 168, alert: true, materialId: "m-cabo-xv-25" },
    { item: "3.3", desc: "Quadro eléctrico 24 módulos", un: "un", qty: 4, p2019: 12500, atual: 18900, alert: true, materialId: null },
  ],
  "Fase 4 — Acabamentos": [
    { item: "4.1", desc: "Reboco areado fino interior", un: "m²", qty: 1860, p2019: 320, atual: 410, alert: false, materialId: null },
    { item: "4.2", desc: "Tinta plástica branca interior 2 mãos", un: "m²", qty: 1860, p2019: 95, atual: 138, alert: false, materialId: "m-tinta-15l" },
    { item: "4.3", desc: "Pavimento cerâmico 60x60 1ª esc.", un: "m²", qty: 480, p2019: 580, atual: 720, alert: false, materialId: null },
  ],
  "Fase 5 — Exteriores": [
    { item: "5.1", desc: "Pavê betão cinza 8 cm", un: "m²", qty: 380, p2019: 480, atual: 620, alert: false, materialId: null },
    { item: "5.2", desc: "Muro em blocos de cimento h=2m", un: "m", qty: 145, p2019: 1850, atual: 2240, alert: false, materialId: null },
  ],
};

export const priceRows = [
  { material: "Cimento Portland 42.5 (saco 50kg)", un: "saco", cat: "Cimento", fA: 580, fB: 605, fC: 720, mediana: 605, desvio: 19 },
  { material: "Aço A500 NR Ø10mm", un: "kg", cat: "Ferro", fA: 138, fB: 142, fC: 165, mediana: 142, desvio: 16 },
  { material: "Tubo PVC PN10 Ø 50mm", un: "m", cat: "PVC", fA: 185, fB: 195, fC: 240, mediana: 195, desvio: 23 },
  { material: "Cabo XV 3x2.5mm²", un: "m", cat: "Eléctrica", fA: 158, fB: 168, fC: 215, mediana: 168, desvio: 28 },
  { material: "Tinta plástica branca 15L", un: "balde", cat: "Tintas", fA: 4200, fB: 4450, fC: 4680, mediana: 4450, desvio: 5 },
  { material: "Tijolo furado 11x20x30", un: "un", cat: "Cimento", fA: 22, fB: 24, fC: 28, mediana: 24, desvio: 17 },
  { material: "Brita Nº 1 (granito)", un: "m³", cat: "Cimento", fA: 1850, fB: 1920, fC: 2380, mediana: 1920, desvio: 24 },
  { material: "Disjuntor bipolar 25A", un: "un", cat: "Eléctrica", fA: 480, fB: 520, fC: 640, mediana: 520, desvio: 23 },
];

export const auditEntries = [
  { dt: "2026-05-06 09:42", user: "Cláudia M. (Gestor)", item: "BoQ 1.2 — Aço A500 NR", from: "95 MT/kg", to: "142 MT/kg", delta: 49, just: "Actualização cotação Maio 2026 — Fornecedor B" },
  { dt: "2026-05-05 16:18", user: "Eng. Tomás R.", item: "BoQ 2.3 — Chapa lacada", from: "1100 MT/m²", to: "1480 MT/m²", delta: 35, just: "Aumento cambial USD/MZN, factura nº 2451" },
  { dt: "2026-05-05 11:02", user: "Cláudia M. (Gestor)", item: "Quantidade 1.1 — Betão fund.", from: "128 m³", to: "142 m³", delta: 11, just: "Revisão cálculo estrutural — eng. Mário" },
  { dt: "2026-05-04 14:50", user: "Eng. Tomás R.", item: "BoQ 3.2 — Cabo XV 3x2.5", from: "85 MT/m", to: "168 MT/m", delta: 98, just: "Cotação anterior desactualizada (2019)" },
  { dt: "2026-05-03 10:24", user: "Auditor S. Cossa", item: "Visualização — Audit Log", from: "—", to: "—", delta: 0, just: "Acesso de leitura — relatório mensal" },
  { dt: "2026-05-02 08:15", user: "Cláudia M. (Gestor)", item: "Novo projecto criado", from: "—", to: "Escola Matola III", delta: 0, just: "Adjudicação concurso público 14/2026" },
];

export const ganttTasks = [
  { name: "Preliminares & estaleiro", phase: "F0", start: 0, dur: 3, critical: false, progress: 100 },
  { name: "Fundações", phase: "F1", start: 2, dur: 5, critical: true, progress: 100 },
  { name: "Estrutura piso 1-3", phase: "F1", start: 6, dur: 8, critical: true, progress: 100 },
  { name: "Estrutura piso 4-6", phase: "F1", start: 12, dur: 6, critical: true, progress: 80 },
  { name: "Alvenaria interior", phase: "F2", start: 16, dur: 7, critical: false, progress: 58 },
  { name: "Cobertura", phase: "F2", start: 18, dur: 4, critical: false, progress: 30 },
  { name: "Instalações eléctricas", phase: "F3", start: 20, dur: 8, critical: true, progress: 12 },
  { name: "Instalações hidráulicas", phase: "F3", start: 21, dur: 7, critical: false, progress: 8 },
  { name: "Acabamentos interiores", phase: "F4", start: 26, dur: 9, critical: true, progress: 0 },
  { name: "Pavimentos exteriores", phase: "F5", start: 32, dur: 4, critical: false, progress: 0 },
  { name: "Vistoria & entrega", phase: "F5", start: 35, dur: 2, critical: true, progress: 0 },
];

export const phaseColors: Record<string, string> = {
  F0: "hsl(220 15% 55%)",
  F1: "hsl(211 47% 43%)",
  F2: "hsl(216 52% 25%)",
  F3: "hsl(38 92% 50%)",
  F4: "hsl(152 55% 38%)",
  F5: "hsl(280 40% 50%)",
};

export const fmtMT = (n: number) =>
  new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(n) + " MT";

// 3D Phase mapping → BoQ groups for cost breakdown per element
export type Phase3D = "fundacao" | "pilares" | "lajes" | "alvenaria" | "cobertura" | "acabamentos";

export const phase3DInfo: Record<Phase3D, {
  label: string;
  desc: string;
  items: { item: string; desc: string; un: string; qty: number; preco: number }[];
}> = {
  fundacao: {
    label: "Fundação",
    desc: "Sapatas, vigas de fundação e betão de limpeza",
    items: [
      { item: "F.1", desc: "Escavação manual em terreno comum", un: "m³", qty: 96, preco: 420 },
      { item: "F.2", desc: "Betão de limpeza C12/15", un: "m³", qty: 8.4, preco: 6800 },
      { item: "F.3", desc: "Betão armado C25/30 em sapatas", un: "m³", qty: 42, preco: 9800 },
      { item: "F.4", desc: "Aço A500 NR — sapatas", un: "kg", qty: 3850, preco: 142 },
    ],
  },
  pilares: {
    label: "Pilares (Arranques + Estrutura)",
    desc: "Pilares em betão armado — 18 colunas, 3 pisos",
    items: [
      { item: "P.1", desc: "Cofragem em pilares 30x30", un: "m²", qty: 145, preco: 560 },
      { item: "P.2", desc: "Betão C25/30 em pilares", un: "m³", qty: 14.6, preco: 9800 },
      { item: "P.3", desc: "Aço A500 NR — pilares", un: "kg", qty: 2240, preco: 142 },
    ],
  },
  lajes: {
    label: "Lajes",
    desc: "Lajes maciças e=18cm — 3 pisos",
    items: [
      { item: "L.1", desc: "Cofragem horizontal para lajes", un: "m²", qty: 288, preco: 480 },
      { item: "L.2", desc: "Lajes maciças e=18cm betão C25/30", un: "m²", qty: 288, preco: 2680 },
      { item: "L.3", desc: "Aço A500 NR — lajes", un: "kg", qty: 6480, preco: 142 },
    ],
  },
  alvenaria: {
    label: "Alvenaria",
    desc: "Paredes exteriores e interiores em tijolo cerâmico",
    items: [
      { item: "A.1", desc: "Tijolo cerâmico furado 11x20x30", un: "un", qty: 18400, preco: 24 },
      { item: "A.2", desc: "Argamassa de assentamento 1:4", un: "m³", qty: 26, preco: 7100 },
      { item: "A.3", desc: "Reboco areado fino", un: "m²", qty: 1240, preco: 410 },
    ],
  },
  cobertura: {
    label: "Cobertura",
    desc: "Estrutura e revestimento da cobertura",
    items: [
      { item: "C.1", desc: "Estrutura metálica de cobertura", un: "kg", qty: 1850, preco: 195 },
      { item: "C.2", desc: "Chapa lacada para cobertura", un: "m²", qty: 110, preco: 1480 },
      { item: "C.3", desc: "Caleiras e tubos de queda", un: "m", qty: 48, preco: 380 },
    ],
  },
  acabamentos: {
    label: "Acabamentos",
    desc: "Janelas, portas, pinturas e pavimentos",
    items: [
      { item: "AC.1", desc: "Janela alumínio c/ vidro duplo", un: "un", qty: 12, preco: 12500 },
      { item: "AC.2", desc: "Porta de entrada blindada", un: "un", qty: 1, preco: 38000 },
      { item: "AC.3", desc: "Tinta plástica branca interior", un: "m²", qty: 1240, preco: 138 },
      { item: "AC.4", desc: "Pavimento cerâmico 60x60", un: "m²", qty: 288, preco: 720 },
    ],
  },
};

export const phase3DTotals = (Object.entries(phase3DInfo) as [Phase3D, typeof phase3DInfo[Phase3D]][])
  .map(([k, v]) => ({
    key: k,
    label: v.label,
    total: v.items.reduce((a, i) => a + i.qty * i.preco, 0),
  }));