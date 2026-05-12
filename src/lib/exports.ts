import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { boqRows, fmtMT } from "@/data/mock";

type BoQKey = keyof typeof boqRows;

function buildRows(phase: BoQKey) {
  return boqRows[phase].map((r) => {
    const delta = ((r.atual - r.p2019) / r.p2019) * 100;
    const total = r.qty * r.atual;
    return {
      Item: r.item,
      Descrição: r.desc,
      Un: r.un,
      Qtd: r.qty,
      "Preço 2019": r.p2019,
      "Preço actual": r.atual,
      "Δ%": `+${delta.toFixed(0)}%`,
      "Total (MT)": Math.round(total),
    };
  });
}

export function exportBoQPDF(projectName: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Bill of Quantities — " + projectName, 14, 16);
  doc.setFontSize(10);
  doc.text("Gerado: " + new Date().toLocaleString("pt-PT"), 14, 22);

  let y = 30;
  let grand = 0;
  (Object.keys(boqRows) as BoQKey[]).forEach((phase) => {
    const data = buildRows(phase);
    const subtotal = data.reduce((a, r) => a + (r["Total (MT)"] as number), 0);
    grand += subtotal;
    doc.setFontSize(12);
    doc.text(phase, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [Object.keys(data[0])],
      body: data.map((r) => Object.values(r) as any),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 50, 90] },
      foot: [["", "", "", "", "", "", "Subtotal", fmtMT(subtotal)]],
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });
  doc.setFontSize(13);
  doc.text("TOTAL GERAL: " + fmtMT(grand), 14, y);
  doc.save(`BoQ_${projectName.replace(/\s+/g, "_")}.pdf`);
}

export function exportBoQExcel(projectName: string) {
  const wb = XLSX.utils.book_new();
  (Object.keys(boqRows) as BoQKey[]).forEach((phase) => {
    const data = buildRows(phase);
    const ws = XLSX.utils.json_to_sheet(data);
    const sheetName = phase.replace(/[^\w\s—-]/g, "").slice(0, 28);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  XLSX.writeFile(wb, `BoQ_${projectName.replace(/\s+/g, "_")}.xlsx`);
}
