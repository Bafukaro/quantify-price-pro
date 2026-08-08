import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { RebarTakeoff } from "@/lib/rebar";

const safe = (s: string) => s.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
const n = (v: number, d = 0) => Number(v.toFixed(d));

function rows(rebar: RebarTakeoff) {
  return rebar.byDiameter.map((r) => ({
    "Ø (mm)": r.diameterMm,
    Varões: r.bars,
    "Comprimento (m)": n(r.lengthM, 1),
    "Massa (kg)": n(r.massKg, 1),
    "Massa média/varão (kg)": r.bars ? n(r.massKg / r.bars, 2) : 0,
  }));
}

const originLine =
  "Origem: extracção directa de IfcReinforcingBar do ficheiro IFC carregado (não é estimativa por rácio).";

export function exportRebarExcel(projectName: string, rebar: RebarTakeoff, phaseLabel?: string) {
  const wb = XLSX.utils.book_new();
  const title = phaseLabel
    ? `Takeoff de armadura — ${projectName} — fase ${phaseLabel}`
    : `Takeoff de armadura — ${projectName}`;
  const ws = XLSX.utils.aoa_to_sheet([
    [title],
    [originLine],
    [`Gerado: ${new Date().toLocaleString("pt-PT")}`],
    [],
  ]);
  XLSX.utils.sheet_add_json(ws, rows(rebar), { origin: "A5" });
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      [],
      ["TOTAL", rebar.totalBars, n(rebar.totalLengthM, 1), n(rebar.totalMassKg, 1), ""],
    ],
    { origin: -1 }
  );
  XLSX.utils.book_append_sheet(wb, ws, "Armadura");
  XLSX.writeFile(wb, `Armadura_${safe(projectName)}${phaseLabel ? "_" + safe(phaseLabel) : ""}.xlsx`);
}

export function exportRebarPDF(projectName: string, rebar: RebarTakeoff, phaseLabel?: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Takeoff de armadura — " + projectName, 14, 16);
  doc.setFontSize(9);
  if (phaseLabel) doc.text("Fase: " + phaseLabel, 14, 22);
  doc.text(originLine, 14, phaseLabel ? 27 : 22, { maxWidth: 180 });
  doc.text("Gerado: " + new Date().toLocaleString("pt-PT"), 14, phaseLabel ? 32 : 27);

  const data = rows(rebar);
  autoTable(doc, {
    startY: phaseLabel ? 40 : 35,
    head: [Object.keys(data[0] ?? { "Ø (mm)": "" })],
    body: data.map((r) => Object.values(r) as any),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 50, 90] },
    foot: [[
      "TOTAL",
      String(rebar.totalBars),
      String(n(rebar.totalLengthM, 1)),
      String(n(rebar.totalMassKg, 1)),
      "",
    ]],
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
  });
  doc.save(`Armadura_${safe(projectName)}${phaseLabel ? "_" + safe(phaseLabel) : ""}.pdf`);
}