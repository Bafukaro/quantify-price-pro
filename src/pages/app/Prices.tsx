import { Fragment, useMemo, useState } from "react";
import { allStats, materials, RISK_COLOR, RISK_LABEL, type MaterialStats } from "@/data/priceDb";
import { Plus, Filter, AlertTriangle, TrendingUp, X, Camera, ChevronDown, Building2, Store } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Legend, BarChart, Bar, Cell as RCell } from "recharts";
import { addQuote, useQuotes } from "@/data/store";

const cats = ["Todos", "Cimento", "Ferro", "PVC", "Eléctrica", "Tintas", "Madeira", "Agregados"];
const months = ["Dez 25", "Jan 26", "Fev 26", "Mar 26", "Abr 26", "Mai 26"];

function genHistory(stats: MaterialStats) {
  const baseline = stats.median * 0.7;
  return months.map((m, i) => {
    const t = i / (months.length - 1);
    const row: Record<string, number | string> = { month: m, mediana: Math.round(baseline + (stats.median - baseline) * t) };
    stats.byQuote.forEach(({ supplier, quote }) => {
      row[supplier.name] = Math.round(quote.price * (0.7 + 0.3 * t) + (i % 2 ? 4 : -3));
    });
    return row;
  });
}

const SUPPLIER_COLORS = ["hsl(211 70% 50%)", "hsl(220 10% 50%)", "hsl(0 70% 55%)", "hsl(38 92% 50%)", "hsl(152 55% 38%)"];

export default function Prices() {
  const [cat, setCat] = useState("Todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const quotes = useQuotes();
  const stats = useMemo(() => allStats(), []);
  const filtered = cat === "Todos" ? stats : stats.filter((s) => s.material.category === cat);

  return (
    <div className="space-y-6 animate-fade-in relative pb-24">
      {/* Header actions */}
      {/* Quotes added quickly via FAB */}
      {quotes.length > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
          <div className="text-[11px] uppercase tracking-wider text-success font-medium">Cotações adicionadas no terreno · {quotes.length}</div>
          <ul className="mt-2 space-y-1 text-xs">
            {quotes.slice(0, 3).map((q, i) => (
              <li key={i} className="flex justify-between"><span>{q.material} — {q.supplier}</span><span className="font-mono">{q.price.toLocaleString("pt-PT")} MT</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground" />
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="size-4" /> Adicionar cotação
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-2 py-3 w-8"></th>
                <th className="px-4 py-3 text-left">Material</th>
                <th className="px-4 py-3">Un</th>
                <th className="px-4 py-3">Mín</th>
                <th className="px-4 py-3">Mediana</th>
                <th className="px-4 py-3">Máx</th>
                <th className="px-4 py-3">σ (DP)</th>
                <th className="px-4 py-3">Spread</th>
                <th className="px-4 py-3">Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
                const isOpen = expanded === s.material.id;
                const history = genHistory(s);
                return (
                  <Fragment key={s.material.id}>
                    <tr onClick={() => setExpanded(isOpen ? null : s.material.id)} className="hover:bg-muted/30 cursor-pointer">
                      <td className="px-2 py-3 text-center text-muted-foreground">
                        <ChevronDown className={`size-4 mx-auto transition ${isOpen ? "rotate-180" : ""}`} />
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="font-medium">{s.material.name}</div>
                        <div className="text-xs text-muted-foreground">{s.material.category} · {s.material.quotes.length} cotações</div>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{s.material.unit}</td>
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">{s.min.toLocaleString("pt-PT")}</td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{s.median.toLocaleString("pt-PT")}</td>
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">{s.max.toLocaleString("pt-PT")}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">±{s.std.toFixed(0)}</td>
                      <td className={`px-4 py-3 text-center font-mono ${s.spreadPct > 20 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {s.spreadPct.toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${RISK_COLOR[s.topRisk]}`}>
                          {s.topRisk === "normal" ? <TrendingUp className="size-3" /> : <AlertTriangle className="size-3" />}
                          {RISK_LABEL[s.topRisk]}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/20">
                        <td colSpan={9} className="px-6 py-5 space-y-5">
                          {/* Per-supplier breakdown */}
                          <div>
                            <div className="text-sm font-medium mb-2">Cotações por fornecedor (formal vs informal)</div>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {s.byQuote.map(({ quote, supplier, deviationPct, risk }) => (
                                <div key={supplier.id} className="flex items-center justify-between p-2.5 rounded-md bg-background border border-border">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {supplier.type === "formal" ? <Building2 className="size-4 text-primary shrink-0" /> : <Store className="size-4 text-warning shrink-0" />}
                                    <div className="min-w-0">
                                      <div className="text-sm truncate">{supplier.name}</div>
                                      <div className="text-[10px] text-muted-foreground">{supplier.location} · {quote.date}{quote.invoice ? ` · ${quote.invoice}` : ""}{quote.hasPhoto ? " · 📷" : ""}</div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-3">
                                    <div className="font-mono text-sm">{quote.price.toLocaleString("pt-PT")}</div>
                                    <div className={`text-[10px] font-mono ${risk === "normal" ? "text-success" : risk === "atencao" ? "text-warning" : "text-destructive"}`}>
                                      {deviationPct > 0 ? "+" : ""}{deviationPct.toFixed(1)}% · {RISK_LABEL[risk]}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Bar chart deviations */}
                          <div className="h-44 w-full">
                            <div className="text-xs text-muted-foreground mb-1">Desvio % vs mediana de mercado</div>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={s.byQuote.map((q) => ({ name: q.supplier.name.split(" ")[0], dev: +q.deviationPct.toFixed(1), risk: q.risk }))}>
                                <XAxis dataKey="name" fontSize={10} stroke="hsl(220 10% 50%)" />
                                <YAxis fontSize={10} stroke="hsl(220 10% 50%)" />
                                <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
                                <ReferenceLine y={0} stroke="hsl(220 10% 50%)" />
                                <Bar dataKey="dev" radius={[4, 4, 0, 0]}>
                                  {s.byQuote.map((q, i) => (
                                    <RCell key={i} fill={q.risk === "alto" ? "hsl(var(--destructive))" : q.risk === "atencao" ? "hsl(var(--warning))" : "hsl(var(--success))"} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Trend line */}
                          <div>
                            <div className="text-sm font-medium mb-2">Evolução — últimos 6 meses</div>
                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                  <XAxis dataKey="month" stroke="hsl(220 10% 50%)" fontSize={11} />
                                  <YAxis stroke="hsl(220 10% 50%)" fontSize={11} />
                                  <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                                  <Legend wrapperStyle={{ fontSize: 11 }} />
                                  <ReferenceLine y={s.median} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Mediana", fontSize: 10, fill: "hsl(var(--accent))" }} />
                                  {s.byQuote.map((q, i) => (
                                    <Line key={q.supplier.id} type="monotone" dataKey={q.supplier.name} stroke={SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]} strokeWidth={2} dot={{ r: 2.5 }} />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setFabOpen(true)}
        className="fixed bottom-8 right-8 size-14 rounded-full bg-primary text-primary-foreground shadow-elegant grid place-items-center hover:scale-105 transition z-40"
        aria-label="Adicionar cotação rápida"
      >
        <Plus className="size-6" />
      </button>

      {fabOpen && <QuickQuoteModal onClose={() => setFabOpen(false)} />}
    </div>
  );
}

function QuickQuoteModal({ onClose }: { onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ material: "", supplier: "", price: "", hasPhoto: false });

  const submit = () => {
    const price = parseFloat(form.price);
    if (!form.material || !form.supplier || !price) return;
    addQuote({ material: form.material, supplier: form.supplier, price, date: today, hasPhoto: form.hasPhoto });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end sm:place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-surface-elevated rounded-t-2xl sm:rounded-2xl p-6 shadow-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Nova cotação rápida</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Material</label>
            <input list="mats" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
              placeholder="Ex: Cimento Portland 50kg"
              className="mt-1 w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
            <datalist id="mats">
              {materials.map((m) => <option key={m.id} value={m.name} />)}
            </datalist>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Fornecedor</label>
            <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="Nome do fornecedor"
              className="mt-1 w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Preço (MT)</label>
            <input type="number" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0"
              className="mt-1 w-full px-3 py-3 rounded-md border border-border bg-background text-2xl font-display" />
          </div>
          <button onClick={() => setForm({ ...form, hasPhoto: !form.hasPhoto })}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-sm transition ${form.hasPhoto ? "border-accent bg-accent/5 text-accent" : "border-dashed border-border text-muted-foreground hover:bg-muted"}`}>
            <Camera className="size-4" /> {form.hasPhoto ? "Foto anexada ✓" : "Foto do tabelão/recibo"}
          </button>
          <div className="text-[11px] text-muted-foreground">Data: {today} (auto)</div>
          <button onClick={submit} className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-md font-medium hover:opacity-90">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}