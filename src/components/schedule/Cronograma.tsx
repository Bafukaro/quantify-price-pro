import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ClipboardList,
  GanttChartSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { phaseColors } from "@/data/mock";
import { useAuth } from "@/hooks/useAuth";
import { setProjectPhasePct } from "@/data/store";
import type { Project as ProjectRecord } from "@/data/projects";
import {
  addDailyReport,
  addScheduleTask,
  confirmedQty,
  currentWeek,
  deleteDailyReport,
  deleteScheduleTask,
  isScheduleLoaded,
  isTemplateCritical,
  pendingQty,
  realPct,
  reviewDailyReport,
  seedScheduleTemplate,
  updateScheduleTask,
  useSchedule,
  type DailyReport,
  type ScheduleTask,
} from "@/data/schedule";

const START_KEY = (id: string) => `sqi.schedule.start.${id}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

function phaseColor(phases: string[], phase: string) {
  const i = Math.max(0, phases.indexOf(phase));
  return phaseColors[`F${i % 6}`];
}

/** Lista ordenada de fases: primeiro as que aparecem nas tarefas (ordem do Gantt),
 *  depois as restantes fases do projecto. Garante cor consistente por nome. */
function buildPhaseList(phaseNames: string[], tasks: ScheduleTask[]) {
  const names: string[] = [];
  [...tasks]
    .sort((a, b) => a.startWeek - b.startWeek)
    .forEach((t) => {
      if (t.phase && !names.includes(t.phase)) names.push(t.phase);
    });
  phaseNames.forEach((p) => {
    if (p && !names.includes(p)) names.push(p);
  });
  return names;
}

type Sub = "gantt" | "reports" | "fases";

export default function Cronograma({ project }: { project: ProjectRecord }) {
  const { tasks, reports, photoUrl } = useSchedule(project.id);
  const { user } = useAuth();
  const [sub, setSub] = useState<Sub>("gantt");
  const phaseNames = (project.phases ?? []).map((p) => p.name);

  const pendingCount = reports.filter((r) => r.status === "pendente").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1 w-fit">
        <SubBtn active={sub === "gantt"} onClick={() => setSub("gantt")} icon={<GanttChartSquare className="size-4" />}>
          Planeado vs. real
        </SubBtn>
        <SubBtn active={sub === "reports"} onClick={() => setSub("reports")} icon={<ClipboardList className="size-4" />}>
          Relatórios diários{pendingCount > 0 ? ` (${pendingCount})` : ""}
        </SubBtn>
        <SubBtn active={sub === "fases"} onClick={() => setSub("fases")} icon={<CalendarDays className="size-4" />}>
          Fases
        </SubBtn>
      </div>

      {sub === "gantt" && (
        <GanttView project={project} tasks={tasks} reports={reports} phaseNames={phaseNames} />
      )}
      {sub === "reports" && (
        <ReportsView
          project={project}
          tasks={tasks}
          reports={reports}
          photoUrl={photoUrl}
          phaseNames={phaseNames}
          userEmail={user?.email ?? "—"}
        />
      )}
      {sub === "fases" && <PhasesView project={project} />}
    </div>
  );
}

function SubBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${
        active ? "bg-surface-elevated shadow-soft text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// ===================== GANTT (planeado vs real) =====================

function GanttView({
  project,
  tasks,
  reports,
  phaseNames,
}: {
  project: ProjectRecord;
  tasks: ScheduleTask[];
  reports: DailyReport[];
  phaseNames: string[];
}) {
  const [startDate, setStartDate] = useState<string>(
    () => (typeof window !== "undefined" && localStorage.getItem(START_KEY(project.id))) || ""
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phase: phaseNames[0] ?? "Estrutura",
    startWeek: 1,
    durWeeks: 4,
    targetQty: 0,
    unit: "un",
  });
  const [err, setErr] = useState<string | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);

  // Pré-preenchimento automático do cronograma tipo no projecto MALANGA
  // (uma única vez; tarefas ficam persistidas na base de dados).
  useEffect(() => {
    if (!/malanga/i.test(project.name)) return;
    if (!isScheduleLoaded(project.id) || tasks.length > 0) return;
    setSeedBusy(true);
    void seedScheduleTemplate(project.id).finally(() => setSeedBusy(false));
  }, [project.id, project.name, tasks.length]);

  const phaseList = useMemo(() => buildPhaseList(phaseNames, tasks), [phaseNames, tasks]);

  const totalWeeks = useMemo(
    () => Math.max(12, ...tasks.map((t) => t.startWeek + t.durWeeks)),
    [tasks]
  );
  const week = currentWeek(startDate || null, totalWeeks);

  const rows = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => a.startWeek - b.startWeek || a.name.localeCompare(b.name))
        .map((t) => {
          // Planeado = fracção do tempo decorrido dentro da janela da tarefa.
          const elapsed = week - t.startWeek;
          const planned = week === 0 ? 0 : Math.max(0, Math.min(100, Math.round((elapsed / t.durWeeks) * 100)));
          // Real = unidades confirmadas / alvo; sem alvo definido, usa o
          // progresso manual editável (plannedPct).
          const hasReports = reports.some((r) => r.taskId === t.id);
          const real =
            t.targetQty > 0 || hasReports
              ? realPct(t, reports)
              : Math.max(0, Math.min(100, Math.round(t.plannedPct)));
          const delta = real - planned;
          return { t, planned, real, delta };
        }),
    [tasks, reports, week]
  );

  const criticalIds = useMemo(() => {
    // Caminho crítico = tarefas com folga zero declaradas no plano
    // (Escavação → Sapatas → Pilares R/C → Laje → Alvenaria → Cobertura →
    // Pintura → Entrega), mais qualquer tarefa em curso com atraso ≥ 10 p.p.
    const set = new Set<string>();
    for (const r of rows) {
      const started = week > r.t.startWeek;
      if (isTemplateCritical(r.t.name) || (started && r.real < 100 && r.delta <= -10)) set.add(r.t.id);
    }
    return set;
  }, [rows, week]);

  const avgReal = rows.length ? Math.round(rows.reduce((a, r) => a + r.real, 0) / rows.length) : 0;
  const avgPlanned = rows.length ? Math.round(rows.reduce((a, r) => a + r.planned, 0) / rows.length) : 0;

  const saveStart = (v: string) => {
    setStartDate(v);
    if (typeof window !== "undefined") localStorage.setItem(START_KEY(project.id), v);
  };

  const submit = async () => {
    if (!form.name.trim()) return setErr("Indique o nome da tarefa.");
    const e = await addScheduleTask(project.id, {
      ...form,
      name: form.name.trim(),
      startWeek: Math.max(0, form.startWeek - 1),
      targetQty: Number(form.targetQty) || 0,
    });
    if (e) return setErr(e);
    setErr(null);
    setForm({ ...form, name: "", targetQty: 0 });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="text-xs text-muted-foreground">Início da obra</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => saveStart(e.target.value)}
            className="px-3 py-1.5 rounded border border-border bg-background text-sm"
          />
          <span className="text-xs text-muted-foreground">
            {startDate ? `Semana ${week} de ${totalWeeks}` : "defina a data para calcular o planeado"}
          </span>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2 p-4 rounded-lg border border-border bg-muted/30">
          <input
            placeholder="Tarefa (ex: Caixas de controlo)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="lg:col-span-2 px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <select
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          >
            {(phaseNames.length ? phaseNames : ["Estrutura"]).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={form.startWeek}
            onChange={(e) => setForm({ ...form, startWeek: Number(e.target.value) })}
            placeholder="Semana início"
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <input
            type="number"
            min={1}
            value={form.durWeeks}
            onChange={(e) => setForm({ ...form, durWeeks: Number(e.target.value) })}
            placeholder="Semanas"
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={form.targetQty}
              onChange={(e) => setForm({ ...form, targetQty: Number(e.target.value) })}
              placeholder="Alvo"
              className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
            />
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="un"
              className="w-20 px-3 py-2 rounded border border-border bg-background text-sm"
            />
          </div>
          {err && <div className="lg:col-span-6 text-xs text-destructive">{err}</div>}
          <button
            onClick={submit}
            className="lg:col-span-6 bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-medium hover:opacity-90"
          >
            Guardar tarefa
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {phaseList.map((p, i) => (
          <span key={p} className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: phaseColors[`F${i % 6}`] }} /> {p}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-accent" /> Real reportado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border-2 border-dashed border-destructive" /> Caminho crítico (folga zero)
        </span>
      </div>

      {/* Gantt */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground space-y-3">
          <div>
            {seedBusy
              ? "A pré-preencher o cronograma tipo…"
              : "Sem tarefas no cronograma. Crie a primeira tarefa com quantidade-alvo (ex: 100 caixas)."}
          </div>
          {!seedBusy && (
            <button
              onClick={() => {
                setSeedBusy(true);
                void seedScheduleTemplate(project.id).finally(() => setSeedBusy(false));
              }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
            >
              <Plus className="size-4" /> Pré-preencher cronograma tipo (13 tarefas)
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[240px_1fr] text-xs">
                <div className="bg-muted/60 px-4 py-2.5 font-medium uppercase tracking-wider text-muted-foreground border-r border-b border-border">
                  Tarefa
                </div>
                <div
                  className="bg-muted/60 grid border-b border-border"
                  style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: totalWeeks }).map((_, i) => (
                    <div
                      key={i}
                      className="text-center py-2.5 text-[10px] text-muted-foreground border-r border-border/50 last:border-r-0"
                    >
                      {i % 4 === 0 ? `S${i + 1}` : ""}
                    </div>
                  ))}
                </div>

                {rows.map(({ t, planned, real, delta }) => (
                  <GanttRow
                    key={t.id}
                    t={t}
                    planned={planned}
                    real={real}
                    delta={delta}
                    totalWeeks={totalWeeks}
                    week={week}
                    color={phaseColor(phaseList, t.phase)}
                    critical={criticalIds.has(t.id)}
                    confirmed={confirmedQty(reports, t.id)}
                    onClose={() =>
                      updateScheduleTask(t.id, { status: t.status === "fechada" ? "aberta" : "fechada" })
                    }
                    onDelete={() => deleteScheduleTask(t.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Tarefas no caminho crítico" value={criticalIds.size} />
        <Stat label="Progresso planeado" value={`${avgPlanned}%`} />
        <Stat label="Progresso real" value={`${avgReal}%`} hint="unidades confirmadas / alvo" />
        <Stat label="Semanas decorridas" value={`${week} / ${totalWeeks}`} />
      </div>
    </div>
  );
}

function GanttRow({
  t,
  planned,
  real,
  delta,
  totalWeeks,
  week,
  color,
  critical,
  confirmed,
  onClose,
  onDelete,
}: {
  t: ScheduleTask;
  planned: number;
  real: number;
  delta: number;
  totalWeeks: number;
  week: number;
  color: string;
  critical: boolean;
  confirmed: number;
  onClose: () => void;
  onDelete: () => void;
}) {
  const left = (t.startWeek / totalWeeks) * 100;
  const width = (t.durWeeks / totalWeeks) * 100;
  const statusLabel =
    week === 0 ? "sem data de início" : delta >= 5 ? "adiantada" : delta <= -10 ? "atrasada" : "no prazo";
  const statusColor =
    week === 0
      ? "text-muted-foreground"
      : delta >= 5
      ? "text-success"
      : delta <= -10
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <>
      <div className="px-4 py-3 border-r border-b border-border">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: color }} />
          <span className={`text-sm truncate ${t.status === "fechada" ? "line-through text-muted-foreground" : ""}`}>
            {t.name}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>
            {confirmed}/{t.targetQty || "—"} {t.unit}
          </span>
          <span className={statusColor}>· {statusLabel}</span>
          <button onClick={onClose} className="ml-auto hover:text-accent" title="Fechar/reabrir tarefa">
            <Check className="size-3.5" />
          </button>
          <button onClick={onDelete} className="hover:text-destructive" title="Remover tarefa">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div
        className="relative border-b border-border h-14 grid"
        style={{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalWeeks }).map((_, i) => (
          <div key={i} className="border-r border-border/40 last:border-r-0" />
        ))}
        {week > 0 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-destructive/70"
            style={{ left: `${(week / totalWeeks) * 100}%` }}
          />
        )}
        {/* Barra planeada */}
        <div
          className={`absolute top-2 h-4 rounded-md overflow-hidden shadow-soft ${
            critical ? "ring-2 ring-destructive ring-offset-1 ring-offset-surface-elevated" : ""
          }`}
          style={{ left: `${left}%`, width: `${width}%`, background: color, opacity: 0.55 }}
        >
          <div className="h-full bg-black/25" style={{ width: `${planned}%` }} />
          <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-mono text-white/90">
            plan {planned}%
          </span>
        </div>
        {/* Barra real */}
        <div
          className="absolute top-8 h-4 rounded-md bg-muted border border-border overflow-hidden"
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${real}%` }} />
          <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-mono text-foreground/80">
            real {real}%
          </span>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="p-5 rounded-xl bg-surface-elevated border border-border shadow-soft">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

// ===================== RELATÓRIOS DIÁRIOS =====================

function ReportsView({
  project,
  tasks,
  reports,
  photoUrl,
  phaseNames,
  userEmail,
}: {
  project: ProjectRecord;
  tasks: ScheduleTask[];
  reports: DailyReport[];
  photoUrl: (p: string) => string | undefined;
  phaseNames: string[];
  userEmail: string;
}) {
  const [form, setForm] = useState({
    taskId: tasks[0]?.id ?? "",
    date: todayISO(),
    qty: 0,
    note: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pendente" | "todos">("pendente");

  const openTasks = tasks.filter((t) => t.status === "aberta");
  const list = reports.filter((r) => (filter === "todos" ? true : r.status === "pendente"));

  const submit = async () => {
    if (!form.taskId) return setErr("Escolha a tarefa reportada.");
    if (!form.qty || form.qty <= 0) return setErr("Indique as unidades concluídas hoje.");
    setBusy(true);
    const e = await addDailyReport({
      projectId: project.id,
      taskId: form.taskId,
      date: form.date,
      qty: Number(form.qty),
      note: form.note,
      reporter: userEmail,
      files,
    });
    setBusy(false);
    if (e) return setErr(e);
    setErr(null);
    setForm({ ...form, qty: 0, note: "" });
    setFiles([]);
  };

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
      {/* Upload do trabalhador */}
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="size-4 text-accent" />
          <h4 className="font-display text-lg">Relatório de fim do dia</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Fotos do trabalho feito + unidades concluídas hoje. Fica pendente até revisão do engenheiro.
        </p>
        <select
          value={form.taskId}
          onChange={(e) => setForm({ ...form, taskId: e.target.value })}
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
        >
          <option value="">— tarefa —</option>
          {openTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.unit})
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          />
          <input
            type="number"
            min={0}
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
            placeholder="Unidades feitas"
            className="px-3 py-2 rounded border border-border bg-background text-sm"
          />
        </div>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Observações (equipa, incidentes, clima…)"
          rows={3}
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
        />
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="w-full text-xs"
        />
        {files.length > 0 && (
          <div className="text-[11px] text-muted-foreground">{files.length} foto(s) seleccionada(s)</div>
        )}
        {err && <div className="text-xs text-destructive">{err}</div>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "A enviar…" : "Enviar relatório"}
        </button>
      </div>

      {/* Revisão do engenheiro */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-display text-lg">Revisão do gestor de obra</h4>
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(["pendente", "todos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {f === "pendente" ? "Pendentes" : "Todos"}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Sem relatórios {filter === "pendente" ? "pendentes" : ""} nesta obra.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <ReportCard
                key={r.id}
                r={r}
                task={tasks.find((t) => t.id === r.taskId) ?? null}
                photoUrl={photoUrl}
                reviewer={userEmail}
                reports={reports}
              />
            ))}
          </div>
        )}

        {/* Resumo por tarefa após revisão */}
        {tasks.length > 0 && (
          <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              Acumulado por tarefa
            </div>
            <ul className="divide-y divide-border">
              {tasks.map((t) => {
                const conf = confirmedQty(reports, t.id);
                const pend = pendingQty(reports, t.id);
                return (
                  <li key={t.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate">{t.name}</span>
                    <span className="font-mono text-xs">
                      {conf}/{t.targetQty || "—"} {t.unit}
                      {pend > 0 && <span className="text-warning"> (+{pend} p/ rever)</span>}
                    </span>
                    <span className="font-mono text-xs w-12 text-right">{realPct(t, reports)}%</span>
                    <button
                      onClick={() => updateScheduleTask(t.id, { status: t.status === "fechada" ? "aberta" : "fechada" })}
                      className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted whitespace-nowrap"
                    >
                      {t.status === "fechada" ? "Reabrir" : "Fechar tarefa"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  r,
  task,
  photoUrl,
  reviewer,
  reports,
}: {
  r: DailyReport;
  task: ScheduleTask | null;
  photoUrl: (p: string) => string | undefined;
  reviewer: string;
  reports: DailyReport[];
}) {
  const [qty, setQty] = useState(r.approvedQty ?? r.qty);
  const badge =
    r.status === "confirmado"
      ? "border-success/40 text-success"
      : r.status === "rejeitado"
      ? "border-destructive/40 text-destructive"
      : "border-warning/40 text-warning";

  return (
    <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{task?.name ?? "Tarefa removida"}</span>
        <ChevronRight className="size-3 text-muted-foreground" />
        <span className="font-mono text-xs">
          {r.qty} {task?.unit ?? "un"}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge}`}>{r.status}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {r.date} · {r.reporter || "—"}
        </span>
      </div>
      {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
      {r.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {r.photos.map((p) => {
            const url = photoUrl(p);
            return url ? (
              <a key={p} href={url} target="_blank" rel="noreferrer" className="shrink-0">
                <img src={url} alt="Foto do relatório diário de obra" className="h-24 w-32 object-cover rounded-md border border-border" loading="lazy" />
              </a>
            ) : (
              <div key={p} className="h-24 w-32 rounded-md bg-muted animate-pulse shrink-0" />
            );
          })}
        </div>
      )}
      {r.status === "pendente" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground">Unidades confirmadas</label>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-24 px-2 py-1 rounded border border-border bg-background text-sm font-mono"
          />
          <button
            onClick={() => reviewDailyReport(r.id, "confirmado", qty, reviewer)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90"
          >
            <Check className="size-3.5" /> Confirmar
          </button>
          <button
            onClick={() => reviewDailyReport(r.id, "rejeitado", 0, reviewer)}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded text-xs hover:bg-muted"
          >
            <X className="size-3.5" /> Rejeitar
          </button>
          <button
            onClick={() => deleteDailyReport(r.id)}
            className="ml-auto text-muted-foreground hover:text-destructive"
            title="Remover relatório"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground">
          {r.status === "confirmado" ? `${r.approvedQty ?? r.qty} confirmadas` : "rejeitado"} por{" "}
          {r.reviewedBy || "—"}
          {task && r.status === "confirmado" && (
            <> · acumulado {confirmedQty(reports, task.id)}/{task.targetQty || "—"} {task.unit}</>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== FASES (progresso declarado) =====================

function PhasesView({ project }: { project: ProjectRecord }) {
  const phases = project.phases ?? [];
  if (!phases.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Sem fases definidas para este projecto.
      </div>
    );
  }
  const avg = Math.round(phases.reduce((a, f) => a + f.pct, 0) / phases.length);
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface-elevated border border-border shadow-soft divide-y divide-border">
        {phases.map((f, i) => (
          <div key={f.name} className="px-5 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">F{i}</span>
                {f.name}
              </span>
              <span className="font-mono text-xs">{f.pct}%</span>
            </div>
            <div className="relative mt-2 h-6 rounded-md bg-muted border border-border overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, f.pct))}%` }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-foreground/70">
                {f.pct > 0 ? `${f.pct}%` : "por iniciar"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={f.pct}
                onChange={(e) => setProjectPhasePct(project.id, f.name, Number(e.target.value))}
                className="flex-1 accent-[hsl(var(--accent))]"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={f.pct}
                onChange={(e) => setProjectPhasePct(project.id, f.name, Number(e.target.value))}
                className="w-16 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
              />
            </div>
          </div>
        ))}
      </div>
      <Stat label="Progresso médio das fases" value={`${avg}%`} />
    </div>
  );
}
