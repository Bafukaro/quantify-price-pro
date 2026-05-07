import { useState } from "react";
import { priceRows } from "@/data/mock";
import { Plus, Filter, AlertTriangle, TrendingUp, X, Camera, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import { addQuote, useQuotes } from "@/data/store";

const cats = ["Todos", "Cimento", "Ferro", "PVC", "Eléctrica", "Tintas"];
const months = ["Dez 25", "Jan 26", "Fev 26", "Mar 26", "Abr 26", "Mai 26"];

function genHistory(mediana: number, fA: number, fB: number, fC: number) {
  return months.map((m, i) => {
    const t = i / (months.length - 1);
    return {
      month: m,
      "Forn. A": Math.round(fA * (0.7 + 0.3 * t) + (i % 2 ? 5 : -3)),
      "Forn. B": Math.round(fB * (0.72 + 0.28 * t)),
      "Forn. C": Math.round(fC * (0.65 + 0.35 * t) + (i === 4 ? 12 : 0)),
      mediana,
    };
  });
}

export default function Prices() {
  const [cat, setCat] = useState("Todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const quotes = useQuotes();
  const allRows = [
    ...quotes.map((q) => ({ material: q.material, un: "—", cat: "Novo", fA: q.price, fB: q.price, fC: q.price, mediana: q.price, desvio: 0, _new: true as const })),
    ...priceRows.map((r) => ({ ...r, _new: false as const })),
  ];
  const filtered = cat === "Todos" ? allRows : allRows.filter((r) => r.cat === cat);

  return (
    <div className="space-y-6 animate-fade-in relative pb-24">
      {/* Header actions */}
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
                <th className="px-4 py-3">Forn. A</th>
                <th className="px-4 py-3">Forn. B</th>
                <th className="px-4 py-3">Forn. C</th>
                <th className="px-4 py-3">Mediana</th>
                <th className="px-4 py-3">Desvio %</th>
                <th className="px-4 py-3">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const high = r.desvio > 15;
                const isOpen = expanded === r.material;
                const data = genHistory(r.mediana, r.fA, r.fB, r.fC);
                const change = Math.round(((data[5]["Forn. B"] - data[1]["Forn. B"]) / data[1]["Forn. B"]) * 100);
                return (
                  <>
                  <tr key={r.material} onClick={() => setExpanded(isOpen ? null : r.material)} className="hover:bg-muted/30 cursor-pointer">
                    <td className="px-2 py-3 text-center text-muted-foreground">
                      <ChevronDown className={`size-4 mx-auto transition ${isOpen ? "rotate-180" : ""}`} />
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="font-medium">{r.material} {r._new && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success">NOVO</span>}</div>
                      <div className="text-xs text-muted-foreground">{r.cat}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{r.un}</td>
                    <Cell value={r.fA} mediana={r.mediana} />
                    <Cell value={r.fB} mediana={r.mediana} />
                    <Cell value={r.fC} mediana={r.mediana} />
                    <td className="px-4 py-3 text-center font-mono font-medium">
                      {r.mediana.toLocaleString("pt-PT")}
                    </td>
                    <td className={`px-4 py-3 text-center font-mono ${high ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {r.desvio}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {high ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">
                          <AlertTriangle className="size-3" /> Desvio
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-success text-xs">
                          <TrendingUp className="size-3" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-muted/20">
                      <td colSpan={9} className="px-6 py-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium">Evolução de preço — últimos 6 meses</div>
                          <div className={`text-xs font-mono ${change > 0 ? "text-destructive" : "text-success"}`}>
                            {change > 0 ? "▲" : "▼"} {Math.abs(change)}% desde Jan 2026
                          </div>
                        </div>
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                              <XAxis dataKey="month" stroke="hsl(220 10% 50%)" fontSize={11} />
                              <YAxis stroke="hsl(220 10% 50%)" fontSize={11} />
                              <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <ReferenceLine y={r.mediana} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Mediana", fontSize: 10, fill: "hsl(var(--accent))" }} />
                              <Line type="monotone" dataKey="Forn. A" stroke="hsl(211 70% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="Forn. B" stroke="hsl(220 10% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="Forn. C" stroke="hsl(0 70% 55%)" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
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

function Cell({ value, mediana }: { value: number; mediana: number }) {
  const desv = ((value - mediana) / mediana) * 100;
  const high = desv > 15;
  return (
    <td className={`px-4 py-3 text-center font-mono ${high ? "bg-destructive/5 text-destructive" : ""}`}>
      {value.toLocaleString("pt-PT")}
      {high && <div className="text-[10px] uppercase tracking-wider">+{desv.toFixed(0)}%</div>}
    </td>
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
              {priceRows.map((r) => <option key={r.material} value={r.material} />)}
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