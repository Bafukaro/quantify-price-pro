import { Building2, Box, Ruler, LineChart, ShieldAlert, ClipboardCheck, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { fmtMT } from "@/data/mock";

const QUANTITIES = [
  { code: "1.2.1", desc: "Betão C25/30 — Lajes", qty: 412, unit: "m³" },
  { code: "1.2.2", desc: "Aço A500 — Vigas e pilares", qty: 38_400, unit: "kg" },
  { code: "2.1.0", desc: "Alvenaria bloco 20 cm", qty: 1_280, unit: "m²" },
  { code: "3.1.4", desc: "Cabo XV 3x2.5", qty: 2_400, unit: "m" },
  { code: "4.2.1", desc: "Chapa lacada cobertura", qty: 860, unit: "m²" },
];

const SUPPLIERS = [
  { item: "Aço A500", median: 78, supplier: "Aços Maputo", price: 107, dev: 37 },
  { item: "Betão C25/30", median: 5_400, supplier: "Cimentos Moç.", price: 5_550, dev: 2.8 },
  { item: "Cabo XV 3x2.5", median: 142, supplier: "Eletro Beira", price: 175, dev: 23 },
  { item: "Chapa cobertura", median: 920, supplier: "Coberturas SA", price: 1_080, dev: 17 },
];

const tone = (d: number) =>
  d < 10 ? "text-success" : d < 20 ? "text-warning" : "text-destructive";
const bgTone = (d: number) =>
  d < 10 ? "bg-success/10 border-success/30" : d < 20 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";

export default function CaseStudy() {
  const total = 18_540_000;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-border bg-surface-elevated p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="size-14 rounded-lg bg-accent/10 grid place-items-center">
          <Building2 className="size-7 text-accent" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pilot Project · Maputo</div>
          <h2 className="font-display text-3xl mt-1">Edifício Residencial Polana 12</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Caso de estudo real do fluxo SQI: importação IFC, extracção de quantitativos, análise de mercado,
            classificação de risco e geração automática de BoQ com justificação técnica.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Mini label="Área" value="3 240 m²" />
          <Mini label="Pisos" value="8" />
          <Mini label="Orçamento" value={fmtMT(total)} />
        </div>
      </div>

      {/* Step 1 — IFC */}
      <Step n="01" icon={Box} title="Modelo IFC carregado">
        <div className="grid md:grid-cols-3 gap-4">
          <Stat label="Elementos" value="1 248" />
          <Stat label="Fases detectadas" value="6 / 6" />
          <Stat label="Classificação automática" value="94%" />
        </div>
      </Step>

      {/* Step 2 — Quantities */}
      <Step n="02" icon={Ruler} title="Quantitativos extraídos">
        <Table>
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left py-2">Código</th>
              <th className="text-left">Descrição</th>
              <th className="text-right">Quantidade</th>
              <th className="text-left pl-3">Unid.</th>
            </tr>
          </thead>
          <tbody>
            {QUANTITIES.map((q) => (
              <tr key={q.code} className="border-t border-border">
                <td className="py-2 font-mono text-xs">{q.code}</td>
                <td>{q.desc}</td>
                <td className="text-right font-mono">{q.qty.toLocaleString("pt-PT")}</td>
                <td className="pl-3 text-muted-foreground">{q.unit}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Step>

      {/* Step 3 — Pricing */}
      <Step n="03" icon={LineChart} title="Análise de mercado">
        <Table>
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left py-2">Item</th>
              <th className="text-right">Mediana</th>
              <th className="text-left pl-3">Fornecedor</th>
              <th className="text-right">Preço</th>
              <th className="text-right">Δ %</th>
            </tr>
          </thead>
          <tbody>
            {SUPPLIERS.map((s) => (
              <tr key={s.item} className="border-t border-border">
                <td className="py-2">{s.item}</td>
                <td className="text-right font-mono">{s.median.toLocaleString("pt-PT")}</td>
                <td className="pl-3 text-muted-foreground">{s.supplier}</td>
                <td className="text-right font-mono">{s.price.toLocaleString("pt-PT")}</td>
                <td className={`text-right font-mono font-medium ${tone(s.dev)}`}>+{s.dev}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Step>

      {/* Step 4 — Risk */}
      <Step n="04" icon={ShieldAlert} title="Risco detectado">
        <div className="grid sm:grid-cols-3 gap-3">
          {SUPPLIERS.filter((s) => s.dev >= 10).map((s) => (
            <div key={s.item} className={`p-4 rounded-lg border ${bgTone(s.dev)}`}>
              <div className="text-xs text-muted-foreground">{s.item}</div>
              <div className={`font-display text-2xl mt-1 ${tone(s.dev)}`}>+{s.dev}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.dev >= 20 ? "Risco alto · justificação obrigatória" : "Atenção · revisão recomendada"}
              </div>
            </div>
          ))}
        </div>
      </Step>

      {/* Step 5 — Justification */}
      <Step n="05" icon={ClipboardCheck} title="Justificação técnica & aprovação">
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-warning mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">Aço A500 — desvio +37%</span>
              <p className="text-muted-foreground mt-1">
                Justificação: fornecedor único homologado para A500 com certificado válido na região de Maputo;
                alternativa informal sem rastreabilidade. Aprovado com condições.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-success">
            <CheckCircle2 className="size-4" />
            Aprovado por Cláudia Macuácua · 04 Maio 2026
          </div>
        </div>
      </Step>

      {/* Step 6 — Final BoQ */}
      <Step n="06" icon={FileSpreadsheet} title="BoQ final gerado">
        <div className="grid sm:grid-cols-3 gap-4">
          <Stat label="Total estimado" value={fmtMT(total)} />
          <Stat label="Desvio global" value="+6.2%" />
          <Stat label="Itens com alerta" value="3 / 47" />
        </div>
      </Step>
    </div>
  );
}

function Step({ n, icon: Icon, title, children }: any) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">STEP {n}</span>
        <Icon className="size-4 text-accent" />
        <h3 className="font-display text-lg">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-md bg-muted/60">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm mt-0.5">{value}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}