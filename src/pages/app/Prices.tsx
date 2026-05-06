import { useState } from "react";
import { priceRows } from "@/data/mock";
import { Plus, Filter, AlertTriangle, TrendingUp } from "lucide-react";

const cats = ["Todos", "Cimento", "Ferro", "PVC", "Eléctrica", "Tintas"];

export default function Prices() {
  const [cat, setCat] = useState("Todos");
  const filtered = cat === "Todos" ? priceRows : priceRows.filter((r) => r.cat === cat);

  return (
    <div className="space-y-6 animate-fade-in">
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
                return (
                  <tr key={r.material} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-left">
                      <div className="font-medium">{r.material}</div>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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