import { useState } from "react";
import { useProjects } from "@/data/store";
import { useServerAudit, verifyAuditChain } from "@/data/auditLog";
import { Lock, ShieldCheck } from "lucide-react";

export default function Audit() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const pid = projectId || projects[0]?.id || "__none__";
  const entries = useServerAudit(pid);
  const [verify, setVerify] = useState<{ intact: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const head = entries[0]?.hash;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 max-w-2xl">
          <Lock className="size-5 text-accent mt-1" />
          <div className="text-sm text-muted-foreground">
            Registo guardado na base de dados, só de acrescentar. O hash SHA-256 de cada entrada é
            calculado no servidor e ligado à entrada anterior do mesmo projecto.
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={pid}
            onChange={(e) => {
              setProjectId(e.target.value);
              setVerify(null);
            }}
            className="bg-background border border-border rounded-md px-2.5 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            disabled={busy || pid === "__none__"}
            onClick={async () => {
              setBusy(true);
              setVerify(await verifyAuditChain(pid));
              setBusy(false);
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <ShieldCheck className="size-4" /> {busy ? "A verificar…" : "Verificar integridade"}
          </button>
        </div>
      </div>

      {verify && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            verify.intact ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {verify.intact ? "✓ Cadeia " : "✗ "}
          {verify.message}
        </div>
      )}

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
                <th className="px-4 py-3 text-left">Justificativa</th>
                <th className="px-4 py-3 text-left">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Sem entradas neste projecto.
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{e.dt}</td>
                  <td className="px-4 py-3">{e.user}</td>
                  <td className="px-4 py-3 font-medium">{e.item}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.from}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.to}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-sm">{e.just}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground" title={e.hash}>
                    {e.hash.slice(0, 6)}…{e.hash.slice(-4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/30 border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{entries.length} entradas · só acrescentar</span>
          <span className="font-mono" title={head ?? ""}>
            Topo da cadeia: {head ? `${head.slice(0, 6)}…${head.slice(-4)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
