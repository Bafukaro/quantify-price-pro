import { useMemo, useState } from "react";
import { allStats, RISK_COLOR, RISK_LABEL, type RiskLevel } from "@/data/priceDb";
import { useRisks, openRiskCase, justifyRisk, decideRisk, type RiskReason, type RiskCase } from "@/data/store";
import { AlertTriangle, ShieldCheck, ShieldAlert, X, Check, FileWarning } from "lucide-react";
import { fmtMT } from "@/data/mock";

const REASONS: { value: RiskReason; label: string }[] = [
  { value: "urgencia", label: "Urgência da obra" },
  { value: "logistica", label: "Logística / transporte" },
  { value: "qualidade", label: "Qualidade superior" },
  { value: "fornecedor_unico", label: "Fornecedor único disponível" },
  { value: "outro", label: "Outro motivo" },
];

export default function Risk() {
  const stats = allStats();
  const risks = useRisks();

  // All quotes flagged as 'atencao' or 'alto'
  const flagged = useMemo(() => {
    return stats.flatMap((s) =>
      s.byQuote
        .filter((q) => q.risk !== "normal")
        .map((q) => ({ stat: s, quote: q }))
    );
  }, [stats]);

  const [openCaseFor, setOpenCaseFor] = useState<RiskCase | null>(null);

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { normal: 0, atencao: 0, alto: 0 };
    stats.forEach((s) => s.byQuote.forEach((q) => c[q.risk]++));
    return c;
  }, [stats]);

  const handleOpen = (materialId: string, materialName: string, supplierName: string, marketPrice: number, supplierPrice: number, deviationPct: number) => {
    // reuse existing pendente if any
    const existing = risks.find((r) => r.materialId === materialId && r.supplierName === supplierName && r.status === "pendente");
    if (existing) { setOpenCaseFor(existing); return; }
    const id = openRiskCase({ materialId, materialName, supplierName, marketPrice, supplierPrice, deviationPct, createdBy: "Eng. Tomás R." });
    const created = risks.find((r) => r.id === id) ?? {
      id, materialId, materialName, supplierName, marketPrice, supplierPrice,
      deviationPct, status: "pendente" as const, createdBy: "Eng. Tomás R.", createdAt: new Date().toISOString(),
    };
    setOpenCaseFor(created);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI strip */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Kpi icon={<ShieldCheck className="size-4" />} label="Cotações Normais" value={counts.normal} tone="text-success" />
        <Kpi icon={<AlertTriangle className="size-4" />} label="Atenção (10–20%)" value={counts.atencao} tone="text-warning" />
        <Kpi icon={<ShieldAlert className="size-4" />} label="Alto risco (>20%)" value={counts.alto} tone="text-destructive" />
      </div>

      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <FileWarning className="size-4 text-warning" />
          <h3 className="font-display text-lg">Cotações fora da mediana de mercado</h3>
          <span className="text-xs text-muted-foreground ml-auto">Regras: 0–10% Normal · 10–20% Atenção · &gt;20% Alto risco</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Material</th>
                <th className="px-4 py-3 text-left">Fornecedor</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3">Mediana</th>
                <th className="px-4 py-3">Preço fornec.</th>
                <th className="px-4 py-3">Δ%</th>
                <th className="px-4 py-3">Risco</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {flagged.map(({ stat, quote }) => {
                const existing = risks.find((r) => r.materialId === stat.material.id && r.supplierName === quote.supplier.name);
                return (
                  <tr key={stat.material.id + quote.supplier.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{stat.material.name}</div>
                      <div className="text-xs text-muted-foreground">{stat.material.category} · {stat.material.unit}</div>
                    </td>
                    <td className="px-4 py-3">{quote.supplier.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${quote.supplier.type === "formal" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                        {quote.supplier.type === "formal" ? "Formal" : "Informal"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{stat.median.toLocaleString("pt-PT")}</td>
                    <td className="px-4 py-3 text-center font-mono">{quote.quote.price.toLocaleString("pt-PT")}</td>
                    <td className="px-4 py-3 text-center font-mono">{quote.deviationPct > 0 ? "+" : ""}{quote.deviationPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${RISK_COLOR[quote.risk]}`}>
                        {RISK_LABEL[quote.risk]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {existing ? (
                        <span className={`px-2 py-0.5 rounded-full ${
                          existing.status === "aprovado" ? "bg-success/10 text-success" :
                          existing.status === "rejeitado" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>{existing.status}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpen(stat.material.id, stat.material.name, quote.supplier.name, stat.median, quote.quote.price, quote.deviationPct)}
                        className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
                      >
                        {existing ? "Rever" : "Justificar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History of cases */}
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-5">
        <h3 className="font-display text-lg mb-3">Histórico de decisões</h3>
        {risks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem casos abertos ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {risks.map((r) => (
              <li key={r.id} className="py-3 flex items-start gap-3 text-sm">
                <span className={`mt-0.5 size-2 rounded-full ${
                  r.status === "aprovado" ? "bg-success" : r.status === "rejeitado" ? "bg-destructive" : "bg-warning"
                }`} />
                <div className="flex-1">
                  <div className="font-medium">{r.materialName} — {r.supplierName}</div>
                  <div className="text-xs text-muted-foreground">
                    Δ {r.deviationPct.toFixed(1)}% · {fmtMT(r.supplierPrice)} vs mediana {fmtMT(r.marketPrice)}
                    {r.reason && ` · motivo: ${REASONS.find(x => x.value === r.reason)?.label}`}
                  </div>
                  {r.observation && <div className="text-xs mt-1 italic text-muted-foreground">"{r.observation}"</div>}
                </div>
                <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                  {r.createdAt}
                  {r.decidedBy && <div>{r.status} · {r.decidedBy}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openCaseFor && <CaseModal initial={openCaseFor} onClose={() => setOpenCaseFor(null)} />}
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${tone}`}>{icon}{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
    </div>
  );
}

function CaseModal({ initial, onClose }: { initial: RiskCase; onClose: () => void }) {
  const risks = useRisks();
  const current = risks.find((r) => r.id === initial.id) ?? initial;
  const [reason, setReason] = useState<RiskReason>(current.reason ?? "urgencia");
  const [obs, setObs] = useState(current.observation ?? "");
  const isHigh = Math.abs(current.deviationPct) > 20;
  const decided = current.status !== "pendente";

  const save = () => justifyRisk(current.id, reason, obs);
  const approve = () => { save(); decideRisk(current.id, "aprovado"); onClose(); };
  const reject = () => { save(); decideRisk(current.id, "rejeitado"); onClose(); };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-surface-elevated rounded-2xl shadow-elegant">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-lg">Justificação & aprovação</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="font-medium">{current.materialName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{current.supplierName}</div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
              <div><div className="text-muted-foreground">Mediana</div><div className="font-mono">{fmtMT(current.marketPrice)}</div></div>
              <div><div className="text-muted-foreground">Fornecedor</div><div className="font-mono">{fmtMT(current.supplierPrice)}</div></div>
              <div><div className="text-muted-foreground">Δ%</div><div className={`font-mono ${isHigh ? "text-destructive" : "text-warning"}`}>{current.deviationPct.toFixed(1)}%</div></div>
            </div>
          </div>
          {isHigh && (
            <div className="text-xs text-destructive flex items-center gap-2"><AlertTriangle className="size-3.5" /> Justificação obrigatória — alto risco.</div>
          )}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Motivo</label>
            <select disabled={decided} value={reason} onChange={(e) => setReason(e.target.value as RiskReason)}
              className="mt-1 w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm">
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Observação</label>
            <textarea disabled={decided} value={obs} onChange={(e) => setObs(e.target.value)} rows={3}
              placeholder="Descreva o contexto da decisão…"
              className="mt-1 w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm resize-none" />
          </div>
        </div>
        {!decided && (
          <div className="p-5 border-t border-border flex items-center justify-end gap-2">
            <button onClick={reject} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">
              <X className="size-4" /> Rejeitar
            </button>
            <button onClick={approve} disabled={isHigh && !obs.trim()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
              <Check className="size-4" /> Aprovar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}