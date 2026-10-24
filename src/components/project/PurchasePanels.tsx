import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMT } from "@/data/mock";
import { purchaseComparison, reconciliationRows, type PurchaseArticle, type PurchaseDraft, type PurchaseSummary, type Purchase, type ReconciledPurchase } from "@/lib/purchaseReconciliation";

const field = "w-full min-w-0 rounded border border-border bg-background px-2 py-1.5 text-xs";
export function PurchaseEditor({ articles, value, onChange }: { articles: PurchaseArticle[]; value: PurchaseDraft[]; onChange: (v: PurchaseDraft[]) => void }) {
  const patch = (id: string, p: Partial<PurchaseDraft>) => onChange(value.map(l => l.id === id ? {...l,...p} : l));
  return <section className="space-y-3 border-t border-border pt-3">
    <div className="flex items-center justify-between"><h5 className="font-medium text-sm">Materiais comprados</h5><Button size="sm" variant="outline" onClick={() => onChange([...value,{id:crypto.randomUUID(),lineKey:"",quantity:1,paidPrice:0,supplier:"",invoice:"",receipt:"",file:null}])}><Plus className="size-3"/>Linha</Button></div>
    {value.map(l => <div key={l.id} className="space-y-2 border-b border-border pb-3">
      <div className="flex gap-2"><select aria-label="Linha do BoQ" className={field} value={l.lineKey} onChange={e => patch(l.id,{lineKey:e.target.value})}><option value="">— Artigo do BoQ —</option>{articles.map(a => <option key={a.key} value={a.key}>{a.description} · {a.unit} · {fmtMT(a.price)}</option>)}</select><Button size="icon" variant="ghost" title="Remover linha de compra" onClick={() => onChange(value.filter(x => x.id!==l.id))}><Trash2 className="size-4"/></Button></div>
      <div className="grid grid-cols-2 gap-2"><label className="text-xs">Quantidade comprada<input aria-label="Quantidade comprada" className={field} type="number" min="0" step="any" value={l.quantity} onChange={e => patch(l.id,{quantity:Number(e.target.value)})}/></label><label className="text-xs">Preço unitário PAGO<input aria-label="Preço unitário PAGO" className={field} type="number" min="0" step="any" value={l.paidPrice} onChange={e => patch(l.id,{paidPrice:Number(e.target.value)})}/></label></div>
      <input aria-label="Fornecedor" placeholder="Fornecedor" className={field} value={l.supplier} onChange={e => patch(l.id,{supplier:e.target.value})}/><input aria-label="Número de factura" placeholder="Nº de factura" className={field} value={l.invoice} onChange={e => patch(l.id,{invoice:e.target.value})}/>
      <label className="block text-xs">Recibo (foto ou PDF)<input aria-label="Recibo" type="file" accept="image/*,application/pdf" className="mt-1 w-full text-xs" onChange={e => patch(l.id,{file:e.target.files?.[0]??null})}/></label>{!l.file && <p className="text-xs text-warning">Sem comprovativo</p>}
    </div>)}
  </section>;
}

export function PurchaseReview({ purchases, results, articles, pending, justifications, onJustification, photoUrl }: { purchases: Purchase[]; results: ReconciledPurchase[]; articles: PurchaseArticle[]; pending: boolean; justifications: Record<string,string>; onJustification:(id:string,v:string)=>void; photoUrl:(p:string)=>string|undefined }) {
  return <section className="space-y-3 border-t border-border pt-3"><h5 className="font-medium text-sm">Materiais comprados</h5>{purchases.length===0 && <p className="text-xs text-muted-foreground">Sem compras</p>}
    {purchases.map(p => {
      const article=articles.find(a=>a.key===p.lineKey); const result=results.find(a=>a.id===p.id); const price=pending?article?.price:result?.boqPrice;
      const cmp=price===undefined?null:purchaseComparison(price,p.paidPrice,p.quantity); const mismatch=pending?cmp?.mismatch:result?.mismatch;
      return <div key={p.id} className="space-y-1 text-xs border-b border-border pb-3">
        <div className="font-medium break-words">{result?.description??article?.description??p.lineKey}</div><p>{p.quantity} {result?.unit??article?.unit} · {p.supplier} · factura {p.invoice}</p>
        <p className={mismatch?"font-semibold text-warning":"text-success"}>{price===undefined?"Artigo indisponível — actualizar orçamento":mismatch?"⚠ NÃO BATE · Diferença a esclarecer":"✅ Bate"}</p>
        <p>Preço BoQ: {price===undefined?"—":fmtMT(price)} · Pago: {fmtMT(p.paidPrice)} · Mediana de mercado: {(result?.median??article?.median)==null?"—":fmtMT(result?.median??article?.median??0)}</p>
        {cmp && <p>Diferença unitária: {fmtMT(cmp.unitDifference)} · Total: {fmtMT(cmp.difference)} · pago {cmp.difference<0?"acima":cmp.difference>0?"abaixo":"igual ao"} do orçado</p>}
        {p.receipt?<a className="text-accent underline" href={photoUrl(p.receipt)} target="_blank" rel="noreferrer">Ver comprovativo</a>:<p className="text-warning">Sem comprovativo</p>}
        {pending&&mismatch&&<label className="block">Justificação da diferença ({(justifications[p.id]??"").trim().length}/30)<textarea aria-label="Justificação da diferença" className={field} rows={3} value={justifications[p.id]??""} onChange={e=>onJustification(p.id,e.target.value)}/></label>}
        {!pending&&result?.justification&&<p>{result.justification}</p>}
      </div>;
    })}
  </section>;
}

export function ReconciliationSummary({ rows }: { rows: PurchaseSummary[] }) {
  const data=reconciliationRows(rows);
  return <section className="mt-6 pt-6 border-t border-border space-y-3"><h3 className="font-display text-lg">Reconciliação de compras</h3>
    <div className="grid sm:grid-cols-2 gap-3 text-sm"><p>Pago abaixo do orçado <strong className="block font-mono">{fmtMT(rows.reduce((s,r)=>s+r.below,0))}</strong></p><p>Pago acima do orçado <strong className="block font-mono">{fmtMT(rows.reduce((s,r)=>s+r.above,0))}</strong></p></div>
    <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{["Artigo do BoQ","Preço BoQ","Médio pago","Quantidade","Diferença %","Diferença MT","Estado","Recibo"].map(h=><th key={h} className="p-2 text-left border-b border-border">{h}</th>)}</tr></thead><tbody>{data.map((row,i)=><tr key={rows[i].key} className={rows[i].mismatch?"text-warning":""}>{row.map((cell,j)=><td key={j} className="p-2 align-top border-b border-border">{cell}</td>)}</tr>)}</tbody></table></div>
  </section>;
}