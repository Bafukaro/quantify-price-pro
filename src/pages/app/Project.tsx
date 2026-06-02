import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { boqRows, projects, fmtMT, ganttTasks, phaseColors } from "@/data/mock";
import { Download, FileSpreadsheet, AlertTriangle, Calendar, Bell, TrendingUp, TrendingDown, ShieldCheck, Calculator, FileText, ScrollText, GanttChartSquare, Layers } from "lucide-react";
import { marketMedian, classifyRisk, RISK_COLOR, RISK_LABEL } from "@/data/priceDb";
import { useAudit } from "@/data/store";
import { exportBoQPDF, exportBoQExcel } from "@/lib/exports";

const phases = Object.keys(boqRows) as Array<keyof typeof boqRows>;
type TabKey = "resumo" | "vista3d" | "fases" | "calculos" | "orcamento" | "cronograma" | "auditlog" | "relatorio";

export default function Project() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const project = projects.find((p) => p.id === id) ?? projects[0];
  const [active, setActive] = useState<TabKey>("resumo");
  useEffect(() => {
    const t = params.get("tab") as TabKey | null;
    const valid: TabKey[] = ["resumo", "vista3d", "fases", "calculos", "orcamento", "cronograma", "auditlog", "relatorio"];
    if (t && valid.includes(t)) setActive(t);
  }, [params]);
  const [exec, setExec] = useState("Obra dentro do prazo. Atenção ao desvio do aço A500 (+49%) — renegociar com Forn. B antes da próxima encomenda.");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const ivaPct = 0.17;
  const contPct = 0.10;

  // contracted vs actual per phase
  const phaseTotals = phases.map((ph) => {
    const rows = boqRows[ph];
    const actual = rows.reduce((a, r) => a + r.qty * r.atual, 0);
    const contracted = rows.reduce((a, r) => a + r.qty * r.p2019, 0);
    return { ph, actual, contracted };
  });
  const totalActual = phaseTotals.reduce((a, p) => a + p.actual, 0);
  const totalContracted = phaseTotals.reduce((a, p) => a + p.contracted, 0);
  const deviationPct = ((totalActual - totalContracted) / totalContracted) * 100;

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
            <button onClick={() => exportBoQExcel(project.name)} className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted">
              <FileSpreadsheet className="size-4" /> Exportar Excel
            </button>
            <button onClick={() => exportBoQPDF(project.name)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Download className="size-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        <TabBtn label="Resumo" active={active === "resumo"} onClick={() => setActive("resumo")} />
        <TabBtn label="Vista 3D" active={active === "vista3d"} onClick={() => setActive("vista3d")} />
        <TabBtn label="Fases" active={active === "fases"} onClick={() => setActive("fases")} />
        <TabBtn label="Cálculos" active={active === "calculos"} onClick={() => setActive("calculos")} />
        <TabBtn label="Orçamento" active={active === "orcamento"} onClick={() => setActive("orcamento")} />
        <TabBtn label="Cronograma" active={active === "cronograma"} onClick={() => setActive("cronograma")} />
        <TabBtn label="Audit Log" active={active === "auditlog"} onClick={() => setActive("auditlog")} />
        <TabBtn label="Relatório" active={active === "relatorio"} onClick={() => setActive("relatorio")} />
      </div>

      {active === "resumo" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor contratado</div>
              <div className="font-display text-3xl mt-2">{fmtMT(totalContracted)}</div>
              <div className="text-xs text-muted-foreground mt-1">Base 2019 · adjudicação</div>
            </div>
            <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor actual do sistema</div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${deviationPct > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {deviationPct > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {deviationPct > 0 ? "+" : ""}{deviationPct.toFixed(1)}%
                </span>
              </div>
              <div className="font-display text-3xl mt-2">{fmtMT(totalActual)}</div>
              <div className="text-xs text-muted-foreground mt-1">Preços actuais · {phases.length} fases</div>
            </div>
          </div>

          {/* Bar chart by phase */}
          <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
            <h3 className="font-display text-lg mb-4">Custo por fase — contratado vs actual</h3>
            <div className="space-y-3">
              {phaseTotals.map(({ ph, actual, contracted }) => {
                const max = Math.max(...phaseTotals.flatMap((p) => [p.actual, p.contracted]));
                return (
                  <div key={ph} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{ph}</span>
                      <span className="font-mono">{fmtMT(actual)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-muted-foreground/40" style={{ width: `${(contracted / max) * 100}%` }} />
                      </div>
                      <div className="h-2.5 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${(actual / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted-foreground/40" /> Contratado</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-accent" /> Actual</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Calendar className="size-3.5" /> Próxima fase a iniciar
              </div>
              <div className="font-display text-xl mt-2">Fase 3 — Instalações</div>
              <div className="text-xs text-muted-foreground mt-1">Início estimado: 22 Maio 2026</div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-accent">•</span> Conclusão alvenaria piso 3</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Aprovação cotação cabos eléctricos</li>
                <li className="flex gap-2"><span className="text-accent">•</span> Mobilização equipa subempreitada</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Bell className="size-3.5" /> Alertas activos de preço
              </div>
              <div className="font-display text-5xl mt-2 text-warning">{project.alerts}</div>
              <div className="text-xs text-muted-foreground mt-1">Materiais com desvio &gt;15% face à mediana</div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Resumo executivo</label>
            <textarea
              value={exec}
              onChange={(e) => setExec(e.target.value)}
              rows={4}
              className="mt-2 w-full p-3 rounded-md border border-border bg-background text-sm font-body resize-none focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

      {active === "vista3d" && <Vista3D selected={selectedFloor} onSelect={setSelectedFloor} />}
      {active === "fases" && <FasesView ivaPct={ivaPct} contPct={contPct} />}
      {active === "calculos" && <CalculosView />}
      {active === "orcamento" && <OrcamentoView ivaPct={ivaPct} contPct={contPct} projectName={project.name} />}
      {active === "cronograma" && <CronogramaView />}
      {active === "auditlog" && <AuditLogView />}
      {active === "relatorio" && <RelatorioView project={project} totalActual={totalActual} totalContracted={totalContracted} deviationPct={deviationPct} exec={exec} />}
    </div>
  );
}

function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition inline-flex items-center gap-2 ${
        active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {badge !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning/15 text-warning text-[10px] font-mono">
          {badge}
        </span>
      )}
    </button>
  );
}

function BoQTable({ phase, ivaPct, contPct }: { phase: keyof typeof boqRows; ivaPct: number; contPct: number }) {
  const rows = boqRows[phase];
  // Resolve dynamic price for items linked to priceDb (median of all current quotes)
  const resolved = rows.map((r) => {
    const market = r.materialId ? marketMedian(r.materialId) : 0;
    const price = market > 0 ? market : r.atual;
    const delta = ((price - r.p2019) / r.p2019) * 100;
    const risk = classifyRisk(delta);
    return { ...r, price, market, delta, risk, total: r.qty * price, dynamic: market > 0 };
  });
  const totalFase = resolved.reduce((a, r) => a + r.total, 0);
  const grandTotal = totalFase * (1 + ivaPct + contPct);
  return (
    <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        {resolved.some((r) => r.dynamic) && (
          <div className="px-5 py-2 bg-accent/5 border-b border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            Preços actualizados em tempo real a partir da Base de Preços (mediana de mercado).
          </div>
        )}
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
                <Th>Risco</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resolved.map((r) => {
                return (
                  <tr key={r.item} className="hover:bg-muted/30">
                    <Td className="font-mono">{r.item}</Td>
                    <Td className="text-left">{r.desc}</Td>
                    <Td className="text-muted-foreground">{r.un}</Td>
                    <Td className="font-mono">{r.qty.toLocaleString("pt-PT")}</Td>
                    <Td className="font-mono text-muted-foreground">{r.p2019.toLocaleString("pt-PT")}</Td>
                    <Td className={`font-mono ${r.risk === "alto" ? "text-destructive font-medium" : r.risk === "atencao" ? "text-warning font-medium" : ""}`}>
                      {Math.round(r.price).toLocaleString("pt-PT")}
                      {r.dynamic && <div className="text-[9px] text-accent uppercase tracking-wider">live</div>}
                    </Td>
                    <Td className={`font-mono ${r.delta > 15 ? "text-destructive" : "text-muted-foreground"}`}>
                      +{r.delta.toFixed(0)}%
                    </Td>
                    <Td className="font-mono font-medium">{Math.round(r.total).toLocaleString("pt-PT")}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${RISK_COLOR[r.risk]}`}>
                        {r.risk !== "normal" && <AlertTriangle className="size-3" />}
                        {RISK_LABEL[r.risk]}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/40 border-t border-border p-5 grid sm:grid-cols-4 gap-4">
          <Total label="Subtotal fase" value={fmtMT(totalFase)} />
          <Total label={`Contingência (${(contPct * 100).toFixed(0)}%)`} value={fmtMT(totalFase * contPct)} />
          <Total label={`IVA (${(ivaPct * 100).toFixed(0)}%)`} value={fmtMT(totalFase * ivaPct)} />
          <Total label="Total geral" value={fmtMT(grandTotal)} highlight />
        </div>
      </div>
  );
}

const FLOORS = [
  { idx: 4, label: "Piso 3", status: "todo", phase: "Por iniciar", boq: "Cobertura + acabamentos pendentes" },
  { idx: 3, label: "Piso 2", status: "progress", phase: "Alvenaria em curso", boq: "Tijolo 11x20x30 · Reboco" },
  { idx: 2, label: "Piso 1", status: "done", phase: "Estrutura concluída", boq: "Lajes · Pilares betão C25/30" },
  { idx: 1, label: "R/Chão", status: "done", phase: "Estrutura concluída", boq: "Fundações · Pilares" },
];
const STATUS_COLORS: Record<string, string> = {
  done: "hsl(152 55% 38%)",
  progress: "hsl(211 47% 43%)",
  todo: "hsl(220 10% 70%)",
};
const STATUS_LABEL: Record<string, string> = { done: "Concluído", progress: "Em curso", todo: "Por iniciar" };

function Vista3D({ selected, onSelect }: { selected: number | null; onSelect: (n: number | null) => void }) {
  const cx = 200, cy = 280, w = 180, d = 100, h = 50;
  const sel = FLOORS.find((f) => f.idx === selected);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-6">
        <svg viewBox="0 0 500 500" className="w-full h-[480px]">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(220 30% 96%)" />
              <stop offset="100%" stopColor="hsl(220 25% 88%)" />
            </linearGradient>
          </defs>
          <rect width="500" height="500" fill="url(#bg)" rx="8" />
          {/* ground */}
          <polygon points={`${cx},${cy + h} ${cx + w},${cy + h - d * 0.5} ${cx + w + d},${cy + h - d * 0.5 - d * 0.3} ${cx + d},${cy + h - d * 0.3}`} fill="hsl(220 15% 80%)" opacity="0.5" />
          {FLOORS.map((f, i) => {
            const fy = cy - i * h;
            const isSel = selected === f.idx;
            const color = STATUS_COLORS[f.status];
            return (
              <g key={f.idx} onClick={() => onSelect(isSel ? null : f.idx)} style={{ cursor: "pointer" }} opacity={selected && !isSel ? 0.55 : 1}>
                {/* front */}
                <polygon points={`${cx},${fy} ${cx + w},${fy} ${cx + w},${fy + h} ${cx},${fy + h}`} fill={color} stroke={isSel ? "hsl(38 92% 50%)" : "hsl(220 30% 25%)"} strokeWidth={isSel ? 3 : 1} />
                {/* top */}
                <polygon points={`${cx},${fy} ${cx + d},${fy - d * 0.3} ${cx + w + d},${fy - d * 0.3} ${cx + w},${fy}`} fill={color} opacity="0.85" stroke="hsl(220 30% 25%)" strokeWidth="1" />
                {/* side */}
                <polygon points={`${cx + w},${fy} ${cx + w + d},${fy - d * 0.3} ${cx + w + d},${fy + h - d * 0.3} ${cx + w},${fy + h}`} fill={color} opacity="0.7" stroke="hsl(220 30% 25%)" strokeWidth="1" />
                {/* windows */}
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={cx + 20 + k * 55} y={fy + 12} width="30" height="22" fill="hsl(220 40% 92%)" opacity="0.85" />
                ))}
                <text x={cx - 12} y={fy + h / 2 + 4} textAnchor="end" className="fill-foreground" fontSize="11" fontFamily="IBM Plex Sans">
                  {f.label}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Legend */}
        <div className="flex items-center gap-5 pt-4 border-t border-border text-xs">
          {Object.entries(STATUS_COLORS).map(([k, c]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="size-3 rounded-sm" style={{ background: c }} />
              <span className="text-muted-foreground">{STATUS_LABEL[k]}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Estado por piso</div>
          <ul className="mt-3 space-y-2">
            {FLOORS.map((f) => (
              <li key={f.idx}>
                <button onClick={() => onSelect(f.idx)} className={`w-full text-left p-2.5 rounded-md border transition ${selected === f.idx ? "border-accent bg-accent/5" : "border-border hover:bg-muted/40"}`}>
                  <div className="text-sm font-medium">{f.label} — {f.phase}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {sel && (
          <div className="rounded-xl bg-primary text-primary-foreground p-5 shadow-elegant animate-fade-in">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">{sel.label}</div>
            <div className="font-display text-xl mt-1">{sel.phase}</div>
            <div className="mt-3 pt-3 border-t border-white/10 text-sm text-white/80">
              <div className="text-[10px] uppercase tracking-wider text-white/60 mb-1">BoQ deste piso</div>
              {sel.boq}
            </div>
          </div>
        )}
      </aside>
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

// ===================== FASES =====================
function FasesView({ ivaPct, contPct }: { ivaPct: number; contPct: number }) {
  const [open, setOpen] = useState<string>(phases[0]);
  return (
    <div className="space-y-3">
      {phases.map((ph) => {
        const rows = boqRows[ph];
        const subtotal = rows.reduce((a, r) => {
          const m = r.materialId ? marketMedian(r.materialId) : 0;
          return a + r.qty * (m > 0 ? m : r.atual);
        }, 0);
        const contracted = rows.reduce((a, r) => a + r.qty * r.p2019, 0);
        const delta = ((subtotal - contracted) / contracted) * 100;
        const alerts = rows.filter((r) => {
          const m = r.materialId ? marketMedian(r.materialId) : 0;
          const price = m > 0 ? m : r.atual;
          return ((price - r.p2019) / r.p2019) * 100 > 15;
        }).length;
        const isOpen = open === ph;
        return (
          <div key={ph} className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? "" : ph)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-3 text-left">
                <Layers className="size-4 text-accent" />
                <div>
                  <div className="font-display text-base">{ph}</div>
                  <div className="text-xs text-muted-foreground">{rows.length} itens · {fmtMT(subtotal)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {alerts > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="size-3" /> {alerts}
                  </span>
                )}
                <span className={`text-xs font-mono ${delta > 15 ? "text-destructive" : "text-muted-foreground"}`}>
                  Δ {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                </span>
              </div>
            </button>
            {isOpen && <BoQTable phase={ph} ivaPct={ivaPct} contPct={contPct} />}
          </div>
        );
      })}
    </div>
  );
}

// ===================== CÁLCULOS (REBAP) =====================
const REBAP_CHECKS: Array<{
  phase: string;
  items: { titulo: string; valor: string; norma: string; ok: boolean }[];
}> = [
  {
    phase: "Fase 1 — Estrutura · Fundações",
    items: [
      { titulo: "Armadura longitudinal mínima (sapatas)", valor: "Ø10 // 0.15 m — As = 5.24 cm²/m", norma: "REBAP Art. 89 — mín. 0.10% da secção", ok: true },
      { titulo: "Espaçamento mínimo entre varões", valor: "12 cm", norma: "REBAP Art. 78 — ≥ 1.5×Ømáx, mín. 4 cm", ok: true },
      { titulo: "Classe de betão em fundações", valor: "C25/30", norma: "REBAP Art. 13 — mín. C20/25 em meio agressivo", ok: true },
      { titulo: "Recobrimento das armaduras", valor: "4 cm", norma: "REBAP Art. 81 — mín. 3.5 cm em contacto com terreno", ok: true },
    ],
  },
  {
    phase: "Fase 1 — Estrutura · Pilares",
    items: [
      { titulo: "Taxa geométrica de armadura longitudinal", valor: "ρ = 1.2%", norma: "REBAP Art. 121 — 0.8% ≤ ρ ≤ 6%", ok: true },
      { titulo: "Estribos — diâmetro", valor: "Ø8 mm", norma: "REBAP Art. 122 — ≥ Ømáx/4 e ≥ 6 mm", ok: true },
      { titulo: "Espaçamento de estribos", valor: "15 cm", norma: "REBAP Art. 122 — ≤ 12·Ømin = 12 cm", ok: false },
      { titulo: "Classe de betão pilares", valor: "C25/30", norma: "REBAP Art. 13 — mín. C20/25", ok: true },
    ],
  },
  {
    phase: "Fase 1 — Estrutura · Lajes",
    items: [
      { titulo: "Espessura mínima laje maciça", valor: "18 cm", norma: "REBAP Art. 102 — L/30 = 16.7 cm", ok: true },
      { titulo: "Armadura de distribuição", valor: "Ø8 // 0.20 m", norma: "REBAP Art. 91 — mín. 20% da principal", ok: true },
      { titulo: "Recobrimento", valor: "2.5 cm", norma: "REBAP Art. 81 — mín. 2.0 cm interior", ok: true },
    ],
  },
  {
    phase: "Fase 2 — Alvenaria",
    items: [
      { titulo: "Argamassa de assentamento", valor: "Traço 1:4 (cimento:areia)", norma: "EN 998-2 — classe M5 mínima", ok: true },
      { titulo: "Espessura juntas", valor: "1.0 cm", norma: "Boa prática — 0.8 a 1.2 cm", ok: true },
    ],
  },
];

function CalculosView() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-lg border border-accent/30 bg-accent/5">
        <ShieldCheck className="size-5 text-accent mt-0.5 shrink-0" />
        <div className="text-sm">
          <div className="font-medium">Cálculos estruturais — validação automática REBAP</div>
          <div className="text-muted-foreground text-xs mt-0.5">
            Cada resultado é confrontado com a norma aplicável. Itens fora de norma são sinalizados a vermelho.
          </div>
        </div>
      </div>
      {REBAP_CHECKS.map((g) => (
        <div key={g.phase} className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
            <Calculator className="size-4 text-muted-foreground" />
            <span className="font-display text-base">{g.phase}</span>
          </div>
          <ul className="divide-y divide-border">
            {g.items.map((it) => (
              <li key={it.titulo} className="px-5 py-3 flex items-start gap-3">
                <span className={`mt-1.5 size-2 rounded-full shrink-0 ${it.ok ? "bg-success" : "bg-destructive"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="text-sm font-medium">{it.titulo}</div>
                    <div className="font-mono text-sm">{it.valor}</div>
                  </div>
                  <div className={`text-xs mt-0.5 ${it.ok ? "text-muted-foreground" : "text-destructive"}`}>
                    {it.ok ? "Conforme " : "Não conforme — "}{it.norma}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ===================== ORÇAMENTO =====================
function OrcamentoView({ ivaPct, contPct, projectName }: { ivaPct: number; contPct: number; projectName: string }) {
  const perPhase = phases.map((ph) => {
    const subtotal = boqRows[ph].reduce((a, r) => {
      const m = r.materialId ? marketMedian(r.materialId) : 0;
      return a + r.qty * (m > 0 ? m : r.atual);
    }, 0);
    return { ph, subtotal };
  });
  const subtotalGeral = perPhase.reduce((a, p) => a + p.subtotal, 0);
  const contingencia = subtotalGeral * contPct;
  const iva = subtotalGeral * ivaPct;
  const total = subtotalGeral + contingencia + iva;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground">
          BoQ completo gerado automaticamente a partir das quantidades extraídas e da Base de Preços.
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportBoQExcel(projectName)} className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-sm hover:bg-muted">
            <FileSpreadsheet className="size-4" /> Excel
          </button>
          <button onClick={() => exportBoQPDF(projectName)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90">
            <Download className="size-4" /> PDF
          </button>
        </div>
      </div>
      {phases.map((ph) => (
        <div key={ph} className="space-y-2">
          <div className="text-sm font-display">{ph}</div>
          <BoQTable phase={ph} ivaPct={0} contPct={0} />
        </div>
      ))}
      <div className="rounded-xl bg-primary text-primary-foreground p-6 shadow-elegant">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">Total geral do projecto</div>
        <div className="grid sm:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Subtotal</div>
            <div className="font-display text-lg">{fmtMT(subtotalGeral)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Contingência {(contPct * 100).toFixed(0)}%</div>
            <div className="font-display text-lg">{fmtMT(contingencia)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">IVA {(ivaPct * 100).toFixed(0)}%</div>
            <div className="font-display text-lg">{fmtMT(iva)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">Total</div>
            <div className="font-display text-2xl text-accent">{fmtMT(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== CRONOGRAMA =====================
const TOTAL_WEEKS = 38;
function CronogramaView() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries(phaseColors).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: c }} /> {k}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border-2 border-destructive" /> Caminho crítico
        </span>
      </div>
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <div className="grid grid-cols-[240px_1fr] text-xs">
          <div className="bg-muted/60 px-4 py-2.5 font-medium uppercase tracking-wider text-muted-foreground border-r border-border">Tarefa</div>
          <div className="bg-muted/60 grid border-b border-border" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
              <div key={i} className="text-center py-2.5 text-[10px] text-muted-foreground border-r border-border/50 last:border-r-0">
                {i % 4 === 0 ? `S${i + 1}` : ""}
              </div>
            ))}
          </div>
          {ganttTasks.map((t, idx) => {
            const color = phaseColors[t.phase];
            return (
              <div key={idx} className="contents">
                <div className="px-4 py-3 border-r border-b border-border flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm">{t.name}</span>
                </div>
                <div className="relative border-b border-border h-12 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 1fr))` }}>
                  {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
                    <div key={i} className="border-r border-border/40 last:border-r-0" />
                  ))}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md overflow-hidden shadow-soft ${t.critical ? "ring-2 ring-destructive ring-offset-1 ring-offset-surface-elevated" : ""}`}
                    style={{ left: `${(t.start / TOTAL_WEEKS) * 100}%`, width: `${(t.dur / TOTAL_WEEKS) * 100}%`, background: color }}
                  >
                    <div className="h-full bg-black/30" style={{ width: `${t.progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tarefas críticas</div>
          <div className="font-display text-2xl mt-2">{ganttTasks.filter((t) => t.critical).length}</div>
        </div>
        <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Progresso médio</div>
          <div className="font-display text-2xl mt-2">{Math.round(ganttTasks.reduce((a, t) => a + t.progress, 0) / ganttTasks.length)}%</div>
        </div>
        <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Semanas decorridas</div>
          <div className="font-display text-2xl mt-2">18 / {TOTAL_WEEKS}</div>
        </div>
      </div>
    </div>
  );
}

// ===================== AUDIT LOG =====================
function AuditLogView() {
  const entries = useAudit();
  return (
    <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <ScrollText className="size-4 text-accent" />
        <span className="text-sm">Histórico imutável de alterações deste projecto · {entries.length} entradas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Data / Hora</th>
              <th className="px-4 py-3 text-left">Utilizador</th>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Anterior</th>
              <th className="px-4 py-3 text-left">Novo</th>
              <th className="px-4 py-3">Δ%</th>
              <th className="px-4 py-3 text-left">Justificativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((e, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{e.dt}</td>
                <td className="px-4 py-3">{e.user}</td>
                <td className="px-4 py-3 font-medium">{e.item}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.from}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.to}</td>
                <td className={`px-4 py-3 text-center font-mono ${e.delta > 10 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {e.delta > 0 ? `+${e.delta}%` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-sm">{e.just}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===================== RELATÓRIO =====================
function RelatorioView({ project, totalActual, totalContracted, deviationPct, exec }: any) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          Relatório técnico compilando todas as secções do projecto
        </div>
        <button onClick={() => exportBoQPDF(project.name)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <Download className="size-4" /> Gerar PDF
        </button>
      </div>
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-8 max-w-3xl mx-auto">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SQI — Relatório de obra</div>
        <h2 className="font-display text-2xl mt-1">{project.name}</h2>
        <div className="text-sm text-muted-foreground">{project.location} · {project.client}</div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <Metric label="Valor contratado" value={fmtMT(totalContracted)} />
          <Metric label="Valor actual" value={fmtMT(totalActual)} />
          <Metric label="Desvio" value={`${deviationPct > 0 ? "+" : ""}${deviationPct.toFixed(1)}%`} accent={deviationPct > 0} />
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Secções incluídas</div>
          <ul className="text-sm space-y-1.5">
            {["Resumo executivo", "Vista 3D e progresso por piso", "BoQ por fase com preços actualizados", "Validação estrutural REBAP", "Orçamento consolidado", "Cronograma Gantt", "Audit log completo"].map((s) => (
              <li key={s} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" /> {s}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Resumo executivo</div>
          <p className="text-sm leading-relaxed">{exec}</p>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-[11px] text-muted-foreground flex justify-between">
          <span>Hash SHA-256 · 8a3f…d201</span>
          <span>Gerado por SQI · {new Date().toLocaleDateString("pt-PT")}</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-xl mt-1 ${accent ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}