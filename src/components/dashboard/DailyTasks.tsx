import { useState } from "react";
import { useTasks, toggleTask, addTask, type Priority } from "@/data/store";
import { Plus, CheckCircle2, Circle, X } from "lucide-react";

const priorityColor: Record<Priority, string> = {
  alta: "bg-destructive",
  media: "bg-warning",
  baixa: "bg-success",
};
const priorityLabel: Record<Priority, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
const PHASES = ["F0 Preliminares", "F1 Estrutura", "F2 Alvenaria", "F3 Instalações", "F4 Acabamentos", "F5 Exteriores", "Base Preços"];

export default function DailyTasks() {
  const tasks = useTasks();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", assignee: "", phase: "F1 Estrutura", priority: "media" as Priority });

  const today = tasks; // simulated "today"
  const doneToday = today.filter((t) => t.done).length;
  const pctToday = today.length ? Math.round((doneToday / today.length) * 100) : 0;
  const weekDone = tasks.filter((t) => t.done).length;

  // group by phase
  const grouped = today.reduce<Record<string, typeof tasks>>((acc, t) => {
    (acc[t.phase] ||= []).push(t);
    return acc;
  }, {});

  const submit = () => {
    if (!form.name.trim() || !form.assignee.trim()) return;
    addTask(form);
    setForm({ name: "", assignee: "", phase: "F1 Estrutura", priority: "media" });
    setOpen(false);
  };

  return (
    <aside className="rounded-xl bg-surface-elevated border border-border shadow-soft p-5 space-y-4 sticky top-24">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">Tarefas de hoje</h3>
          <span className="text-xs text-muted-foreground font-mono">{doneToday}/{today.length}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pctToday}%` }} />
          </div>
          <span className="text-xs font-mono text-accent">{pctToday}%</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">% concluído hoje</div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-center gap-2 border border-dashed border-border px-3 py-2 rounded-md text-xs hover:bg-muted text-muted-foreground"
      >
        {open ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
        {open ? "Cancelar" : "Nova tarefa"}
      </button>

      {open && (
        <div className="space-y-2 p-3 rounded-md border border-border bg-muted/30 animate-fade-in">
          <input
            placeholder="Nome da tarefa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm"
          />
          <input
            placeholder="Responsável"
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm"
          />
          <div className="flex gap-2">
            <select
              value={form.phase}
              onChange={(e) => setForm({ ...form, phase: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-xs"
            >
              {PHASES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="px-2 py-1.5 rounded border border-border bg-background text-xs"
            >
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <button onClick={submit} className="w-full bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90">
            Guardar tarefa
          </button>
        </div>
      )}

      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([phase, list]) => (
          <div key={phase}>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-1.5">
              {phase}
            </div>
            <ul className="space-y-1.5">
              {list.map((t) => (
                <li key={t.id} className={`flex items-start gap-2 p-2 rounded-md border border-border hover:bg-muted/40 ${t.done ? "opacity-60" : ""}`}>
                  <button onClick={() => toggleTask(t.id)} className="mt-0.5 shrink-0 text-accent" aria-label="toggle">
                    {t.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{t.assignee} · {priorityLabel[t.priority]}</div>
                  </div>
                  <span className={`mt-1 size-2 rounded-full shrink-0 ${priorityColor[t.priority]}`} title={priorityLabel[t.priority]} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Esta semana</span>
          <span className="font-mono">{weekDone} de {tasks.length}</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-accent" style={{ width: `${(weekDone / tasks.length) * 100}%` }} />
        </div>
      </div>
    </aside>
  );
}