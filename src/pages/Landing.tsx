import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileSearch,
  Database,
  ShieldCheck,
  GanttChartSquare,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-gradient-hero grid place-items-center">
              <Building2 className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">SQI</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                Sistema Quantitativo Integrado
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#problema" className="hover:text-foreground">Problema</a>
            <a href="#como" className="hover:text-foreground">Como funciona</a>
            <a href="#modulos" className="hover:text-foreground">Módulos</a>
            <a href="#metricas" className="hover:text-foreground">Métricas</a>
          </nav>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            Entrar no sistema <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-xs uppercase tracking-[0.16em] mb-8 animate-fade-in">
            <span className="size-1.5 rounded-full bg-warning" />
            Construção civil · Moçambique · Fase 1 MVP
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] max-w-4xl text-balance animate-fade-up">
            Quantidades, preços e auditoria — um único sistema.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            O SQI une a extracção de quantitativos a partir de plantas BIM, os cálculos
            estruturais e uma base de preços de mercados formais e informais — com trilha
            de auditoria em cada alteração.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Link
              to="/app/modelo-3d"
              className="inline-flex items-center gap-2 bg-warning text-foreground px-5 py-3 rounded-md font-medium hover:opacity-90 transition shadow-elegant"
            >
              <Upload className="size-4" /> Carregar planta / .pln
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 bg-background text-foreground px-5 py-3 rounded-md font-medium hover:bg-white transition shadow-elegant"
            >
              Ver protótipo <ArrowRight className="size-4" />
            </Link>
            <a
              href="#como"
              className="inline-flex items-center gap-2 border border-white/25 px-5 py-3 rounded-md text-sm hover:bg-white/5"
            >
              Como funciona
            </a>
          </div>

          {/* Triad */}
          <div className="mt-16 grid md:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10 shadow-elegant">
            {[
              { i: FileSearch, t: "Quantitativos", d: "Plantas BIM e PDF → áreas, volumes e comprimentos." },
              { i: Database, t: "Preços vivos", d: "≥3 fornecedores por material, mediana e desvio." },
              { i: ShieldCheck, t: "Auditoria total", d: "Cada alteração registada com justificativa." },
            ].map((b) => (
              <div key={b.t} className="bg-primary/80 p-6 backdrop-blur">
                <b.i className="size-5 text-warning mb-3" />
                <div className="font-display text-xl">{b.t}</div>
                <div className="text-sm text-white/70 mt-1.5">{b.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problema" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="text-xs uppercase tracking-[0.18em] text-accent font-medium mb-3">
                01 · O problema
              </div>
              <h2 className="font-display text-4xl leading-tight">
                Orçamentos feitos em planilhas isoladas geram erros, atrasos e manipulação.
              </h2>
            </div>
            <div className="md:col-span-7 grid sm:grid-cols-2 gap-5">
              {[
                "Medição manual a partir de plantas impressas — sujeita a erros",
                "Preços de materiais desactualizados ou recolhidos informalmente",
                "Sem rastreabilidade de alterações — facilita manipulação",
                "Dados dispersos: plantas num sítio, estrutural noutro, preços noutro",
                "Tempo de orçamentação: 3–20 dias manualmente",
                "Sem comparação entre fornecedores formais e informais",
              ].map((p) => (
                <div key={p} className="flex gap-3 p-5 rounded-lg border border-border bg-surface-elevated">
                  <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como" className="py-24 bg-surface-sunken border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.18em] text-accent font-medium mb-3">
            02 · Como funciona
          </div>
          <h2 className="font-display text-4xl max-w-2xl leading-tight">
            Plantas → Quantidades → Preços → BoQ assinado.
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Carrega a planta", d: "Upload em PDF, imagem ou modelo BIM. O sistema extrai dimensões e gera o quantitativo." },
              { n: "02", t: "Sistema cruza preços", d: "Cada material é comparado com cotações reais de ≥3 fornecedores. Mediana e desvio calculados." },
              { n: "03", t: "Gera BoQ + audit log", d: "BoQ por fases com IVA e contingência. Cada alteração ≥10% exige justificativa." },
            ].map((s) => (
              <div key={s.n} className="relative p-7 rounded-xl bg-surface-elevated border border-border shadow-soft">
                <div className="font-display text-5xl text-accent/30 leading-none mb-4">{s.n}</div>
                <div className="font-display text-xl mb-2">{s.t}</div>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules — bento */}
      <section id="modulos" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.18em] text-accent font-medium mb-3">
            03 · Módulos do sistema
          </div>
          <h2 className="font-display text-4xl max-w-2xl leading-tight mb-12">
            Cinco módulos integrados, um único fluxo de trabalho.
          </h2>

          <div className="grid md:grid-cols-6 gap-4 auto-rows-[180px]">
            <BentoCard className="md:col-span-3 md:row-span-2 bg-gradient-hero text-primary-foreground" icon={FileSearch} title="Extracção de quantitativos">
              Upload de plantas em PDF, imagem ou IFC/BIM. Cálculo automático de áreas, volumes e comprimentos por elemento estrutural.
            </BentoCard>
            <BentoCard className="md:col-span-3" icon={Database} title="Base de preços em tempo real">
              ≥3 fornecedores por material. Mediana e desvio calculados automaticamente.
            </BentoCard>
            <BentoCard className="md:col-span-3" icon={Layers} title="Gerador de BoQ automático">
              Quantidades × preço unitário, organizado por fases. Inclui contingência (10%) e IVA (17%).
            </BentoCard>
            <BentoCard className="md:col-span-2" icon={AlertTriangle} title="Sistema de alertas">
              Notifica quando preço &gt;15% acima da mediana ou orçamento total excede planeado.
            </BentoCard>
            <BentoCard className="md:col-span-2" icon={ShieldCheck} title="Auditoria total">
              Cada alteração regista user, timestamp, valor anterior e justificativa.
            </BentoCard>
            <BentoCard className="md:col-span-2" icon={GanttChartSquare} title="Cronograma Gantt">
              Caminho crítico destacado, drag-and-drop e progresso real vs planeado.
            </BentoCard>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section id="metricas" className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.18em] text-warning font-medium mb-3">
            04 · Resultados em curso
          </div>
          <h2 className="font-display text-4xl max-w-2xl">Impacto medido em projectos piloto.</h2>

          <div className="mt-12 grid md:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden">
            {[
              { v: "61.5M MT", l: "Geridos via SQI" },
              { v: "5", l: "Fornecedores integrados" },
              { v: "80%", l: "Redução tempo orçamentação" },
              { v: "100%", l: "Alterações com auditoria" },
            ].map((m) => (
              <div key={m.l} className="bg-primary p-8">
                <div className="font-display text-4xl text-warning">{m.v}</div>
                <div className="text-sm text-white/70 mt-2">{m.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-5">
            {[
              { r: "Gestor de Obra", d: "Cria projectos, gera BoQ, aprova compras." },
              { r: "Engenheiro", d: "Insere quantitativos, valida cálculos estruturais." },
              { r: "Auditor / Supervisor", d: "Acesso de leitura ao audit log, sem edição." },
            ].map((u) => (
              <div key={u.r} className="p-6 rounded-lg border border-white/10 bg-white/5">
                <CheckCircle2 className="size-5 text-warning mb-3" />
                <div className="font-display text-lg">{u.r}</div>
                <div className="text-sm text-white/70 mt-1">{u.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <TrendingUp className="size-8 text-accent mx-auto mb-5" />
          <h2 className="font-display text-4xl md:text-5xl text-balance">
            Pronto para ver o SQI a funcionar?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            O protótipo inclui dashboard, BoQ por fases, base de preços, audit log e cronograma —
            com dados realistas de Maputo e Beira.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition shadow-elegant"
          >
            Abrir protótipo <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© 2026 SQI · Sistema Quantitativo Integrado</div>
          <div>Maputo · Beira · Matola</div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({
  children,
  className = "",
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  icon: any;
  title: string;
}) {
  return (
    <div className={`p-6 rounded-xl border border-border bg-surface-elevated shadow-soft flex flex-col ${className}`}>
      <Icon className="size-5 mb-4 opacity-80" />
      <div className="font-display text-xl mb-2">{title}</div>
      <p className="text-sm opacity-75">{children}</p>
    </div>
  );
}