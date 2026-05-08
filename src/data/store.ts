import { useSyncExternalStore } from "react";
import { auditEntries } from "./mock";

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

let tasks: DailyTask[] = [...initialTasks];
let audit = [...auditEntries];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
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
let quotes: QuickQuote[] = [];
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