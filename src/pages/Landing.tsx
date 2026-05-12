import { Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment } from "@react-three/drei";
import BuildingModel, { PhaseKey, PHASE_COLORS } from "@/components/three/BuildingModel";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowRight,
  Building2,
  FileSearch,
  Database,
  ShieldCheck,
  GanttChartSquare,
  Layers,
  AlertTriangle,
  Upload,
  Activity,
  GitBranch,
  FileBarChart,
  Workflow,
  Cpu,
  Gauge,
  CheckCircle2,
  TrendingUp,
  ScrollText,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
} from "lucide-react";

const ALL_PHASES: PhaseKey[] = ["fundacao", "pilares", "lajes", "alvenaria", "cobertura", "acabamentos"];
const PHASE_LABELS: Record<PhaseKey, string> = {
  fundacao: "Fundação",
  pilares: "Pilares",
  lajes: "Lajes",
  alvenaria: "Alvenaria",
  cobertura: "Cobertura",
  acabamentos: "Acabamentos",
};

export default function Landing() {
  const [selected, setSelected] = useState<PhaseKey | null>(null);
  const visible = new Set<PhaseKey>(ALL_PHASES);

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
                Quantitative Engineering Intelligence
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#risk" className="hover:text-foreground">Risk Engine</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#architecture" className="hover:text-foreground">Architecture</a>
          </nav>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            Open platform <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* HERO with full-width interactive 3D BIM viewer */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        {/* technical grid */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* radial accent */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 70% 30%, hsl(211 60% 55% / 0.35), transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-10">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            {/* Copy column */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-[11px] uppercase tracking-[0.18em] mb-7">
                <span className="size-1.5 rounded-full bg-warning animate-pulse" />
                BIM · Quantities · Pricing · Risk
              </div>
              <h1 className="font-display text-4xl md:text-5xl xl:text-6xl leading-[1.05] text-balance">
                Engineering decisions powered by quantitative intelligence.
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/75 max-w-xl">
                Integrating BIM data, structural quantities, and market pricing into a
                traceable construction workflow — built for engineers, surveyors and
                project managers.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/app/modelo-3d"
                  className="inline-flex items-center gap-2 bg-warning text-foreground px-5 py-3 rounded-md font-medium hover:opacity-90 transition shadow-elegant"
                >
                  <Upload className="size-4" /> Upload project (.ifc / .gltf)
                </Link>
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-primary-foreground px-5 py-3 rounded-md font-medium hover:bg-white/15 transition"
                >
                  View demo workflow <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Mini KPI strip */}
              <div className="mt-10 grid grid-cols-3 gap-px bg-white/10 rounded-lg overflow-hidden border border-white/10">
                {[
                  { v: "BIM", l: "IFC / GLTF / OBJ" },
                  { v: "≥3", l: "Suppliers per item" },
                  { v: "100%", l: "Audit-traced" },
                ].map((k) => (
                  <div key={k.l} className="bg-primary/70 px-4 py-3 backdrop-blur">
                    <div className="font-mono text-warning text-sm">{k.v}</div>
                    <div className="text-[11px] text-white/65 mt-0.5">{k.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D viewer column with overlay metric cards */}
            <div className="lg:col-span-7 relative">
              <div className="relative h-[460px] md:h-[540px] rounded-2xl overflow-hidden border border-white/15 bg-[hsl(224_55%_8%)] shadow-elegant">
                <Canvas shadows dpr={[1, 2]}>
                  <PerspectiveCamera makeDefault position={[16, 12, 18]} fov={42} />
                  <ambientLight intensity={0.55} />
                  <directionalLight
                    position={[10, 14, 6]}
                    intensity={1.1}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                  />
                  <Suspense fallback={null}>
                    <Environment preset="city" />
                    <BuildingModel
                      selected={selected}
                      onSelect={(p) => setSelected((s) => (s === p ? null : p))}
                      visiblePhases={visible}
                    />
                    <ContactShadows
                      position={[0, -0.8, 0]}
                      opacity={0.45}
                      scale={40}
                      blur={2.4}
                      far={20}
                    />
                  </Suspense>
                  <OrbitControls
                    enablePan={false}
                    minDistance={14}
                    maxDistance={36}
                    maxPolarAngle={Math.PI / 2.05}
                    autoRotate
                    autoRotateSpeed={0.6}
                  />
                </Canvas>

                {/* Top-left header */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
                  <div className="px-3 py-1.5 rounded-md bg-black/40 backdrop-blur border border-white/10 text-[11px] font-mono uppercase tracking-[0.14em] text-white/80">
                    BIM Viewer · Demo IFC
                  </div>
                  <div className="px-3 py-1.5 rounded-md bg-black/40 backdrop-blur border border-white/10 text-[11px] font-mono text-white/80 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-success animate-pulse" />
                    Live model
                  </div>
                </div>

                {/* Overlay metric cards */}
                <div className="absolute left-4 bottom-4 grid grid-cols-2 gap-2 max-w-[260px]">
                  <OverlayCard label="Concrete volume" value="184.6 m³" tone="default" />
                  <OverlayCard label="Steel quantity" value="22.4 t" tone="default" />
                  <OverlayCard label="Est. budget" value="61.5M MT" tone="accent" />
                  <OverlayCard label="Suppliers" value="14 · 3 markets" tone="default" />
                </div>

                {/* Risk alert overlay */}
                <div className="absolute right-4 bottom-4 max-w-[260px] px-3 py-2.5 rounded-md bg-destructive/20 backdrop-blur border border-destructive/40 text-white">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-mono text-warning">
                    <AlertTriangle className="size-3.5" /> Risk alert
                  </div>
                  <div className="mt-1 text-sm">
                    Cement supplier B: <span className="font-mono text-warning">+37%</span> vs market median.
                  </div>
                </div>

                {/* Phase legend */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 hidden md:flex flex-wrap justify-center gap-1.5 px-3 py-1.5 rounded-md bg-black/40 backdrop-blur border border-white/10">
                  {ALL_PHASES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelected((s) => (s === p ? null : p))}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition ${
                        selected === p ? "bg-white/15 text-white" : "text-white/65 hover:text-white"
                      }`}
                    >
                      <span
                        className="size-2 rounded-sm"
                        style={{ background: PHASE_COLORS[p] }}
                      />
                      {PHASE_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 text-[11px] font-mono uppercase tracking-[0.14em] text-white/55 text-center">
                Drag to orbit · scroll to zoom · click a phase to isolate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            kicker="01 · Platform modules"
            title="Seven integrated modules. One engineering workflow."
            sub="From IFC import to audit-traced BoQ, every step is structured for traceable cost decisions."
          />

          <div className="mt-12 grid md:grid-cols-6 gap-4 auto-rows-[180px]">
            <BentoCard
              className="md:col-span-3 md:row-span-2 bg-gradient-hero text-primary-foreground"
              icon={Building2}
              title="BIM / IFC import"
            >
              Upload IFC, GLTF or OBJ models with project metadata and structural inputs.
              Mesh-level classification by phase and element family.
            </BentoCard>
            <BentoCard className="md:col-span-3" icon={FileSearch} title="Automatic quantity extraction">
              Slabs, beams, columns, walls — concrete volumes, steel weights and wall areas
              extracted directly from the model geometry.
            </BentoCard>
            <BentoCard className="md:col-span-3" icon={Database} title="Market price analysis">
              Multiple suppliers per item with unit prices, computed median and percent
              deviation across formal and informal markets.
            </BentoCard>
            <BentoCard className="md:col-span-2" icon={Layers} title="Automated BoQ">
              Bill of quantities generated by phase, with material summaries and PDF / Excel export.
            </BentoCard>
            <BentoCard className="md:col-span-2" icon={ScrollText} title="Justification & approval">
              High-risk deviations require justification, approver and timestamp before commit.
            </BentoCard>
            <BentoCard className="md:col-span-2" icon={ShieldCheck} title="Audit & traceability">
              Decision history, supplier changes, risk events and procurement logs on a single timeline.
            </BentoCard>
          </div>
        </div>
      </section>

      {/* RISK ENGINE — flagship module */}
      <section id="risk" className="py-24 bg-surface-sunken border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            kicker="02 · Risk analysis engine"
            title="Detect price deviations before they become cost overruns."
            sub="The risk engine compares supplier prices against the current market median and classifies each line item."
          />

          <div className="mt-12 grid lg:grid-cols-12 gap-6">
            {/* Risk classes */}
            <div className="lg:col-span-5 grid gap-3">
              <RiskRow tone="success" label="Normal" range="±10% from median" />
              <RiskRow tone="warning" label="Attention" range="+10% to +20% from median" />
              <RiskRow tone="destructive" label="High risk" range="> +20% from median" />

              <div className="mt-4 p-5 rounded-xl border border-border bg-surface-elevated">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
                  Worked example
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Market</div>
                    <div className="font-mono text-lg">80 MT</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Supplier</div>
                    <div className="font-mono text-lg">110 MT</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Deviation</div>
                    <div className="font-mono text-lg text-destructive">+37%</div>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                  <AlertTriangle className="size-3.5" /> HIGH RISK · justification required
                </div>
              </div>
            </div>

            {/* Mock dashboard panel */}
            <div className="lg:col-span-7 p-6 rounded-xl border border-border bg-surface-elevated shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="font-display text-lg">Procurement risk panel</div>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                  Live · 14 items
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-2 font-medium">Material</th>
                    <th className="text-right font-medium">Median</th>
                    <th className="text-right font-medium">Supplier</th>
                    <th className="text-right font-medium">Δ</th>
                    <th className="text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <RiskTableRow material="Cimento 50kg" median="450" supplier="465" delta="+3.3%" tone="success" />
                  <RiskTableRow material="Aço Ø12mm (kg)" median="120" supplier="138" delta="+15.0%" tone="warning" />
                  <RiskTableRow material="Brita 1 (m³)" median="1 800" supplier="1 850" delta="+2.8%" tone="success" />
                  <RiskTableRow material="Areia fina (m³)" median="900" supplier="1 240" delta="+37.8%" tone="destructive" />
                  <RiskTableRow material="Bloco 20cm" median="38" supplier="42" delta="+10.5%" tone="warning" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* MARKET PRICE ANALYSIS */}
      <section id="market" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            kicker="03 · Market price analysis"
            title="Quantified supplier intelligence."
            sub="Median pricing, supplier dispersion and 6-month trend analysis across the formal and informal markets."
          />

          <div className="mt-12 grid lg:grid-cols-12 gap-6">
            {/* Trend chart */}
            <div className="lg:col-span-7 p-6 rounded-xl border border-border bg-surface-elevated shadow-soft">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
                    Cement 50kg · 6-month trend
                  </div>
                  <div className="font-display text-xl mt-1">Supplier dispersion vs market median</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl">605 <span className="text-xs text-muted-foreground">MT</span></div>
                  <div className="text-[11px] text-success font-mono">median ▲ +4.2% MoM</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MARKET_TREND} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(220 10% 50%)" fontSize={11} />
                    <YAxis stroke="hsl(220 10% 50%)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={605} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Median", fontSize: 10, fill: "hsl(var(--accent))" }} />
                    <Line type="monotone" dataKey="Forn. A" stroke="hsl(211 70% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Forn. B" stroke="hsl(220 10% 50%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Forn. C" stroke="hsl(0 70% 55%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Deviation by item */}
            <div className="lg:col-span-5 p-6 rounded-xl border border-border bg-surface-elevated shadow-soft">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
                Deviation by material
              </div>
              <div className="font-display text-xl mt-1 mb-4">% above median</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MARKET_DEVIATION} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(220 10% 50%)" fontSize={11} unit="%" />
                    <YAxis type="category" dataKey="name" stroke="hsl(220 10% 50%)" fontSize={11} width={90} />
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="dev" radius={[0, 4, 4, 0]}>
                      {MARKET_DEVIATION.map((d, i) => (
                        <rect key={i} fill={d.dev > 20 ? "hsl(var(--destructive))" : d.dev > 10 ? "hsl(var(--warning))" : "hsl(var(--success))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison table */}
            <div className="lg:col-span-12 p-6 rounded-xl border border-border bg-surface-elevated shadow-soft overflow-x-auto">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="font-display text-lg">Supplier comparison · per item</div>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                  3 suppliers · MT
                </div>
              </div>
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-2 font-medium">Material</th>
                    <th className="text-right font-medium">Un</th>
                    <th className="text-right font-medium">Forn. A</th>
                    <th className="text-right font-medium">Forn. B</th>
                    <th className="text-right font-medium">Forn. C</th>
                    <th className="text-right font-medium">Median</th>
                    <th className="text-right font-medium">Δ%</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {MARKET_TABLE.map((r) => (
                    <tr key={r.name} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 font-sans">{r.name}</td>
                      <td className="text-right text-muted-foreground">{r.un}</td>
                      <td className="text-right">{r.a}</td>
                      <td className="text-right">{r.b}</td>
                      <td className="text-right">{r.c}</td>
                      <td className="text-right">{r.med}</td>
                      <td className={`text-right font-medium ${r.dev > 20 ? "text-destructive" : r.dev > 10 ? "text-warning-foreground" : "text-success"}`}>
                        +{r.dev}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ENGINEERING ANALYTICS DASHBOARD */}
      <section id="analytics" className="py-24 bg-surface-sunken border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            kicker="04 · Engineering analytics"
            title="Quantified insights for project managers."
            sub="Real-time cost performance, risk concentration and quantity progression — instrumented for engineering decisions."
          />

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Cost Performance Index" value="0.94" delta="-6%" tone="warning" />
            <KpiCard label="Quantities take-off" value="184" delta="100%" tone="success" sub="BoQ items" />
            <KpiCard label="High-risk lines" value="5" delta="2.7%" tone="destructive" sub="of total BoQ" />
            <KpiCard label="Audit events" value="38" delta="+12 wk" tone="default" />
          </div>

          <div className="mt-6 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-xl border border-border bg-surface-elevated shadow-soft">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
                    Planned vs actual cost
                  </div>
                  <div className="font-display text-xl mt-1">Cumulative project spend (M MT)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl">61.5M</div>
                  <div className="text-[11px] text-destructive font-mono">+8.4% over plan</div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ANALYTICS_PROGRESS} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="hsl(220 10% 50%)" fontSize={11} />
                    <YAxis stroke="hsl(220 10% 50%)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Planned" stroke="hsl(220 10% 50%)" strokeDasharray="4 4" fill="transparent" />
                    <Area type="monotone" dataKey="Actual" stroke="hsl(var(--accent))" fill="url(#actGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-xl border border-border bg-surface-elevated shadow-soft">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
                Risk concentration by phase
              </div>
              <div className="font-display text-xl mt-1 mb-4">High-risk MT exposure</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ANALYTICS_RISK} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="phase" stroke="hsl(220 10% 50%)" fontSize={11} />
                    <YAxis stroke="hsl(220 10% 50%)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="exposure" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-12 grid sm:grid-cols-3 gap-4">
              <InsightCard icon={LineChartIcon} title="Steel A500 trend" body="Price up +49% YoY. Switching to Forn. A saves 2.1M MT over remaining work." />
              <InsightCard icon={BarChart3} title="Concrete C25/30 stable" body="Within ±3% of median across 14 weeks. No procurement action required." />
              <InsightCard icon={PieChart} title="Phase exposure" body="Structure phase concentrates 62% of high-risk lines. Prioritize approval workflow." />
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW DIAGRAM */}
      <section id="workflow" className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            kicker="03 · End-to-end workflow"
            title="From IFC model to signed BoQ."
          />

          <div className="mt-12 grid md:grid-cols-5 gap-3">
            {[
              { i: Upload, t: "Import", d: "IFC / GLTF / OBJ" },
              { i: FileSearch, t: "Quantify", d: "Auto BoQ items" },
              { i: Database, t: "Price", d: "≥3 suppliers" },
              { i: Activity, t: "Risk", d: "Deviation engine" },
              { i: ShieldCheck, t: "Approve", d: "Audit log" },
            ].map((s, i) => (
              <div key={s.t} className="relative">
                <div className="p-5 rounded-xl border border-border bg-surface-elevated shadow-soft h-full">
                  <div className="flex items-center justify-between mb-4">
                    <s.i className="size-5 text-accent" />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <div className="font-display text-lg">{s.t}</div>
                  <div className="text-sm text-muted-foreground">{s.d}</div>
                </div>
                {i < 4 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 size-4 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASE STUDY */}
      <section className="py-24 bg-surface-sunken border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            kicker="04 · Case study simulation"
            title="Residential project · Maputo · 3 floors"
          />

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <CaseCard
              icon={Gauge}
              title="Quantities extracted"
              metric="184 BoQ items"
              detail="Concrete: 184.6 m³ · Steel: 22.4 t · Walls: 612 m²"
            />
            <CaseCard
              icon={TrendingUp}
              title="Price intelligence"
              metric="14 / 184 items"
              detail="Flagged above market median across 3 supplier zones"
            />
            <CaseCard
              icon={ShieldCheck}
              title="Decisions logged"
              metric="38 audit events"
              detail="Justifications, approvals and supplier swaps over 6 weeks"
            />
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-warning font-mono mb-3">
            05 · System architecture
          </div>
          <h2 className="font-display text-4xl max-w-2xl leading-tight">
            Three connected layers. One source of truth.
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10 shadow-elegant">
            <ArchLayer
              icon={Cpu}
              name="Geometry layer"
              points={["IFC / GLTF parser", "Mesh classification", "Quantity take-off"]}
            />
            <ArchLayer
              icon={Database}
              name="Pricing layer"
              points={["Supplier database", "Median engine", "Deviation classifier"]}
            />
            <ArchLayer
              icon={GitBranch}
              name="Decision layer"
              points={["BoQ generator", "Approval workflow", "Immutable audit log"]}
            />
          </div>

          <div className="mt-16 grid md:grid-cols-4 gap-5">
            {[
              { i: Workflow, r: "Engineers", d: "Validate quantities and structural inputs." },
              { i: FileBarChart, r: "Quantity surveyors", d: "Compare suppliers, manage BoQ." },
              { i: GanttChartSquare, r: "Project managers", d: "Track risk, schedule and cost." },
              { i: ShieldCheck, r: "Clients & auditors", d: "Read-only audit and traceability." },
            ].map((u) => (
              <div key={u.r} className="p-6 rounded-lg border border-white/10 bg-white/5">
                <u.i className="size-5 text-warning mb-3" />
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
          <CheckCircle2 className="size-8 text-accent mx-auto mb-5" />
          <h2 className="font-display text-4xl md:text-5xl text-balance">
            Bring quantitative intelligence to your next project.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Open the platform to explore the BIM viewer, quantity extraction, market price
            engine and audit trail with realistic project data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              to="/app/modelo-3d"
              className="inline-flex items-center gap-2 bg-warning text-foreground px-5 py-3 rounded-md font-medium hover:opacity-90 transition shadow-elegant"
            >
              <Upload className="size-4" /> Upload project
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-md font-medium hover:opacity-90 transition shadow-elegant"
            >
              View demo workflow <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© 2026 SQI · Quantitative Engineering Intelligence</div>
          <div>BIM · Quantities · Pricing · Risk · Audit</div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- helpers ---------- */

function SectionHeader({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-mono mb-3">
        {kicker}
      </div>
      <h2 className="font-display text-4xl leading-tight">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
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

function OverlayCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "accent";
}) {
  return (
    <div
      className={`px-3 py-2 rounded-md backdrop-blur border text-white ${
        tone === "accent"
          ? "bg-accent/30 border-accent/50"
          : "bg-black/40 border-white/10"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/70 font-mono">
        {label}
      </div>
      <div className="font-mono text-sm mt-0.5">{value}</div>
    </div>
  );
}

function RiskRow({
  tone,
  label,
  range,
}: {
  tone: "success" | "warning" | "destructive";
  label: string;
  range: string;
}) {
  const cls =
    tone === "success"
      ? "border-success/30 bg-success/5 text-success"
      : tone === "warning"
      ? "border-warning/40 bg-warning/10 text-warning-foreground"
      : "border-destructive/40 bg-destructive/10 text-destructive";
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${cls}`}>
      <div className="flex items-center gap-3">
        <span
          className={`size-2.5 rounded-full ${
            tone === "success"
              ? "bg-success"
              : tone === "warning"
              ? "bg-warning"
              : "bg-destructive"
          }`}
        />
        <div className="font-display text-base text-foreground">{label}</div>
      </div>
      <div className="font-mono text-xs text-muted-foreground">{range}</div>
    </div>
  );
}

function RiskTableRow({
  material,
  median,
  supplier,
  delta,
  tone,
}: {
  material: string;
  median: string;
  supplier: string;
  delta: string;
  tone: "success" | "warning" | "destructive";
}) {
  const tag =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
      ? "bg-warning/15 text-warning-foreground"
      : "bg-destructive/10 text-destructive";
  const label =
    tone === "success" ? "Normal" : tone === "warning" ? "Attention" : "High risk";
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-2.5 font-sans">{material}</td>
      <td className="text-right text-muted-foreground">{median}</td>
      <td className="text-right">{supplier}</td>
      <td className="text-right">{delta}</td>
      <td className="text-right">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${tag}`}>
          {label}
        </span>
      </td>
    </tr>
  );
}

function CaseCard({
  icon: Icon,
  title,
  metric,
  detail,
}: {
  icon: any;
  title: string;
  metric: string;
  detail: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-surface-elevated shadow-soft">
      <Icon className="size-5 text-accent mb-3" />
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
        {title}
      </div>
      <div className="font-display text-3xl mt-1.5">{metric}</div>
      <div className="text-sm text-muted-foreground mt-2">{detail}</div>
    </div>
  );
}

function ArchLayer({
  icon: Icon,
  name,
  points,
}: {
  icon: any;
  name: string;
  points: string[];
}) {
  return (
    <div className="bg-primary/80 p-7 backdrop-blur">
      <Icon className="size-5 text-warning mb-3" />
      <div className="font-display text-xl">{name}</div>
      <ul className="mt-3 space-y-1.5 text-sm text-white/75">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-warning/70" />
            <span className="font-mono text-[12px]">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- analytics data + cards ---------- */

const MARKET_TREND = [
  { month: "Dez 25", "Forn. A": 540, "Forn. B": 565, "Forn. C": 640 },
  { month: "Jan 26", "Forn. A": 555, "Forn. B": 575, "Forn. C": 660 },
  { month: "Fev 26", "Forn. A": 562, "Forn. B": 590, "Forn. C": 680 },
  { month: "Mar 26", "Forn. A": 570, "Forn. B": 598, "Forn. C": 695 },
  { month: "Abr 26", "Forn. A": 578, "Forn. B": 602, "Forn. C": 710 },
  { month: "Mai 26", "Forn. A": 580, "Forn. B": 605, "Forn. C": 720 },
];

const MARKET_DEVIATION = [
  { name: "Cabo XV 2.5", dev: 28 },
  { name: "Brita Nº 1", dev: 24 },
  { name: "Disjuntor 25A", dev: 23 },
  { name: "Tubo PVC 50", dev: 23 },
  { name: "Cimento 50kg", dev: 19 },
  { name: "Tijolo furado", dev: 17 },
  { name: "Aço Ø10mm", dev: 16 },
  { name: "Tinta 15L", dev: 5 },
];

const MARKET_TABLE = [
  { name: "Cimento Portland 50kg", un: "saco", a: 580, b: 605, c: 720, med: 605, dev: 19 },
  { name: "Aço A500 NR Ø10mm", un: "kg", a: 138, b: 142, c: 165, med: 142, dev: 16 },
  { name: "Tubo PVC PN10 Ø50mm", un: "m", a: 185, b: 195, c: 240, med: 195, dev: 23 },
  { name: "Cabo XV 3x2.5mm²", un: "m", a: 158, b: 168, c: 215, med: 168, dev: 28 },
  { name: "Tijolo furado 11x20x30", un: "un", a: 22, b: 24, c: 28, med: 24, dev: 17 },
  { name: "Brita Nº 1 (granito)", un: "m³", a: 1850, b: 1920, c: 2380, med: 1920, dev: 24 },
];

const ANALYTICS_PROGRESS = [
  { m: "S1", Planned: 6, Actual: 6.2 },
  { m: "S4", Planned: 14, Actual: 15.1 },
  { m: "S8", Planned: 24, Actual: 26.4 },
  { m: "S12", Planned: 36, Actual: 40.1 },
  { m: "S16", Planned: 47, Actual: 51.8 },
  { m: "S20", Planned: 56, Actual: 61.5 },
];

const ANALYTICS_RISK = [
  { phase: "F0", exposure: 0.6 },
  { phase: "F1", exposure: 6.2 },
  { phase: "F2", exposure: 2.1 },
  { phase: "F3", exposure: 3.4 },
  { phase: "F4", exposure: 1.2 },
  { phase: "F5", exposure: 0.4 },
];

function KpiCard({
  label,
  value,
  delta,
  tone,
  sub,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "default" | "success" | "warning" | "destructive";
  sub?: string;
}) {
  const cls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : tone === "destructive"
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <div className="p-5 rounded-xl border border-border bg-surface-elevated shadow-soft">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
        {label}
      </div>
      <div className="font-display text-3xl mt-2">{value}</div>
      <div className={`text-xs font-mono mt-1 ${cls}`}>
        {delta}
        {sub && <span className="text-muted-foreground ml-1">· {sub}</span>}
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface-elevated shadow-soft">
      <Icon className="size-5 text-accent mb-3" />
      <div className="font-display text-base">{title}</div>
      <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{body}</div>
    </div>
  );
}