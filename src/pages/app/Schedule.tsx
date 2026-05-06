import { ganttTasks, phaseColors } from "@/data/mock";
import { Download, Calendar } from "lucide-react";

const TOTAL_WEEKS = 38;

export default function Schedule() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <Calendar className="size-4" />
          Edifício Polana 12 · 38 semanas planeadas
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border border-border overflow-hidden text-sm">
            <button className="px-3 py-1.5 bg-primary text-primary-foreground">Semana</button>
            <button className="px-3 py-1.5 hover:bg-muted">Mês</button>
          </div>
          <button className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted">
            <Download className="size-4" /> Exportar PNG
          </button>
        </div>
      </div>

      {/* Legend */}
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

      {/* Gantt */}
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <div className="grid grid-cols-[260px_1fr] text-xs">
          {/* Header */}
          <div className="bg-muted/60 px-4 py-2.5 font-medium uppercase tracking-wider text-muted-foreground border-r border-border">
            Tarefa
          </div>
          <div className="bg-muted/60 grid border-b border-border" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
              <div key={i} className="text-center py-2.5 text-[10px] text-muted-foreground border-r border-border/50 last:border-r-0">
                {i % 4 === 0 ? `S${i + 1}` : ""}
              </div>
            ))}
          </div>

          {/* Rows */}
          {ganttTasks.map((t, idx) => (
            <RowFragment key={idx} t={t} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Tarefas no caminho crítico" value={ganttTasks.filter(t => t.critical).length} />
        <Stat label="Progresso médio" value={`${Math.round(ganttTasks.reduce((a, t) => a + t.progress, 0) / ganttTasks.length)}%`} />
        <Stat label="Semanas decorridas" value={`18 / ${TOTAL_WEEKS}`} />
      </div>
    </div>
  );
}

function RowFragment({ t }: { t: typeof ganttTasks[number] }) {
  const color = phaseColors[t.phase];
  return (
    <>
      <div className="px-4 py-3 border-r border-b border-border flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: color }} />
        <span className="text-sm">{t.name}</span>
      </div>
      <div className="relative border-b border-border h-12 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 1fr))` }}>
        {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
          <div key={i} className="border-r border-border/40 last:border-r-0" />
        ))}
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md overflow-hidden shadow-soft ${
            t.critical ? "ring-2 ring-destructive ring-offset-1 ring-offset-surface-elevated" : ""
          }`}
          style={{
            left: `${(t.start / TOTAL_WEEKS) * 100}%`,
            width: `${(t.dur / TOTAL_WEEKS) * 100}%`,
            background: color,
          }}
        >
          <div className="h-full bg-black/30" style={{ width: `${t.progress}%` }} />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
    </div>
  );
}