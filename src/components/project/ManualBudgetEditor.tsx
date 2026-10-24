import { useState } from "react";
import { Pencil, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveManualLine, type Project } from "@/data/projects";
import { materials } from "@/data/priceDb";
import { loadAudit } from "@/data/auditLog";
import { PHASES, phaseLabel } from "@/lib/phaseQuantities";
import { manualLinePrice, type ManualLine } from "@/lib/manualQuantities";
import { fmtMT } from "@/data/mock";

const inputClass = "w-full min-w-0 border border-border rounded-md bg-background px-3 py-2 text-sm";
export default function ManualBudgetEditor({ project }: { project: Project }) {
  const [draft, setDraft] = useState<ManualLine | null>(null);
  const [justification, setJustification] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const open = (line?: ManualLine) => {
    setDraft(line ? { ...line } : { id: `M-${crypto.randomUUID()}`, phase: "fundacao", description: "", unit: "un", quantity: 0, materialId: null });
    setJustification(""); setError(null);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || !draft.description.trim() || !draft.unit.trim() || !Number.isFinite(draft.quantity) || draft.quantity < 0) return setError("Indique descrição, unidade e quantidade válida.");
    setBusy(true);
    try {
      const err = await saveManualLine(project.id, { ...draft, description: draft.description.trim(), unit: draft.unit.trim() }, justification);
      if (err) return setError(err);
      await loadAudit(project.id);
      setDraft(null);
    } finally { setBusy(false); }
  };
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h3 className="font-display text-lg">Linhas manuais</h3>
      <Button size="sm" onClick={() => open()}><Plus /> Adicionar linha</Button>
    </div>
    <div className="overflow-x-auto border border-border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground"><tr>{["Fase", "Descrição", "Unidade", "Quantidade", "Material", "Preço unitário", "Total", ""].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">
          {project.manualLines.map((l) => {
            const price = project.priceOverrides[`${l.phase}::${l.id}`]?.price ?? manualLinePrice(l, project.location);
            return <tr key={l.id}>
              <td className="px-3 py-2">{phaseLabel(l.phase)}</td><td className="px-3 py-2">{l.description}</td><td className="px-3 py-2">{l.unit}</td><td className="px-3 py-2 font-mono">{l.quantity}</td>
              <td className="px-3 py-2">{materials.find((m) => m.id === l.materialId)?.name ?? "—"}</td><td className="px-3 py-2 whitespace-nowrap">{price ? fmtMT(price) : "Sem preço"}</td><td className="px-3 py-2 whitespace-nowrap">{fmtMT(l.quantity * price)}</td>
              <td className="px-3 py-2"><Button variant="ghost" size="icon" title={`Editar ${l.description}`} aria-label={`Editar ${l.description}`} onClick={() => open(l)}><Pencil /></Button></td>
            </tr>;
          })}
          {!project.manualLines.length && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Sem linhas manuais.</td></tr>}
        </tbody>
      </table>
    </div>
    {draft && <form onSubmit={save} className="border-t border-border pt-4 space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-sm space-y-1 block">Fase<select className={inputClass} value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value as ManualLine["phase"] })}>{PHASES.map((p) => <option key={p} value={p}>{phaseLabel(p)}</option>)}</select></label>
        <label className="text-sm space-y-1 block">Descrição<input className={inputClass} required value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <label className="text-sm space-y-1 block">Material (opcional)<select className={inputClass} value={draft.materialId ?? ""} onChange={(e) => {
          const material = materials.find((m) => m.id === e.target.value);
          setDraft({ ...draft, materialId: material?.id ?? null, unit: material?.unit ?? draft.unit });
        }}><option value="">Sem material</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></label>
        <label className="text-sm space-y-1 block">Unidade<input className={inputClass} required value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></label>
        <label className="text-sm space-y-1 block">Quantidade<input className={inputClass} type="number" min="0" step="any" required value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.valueAsNumber })} /></label>
        <div className="text-sm self-end py-2">Mediana: {fmtMT(manualLinePrice(draft, project.location))}</div>
      </div>
      {draft.materialId && materials.find((m) => m.id === draft.materialId)?.unit !== draft.unit && <p className="text-sm text-warning">Unidade diferente do material: sem preço automático.</p>}
      <label className="text-sm space-y-1 block">Justificação (mínimo 10 caracteres) · {justification.trim().length}/10<textarea className={inputClass} required value={justification} onChange={(e) => setJustification(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><Button type="submit" disabled={busy || justification.trim().length < 10}><Check />{busy ? "A guardar…" : "Guardar linha"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)}><X /> Cancelar</Button></div>
    </form>}
  </section>;
}