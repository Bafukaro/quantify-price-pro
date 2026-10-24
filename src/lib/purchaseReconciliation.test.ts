import { describe, expect, it } from "vitest";
import { purchaseComparison, PURCHASE_JUSTIFICATION_MIN, reconcileSummary, type ReconciledPurchase } from "./purchaseReconciliation";
describe("Reconciliação de compras", () => {
  it("aceita exactamente 3%, mas não acima", () => { expect(purchaseComparison(100,103,1).mismatch).toBe(false); expect(purchaseComparison(100,103.01,1).mismatch).toBe(true); });
  it("148 vs 128 em 500 unidades dá 10 000 MT abaixo", () => { expect(purchaseComparison(148,128,500).difference).toBe(10000); expect(purchaseComparison(148,128,500).mismatch).toBe(true); });
  it("preço pago acima produz diferença negativa", () => { expect(purchaseComparison(100,120,5).difference).toBe(-100); });
  it("exige pelo menos 30 caracteres", () => { expect(PURCHASE_JUSTIFICATION_MIN).toBe(30); });
  it("zero orçado com preço pago positivo não bate", () => { expect(purchaseComparison(0,1,10).mismatch).toBe(true); });
  it("pondera por quantidade e não esconde flags compensados", () => {
    const base = { lineKey: "a", description:"A", unit:"un", boqPrice:100, median:100, percent:0, mismatch:true, receipt:"", justification:"" };
    const purchases: ReconciledPurchase[] = [{...base,id:"1",paidPrice:80,quantity:3,difference:60},{...base,id:"2",paidPrice:160,quantity:1,difference:-60}];
    const [row] = reconcileSummary([{key:"a",description:"A",unit:"un",price:100,median:100}],purchases);
    expect(row.averagePaid).toBe(100); expect(row.difference).toBe(0); expect(row.mismatch).toBe(true); expect(row.below).toBe(60); expect(row.above).toBe(60);
  });
});