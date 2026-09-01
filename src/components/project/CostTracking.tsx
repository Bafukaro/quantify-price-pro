import { useMemo, useState } from "react";
import type { PhaseKey } from "@/components/three/BuildingModel";
import { fmtMT } from "@/data/mock";
import { useSchedule, realPct } from "@/data/schedule";
import { useProjectExpenses, addExpense, deleteExpense, type Expense } from "@/data/expenses";
import type { BoQSource } from "@/lib/boqSource";
import { phaseLabel } from "@/lib/phaseQuantities";
import { Plus, Trash2, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

/** Fase do cronograma (rótulo humano) → fases construtivas do orçamento. */
const SCHED_TO_BOQ: Record<string, PhaseKey[]> = {
  Preliminares: [],
  Fundação: ["fundacao"],
  Estrutura: ["pilares", "lajes"],
  Alvenaria: ["alvenaria"],
  Cobertura: ["cobertura"],
  Instalações: ["instalacoes"],
  Acabamentos: ["acabamentos"],
};

const today = () => new Date().toISOString().slice(0, 10);

export default function CostTracking({
  projectId,
  boq,
}: {
  projectId: string;
  boq: BoQSource;
}) {
  const { tasks, reports } = useSchedule(projectId);
  const expenses = useProjectExpenses(projectId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    phase: "fundacao" as PhaseKey,
    date: today(),
    description: "",
    supplier: "",
    invoiceRef: "",
    amount: "",
    note: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Progresso real (0-1) por fase construtiva, a partir dos relatórios diários confirmados. */
  const progressByPhase = useMemo(() => {
    const acc: Record<string, { w: number; sum: number }> = {};
    tasks
      .filter((t) => t.kind !== "cura")
      .forEach((t) => {
        const targets = SCHED_TO_BOQ[t.phase] ?? [];
        const pct = realPct(t, reports) / 100;
        targets.forEach((p) => {
          const a = (acc[p] ??= { w: 0, sum: 0 });
          const w = Math.max(1, t.durWeeks);
          a.w += w;
          a.sum += pct * w;
        });
      });
    const out = {} as Record<PhaseKey, number>;
    boq.order.forEach((p) => {
      const a = acc[p];
      out[p] = a && a.w > 0 ? a.sum / a.w : 0;
    });
    return out;
  }, [tasks, reports, boq.order]);

  const rows = useMemo(() => {
    const byPhaseExp: Record<string, number> = {};
    expenses.forEach((e) => {
      byPhaseExp[e.phase] = (byPhaseExp[e.phase] ?? 0) + e.amount;
    });
    return boq.order.map((p) => {
      const budget = boq.sections[p].total;
      const pct = progressByPhase[p] ?? 0;
      const earned = budget * pct;
      const spent = byPhaseExp[p] ?? 0;
      const dev = earned > 0 ? ((spent - earned) / earned) * 100 : spent > 0 ? 100 : 0;
      return { p, budget, pct, earned, spent, dev };
    });
  }, [boq, progressByPhase, expenses]);

  const totals = rows.reduce(
    (a, r) => ({
      budget: a.budget + r.budget,
      earned: a.earned + r.earned,
      spent: a.spent + r.spent,
    }),
    { budget: 0, earned: 0, spent: 0 }
  );
  const totalDev =
    totals.earned > 0 ? ((totals.spent - totals.earned) / totals.earned) * 100 : 0;

  const submit = async () => {
    const amount = Number(String(form.amount).replace(",", "."));
    if (!form.description.trim()) return setErr("Indique a descrição da despesa.");
    if (!Number.isFinite(amount) || amount <= 0) return setErr("Indique um valor válido em MT.");
    setSaving(true);
    setErr(null);
    const e = await addExpense({
      projectId,
      phase: form.phase,
      date: form.date,
      description: form.description.trim(),
      supplier: form.supplier.trim(),
      invoiceRef: form.invoiceRef.trim(),
      amount,
      note: form.note.trim(),
    });
    setSaving(false);
    if (e) return setErr(e);
    setForm({ ...form, description: "", supplier: "", invoiceRef: "", amount: "", note: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Dois indicadores lado a lado */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Orçamento total
          </div>
          <div className="font-display text-2xl mt-1">{fmtMT(totals.budget)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{boq.originLabel}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="size-3" /> Custo ganho (progresso)
          </div>
          <div className="font-display text-2xl mt-1 text-accent">{fmtMT(totals.earned)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Derivado das quantidades confirmadas nos relatórios diários
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
            <Wallet className="size-3" /> Despesa real lançada
          </div>
          <div className="font-display text-2xl mt-1">{fmtMT(totals.spent)}</div>
          <div
            className={`text-[11px] mt-1 font-medium ${
              Math.abs(totalDev) > 15 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            Desvio vs. custo ganho: {totalDev >= 0 ? "+" : ""}
            {totalDev.toFixed(1)}%
            {Math.abs(totalDev) > 15 && " — acima do limiar de 15%"}
          </div>
        </div>
      </div>

      {/* Tabela por fase */}
      <div className="rounded-xl border border-border bg-surface-elevated shadow-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="text-sm font-medium">Custo real vs. orçamento por fase</div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90"
          >
            <Plus className="size-3.5" /> Lançar despesa
          </button>
        </div>

        {open && (
          <div className="px-5 py-4 border-b border-border bg-muted/10 grid sm:grid-cols-3 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-muted-foreground">Fase</span>
              <select
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value as PhaseKey })}
                className="w-full border border-border rounded px-2 py-1.5 bg-background"
              >
                {boq.order.map((p) => (
                  <option key={p} value={p}>
                    {phaseLabel(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground">Data</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-border rounded px-2 py-1.5 bg-background"
              />
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground">Valor (MT)</span>
              <input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="w-full border border-border rounded px-2 py-1.5 bg-background font-mono"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-muted-foreground">Descrição</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: Cimento 42,5R — 120 sacos"
                className="w-full border border-border rounded px-2 py-1.5 bg-background"
              />
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground">Fornecedor</span>
              <input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full border border-border rounded px-2 py-1.5 bg-background"
              />
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground">Ref. factura</span>
              <input
                value={form.invoiceRef}
                onChange={(e) => setForm({ ...form, invoiceRef: e.target.value })}
                className="w-full border border-border rounded px-2 py-1.5 bg-background font-mono"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-muted-foreground">Nota</span>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-border rounded px-2 py-1.5 bg-background"
              />
            </label>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                onClick={submit}
                disabled={saving}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "A guardar…" : "Guardar despesa"}
              </button>
              <button
                onClick={() => { setOpen(false); setErr(null); }}
                className="border border-border px-3 py-1.5 rounded-md text-xs hover:bg-muted"
              >
                Cancelar
              </button>
              {err && <span className="text-destructive">{err}</span>}
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 text-left">Fase</th>
              <th className="px-4 py-2.5 text-right">Orçamento</th>
              <th className="px-4 py-2.5 text-right">Progresso real</th>
              <th className="px-4 py-2.5 text-right">Custo ganho</th>
              <th className="px-4 py-2.5 text-right">Despesa real</th>
              <th className="px-4 py-2.5 text-right">Desvio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.p} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">{boq.sections[r.p].label}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtMT(r.budget)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{(r.pct * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-accent">{fmtMT(r.earned)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{fmtMT(r.spent)}</td>
                <td
                  className={`px-4 py-2.5 text-right font-mono ${
                    Math.abs(r.dev) > 15 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {r.earned === 0 && r.spent === 0 ? "—" : `${r.dev >= 0 ? "+" : ""}${r.dev.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-accent/30 font-medium">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right font-mono">{fmtMT(totals.budget)}</td>
              <td className="px-4 py-3 text-right font-mono">
                {totals.budget > 0 ? ((totals.earned / totals.budget) * 100).toFixed(0) : 0}%
              </td>
              <td className="px-4 py-3 text-right font-mono text-accent">{fmtMT(totals.earned)}</td>
              <td className="px-4 py-3 text-right font-mono">{fmtMT(totals.spent)}</td>
              <td
                className={`px-4 py-3 text-right font-mono ${
                  Math.abs(totalDev) > 15 ? "text-destructive" : ""
                }`}
              >
                {totalDev >= 0 ? "+" : ""}
                {totalDev.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Lançamentos */}
      <div className="rounded-xl border border-border bg-surface-elevated shadow-soft overflow-hidden">
        <div className="px-5 py-3 border-b border-border text-sm font-medium bg-muted/30">
          Despesas lançadas ({expenses.length})
        </div>
        {expenses.length === 0 ? (
          <div className="px-5 py-6 text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-warning" />
            Sem despesas lançadas — o custo real ainda não é auditável nesta obra.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Data</th>
                <th className="px-4 py-2.5 text-left">Fase</th>
                <th className="px-4 py-2.5 text-left">Descrição</th>
                <th className="px-4 py-2.5 text-left">Fornecedor</th>
                <th className="px-4 py-2.5 text-left">Factura</th>
                <th className="px-4 py-2.5 text-right">Valor</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e: Expense) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{e.date}</td>
                  <td className="px-4 py-2.5 text-xs">{phaseLabel(e.phase as PhaseKey)}</td>
                  <td className="px-4 py-2.5">{e.description}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.supplier || "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{e.invoiceRef || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{fmtMT(e.amount)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => void deleteExpense(e.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Eliminar lançamento"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
