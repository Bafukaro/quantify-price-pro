import { useSyncExternalStore } from "react";

export * from "./projects";

const TASKS_KEY = "sqi.tasks.v1";
const QUOTES_KEY = "sqi.quotes.v1";
const AUDIT_KEY = "sqi.audit.v1";
const RISK_KEY = "sqi.risk.v1";

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

export type AuditEntry = {
  dt: string;
  user: string;
  item: string;
  from: string;
  to: string;
  delta: number;
  just: string;
};

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

// Sem histórico fabricado: tudo começa vazio e só regista acções reais do utilizador.
const initialTasks: DailyTask[] = [];

let tasks: DailyTask[] = loadLS<DailyTask[]>(TASKS_KEY, initialTasks);

// O audit log é isolado por conta autenticada — nunca partilhado nem pré-populado.
let auditUser = "—";
let auditKey = AUDIT_KEY;
let audit: AuditEntry[] = [];

/** Liga o audit log à conta autenticada (chamado pelo AuthProvider). */
export function setAuditUser(email: string | null) {
  auditUser = email ?? "—";
  auditKey = email ? `${AUDIT_KEY}.${email}` : AUDIT_KEY;
  audit = loadLS<AuditEntry[]>(auditKey, []);
  listeners.forEach((l) => l());
}
export const currentAuditUser = () => auditUser;

const listeners = new Set<() => void>();
const persist = () => {
  saveLS(TASKS_KEY, tasks);
  saveLS(auditKey, audit);
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
export function pushAudit(entry: AuditEntry) {
  audit = [entry, ...audit];
  emit();
}
export const auditStamp = () => nowStamp();

export function useAudit() {
  return useSyncExternalStore(subscribe, () => audit, () => audit);
}

const nowStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function toggleTask(id: string, user = auditUser) {
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
    { dt: nowStamp(), user: auditUser, item: `Cotação rápida — ${q.material}`, from: "—", to: `${q.price} MT (${q.supplier})`, delta: 0, just: q.hasPhoto ? "Foto do tabelão anexa" : "Entrada manual mobile" },
    ...audit,
  ];
  emit();
}

export function resetStore() {
  tasks = [...initialTasks];
  audit = [];
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

export function decideRisk(id: string, status: "aprovado" | "rejeitado", user = auditUser) {
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