import { useSyncExternalStore } from "react";
import { auditEntries } from "./mock";

const TASKS_KEY = "sqi.tasks.v1";
const QUOTES_KEY = "sqi.quotes.v1";
const AUDIT_KEY = "sqi.audit.v1";
const RISK_KEY = "sqi.risk.v1";
const MODEL_OVERRIDES_KEY = "sqi.modelOverrides.v1";

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or serialization error — ignore */
  }
}

export type Priority = "alta" | "media" | "baixa";
export type DailyTask = {
  id: string;
  name: string;
  assignee: string;
  phase: string;
  priority: Priority;
  done: boolean;
  createdAt: string;
  projectId: string;
  due?: string;
};

const initialTasks: DailyTask[] = [
  { id: "t1", projectId: "p-001", due: "2026-05-09", name: "Receber cotação ferro Ø10mm — Forn. B", assignee: "Eng. Tomás", phase: "Estrutura", priority: "alta", done: false, createdAt: "2026-05-07" },
  { id: "t2", projectId: "p-001", due: "2026-05-08", name: "Verificar betonagem fundações bloco C", assignee: "Cláudia M.", phase: "Estrutura", priority: "alta", done: false, createdAt: "2026-05-07" },
  { id: "t3", projectId: "p-001", due: "2026-05-10", name: "Actualizar preço cimento Portland na base", assignee: "Eng. Tomás", phase: "Preliminares", priority: "media", done: true, createdAt: "2026-05-07" },
  { id: "t4", projectId: "p-001", due: "2026-05-12", name: "Aprovar BoQ Fase 2 — Alvenaria", assignee: "Cláudia M.", phase: "Alvenaria", priority: "alta", done: false, createdAt: "2026-05-07" },
  { id: "t5", projectId: "p-002", due: "2026-05-09", name: "Fotografar tabelão Fornecedor C", assignee: "Eng. Tomás", phase: "Instalações", priority: "baixa", done: false, createdAt: "2026-05-06" },
  { id: "t6", projectId: "p-002", due: "2026-05-11", name: "Conferir ordem entrega cabos eléctricos", assignee: "Cláudia M.", phase: "Instalações", priority: "media", done: false, createdAt: "2026-05-05" },
  { id: "t7", projectId: "p-001", due: "2026-05-08", name: "Vistoria armaduras pilares P3-P5", assignee: "Eng. Tomás", phase: "Estrutura", priority: "alta", done: false, createdAt: "2026-05-05" },
  { id: "t8", projectId: "p-002", due: "2026-05-15", name: "Recepção de chapas para cobertura", assignee: "Eng. Tomás", phase: "Cobertura", priority: "media", done: false, createdAt: "2026-05-06" },
];

let tasks: DailyTask[] = loadLS<DailyTask[]>(TASKS_KEY, initialTasks);
let audit = loadLS<typeof auditEntries>(AUDIT_KEY, auditEntries);
const listeners = new Set<() => void>();
const persist = () => {
  saveLS(TASKS_KEY, tasks);
  saveLS(AUDIT_KEY, audit);
  saveLS(QUOTES_KEY, quotes);
  saveLS(RISK_KEY, risks);
};
const emit = () => {
  persist();
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTasks() {
  return useSyncExternalStore(subscribe, () => tasks, () => tasks);
}
export function useAudit() {
  return useSyncExternalStore(subscribe, () => audit, () => audit);
}

const nowStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function toggleTask(id: string, user = "Cláudia M. (Gestor)") {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  const t = tasks.find((x) => x.id === id);
  if (t && t.done) {
    audit = [
      { dt: nowStamp(), user, item: `Tarefa concluída — ${t.name}`, from: "—", to: "✓", delta: 0, just: `Fase ${t.phase} · ${t.assignee}` },
      ...audit,
    ];
  }
  emit();
}

export function addTask(t: Omit<DailyTask, "id" | "done" | "createdAt">) {
  const newT: DailyTask = { ...t, id: `t${Date.now()}`, done: false, createdAt: new Date().toISOString().slice(0, 10) };
  tasks = [newT, ...tasks];
  emit();
}

// Quick price quotation additions
export type QuickQuote = { material: string; supplier: string; price: number; date: string; hasPhoto: boolean };
let quotes: QuickQuote[] = loadLS<QuickQuote[]>(QUOTES_KEY, []);
export function useQuotes() {
  return useSyncExternalStore(subscribe, () => quotes, () => quotes);
}
export function addQuote(q: QuickQuote) {
  quotes = [q, ...quotes];
  audit = [
    { dt: nowStamp(), user: "Eng. Tomás R.", item: `Cotação rápida — ${q.material}`, from: "—", to: `${q.price} MT (${q.supplier})`, delta: 0, just: q.hasPhoto ? "Foto do tabelão anexa" : "Entrada manual mobile" },
    ...audit,
  ];
  emit();
}

export function resetStore() {
  tasks = [...initialTasks];
  audit = [...auditEntries];
  quotes = [];
  risks = [];
  emit();
}

// === Risk justifications & approvals ===
export type RiskReason = "urgencia" | "logistica" | "qualidade" | "fornecedor_unico" | "outro";
export type RiskStatus = "pendente" | "aprovado" | "rejeitado";
export type RiskCase = {
  id: string;
  materialId: string;
  materialName: string;
  supplierName: string;
  marketPrice: number;
  supplierPrice: number;
  deviationPct: number;
  reason?: RiskReason;
  observation?: string;
  status: RiskStatus;
  createdBy: string;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
};

let risks: RiskCase[] = loadLS<RiskCase[]>(RISK_KEY, []);
export function useRisks() {
  return useSyncExternalStore(subscribe, () => risks, () => risks);
}

// === Per-project uploaded 3D model state ===
// The blob URL and mesh list are session-only (not persistable), so they live
// in memory keyed by projectId. Manual phase overrides ARE persisted because
// they represent user corrections.
export type UploadedModelPhase =
  | "fundacao"
  | "pilares"
  | "lajes"
  | "alvenaria"
  | "cobertura"
  | "acabamentos";

export type StoredMeshInfo = {
  id: string;
  name: string;
  phase: UploadedModelPhase;
  confidence: number;
  reason: string;
};

export type ProjectModelState = {
  url: string;
  ext: "gltf" | "glb" | "obj" | "ifc";
  name: string;
  size: number;
  meshes: StoredMeshInfo[];
};

const projectModels = new Map<string, ProjectModelState>();
let projectOverrides: Record<string, Record<string, UploadedModelPhase>> = loadLS(
  MODEL_OVERRIDES_KEY,
  {}
);

const persistOverrides = () => saveLS(MODEL_OVERRIDES_KEY, projectOverrides);

// Snapshot ref bumped on every change so useSyncExternalStore re-renders.
let modelsSnapshot = { models: projectModels, overrides: projectOverrides, v: 0 };
const bumpModels = () => {
  modelsSnapshot = { models: projectModels, overrides: projectOverrides, v: modelsSnapshot.v + 1 };
  listeners.forEach((l) => l());
};

export function useProjectModel(projectId: string) {
  useSyncExternalStore(subscribe, () => modelsSnapshot, () => modelsSnapshot);
  return projectModels.get(projectId) ?? null;
}

export function useProjectOverrides(projectId: string) {
  useSyncExternalStore(subscribe, () => modelsSnapshot, () => modelsSnapshot);
  return projectOverrides[projectId] ?? {};
}

export function setProjectModel(projectId: string, state: ProjectModelState | null) {
  // Revoke stale blob URL if we're replacing/clearing.
  const prev = projectModels.get(projectId);
  if (prev && prev.url !== state?.url && prev.url.startsWith("blob:")) {
    try { URL.revokeObjectURL(prev.url); } catch { /* noop */ }
  }
  if (state) projectModels.set(projectId, state);
  else projectModels.delete(projectId);
  bumpModels();
}

export function setProjectModelMeshes(projectId: string, meshes: StoredMeshInfo[]) {
  const cur = projectModels.get(projectId);
  if (!cur) return;
  projectModels.set(projectId, { ...cur, meshes });
  bumpModels();
}

export function setProjectMeshOverride(
  projectId: string,
  meshId: string,
  phase: UploadedModelPhase
) {
  const cur = projectOverrides[projectId] ?? {};
  projectOverrides = { ...projectOverrides, [projectId]: { ...cur, [meshId]: phase } };
  persistOverrides();
  bumpModels();
}

export function clearProjectMeshOverrides(projectId: string) {
  const { [projectId]: _, ...rest } = projectOverrides;
  projectOverrides = rest;
  persistOverrides();
  bumpModels();
}

export function openRiskCase(c: Omit<RiskCase, "id" | "status" | "createdAt">) {
  const newC: RiskCase = {
    ...c,
    id: `r${Date.now()}`,
    status: "pendente",
    createdAt: nowStamp(),
  };
  risks = [newC, ...risks];
  audit = [
    {
      dt: nowStamp(),
      user: c.createdBy,
      item: `Caso de risco aberto — ${c.materialName}`,
      from: `Mediana ${c.marketPrice} MT`,
      to: `${c.supplierName}: ${c.supplierPrice} MT`,
      delta: Math.round(c.deviationPct),
      just: "Aguarda justificação",
    },
    ...audit,
  ];
  emit();
  return newC.id;
}

export function justifyRisk(id: string, reason: RiskReason, observation: string) {
  risks = risks.map((r) => (r.id === id ? { ...r, reason, observation } : r));
  emit();
}

export function decideRisk(id: string, status: "aprovado" | "rejeitado", user = "Cláudia M. (Gestor)") {
  const r = risks.find((x) => x.id === id);
  if (!r) return;
  risks = risks.map((x) => (x.id === id ? { ...x, status, decidedBy: user, decidedAt: nowStamp() } : x));
  audit = [
    {
      dt: nowStamp(),
      user,
      item: `Caso de risco ${status} — ${r.materialName}`,
      from: `${r.supplierName}: ${r.supplierPrice} MT`,
      to: status === "aprovado" ? "✓ aprovado" : "✗ rejeitado",
      delta: Math.round(r.deviationPct),
      just: r.observation || `Motivo: ${r.reason || "n/d"}`,
    },
    ...audit,
  ];
  emit();
}