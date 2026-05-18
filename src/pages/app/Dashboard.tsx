import { Link } from "react-router-dom";
import { projects, fmtMT } from "@/data/mock";
import { AlertTriangle, ArrowUpRight, Plus, TrendingUp, Building2, Wallet, ListTodo, Gauge, CheckCircle2, XCircle } from "lucide-react";
import { useTasks } from "@/data/store";

export default function Dashboard() {
  const totalGerido = projects.reduce((a, p) => a + p.totalMT, 0);
  const totalAlertas = projects.reduce((a, p) => a + p.alerts, 0);
  const tasks = useTasks();
  const pendingByProject = projects
    .map((p) => ({ p, n: tasks.filter((t) => t.projectId === p.id && !t.done).length }))
    .sort((a, b) => b.n - a.n);
  const totalPending = pendingByProject.reduce((a, x) => a + x.n, 0);
  const topProject = pendingByProject[0];

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
        <TraceabilityKpi />
        <Kpi icon={AlertTriangle} label="Alertas activos" value={String(totalAlertas)} delta="3 desvios de preço" warn />
      </div>

      <TraceabilityPanel />

      <ComparisonSection />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Obras em curso</h2>
            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 shadow-soft">
              <Plus className="size-4" /> Novo projecto
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
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
        <aside className="space-y-4">
          <Link
            to={topProject && topProject.n > 0 ? `/app/projecto/${topProject.p.id}?tab=tarefas` : "#"}
            className="block p-5 rounded-xl bg-surface-elevated border border-border shadow-soft hover:shadow-elegant transition group"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Tarefas pendentes</div>
              <ListTodo className="size-4 text-accent" />
            </div>
            <div className="font-display text-4xl mt-3">{totalPending}</div>
            <div className="text-xs text-muted-foreground mt-1">
              em {pendingByProject.filter((x) => x.n > 0).length} projecto(s)
            </div>
            {topProject && topProject.n > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate">
                  +{topProject.n} em <span className="text-foreground font-medium">{topProject.p.name}</span>
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-accent transition shrink-0" />
              </div>
            )}
          </Link>

          <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Por projecto</div>
            <ul className="space-y-2">
              {pendingByProject.map(({ p, n }) => (
                <li key={p.id}>
                  <Link
                    to={`/app/projecto/${p.id}?tab=tarefas`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-muted/50 text-sm"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${n > 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                      {n}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
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

function TraceabilityKpi() {
  const score = 78;
  return (
    <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Decision Traceability</div>
        <Gauge className="size-4 text-accent" />
      </div>
      <div className="font-display text-3xl mt-3">{score}%</div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">Governance score</div>
    </div>
  );
}

function TraceabilityPanel() {
  const rows = [
    { level: "Risco Baixo", score: 90, tone: "bg-success" },
    { level: "Risco Médio", score: 65, tone: "bg-warning" },
    { level: "Risco Alto", score: 40, tone: "bg-destructive" },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg">Decision Traceability Score</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Métrica de engenharia para rastreabilidade e accountability das decisões.
          </p>
        </div>
        <Link to="/app/auditoria" className="text-xs font-medium text-accent hover:underline">
          Ver audit log →
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mt-5">
        {rows.map((r) => (
          <div key={r.level}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">{r.level}</span>
              <span className="font-mono text-muted-foreground">{r.score}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${r.tone}`} style={{ width: `${r.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonSection() {
  const rows = [
    ["Quantitativos", "Manual, folha de cálculo", "Extracção automática a partir de IFC / BIM"],
    ["Preços", "Cotações informais isoladas", "Análise estatística (mediana, σ, spread)"],
    ["Rastreabilidade", "Sem registo formal", "Audit log imutável por acção"],
    ["Decisão", "Subjectiva", "Workflow baseado em risco com justificação"],
    ["Relatórios", "Manuais, formato livre", "Geração automática PDF / Excel"],
    ["Compliance", "Verificação ad-hoc", "Indicadores REBAP / EC / EN 206"],
  ];
  return (
    <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display text-lg">Workflow Tradicional vs QSystem</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Comparação técnica directa de processos.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3 w-1/4">Dimensão</th>
              <th className="text-left px-5 py-3">Workflow Tradicional</th>
              <th className="text-left px-5 py-3">QSystem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([dim, trad, qsys]) => (
              <tr key={dim} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{dim}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <XCircle className="size-3.5 text-destructive shrink-0" /> {trad}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-success shrink-0" /> {qsys}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}