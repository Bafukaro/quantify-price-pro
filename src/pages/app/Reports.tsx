import { FileText, FileSpreadsheet, Download, Printer, ShieldCheck, ScrollText, BarChart3, Users } from "lucide-react";
import { fmtMT } from "@/data/mock";

const REPORTS = [
  { id: "qty", title: "Resumo de Quantitativos", desc: "Quantidades por fase e categoria construtiva.", icon: BarChart3 },
  { id: "risk", title: "Resumo de Risco", desc: "Itens classificados Normal / Atenção / Risco Alto.", icon: ShieldCheck },
  { id: "appr", title: "Histórico de Aprovações", desc: "Justificações técnicas e decisões registadas.", icon: ScrollText },
  { id: "sup", title: "Análise de Fornecedores", desc: "Comparação de preços, mediana e σ por fornecedor.", icon: Users },
  { id: "comp", title: "Estado de Conformidade", desc: "Verificações REBAP / EC / EN 206 e certificações.", icon: ShieldCheck },
  { id: "audit", title: "Audit Trail Completo", desc: "Registo cronológico imutável de todas as acções.", icon: ScrollText },
];

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Engineering Reports</div>
        <h2 className="font-display text-3xl mt-1">Relatórios técnicos & exportação</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
          Relatórios formatados para defesa académica, fiscalização e auditoria interna. Exportação em PDF e Excel
          com cabeçalhos técnicos, tabelas estruturadas e selo de rastreabilidade.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-surface-elevated p-5 hover:shadow-soft transition-shadow">
            <div className="flex items-start justify-between">
              <div className="size-9 rounded-md bg-accent/10 grid place-items-center">
                <r.icon className="size-4 text-accent" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">REL.{r.id.toUpperCase()}</span>
            </div>
            <h3 className="font-display text-lg mt-3">{r.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-medium hover:bg-muted">
                <FileText className="size-3.5" /> PDF
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-medium hover:bg-muted">
                <FileSpreadsheet className="size-3.5" /> Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PDF preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-accent" />
              <h3 className="font-display text-lg">Pré-visualização PDF</h3>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted">
                <Printer className="size-3.5" /> Imprimir
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90">
                <Download className="size-3.5" /> Download
              </button>
            </div>
          </div>
          <div className="aspect-[210/297] rounded border border-border bg-white text-[hsl(224_60%_12%)] p-6 overflow-hidden text-[10px] leading-snug">
            <div className="flex items-center justify-between border-b border-black/20 pb-2">
              <div>
                <div className="font-mono text-[9px] tracking-wider opacity-70">SQI · Sistema Quantitativo de Investimento</div>
                <div className="font-semibold text-sm mt-0.5">Relatório de Quantitativos — Polana 12</div>
              </div>
              <div className="text-right text-[9px] opacity-70">Maio 2026<br/>REL-QTY-2026-014</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[9px]">
              <Box2 k="Total estimado" v={fmtMT(18540000)} />
              <Box2 k="Itens" v="47" />
              <Box2 k="Desvio global" v="+6.2%" />
            </div>
            <table className="w-full mt-3 text-[9px]">
              <thead className="border-b border-black/30">
                <tr><th className="text-left py-1">Código</th><th className="text-left">Descrição</th><th className="text-right">Qtd</th><th className="text-right">Unit MT</th><th className="text-right">Total MT</th></tr>
              </thead>
              <tbody>
                {[
                  ["1.2.1","Betão C25/30",412,"m³",5400],
                  ["1.2.2","Aço A500",38400,"kg",107],
                  ["2.1.0","Alvenaria 20cm",1280,"m²",780],
                  ["3.1.4","Cabo XV 3x2.5",2400,"m",175],
                  ["4.2.1","Chapa cobertura",860,"m²",1080],
                ].map((r:any)=>(
                  <tr key={r[0]} className="border-b border-black/10">
                    <td className="py-1 font-mono">{r[0]}</td><td>{r[1]}</td><td className="text-right font-mono">{r[2].toLocaleString("pt-PT")}</td><td className="text-right font-mono">{r[4].toLocaleString("pt-PT")}</td><td className="text-right font-mono">{(r[2]*r[4]).toLocaleString("pt-PT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-[8px] opacity-60 border-t border-black/20 pt-2">
              Documento assinado digitalmente · Hash de auditoria: 0x8af3…b21e · Página 1 / 4
            </div>
          </div>
        </div>

        {/* Excel preview */}
        <div className="rounded-xl border border-border bg-surface-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-success" />
              <h3 className="font-display text-lg">Pré-visualização Excel</h3>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90">
              <Download className="size-3.5" /> Download .xlsx
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border border-border">
              <thead className="bg-muted">
                <tr>
                  {["A","B","C","D","E","F"].map((c) => (
                    <th key={c} className="border border-border px-2 py-1 text-muted-foreground text-[10px]">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row cells={["Código","Descrição","Qtd","Unid","Preço","Total"]} head />
                <Row cells={["1.2.1","Betão C25/30","412","m³","5 400","2 224 800"]} />
                <Row cells={["1.2.2","Aço A500","38 400","kg","107","4 108 800"]} />
                <Row cells={["2.1.0","Alvenaria 20cm","1 280","m²","780","998 400"]} />
                <Row cells={["3.1.4","Cabo XV 3x2.5","2 400","m","175","420 000"]} />
                <Row cells={["4.2.1","Chapa cobertura","860","m²","1 080","928 800"]} />
                <Row cells={["","","","","Subtotal","8 680 800"]} bold />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Box2({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-black/15 rounded px-2 py-1">
      <div className="opacity-60 uppercase tracking-wider text-[8px]">{k}</div>
      <div className="font-mono">{v}</div>
    </div>
  );
}
function Row({ cells, head, bold }: { cells: string[]; head?: boolean; bold?: boolean }) {
  return (
    <tr className={head ? "bg-muted/50" : ""}>
      {cells.map((c, i) => (
        <td key={i} className={`border border-border px-2 py-1 ${head || bold ? "font-semibold" : ""}`}>{c}</td>
      ))}
    </tr>
  );
}