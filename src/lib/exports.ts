import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { fmtMT } from "@/data/mock";
import type { BoQSection, BoQSource } from "@/lib/boqSource";
import { boqGrandTotal } from "@/lib/boqSource";
import type { DetailedPhase } from "@/lib/detailedBoq";

/** Linhas do BoQ detalhado (por elemento extraído do IFC) para exportação. */
function detailedRows(phases: DetailedPhase[]) {
  const rows: Record<string, string | number>[] = [];
  phases.forEach((sec) => {
    sec.lines.forEach((l) => {
      rows.push({
        Art: l.code,
        Fase: sec.label,
        "Classe IFC": l.ifcClass,
        Designação: l.desc,
        "Secção / esp.": l.dims.section ?? (l.dims.thicknessM ? `esp. ${l.dims.thicknessM.toFixed(2)} m` : ""),
        "Altura (m)": l.dims.heightM ? Number(l.dims.heightM.toFixed(2)) : "",
        "Nº elementos": l.count,

        Un: l.un,
        Qtd: Number(l.qty.toFixed(2)),
        "Volume (m³)": Number(l.volumeM3.toFixed(3)),
        "Área (m²)": Number(l.areaM2.toFixed(2)),
        Nota: l.note ?? "",
        "Total (MT)": Math.round(l.total),
      });
      l.materials.forEach((m) => {
        rows.push({
          Art: `${l.code}.${m.item}`,
          Fase: sec.label,
          "Classe IFC": "",
          Designação: `   ${m.desc}`,
          "Nº elementos": "",
          Un: m.un,
          Qtd: Number(m.qty.toFixed(2)),
          "Volume (m³)": "",
          "Área (m²)": "",
          Nota: m.priced ? `P.U. ${Math.round(m.preco)} MT` : "sem preço",
          "Total (MT)": Math.round(m.qty * m.preco),
        });
      });
    });
  });
  return rows;
}

const safe = (s: string) => s.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");

function sectionRows(sec: BoQSection) {
  return sec.lines.map((l) => ({
    Item: l.item,
    Descrição: l.desc,
    Un: l.un,
    Qtd: Number(l.qty.toFixed(2)),
    "P.U. (MT)": l.priced ? Math.round(l.preco) : "sem preço",
    "Total (MT)": Math.round(l.qty * l.preco),
  }));
}

function sectionMeta(src: BoQSource, sec: BoQSection) {
  if (!src.hasReal) return sec.desc;
  return `${sec.desc} · ${sec.volumeM3.toFixed(2)} m³ · ${sec.areaM2.toFixed(1)} m² · ${sec.elements} elementos`;
}

function pdfDoc(projectName: string, src: BoQSource, subtitle: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Bill of Quantities — " + projectName, 14, 16);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 22);
  doc.text("Origem dos dados: " + src.originLabel, 14, 27, { maxWidth: 180 });
  doc.text("Gerado: " + new Date().toLocaleString("pt-PT"), 14, 32);
  return doc;
}

function addSection(doc: jsPDF, src: BoQSource, sec: BoQSection, y: number) {
  const data = sectionRows(sec);
  doc.setFontSize(12);
  doc.text(sec.label, 14, y);
  doc.setFontSize(8);
  doc.text(sectionMeta(src, sec), 14, y + 4.5, { maxWidth: 180 });
  autoTable(doc, {
    startY: y + 8,
    head: [Object.keys(data[0] ?? { Item: "", Descrição: "", Un: "", Qtd: "", "P.U. (MT)": "", "Total (MT)": "" })],
    body: data.map((r) => Object.values(r) as any),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 50, 90] },
    foot: [["", "", "", "", "Subtotal", fmtMT(sec.total)]],
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
  });
  return (doc as any).lastAutoTable.finalY + 10;
}

export function exportBoQPDF(projectName: string, src: BoQSource, detailed: DetailedPhase[] = []) {
  const doc = pdfDoc(projectName, src, "Orçamento completo — todas as fases construtivas");
  let y = 40;
  src.order.forEach((p) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y = addSection(doc, src, src.sections[p], y);
  });
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(13);
  doc.text("TOTAL GERAL: " + fmtMT(boqGrandTotal(src)), 14, y);
  if (detailed.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("BoQ detalhado — artigos extraídos do modelo", 14, 16);
    const rows = detailedRows(detailed);
    autoTable(doc, {
      startY: 22,
      head: [["Art.", "Fase", "Designação", "Nº", "Un", "Qtd", "Total (MT)"]],
      body: rows.map((r) => [r.Art, r.Fase, r.Designação, r["Nº elementos"], r.Un, r.Qtd, r["Total (MT)"]] as any),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 50, 90] },
    });
  }
  doc.save(`BoQ_${safe(projectName)}.pdf`);
}

export function exportBoQExcel(projectName: string, src: BoQSource, detailed: DetailedPhase[] = []) {
  const wb = XLSX.utils.book_new();
  src.order.forEach((p) => {
    const sec = src.sections[p];
    const ws = XLSX.utils.aoa_to_sheet([
      [sec.label],
      [sectionMeta(src, sec)],
      [src.originLabel],
      [],
    ]);
    XLSX.utils.sheet_add_json(ws, sectionRows(sec), { origin: "A5" });
    XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "Subtotal (MT)", Math.round(sec.total)]], {
      origin: -1,
    });
    XLSX.utils.book_append_sheet(wb, ws, sec.label.slice(0, 28));
  });
  const resumo = XLSX.utils.json_to_sheet(
    src.order.map((p) => ({ Fase: src.sections[p].label, "Total (MT)": Math.round(src.sections[p].total) }))
  );
  XLSX.utils.sheet_add_aoa(resumo, [["TOTAL GERAL", Math.round(boqGrandTotal(src))]], { origin: -1 });
  XLSX.utils.book_append_sheet(wb, resumo, "Resumo");
  if (detailed.length) {
    const det = XLSX.utils.json_to_sheet(detailedRows(detailed));
    XLSX.utils.book_append_sheet(wb, det, "BoQ detalhado");
  }
  XLSX.writeFile(wb, `BoQ_${safe(projectName)}.xlsx`);
}

export function exportPhasePDF(projectName: string, src: BoQSource, phase: keyof BoQSource["sections"]) {
  const sec = src.sections[phase];
  const doc = pdfDoc(projectName, src, `Cotação parcial — fase ${sec.label}`);
  const y = addSection(doc, src, sec, 40);
  doc.setFontSize(13);
  doc.text(`TOTAL DA FASE (${sec.label}): ` + fmtMT(sec.total), 14, y);
  doc.save(`BoQ_${safe(projectName)}_${safe(sec.label)}.pdf`);
}

export function exportPhaseExcel(projectName: string, src: BoQSource, phase: keyof BoQSource["sections"]) {
  const sec = src.sections[phase];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`${projectName} — ${sec.label}`],
    [sectionMeta(src, sec)],
    [src.originLabel],
    [],
  ]);
  XLSX.utils.sheet_add_json(ws, sectionRows(sec), { origin: "A5" });
  XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "Total da fase (MT)", Math.round(sec.total)]], { origin: -1 });
  XLSX.utils.book_append_sheet(wb, ws, sec.label.slice(0, 28));
  XLSX.writeFile(wb, `BoQ_${safe(projectName)}_${safe(sec.label)}.xlsx`);
}
