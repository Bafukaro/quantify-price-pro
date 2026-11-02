import type { BoQSource } from "@/lib/boqSource";
import { boqGrandTotal } from "@/lib/boqSource";
import { UNCLASSIFIED_PHASE, detailedGrandTotal, type DetailedPhase } from "@/lib/detailedBoq";

/**
 * FONTE ÚNICA DO RELATÓRIO — ecrã, PDF e Excel usam exactamente a mesma função
 * e a mesma fonte que o Orçamento detalhado (buildDetailedBoQ). Quando existe
 * modelo com grupos de elementos, o subtotal sai do BoQ detalhado (incluindo os
 * preços editados); sem modelo, sai do BoQ manual / caso de estudo.
 */

export type ReportArticle = { qty: number; un: string };

export type ReportSection = {
  key: string;
  label: string;
  /** Classes IFC sem correspondência — só na secção "Não classificado". */
  classes?: string[];
  /** Quantidade e unidade reais dos artigos do BoQ da fase. */
  articles: ReportArticle[];
  elements: number;
  total: number;
};

export type ReportSource = {
  source: "model" | "manual" | "study";
  sections: ReportSection[];
  subtotal: number;
};

/** Texto legível das quantidades reais dos artigos da fase (ou "—"). */
export const reportArticlesText = (s: ReportSection) =>
  s.articles.length
    ? s.articles
        .map((a) => `${a.qty.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} ${a.un}`)
        .join(" · ")
    : "—";

export function buildReportSource(boq: BoQSource, detailed: DetailedPhase[] | null): ReportSource {
  if (detailed && detailed.length > 0) {
    const sections: ReportSection[] = detailed.map((p) => ({
      key: p.phase,
      label: p.label,
      ...(p.phase === UNCLASSIFIED_PHASE
        ? { classes: [...new Set(p.lines.map((l) => l.ifcClass))] }
        : {}),
      articles: p.lines.map((l) => ({ qty: l.qty, un: l.un })),
      elements: p.count,
      total: p.total,
    }));
    return { source: "model", sections, subtotal: detailedGrandTotal(detailed) };
  }
  const sections: ReportSection[] = boq.order.map((k) => {
    const sec = boq.sections[k];
    return {
      key: k,
      label: sec.label,
      articles: sec.lines.map((l) => ({ qty: l.qty, un: l.un })),
      elements: sec.elements,
      total: sec.total,
    };
  });
  return { source: boq.source ?? "study", sections, subtotal: boqGrandTotal(boq) };
}

// ===================== CONTINGÊNCIA E IVA =====================

export type TaxConfig = {
  contPct: number;
  ivaPct: number;
  /** true (por defeito): IVA incide sobre a Base (subtotal + contingência); false: sobre o Subtotal. */
  onBase: boolean;
};

export const DEFAULT_TAX: TaxConfig = { contPct: 0.1, ivaPct: 0.16, onBase: true };

export type TaxBreakdown = {
  subtotal: number;
  contingencia: number;
  base: number;
  iva: number;
  total: number;
  cfg: TaxConfig;
};

/** Fórmula por linhas: Subtotal; Contingência; Base; IVA sobre a Base (ou sobre o Subtotal); Total. */
export function taxBreakdown(subtotal: number, cfg: TaxConfig): TaxBreakdown {
  const contingencia = subtotal * cfg.contPct;
  const base = cfg.onBase ? subtotal + contingencia : subtotal;
  const iva = base * cfg.ivaPct;
  return { subtotal, contingencia, base, iva, total: base + iva, cfg };
}

const taxPct = (v: number) =>
  `${(v * 100).toLocaleString("pt-PT", { maximumFractionDigits: 2 })}%`;

export function taxLines(bd: TaxBreakdown): { label: string; value: number }[] {
  return [
    { label: "Subtotal", value: bd.subtotal },
    { label: `Contingência ${taxPct(bd.cfg.contPct)}`, value: bd.contingencia },
    { label: "Base", value: bd.base },
    {
      label: `IVA ${taxPct(bd.cfg.ivaPct)} ${bd.cfg.onBase ? "sobre a Base" : "sobre o Subtotal"}`,
      value: bd.iva,
    },
    { label: "Total", value: bd.total },
  ];
}

/** Modo de incidência activo — assinalado no ecrã e no PDF. */
export const taxIncidenceLabel = (cfg: TaxConfig) =>
  cfg.onBase ? "IVA sobre a Base (subtotal + contingência)" : "IVA sobre o Subtotal";

/** Linhas do Resumo do Excel — TOTAL GERAL vem do subtotal do relatório. */
export function excelResumoRows(report: ReportSource): { Fase: string; "Total (MT)": number }[] {
  const rows = report.sections.map((s) => ({ Fase: s.label, "Total (MT)": Math.round(s.total) }));
  rows.push({ Fase: "TOTAL GERAL", "Total (MT)": Math.round(report.subtotal) });
  return rows;
}
