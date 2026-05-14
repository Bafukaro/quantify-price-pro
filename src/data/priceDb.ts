// Real price database — formal (catalog/invoice) + informal (market survey/photo) quotes.
// All prices in MT (Metical). Computes mediana, mean, std, per-quote deviation and
// risk classification dynamically.

export type SourceType = "formal" | "informal";

export type Supplier = {
  id: string;
  name: string;
  type: SourceType; // formal: registered company w/ catalog; informal: street market / mercado
  location: string;
  rating: number; // 1-5
};

export type Quote = {
  supplierId: string;
  price: number;
  date: string; // ISO YYYY-MM-DD
  invoice?: string;
  hasPhoto?: boolean;
};

export type Material = {
  id: string;
  name: string;
  unit: string;
  category: "Cimento" | "Ferro" | "PVC" | "Eléctrica" | "Tintas" | "Madeira" | "Agregados";
  quotes: Quote[];
};

export const suppliers: Supplier[] = [
  { id: "s-cimentos-mz", name: "Cimentos de Moçambique", type: "formal", location: "Matola", rating: 4.6 },
  { id: "s-construmac", name: "ConstruMac SA", type: "formal", location: "Maputo · Baixa", rating: 4.3 },
  { id: "s-acobeira", name: "AçoBeira Lda.", type: "formal", location: "Beira", rating: 4.1 },
  { id: "s-ferromax", name: "FerroMax Importadora", type: "formal", location: "Maputo · Machava", rating: 4.0 },
  { id: "s-electrocenter", name: "ElectroCenter", type: "formal", location: "Maputo · Sommerschield", rating: 4.2 },
  { id: "s-tintascolor", name: "Tintas Color SA", type: "formal", location: "Matola", rating: 4.4 },
  { id: "s-mercado-xipa", name: "Mercado Xipamanine", type: "informal", location: "Maputo · Xipamanine", rating: 3.4 },
  { id: "s-mercado-zimpeto", name: "Estaleiros Zimpeto", type: "informal", location: "Maputo · Zimpeto", rating: 3.2 },
  { id: "s-feira-beira", name: "Feira de Materiais Beira", type: "informal", location: "Beira · Manga", rating: 3.0 },
  { id: "s-ambulante-matola", name: "Ambulante Matola Gare", type: "informal", location: "Matola Gare", rating: 2.7 },
];

export const materials: Material[] = [
  {
    id: "m-cimento-425",
    name: "Cimento Portland 42.5 (saco 50kg)",
    unit: "saco",
    category: "Cimento",
    quotes: [
      { supplierId: "s-cimentos-mz", price: 580, date: "2026-05-02", invoice: "FT-2026/4521" },
      { supplierId: "s-construmac", price: 605, date: "2026-05-04", invoice: "FT-2026/881" },
      { supplierId: "s-mercado-xipa", price: 720, date: "2026-05-05", hasPhoto: true },
      { supplierId: "s-mercado-zimpeto", price: 690, date: "2026-05-03", hasPhoto: true },
    ],
  },
  {
    id: "m-aco-a500-10",
    name: "Aço A500 NR Ø10mm",
    unit: "kg",
    category: "Ferro",
    quotes: [
      { supplierId: "s-ferromax", price: 138, date: "2026-05-01", invoice: "FT-A/3210" },
      { supplierId: "s-acobeira", price: 142, date: "2026-05-04", invoice: "FT-B/0812" },
      { supplierId: "s-construmac", price: 148, date: "2026-05-02" },
      { supplierId: "s-mercado-xipa", price: 165, date: "2026-05-05", hasPhoto: true },
    ],
  },
  {
    id: "m-pvc-pn10-50",
    name: "Tubo PVC PN10 Ø 50mm",
    unit: "m",
    category: "PVC",
    quotes: [
      { supplierId: "s-construmac", price: 185, date: "2026-05-03", invoice: "FT-C/1102" },
      { supplierId: "s-electrocenter", price: 195, date: "2026-05-04" },
      { supplierId: "s-feira-beira", price: 240, date: "2026-05-05", hasPhoto: true },
      { supplierId: "s-ambulante-matola", price: 220, date: "2026-05-02", hasPhoto: true },
    ],
  },
  {
    id: "m-cabo-xv-25",
    name: "Cabo XV 3x2.5mm²",
    unit: "m",
    category: "Eléctrica",
    quotes: [
      { supplierId: "s-electrocenter", price: 158, date: "2026-05-04", invoice: "FT-E/4422" },
      { supplierId: "s-construmac", price: 168, date: "2026-05-02" },
      { supplierId: "s-mercado-zimpeto", price: 215, date: "2026-05-05", hasPhoto: true },
      { supplierId: "s-feira-beira", price: 198, date: "2026-05-03", hasPhoto: true },
    ],
  },
  {
    id: "m-tinta-15l",
    name: "Tinta plástica branca 15L",
    unit: "balde",
    category: "Tintas",
    quotes: [
      { supplierId: "s-tintascolor", price: 4200, date: "2026-05-04", invoice: "FT-T/0091" },
      { supplierId: "s-construmac", price: 4450, date: "2026-05-03" },
      { supplierId: "s-mercado-xipa", price: 4680, date: "2026-05-05", hasPhoto: true },
    ],
  },
  {
    id: "m-tijolo-furado",
    name: "Tijolo furado 11x20x30",
    unit: "un",
    category: "Cimento",
    quotes: [
      { supplierId: "s-cimentos-mz", price: 22, date: "2026-05-02", invoice: "FT-2026/4810" },
      { supplierId: "s-construmac", price: 24, date: "2026-05-04" },
      { supplierId: "s-mercado-xipa", price: 28, date: "2026-05-05", hasPhoto: true },
      { supplierId: "s-mercado-zimpeto", price: 26, date: "2026-05-03", hasPhoto: true },
    ],
  },
  {
    id: "m-brita-1",
    name: "Brita Nº 1 (granito)",
    unit: "m³",
    category: "Agregados",
    quotes: [
      { supplierId: "s-cimentos-mz", price: 1850, date: "2026-05-02", invoice: "FT-2026/4901" },
      { supplierId: "s-construmac", price: 1920, date: "2026-05-03" },
      { supplierId: "s-feira-beira", price: 2380, date: "2026-05-05", hasPhoto: true },
      { supplierId: "s-ambulante-matola", price: 2200, date: "2026-05-04", hasPhoto: true },
    ],
  },
  {
    id: "m-disjuntor-25",
    name: "Disjuntor bipolar 25A",
    unit: "un",
    category: "Eléctrica",
    quotes: [
      { supplierId: "s-electrocenter", price: 480, date: "2026-05-04", invoice: "FT-E/4501" },
      { supplierId: "s-construmac", price: 520, date: "2026-05-03" },
      { supplierId: "s-mercado-xipa", price: 640, date: "2026-05-05", hasPhoto: true },
    ],
  },
];

// === Statistics ===
export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length);
}

export type RiskLevel = "normal" | "atencao" | "alto";
export function classifyRisk(deviationPct: number): RiskLevel {
  const d = Math.abs(deviationPct);
  if (d <= 10) return "normal";
  if (d <= 20) return "atencao";
  return "alto";
}
export const RISK_LABEL: Record<RiskLevel, string> = {
  normal: "Normal",
  atencao: "Atenção",
  alto: "Alto risco",
};
export const RISK_COLOR: Record<RiskLevel, string> = {
  normal: "text-success bg-success/10",
  atencao: "text-warning bg-warning/10",
  alto: "text-destructive bg-destructive/10",
};

export type MaterialStats = {
  material: Material;
  prices: number[];
  min: number;
  max: number;
  median: number;
  mean: number;
  std: number;
  spreadPct: number; // (max-min)/median
  byQuote: Array<{
    quote: Quote;
    supplier: Supplier;
    deviationPct: number;
    risk: RiskLevel;
  }>;
  topRisk: RiskLevel;
};

export function getStats(materialId: string): MaterialStats | null {
  const m = materials.find((x) => x.id === materialId);
  if (!m) return null;
  const prices = m.quotes.map((q) => q.price);
  const med = median(prices);
  const byQuote = m.quotes.map((q) => {
    const supplier = suppliers.find((s) => s.id === q.supplierId)!;
    const deviationPct = med ? ((q.price - med) / med) * 100 : 0;
    return { quote: q, supplier, deviationPct, risk: classifyRisk(deviationPct) };
  });
  const topRisk: RiskLevel = byQuote.some((x) => x.risk === "alto")
    ? "alto"
    : byQuote.some((x) => x.risk === "atencao")
      ? "atencao"
      : "normal";
  return {
    material: m,
    prices,
    min: Math.min(...prices),
    max: Math.max(...prices),
    median: med,
    mean: mean(prices),
    std: stdDev(prices),
    spreadPct: med ? ((Math.max(...prices) - Math.min(...prices)) / med) * 100 : 0,
    byQuote,
    topRisk,
  };
}

export function allStats(): MaterialStats[] {
  return materials.map((m) => getStats(m.id)!).filter(Boolean) as MaterialStats[];
}

export function marketMedian(materialId: string): number {
  return getStats(materialId)?.median ?? 0;
}