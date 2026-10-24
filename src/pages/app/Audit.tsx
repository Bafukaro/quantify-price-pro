import { useState } from "react";
import { useProjects } from "@/data/store";
import { useServerAudit, verifyAuditChain, tryDeleteAudit } from "@/data/auditLog";
import { Lock, ShieldCheck } from "lucide-react";
import AuditEntryTable from "@/components/project/AuditEntryTable";
import { auditEntryCount, presentIntegrityMessage } from "@/lib/auditPresentation";
import { Button } from "@/components/ui/button";

export default function Audit() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const pid = projectId || projects[0]?.id || "__none__";
  const entries = useServerAudit(pid);
  const [verify, setVerify] = useState<{ intact: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);
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
            <optgroup label="Projectos activos">{projects.filter((p) => !p.archived).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}</optgroup>
            <optgroup label="Arquivados">{projects.filter((p) => p.archived).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>
          </select>
          <Button
            disabled={busy || pid === "__none__"}
            onClick={async () => {
              setBusy(true);
              setVerify(await verifyAuditChain(pid));
              setBusy(false);
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            <ShieldCheck className="size-4" /> {busy ? "A verificar…" : "Verificar integridade"}
          </Button>
        </div>
      </div>

      {verify && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            verify.intact ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {verify.intact ? "✓ Cadeia " : "✗ "}
          {presentIntegrityMessage(verify.message)}
        </div>
      )}

      {delMsg && <div role="status" className="border border-border bg-muted/40 px-4 py-3 text-sm">{delMsg}</div>}
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
        <AuditEntryTable entries={entries} onTryDelete={async (id) => setDelMsg(await tryDeleteAudit(id))} />
        <div className="bg-muted/30 border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{auditEntryCount(entries.length)} · só acrescentar</span>
          <span className="font-mono" title={head ?? ""}>
            Topo da cadeia: {head ? `${head.slice(0, 6)}…${head.slice(-4)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
