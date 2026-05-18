import {
  UploadCloud,
  Box,
  Ruler,
  LineChart,
  ShieldAlert,
  ClipboardCheck,
  FileSpreadsheet,
  ScrollText,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  { n: "01", title: "Project Input", desc: "Criação do projecto, equipa, localização e parâmetros base.", icon: UploadCloud },
  { n: "02", title: "IFC / BIM Import", desc: "Importação de modelo IFC / GLTF e classificação por fase.", icon: Box },
  { n: "03", title: "Quantity Extraction", desc: "Extracção automática de quantitativos (m³, kg, m², un).", icon: Ruler },
  { n: "04", title: "Market Price Analysis", desc: "Mediana, desvio-padrão e spread por material e fornecedor.", icon: LineChart },
  { n: "05", title: "Risk Analysis", desc: "Classificação Normal / Atenção / Risco Alto a partir do desvio.", icon: ShieldAlert },
  { n: "06", title: "Justification & Approval", desc: "Workflow de justificação técnica obrigatória para risco alto.", icon: ClipboardCheck },
  { n: "07", title: "BoQ Generation", desc: "Geração automática de BoQ por fase com totais e desvios.", icon: FileSpreadsheet },
  { n: "08", title: "Reports & Audit Logs", desc: "Exportação PDF/Excel e registo imutável de auditoria.", icon: ScrollText },
];

export default function Workflow() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">System Workflow</div>
        <h2 className="font-display text-3xl mt-1">Fluxo técnico end-to-end</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          Pipeline de engenharia desde a importação BIM até à geração de BoQ e auditoria.
          Cada etapa produz dados estruturados que alimentam a seguinte — garantindo rastreabilidade e justificação técnica.
        </p>
      </div>

      {/* Blueprint diagram */}
      <div
        className="relative rounded-xl border border-border p-6 lg:p-10 overflow-hidden"
        style={{
          backgroundColor: "hsl(var(--primary))",
          backgroundImage:
            "linear-gradient(hsl(var(--primary-foreground) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="h-full rounded-lg border border-white/15 bg-white/[0.04] backdrop-blur-sm p-4 hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/50">STEP {s.n}</span>
                  <s.icon className="size-4 text-accent" />
                </div>
                <div className="font-display text-lg text-white mt-3">{s.title}</div>
                <p className="text-xs text-white/70 mt-2 leading-relaxed">{s.desc}</p>
              </div>
              {(i + 1) % 4 !== 0 && i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 size-5 text-accent/80" />
              )}
            </div>
          ))}
        </div>

        {/* corner ticks */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-3 left-3 size-3 border-l-2 border-t-2 border-accent/60" />
          <div className="absolute top-3 right-3 size-3 border-r-2 border-t-2 border-accent/60" />
          <div className="absolute bottom-3 left-3 size-3 border-l-2 border-b-2 border-accent/60" />
          <div className="absolute bottom-3 right-3 size-3 border-r-2 border-b-2 border-accent/60" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Layer title="Geometry Layer" items={["IFC parser", "Mesh classifier", "Phase mapping", "Quantity engine"]} />
        <Layer title="Pricing Layer" items={["Formal suppliers", "Informal markets", "Statistical median / σ", "Deviation flags"]} />
        <Layer title="Decision Layer" items={["Risk classifier", "Justification workflow", "BoQ generator", "Audit log"]} />
      </div>
    </div>
  );
}

function Layer({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2 text-sm">
            <span className="size-1.5 rounded-full bg-accent" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}