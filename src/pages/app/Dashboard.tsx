import { Link } from "react-router-dom";
import { projects, fmtMT } from "@/data/mock";
import { AlertTriangle, ArrowUpRight, Plus, TrendingUp, Building2, Wallet } from "lucide-react";

export default function Dashboard() {
  const totalGerido = projects.reduce((a, p) => a + p.totalMT, 0);
  const totalAlertas = projects.reduce((a, p) => a + p.alerts, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alerts strip */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-warning/40 bg-warning/10">
        <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <span className="font-medium text-foreground">3 materiais com desvio &gt;15%</span>
          <span className="text-muted-foreground"> — Aço A500, Cabo XV 3x2.5, Chapa lacada cobertura.</span>
        </div>
        <Link to="/app/precos" className="text-sm font-medium text-accent hover:underline shrink-0">
          Ver detalhes →
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Building2} label="Projectos activos" value={String(projects.length)} delta="+1 este mês" />
        <Kpi icon={Wallet} label="Valor total gerido" value={fmtMT(totalGerido)} delta="MZN" />
        <Kpi icon={TrendingUp} label="Redução de tempo" value="80%" delta="vs. orçamentação manual" />
        <Kpi icon={AlertTriangle} label="Alertas activos" value={String(totalAlertas)} delta="3 desvios de preço" warn />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Obras em curso</h2>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-soft">
          <Plus className="size-4" /> Novo projecto
        </button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/app/projecto/${p.id}`}
            className="group p-6 rounded-xl bg-surface-elevated border border-border shadow-soft hover:shadow-elegant transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {p.location}
                </div>
                <h3 className="font-display text-xl mt-1 group-hover:text-accent transition-colors">
                  {p.name}
                </h3>
                <div className="text-sm text-muted-foreground mt-1">{p.client}</div>
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-accent transition" />
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor total</div>
                <div className="font-display text-2xl">{fmtMT(p.totalMT)}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Executado</div>
                <div className="font-mono text-lg">{p.spentPct}%</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.phase}</span>
                {p.alerts > 0 && (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <AlertTriangle className="size-3" /> {p.alerts} alertas
                  </span>
                )}
              </div>
              <div className="flex gap-1 h-2">
                {p.phases.map((ph) => (
                  <div key={ph.name} className="flex-1 rounded-sm bg-muted overflow-hidden" title={`${ph.name} ${ph.pct}%`}>
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${ph.pct}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                {p.phases.map((ph) => (
                  <span key={ph.name} className="flex-1 truncate">{ph.name.slice(0, 4)}.</span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              Última actualização · {p.updatedAt}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, delta, warn = false }: any) {
  return (
    <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`size-4 ${warn ? "text-warning" : "text-accent"}`} />
      </div>
      <div className="font-display text-3xl mt-3">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{delta}</div>
    </div>
  );
}