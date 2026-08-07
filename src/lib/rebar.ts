/** Takeoff real de armadura a partir de IfcReinforcingBar. */
export type RebarDiameterLine = {
  /** diâmetro nominal em mm */
  diameterMm: number;
  bars: number;
  lengthM: number;
  massKg: number;
};

export type RebarTakeoff = {
  byDiameter: RebarDiameterLine[];
  totalBars: number;
  totalLengthM: number;
  totalMassKg: number;
  /** true quando o ficheiro IFC continha armadura modelada */
  modelled: true;
};

const STEEL_DENSITY = 7850; // kg/m³

export function barMassKg(diameterMm: number, lengthM: number) {
  const r = diameterMm / 2000; // mm → m
  return Math.PI * r * r * lengthM * STEEL_DENSITY;
}

/** Extrai e agrega IfcReinforcingBar por diâmetro nominal. Devolve null se não houver armadura modelada. */
export function extractRebar(api: any, modelID: number, WebIFC: any): RebarTakeoff | null {
  const typeCode = WebIFC?.IFCREINFORCINGBAR;
  if (typeCode == null) return null;
  let ids: any;
  try {
    ids = api.GetLineIDsWithType(modelID, typeCode);
  } catch {
    return null;
  }
  const size = typeof ids?.size === "function" ? ids.size() : 0;
  if (!size) return null;

  const acc = new Map<number, { bars: number; lengthM: number }>();
  for (let i = 0; i < size; i++) {
    let line: any;
    try {
      line = api.GetLine(modelID, ids.get(i), true);
    } catch {
      continue;
    }
    const rawDia = Number(line?.NominalDiameter?.value ?? line?.BarDiameter?.value ?? NaN);
    const rawLen = Number(line?.BarLength?.value ?? NaN);
    if (!Number.isFinite(rawDia) || rawDia <= 0) continue;
    // Diâmetro: se vier em metros (<1), converter para mm.
    const diameterMm = rawDia < 1 ? rawDia * 1000 : rawDia;
    // Comprimento: se vier em mm (>100), converter para metros.
    let lengthM = Number.isFinite(rawLen) && rawLen > 0 ? rawLen : 0;
    if (lengthM > 100) lengthM = lengthM / 1000;
    const key = Math.round(diameterMm);
    const cur = acc.get(key) ?? { bars: 0, lengthM: 0 };
    cur.bars += 1;
    cur.lengthM += lengthM;
    acc.set(key, cur);
  }
  if (acc.size === 0) return null;

  const byDiameter: RebarDiameterLine[] = [...acc.entries()]
    .map(([diameterMm, v]) => ({
      diameterMm,
      bars: v.bars,
      lengthM: v.lengthM,
      massKg: barMassKg(diameterMm, v.lengthM),
    }))
    .sort((a, b) => a.diameterMm - b.diameterMm);

  return {
    byDiameter,
    totalBars: byDiameter.reduce((a, l) => a + l.bars, 0),
    totalLengthM: byDiameter.reduce((a, l) => a + l.lengthM, 0),
    totalMassKg: byDiameter.reduce((a, l) => a + l.massKg, 0),
    modelled: true,
  };
}
