import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ScheduleTask = {
  id: string;
  projectId: string;
  name: string;
  phase: string;
  startWeek: number;
  durWeeks: number;
  targetQty: number;
  unit: string;
  plannedPct: number;
  status: "aberta" | "fechada";
};

export type ReportStatus = "pendente" | "confirmado" | "rejeitado";

export type DailyReport = {
  id: string;
  projectId: string;
  taskId: string | null;
  date: string;
  qty: number;
  approvedQty: number | null;
  note: string;
  reporter: string;
  photos: string[];
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

let tasks: ScheduleTask[] = [];
let reports: DailyReport[] = [];
const photoUrls = new Map<string, string>();
let snapshot = { tasks, reports, photoUrls, v: 0 };
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = { tasks, reports, photoUrls, v: snapshot.v + 1 };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const getSnapshot = () => snapshot;

const mapTask = (r: any): ScheduleTask => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  phase: r.phase,
  startWeek: Number(r.start_week ?? 0),
  durWeeks: Math.max(1, Number(r.dur_weeks ?? 1)),
  targetQty: Number(r.target_qty ?? 0),
  unit: r.unit ?? "un",
  plannedPct: Number(r.planned_pct ?? 0),
  status: (r.status as ScheduleTask["status"]) ?? "aberta",
});

const mapReport = (r: any): DailyReport => ({
  id: r.id,
  projectId: r.project_id,
  taskId: r.task_id ?? null,
  date: String(r.report_date ?? "").slice(0, 10),
  qty: Number(r.qty ?? 0),
  approvedQty: r.approved_qty === null || r.approved_qty === undefined ? null : Number(r.approved_qty),
  note: r.note ?? "",
  reporter: r.reporter ?? "",
  photos: (r.photos as string[]) ?? [],
  status: (r.status as ReportStatus) ?? "pendente",
  reviewedBy: r.reviewed_by ?? null,
  reviewedAt: r.reviewed_at ?? null,
  createdAt: r.created_at ?? "",
});

const loadedProjects = new Set<string>();
let loading = false;

export async function loadSchedule(projectId: string, force = false) {
  if (!projectId) return;
  if (loading) return;
  if (loadedProjects.has(projectId) && !force) return;
  loading = true;
  try {
    const [t, r] = await Promise.all([
      supabase.from("schedule_tasks").select("*").eq("project_id", projectId).order("start_week"),
      supabase.from("daily_reports").select("*").eq("project_id", projectId).order("report_date", { ascending: false }),
    ]);
    if (t.error) throw t.error;
    if (r.error) throw r.error;
    tasks = [...tasks.filter((x) => x.projectId !== projectId), ...(t.data ?? []).map(mapTask)];
    reports = [...reports.filter((x) => x.projectId !== projectId), ...(r.data ?? []).map(mapReport)];
    loadedProjects.add(projectId);
    emit();
    void signPhotos((r.data ?? []).flatMap((x: any) => (x.photos as string[]) ?? []));
  } catch (e) {
    console.error("loadSchedule", e);
  } finally {
    loading = false;
  }
}

async function signPhotos(paths: string[]) {
  const missing = paths.filter((p) => p && !photoUrls.has(p));
  if (!missing.length) return;
  for (const p of missing) {
    const { data } = await supabase.storage.from("reports").createSignedUrl(p, 60 * 60 * 4);
    if (data?.signedUrl) photoUrls.set(p, data.signedUrl);
  }
  emit();
}

export function useSchedule(projectId: string) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void loadSchedule(projectId);
  }, [projectId]);
  return {
    tasks: tasks.filter((t) => t.projectId === projectId),
    reports: reports.filter((r) => r.projectId === projectId),
    photoUrl: (path: string) => photoUrls.get(path),
  };
}

// ---------------- tasks ----------------

export type NewTaskInput = {
  name: string;
  phase: string;
  startWeek: number;
  durWeeks: number;
  targetQty: number;
  unit: string;
};

export async function addScheduleTask(projectId: string, input: NewTaskInput) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "Sessão expirada.";
  const { data, error } = await supabase
    .from("schedule_tasks")
    .insert({
      owner_id: auth.user.id,
      project_id: projectId,
      name: input.name,
      phase: input.phase,
      start_week: Math.max(0, Math.round(input.startWeek)),
      dur_weeks: Math.max(1, Math.round(input.durWeeks)),
      target_qty: input.targetQty,
      unit: input.unit || "un",
    } as any)
    .select("*")
    .single();
  if (error || !data) return error?.message ?? "Falha ao criar tarefa.";
  tasks = [...tasks, mapTask(data)];
  emit();
  return null;
}

export async function updateScheduleTask(id: string, patch: Partial<ScheduleTask>) {
  const db: Record<string, unknown> = {};
  if (patch.name !== undefined) db.name = patch.name;
  if (patch.phase !== undefined) db.phase = patch.phase;
  if (patch.startWeek !== undefined) db.start_week = Math.max(0, Math.round(patch.startWeek));
  if (patch.durWeeks !== undefined) db.dur_weeks = Math.max(1, Math.round(patch.durWeeks));
  if (patch.targetQty !== undefined) db.target_qty = patch.targetQty;
  if (patch.unit !== undefined) db.unit = patch.unit;
  if (patch.plannedPct !== undefined) db.planned_pct = Math.max(0, Math.min(100, patch.plannedPct));
  if (patch.status !== undefined) db.status = patch.status;
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  emit();
  const { error } = await supabase.from("schedule_tasks").update(db as any).eq("id", id);
  if (error) console.error("updateScheduleTask", error);
}

export async function deleteScheduleTask(id: string) {
  tasks = tasks.filter((t) => t.id !== id);
  emit();
  const { error } = await supabase.from("schedule_tasks").delete().eq("id", id);
  if (error) console.error("deleteScheduleTask", error);
}

// ---------------- cronograma tipo (pré-preenchimento MALANGA) ----------------

export type TemplateTask = {
  name: string;
  phase: string;
  startWeek: number; // 0-based
  durWeeks: number;
  critical: boolean;
};

export const SCHEDULE_TEMPLATE: TemplateTask[] = [
  { name: "Limpeza e implantação do terreno", phase: "Preliminares", startWeek: 0, durWeeks: 2, critical: false },
  { name: "Escavação e compactação", phase: "Fundação", startWeek: 2, durWeeks: 3, critical: true },
  { name: "Sapatas e maciços de fundação", phase: "Fundação", startWeek: 4, durWeeks: 4, critical: true },
  { name: "Pilares R/Chão (betão + cofr. + aço)", phase: "Estrutura", startWeek: 8, durWeeks: 4, critical: true },
  { name: "Laje de cobertura R/Chão", phase: "Estrutura", startWeek: 11, durWeeks: 4, critical: true },
  { name: "Pilares Piso 1", phase: "Estrutura", startWeek: 14, durWeeks: 3, critical: false },
  { name: "Alvenaria interior e exterior", phase: "Alvenaria", startWeek: 16, durWeeks: 5, critical: true },
  { name: "Cobertura IBR + impermeabilização", phase: "Cobertura", startWeek: 20, durWeeks: 3, critical: true },
  { name: "Instalações eléctricas", phase: "Instalações", startWeek: 21, durWeeks: 4, critical: false },
  { name: "Instalações hidráulicas", phase: "Instalações", startWeek: 22, durWeeks: 4, critical: false },
  { name: "Pavimentos e revestimentos", phase: "Acabamentos", startWeek: 25, durWeeks: 4, critical: false },
  { name: "Pinturas interiores e exteriores", phase: "Acabamentos", startWeek: 27, durWeeks: 4, critical: true },
  { name: "Vistoria e entrega", phase: "Exteriores", startWeek: 31, durWeeks: 3, critical: true },
];

/** Caminho crítico declarado (folga zero): Escavação → Sapatas → Pilares R/C → Laje → Alvenaria → Cobertura → Pintura → Entrega. */
export const isTemplateCritical = (name: string) =>
  SCHEDULE_TEMPLATE.some((t) => t.critical && t.name === name);

export const isScheduleLoaded = (projectId: string) => loadedProjects.has(projectId);

/** Versão reactiva: re-renderiza quando loadSchedule terminar para o projecto. */
export function useScheduleLoaded(projectId: string) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return loadedProjects.has(projectId);
}

const seeding = new Set<string>();
const SEED_KEY = (id: string) => `sqi.schedule.seeded.${id}`;

/** Insere o cronograma tipo (13 tarefas) na base de dados — uma única vez por projecto. */
export async function seedScheduleTemplate(projectId: string): Promise<string | null> {
  if (!projectId || seeding.has(projectId)) return null;
  if (typeof window !== "undefined" && localStorage.getItem(SEED_KEY(projectId))) return null;
  seeding.add(projectId);
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "Sessão expirada.";
    const rows = SCHEDULE_TEMPLATE.map((t) => ({
      owner_id: auth.user.id,
      project_id: projectId,
      name: t.name,
      phase: t.phase,
      start_week: t.startWeek,
      dur_weeks: t.durWeeks,
      target_qty: 0,
      unit: "un",
    }));
    const { data, error } = await supabase.from("schedule_tasks").insert(rows as any).select("*");
    if (error) return error.message;
    tasks = [...tasks, ...(data ?? []).map(mapTask)];
    emit();
    if (typeof window !== "undefined") localStorage.setItem(SEED_KEY(projectId), "1");
    return null;
  } finally {
    seeding.delete(projectId);
  }
}

// ---------------- daily reports ----------------

export async function addDailyReport(input: {
  projectId: string;
  taskId: string | null;
  date: string;
  qty: number;
  note: string;
  reporter: string;
  files: File[];
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "Sessão expirada.";
  const paths: string[] = [];
  for (const f of input.files.slice(0, 6)) {
    const path = `${auth.user.id}/${input.projectId}/${Date.now()}-${f.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("reports").upload(path, f, { upsert: true });
    if (error) return `Falha ao carregar foto: ${error.message}`;
    paths.push(path);
  }
  const { data, error } = await supabase
    .from("daily_reports")
    .insert({
      owner_id: auth.user.id,
      project_id: input.projectId,
      task_id: input.taskId,
      report_date: input.date,
      qty: input.qty,
      note: input.note,
      reporter: input.reporter,
      photos: paths,
    } as any)
    .select("*")
    .single();
  if (error || !data) return error?.message ?? "Falha ao guardar relatório.";
  reports = [mapReport(data), ...reports];
  emit();
  void signPhotos(paths);
  return null;
}

export async function reviewDailyReport(
  id: string,
  status: Exclude<ReportStatus, "pendente">,
  approvedQty: number,
  reviewer: string
) {
  const reviewedAt = new Date().toISOString();
  reports = reports.map((r) =>
    r.id === id ? { ...r, status, approvedQty, reviewedBy: reviewer, reviewedAt } : r
  );
  emit();
  const { error } = await supabase
    .from("daily_reports")
    .update({ status, approved_qty: approvedQty, reviewed_by: reviewer, reviewed_at: reviewedAt } as any)
    .eq("id", id);
  if (error) console.error("reviewDailyReport", error);
}

export async function deleteDailyReport(id: string) {
  reports = reports.filter((r) => r.id !== id);
  emit();
  const { error } = await supabase.from("daily_reports").delete().eq("id", id);
  if (error) console.error("deleteDailyReport", error);
}

// ---------------- derived progress ----------------

/** Unidades confirmadas por tarefa (só relatórios confirmados contam). */
export function confirmedQty(reports: DailyReport[], taskId: string) {
  return reports
    .filter((r) => r.taskId === taskId && r.status === "confirmado")
    .reduce((a, r) => a + (r.approvedQty ?? r.qty), 0);
}

/** Unidades ainda por revisão (relatórios pendentes). */
export function pendingQty(reports: DailyReport[], taskId: string) {
  return reports
    .filter((r) => r.taskId === taskId && r.status === "pendente")
    .reduce((a, r) => a + r.qty, 0);
}

export function realPct(task: ScheduleTask, reports: DailyReport[]) {
  if (task.targetQty <= 0) return task.status === "fechada" ? 100 : 0;
  return Math.min(100, Math.round((confirmedQty(reports, task.id) / task.targetQty) * 100));
}

/** Semana actual (1-based) segundo a data de início do projecto guardada localmente. */
export function currentWeek(startISO: string | null, totalWeeks: number) {
  if (!startISO) return 0;
  const start = new Date(startISO).getTime();
  if (Number.isNaN(start)) return 0;
  const weeks = Math.floor((Date.now() - start) / (7 * 864e5)) + 1;
  return Math.max(0, Math.min(totalWeeks, weeks));
}
