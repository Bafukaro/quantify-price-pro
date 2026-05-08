import { useState, useMemo } from "react";
import { useTasks, toggleTask, addTask, type Priority } from "@/data/store";
import { Plus, CheckCircle2, Circle, X, Calendar, User } from "lucide-react";

const priorityColor: Record<Priority, string> = {
  alta: "bg-destructive",
  media: "bg-warning",
  baixa: "bg-success",
};
const priorityLabel: Record<Priority, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

export default function ProjectTasks({
  projectId,
  phases,
  initialPhase,
}: {
  projectId: string;
  phases: string[];
  initialPhase?: string;
}) {
  const all = useTasks();
  const tasks = useMemo(() => all.filter((t) => t.projectId === projectId), [all, projectId]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    assignee: "",
    phase: initialPhase ?? phases[0] ?? "Estrutura",
    priority: "media" as Priority,
    due: "",
  });

  const grouped = phases.reduce<Record<string, typeof tasks>>((acc, ph) => {
    acc[ph] = tasks.filter((t) => t.phase === ph);
    return acc;
  }, {});
  const orphans = tasks.filter((t) => !phases.includes(t.phase));

  const submit = () => {
    if (!form.name.trim() || !form.assignee.trim()) return;
    addTask({ ...form, projectId });
    setForm({ name: "", assignee: "", phase: form.phase, priority: "media", due: "" });
    setOpen(false);
  };

  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-2xl">Tarefas do projecto</h3>
          <div className="text-sm text-muted-foreground mt-1">
            {pending} pendente{pending !== 1 ? "s" : ""} · {tasks.length} no total
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          {open ? <X className="size-4" /> : <Plus className="size-4" />}
          {open ? "Cancelar" : "Nova tarefa"}
        </button>
      </div>

      {open && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 p-4 rounded-lg border border-border bg-muted/30 animate-fade-in">
          <input
            placeholder="Nome da tarefa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="lg:col-span-2 px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <input
            placeholder="Responsável"
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <select
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          >
            {phases.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          >
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
          <input
            type="date"
            value={form.due}
            onChange={(e) => setForm({ ...form, due: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <button
            onClick={submit}
            className="lg:col-span-5 bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-medium hover:opacity-90"
          >
            Guardar tarefa
          </button>
        </div>
      )}

      <div className="space-y-5">
        {phases.map((phase) => {
          const list = grouped[phase];
          if (!list.length) return null;
          const pendingPh = list.filter((t) => !t.done).length;
          return (
            <div key={phase} className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
                <div className="text-sm font-medium">{phase}</div>
                <span className="text-xs font-mono text-muted-foreground">
                  {pendingPh} pendente{pendingPh !== 1 ? "s" : ""} · {list.length} total
                </span>
              </div>
              <ul className="divide-y divide-border">
                {list.map((t) => (
                  <li key={t.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-muted/30 ${t.done ? "opacity-60" : ""}`}>
                    <button onClick={() => toggleTask(t.id)} className="mt-0.5 shrink-0 text-accent" aria-label="toggle">
                      {t.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.name}</div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="inline-flex items-center gap-1"><User className="size-3" /> {t.assignee}</span>
                        {t.due && <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {t.due}</span>}
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${priorityColor[t.priority]}`} /> {priorityLabel[t.priority]}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {orphans.length > 0 && (
          <div className="rounded-xl bg-surface-elevated border border-dashed border-border p-4 text-xs text-muted-foreground">
            {orphans.length} tarefa(s) sem fase associada.
          </div>
        )}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Sem tarefas para este projecto. Crie uma nova acima.
          </div>
        )}
      </div>
    </div>
  );
}
