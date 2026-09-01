import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Expense = {
  id: string;
  projectId: string;
  phase: string;
  date: string;
  description: string;
  supplier: string;
  invoiceRef: string;
  amount: number;
  note: string;
  createdAt: string;
};

let expenses: Expense[] = [];
let snapshot = { expenses, v: 0 };
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = { expenses, v: snapshot.v + 1 };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const getSnapshot = () => snapshot;

const map = (r: any): Expense => ({
  id: r.id,
  projectId: r.project_id,
  phase: r.phase ?? "fundacao",
  date: String(r.expense_date ?? "").slice(0, 10),
  description: r.description ?? "",
  supplier: r.supplier ?? "",
  invoiceRef: r.invoice_ref ?? "",
  amount: Number(r.amount ?? 0),
  note: r.note ?? "",
  createdAt: r.created_at ?? "",
});

const loadedProjects = new Set<string>();

export async function loadExpenses(projectId: string, force = false) {
  if (!projectId) return;
  if (!force && loadedProjects.has(projectId)) return;
  loadedProjects.add(projectId);
  const { data, error } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("project_id", projectId)
    .order("expense_date", { ascending: false });
  if (error) {
    loadedProjects.delete(projectId);
    return;
  }
  const rest = expenses.filter((e) => e.projectId !== projectId);
  expenses = [...rest, ...(data ?? []).map(map)];
  emit();
}

export function useProjectExpenses(projectId: string): Expense[] {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    void loadExpenses(projectId);
  }, [projectId]);
  return snap.expenses.filter((e) => e.projectId === projectId);
}

export async function addExpense(input: {
  projectId: string;
  phase: string;
  date: string;
  description: string;
  supplier: string;
  invoiceRef: string;
  amount: number;
  note?: string;
}): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return "Sessão expirada — inicie sessão novamente.";
  const { data, error } = await supabase
    .from("project_expenses")
    .insert({
      owner_id: uid,
      project_id: input.projectId,
      phase: input.phase,
      expense_date: input.date,
      description: input.description,
      supplier: input.supplier,
      invoice_ref: input.invoiceRef,
      amount: input.amount,
      note: input.note ?? "",
    })
    .select("*")
    .single();
  if (error) return error.message;
  expenses = [map(data), ...expenses];
  emit();
  return null;
}

export async function deleteExpense(id: string): Promise<string | null> {
  const { error } = await supabase.from("project_expenses").delete().eq("id", id);
  if (error) return error.message;
  expenses = expenses.filter((e) => e.id !== id);
  emit();
  return null;
}

/** Total de despesas lançadas por fase. */
export function expensesByPhase(list: Expense[]): Record<string, number> {
  const out: Record<string, number> = {};
  list.forEach((e) => {
    out[e.phase] = (out[e.phase] ?? 0) + e.amount;
  });
  return out;
}
