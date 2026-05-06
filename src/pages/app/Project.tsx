import { useParams } from "react-router-dom";
import { useState } from "react";
import { boqRows, projects, fmtMT } from "@/data/mock";
import { Download, FileSpreadsheet, AlertTriangle } from "lucide-react";

const phases = Object.keys(boqRows) as Array<keyof typeof boqRows>;

export default function Project() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === id) ?? projects[0];
  const [active, setActive] = useState<keyof typeof boqRows>(phases[1]);

  const rows = boqRows[active];
  const totalFase = rows.reduce((a, r) => a + r.qty * r.atual, 0);
  const ivaPct = 0.17;
  const contPct = 0.10;
  const grandTotal = totalFase * (1 + ivaPct + contPct);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project header */}
      <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {project.location} · {project.client}
            </div>
            <h2 className="font-display text-3xl mt-1">{project.name}</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Fase actual: <span className="text-foreground font-medium">{project.phase}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted">
              <FileSpreadsheet className="size-4" /> Exportar Excel
            </button>
            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Download className="size-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {phases.map((ph) => (
          <button
            key={ph}
            onClick={() => setActive(ph)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              active === ph
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {ph}
          </button>
        ))}
      </div>

      {/* BoQ table */}
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <Th>Item</Th>
                <Th className="text-left w-[40%]">Descrição</Th>
                <Th>Un</Th>
                <Th>Qtd</Th>
                <Th>Preço 2019</Th>
                <Th>Preço actual</Th>
                <Th>Δ%</Th>
                <Th>Total (MT)</Th>
                <Th>Alerta</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const delta = ((r.atual - r.p2019) / r.p2019) * 100;
                const total = r.qty * r.atual;
                return (
                  <tr key={r.item} className="hover:bg-muted/30">
                    <Td className="font-mono">{r.item}</Td>
                    <Td className="text-left">{r.desc}</Td>
                    <Td className="text-muted-foreground">{r.un}</Td>
                    <Td className="font-mono">{r.qty.toLocaleString("pt-PT")}</Td>
                    <Td className="font-mono text-muted-foreground">{r.p2019.toLocaleString("pt-PT")}</Td>
                    <Td className={`font-mono ${r.alert ? "text-destructive font-medium" : ""}`}>
                      {r.atual.toLocaleString("pt-PT")}
                    </Td>
                    <Td className={`font-mono ${delta > 15 ? "text-destructive" : "text-muted-foreground"}`}>
                      +{delta.toFixed(0)}%
                    </Td>
                    <Td className="font-mono font-medium">{total.toLocaleString("pt-PT")}</Td>
                    <Td>
                      {r.alert && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">
                          <AlertTriangle className="size-3" /> &gt;15%
                        </span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-muted/40 border-t border-border p-5 grid sm:grid-cols-4 gap-4">
          <Total label="Subtotal fase" value={fmtMT(totalFase)} />
          <Total label={`Contingência (${(contPct * 100).toFixed(0)}%)`} value={fmtMT(totalFase * contPct)} />
          <Total label={`IVA (${(ivaPct * 100).toFixed(0)}%)`} value={fmtMT(totalFase * ivaPct)} />
          <Total label="Total geral" value={fmtMT(grandTotal)} highlight />
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: any) {
  return <th className={`px-4 py-3 text-right font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: any) {
  return <td className={`px-4 py-3 text-right ${className}`}>{children}</td>;
}
function Total({ label, value, highlight = false }: any) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display ${highlight ? "text-2xl text-accent" : "text-lg"}`}>{value}</div>
    </div>
  );
}