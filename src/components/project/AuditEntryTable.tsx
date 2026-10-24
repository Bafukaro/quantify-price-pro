import type { ServerAuditEntry } from "@/data/auditLog";
import { presentAuditEntry } from "@/lib/auditPresentation";
import { Button } from "@/components/ui/button";

export default function AuditEntryTable({ entries, onTryDelete }: {
  entries: ServerAuditEntry[];
  onTryDelete: (id: string) => Promise<void>;
}) {
  return (
    <table className="w-full table-fixed text-xs [&_th]:px-2 [&_th]:py-3 [&_td]:px-2 [&_td]:py-3 [&_td]:align-top [&_td]:[overflow-wrap:anywhere]">
      <colgroup>
        <col className="w-[11%]" /><col className="w-[11%]" /><col className="w-[12%]" />
        <col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[6%]" />
        <col className="w-[15%]" /><col className="w-[9%]" /><col className="w-[8%]" />
      </colgroup>
      <thead className="bg-muted/60 text-muted-foreground text-left">
        <tr>{["Data / Hora", "Utilizador", "Item", "Anterior", "Novo", "Δ%", "Justificativa", "Hash", "Acção"].map((label) => <th key={label}>{label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-border">
        {entries.length === 0 && <tr><td colSpan={9} className="text-center text-muted-foreground">Sem entradas neste projecto.</td></tr>}
        {entries.map((entry) => {
          const display = presentAuditEntry(entry);
          return <tr key={entry.id} className="hover:bg-muted/30">
            <td className="font-mono">{entry.dt}</td>
            <td>{entry.user}</td><td className="font-medium">{entry.item}</td>
            <td className="text-muted-foreground">{display.from}</td><td>{display.to}</td>
            <td className={Math.abs(display.delta ?? 0) > 10 ? "text-destructive font-medium" : "text-muted-foreground"}>{display.deltaLabel}</td>
            <td className="text-muted-foreground">{entry.just}</td>
            <td className="font-mono text-[11px] text-muted-foreground" title={entry.hash}>{entry.hash.slice(0, 6)}…{entry.hash.slice(-4)}</td>
            <td><Button variant="ghost" size="sm" className="h-auto w-full whitespace-normal px-0 py-0 text-[11px] text-muted-foreground hover:text-destructive" title="Demonstração: a base de dados recusa apagar" onClick={() => void onTryDelete(entry.id)}>Tentar apagar</Button></td>
          </tr>;
        })}
      </tbody>
    </table>
  );
}