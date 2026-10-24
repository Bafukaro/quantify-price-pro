import { buildBoQSource, boqLineKey, boqDetailMatKey, type BoQSource } from "@/lib/boqSource";
import { buildDetailedBoQ } from "@/lib/detailedBoq";
import { marketMedianForCity } from "@/data/priceDb";
import type { Project } from "@/data/projects";
import type { ElementGroup } from "@/workers/ifcWorker";

export const PURCHASE_TOLERANCE = 0.03;
export const PURCHASE_JUSTIFICATION_MIN = 30;
export type Purchase = { id: string; lineKey: string; quantity: number; paidPrice: number; supplier: string; invoice: string; receipt: string };
export type PurchaseDraft = Purchase & { file: File | null };
export type PurchaseArticle = { key: string; description: string; unit: string; price: number; median: number | null };
export type ReconciledPurchase = { id: string; lineKey: string; description: string; unit: string; boqPrice: number; paidPrice: number; quantity: number; median: number | null; difference: number; percent: number | null; mismatch: boolean; receipt: string; justification: string };

export function purchaseComparison(boqPrice: number, paidPrice: number, quantity: number) {
  const difference = (boqPrice - paidPrice) * quantity;
  return { difference, unitDifference: boqPrice - paidPrice, percent: boqPrice === 0 ? (paidPrice === 0 ? 0 : null) : (paidPrice - boqPrice) / boqPrice * 100,
    mismatch: boqPrice === 0 ? paidPrice !== 0 : Math.abs(paidPrice - boqPrice) > boqPrice * PURCHASE_TOLERANCE + 1e-9 };
}

export function purchaseArticles(project: Project, source?: BoQSource, groups: ElementGroup[] = []): PurchaseArticle[] {
  const boq = source ?? buildBoQSource({ location: project.location, meshes: project.meshes, overrides: project.overrides, priceOverrides: project.priceOverrides, quantitySource: project.quantitySource, manualLines: project.manualLines });
  const median = (id: string | null) => id ? marketMedianForCity(id, project.location) : null;
  const phases = boq.order.flatMap(p => boq.sections[p].lines.map(l => ({ key: boqLineKey(p,l.item), description: `${boq.sections[p].label} · ${l.desc}`, unit: l.un, price: l.preco, median: median(l.materialId) })));
  const detailed = buildDetailedBoQ(groups, undefined, project.priceOverrides).flatMap(p => p.lines.flatMap(l => l.materials.map(m => ({ key: boqDetailMatKey(l.code,m.item), description: `${l.code} · ${l.desc} · ${m.desc}`, unit: m.un, price: m.preco, median: median(m.materialId) }))));
  return [...detailed, ...phases];
}

export type PurchaseSummary = { key: string; description: string; unit: string; boqPrice: number; averagePaid: number | null; quantity: number; percent: number | null; difference: number; mismatch: boolean; hasPurchases: boolean; receipt: boolean; below: number; above: number };
export function reconcileSummary(articles: PurchaseArticle[], purchases: ReconciledPurchase[]): PurchaseSummary[] {
  const keys = new Set([...articles.map(a => a.key), ...purchases.map(p => p.lineKey)]);
  return [...keys].map(key => {
    const rows = purchases.filter(p => p.lineKey === key);
    const article = articles.find(a => a.key === key);
    const quantity = rows.reduce((s,p) => s + p.quantity,0);
    const paid = rows.reduce((s,p) => s + p.paidPrice * p.quantity,0);
    const budget = rows.reduce((s,p) => s + p.boqPrice * p.quantity,0);
    // Historical confirmation prices are preserved; current article price remains visible.
    return { key, description: article?.description ?? rows[0]?.description ?? key, unit: article?.unit ?? rows[0]?.unit ?? "", boqPrice: article?.price ?? rows[0]?.boqPrice ?? 0,
      averagePaid: quantity ? paid / quantity : null, quantity, percent: budget ? (paid-budget)/budget*100 : paid ? null : 0, difference: budget-paid,
      mismatch: rows.some(p => p.mismatch), hasPurchases: rows.length>0, receipt: rows.length>0 && rows.every(p => !!p.receipt),
      below: rows.reduce((s,p) => s+Math.max(0,p.difference),0), above: rows.reduce((s,p) => s+Math.max(0,-p.difference),0) };
  });
}

export function reconciliationRows(rows: PurchaseSummary[]) {
  return rows.map(r => [r.description, `${r.boqPrice.toFixed(2)} MT/${r.unit}`, r.averagePaid === null ? "—" : r.averagePaid.toFixed(2), `${r.quantity.toFixed(2)} ${r.unit}`, r.percent === null ? "—" : `${r.percent.toFixed(2)}%`, r.difference.toFixed(2), !r.hasPurchases ? "Sem compras" : r.mismatch ? "⚠ Não bate" : "✅ Bate", r.hasPurchases ? r.receipt ? "sim" : "não" : "—"]);
}