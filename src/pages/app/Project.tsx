import { useParams } from "react-router-dom";
import { useState } from "react";
import { boqRows, projects, fmtMT } from "@/data/mock";
import { Download, FileSpreadsheet, AlertTriangle, Calendar, Bell, TrendingUp, TrendingDown } from "lucide-react";
import ProjectTasks from "@/components/dashboard/DailyTasks";
import { useTasks } from "@/data/store";

const phases = Object.keys(boqRows) as Array<keyof typeof boqRows>;
type TabKey = "resumo" | "vista3d" | "tarefas" | (typeof phases)[number];

// Short label used in tasks (e.g. "Estrutura") derived from BoQ key ("Fase 1 — Estrutura")
const shortPhase = (k: string) => k.split("—").pop()?.trim() ?? k;

export default function Project() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === id) ?? projects[0];
  const [active, setActive] = useState<TabKey>("resumo");
  const [exec, setExec] = useState("Obra dentro do prazo. Atenção ao desvio do aço A500 (+49%) — renegociar com Forn. B antes da próxima encomenda.");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const allTasks = useTasks();
  const projectTasks = allTasks.filter((t) => t.projectId === project.id);
  const pendingByPhase = (phaseKey: string) =>
    projectTasks.filter((t) => !t.done && t.phase === shortPhase(phaseKey)).length;

  const isPhase = (k: TabKey): k is (typeof phases)[number] => phases.includes(k as any);
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
            <button className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted">
              <FileSpreadsheet className="size-4" /> Exportar Excel
            </button>
            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Download className="size-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        <TabBtn label="Resumo" active={active === "resumo"} onClick={() => setActive("resumo")} />
        <TabBtn label="Vista 3D" active={active === "vista3d"} onClick={() => setActive("vista3d")} />
        <TabBtn
          label="Tarefas"
          badge={projectTasks.filter((t) => !t.done).length || undefined}
          active={active === "tarefas"}
          onClick={() => setActive("tarefas")}
        />
        {phases.map((ph) => (
          <TabBtn
            key={ph}
            label={ph}
            badge={pendingByPhase(ph) || undefined}
            active={active === ph}
            onClick={() => setActive(ph)}
          />
        ))}
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

      {active === "tarefas" && (
        <ProjectTasks projectId={project.id} phases={phases.map(shortPhase)} />
      )}

      {isPhase(active) && <BoQTable phase={active} ivaPct={ivaPct} contPct={contPct} />}
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
  const totalFase = rows.reduce((a, r) => a + r.qty * r.atual, 0);
  const grandTotal = totalFase * (1 + ivaPct + contPct);
  return (
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