import { useAudit } from "@/data/store";
import { Download, Lock, FileSignature } from "lucide-react";

export default function Audit() {
  const auditEntries = useAudit();
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 max-w-2xl">
          <Lock className="size-5 text-accent mt-1" />
          <div className="text-sm text-muted-foreground">
            Histórico imutável de todas as alterações. Qualquer alteração &gt;10% exige
            justificativa. Exportável em PDF assinado digitalmente para uso em relatórios.
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <FileSignature className="size-4" /> Exportar PDF assinado
        </button>
      </div>

      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Data / Hora</th>
                <th className="px-4 py-3 text-left">Utilizador</th>
                <th className="px-4 py-3 text-left">Item alterado</th>
                <th className="px-4 py-3 text-left">Anterior</th>
                <th className="px-4 py-3 text-left">Novo</th>
                <th className="px-4 py-3">Δ%</th>
                <th className="px-4 py-3 text-left">Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditEntries.map((e, i) => (
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
        <div className="bg-muted/30 border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{auditEntries.length} entradas · só leitura</span>
          <span className="inline-flex items-center gap-1.5">
            <Download className="size-3" /> Hash SHA-256: <code className="font-mono">8a3f…d201</code>
          </span>
        </div>
      </div>
    </div>
  );
}