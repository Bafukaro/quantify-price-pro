import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuditEntry } from "@/data/store";

/** Entrada do Audit Log guardada na base de dados (hash calculado no servidor). */
export type ServerAuditEntry = AuditEntry & {
  id: string;
  seq: number;
  projectId: string;
  action: string;
  hash: string;
  prevHash: string;
};

export type AuditAction = "preco" | "despesa" | "progresso";
export const MIN_JUSTIFICATION = 10;

let rows: ServerAuditEntry[] = [];
let snapshot = { rows, v: 0 };
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = { rows, v: snapshot.v + 1 };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

const stamp = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const map = (r: any): ServerAuditEntry => ({
  id: r.id,
  seq: Number(r.seq),
  projectId: r.project_id,
  action: r.action,
  hash: r.hash,
  prevHash: r.prev_hash,
  dt: stamp(r.created_at),
  user: r.user_email || String(r.user_id).slice(0, 8),
  item: r.entity,
  from: r.old_value,
  to: r.new_value,
  delta: Number(r.delta ?? 0),
  just: r.justification,
});

/** Carrega o Audit Log (de um projecto, ou de todos os projectos visíveis). */
export async function loadAudit(projectId?: string) {
  let q = supabase.from("audit_log").select("*").order("seq", { ascending: false }).limit(2000);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) return;
  const fresh = (data ?? []).map(map);
  const keep = projectId ? rows.filter((r) => r.projectId !== projectId) : [];
  rows = [...fresh, ...keep].sort((a, b) => b.seq - a.seq);
  emit();
}

export function useServerAudit(projectId?: string): ServerAuditEntry[] {
  const snap = useSyncExternalStore(subscribe, () => snapshot);
  useEffect(() => {
    void loadAudit(projectId);
  }, [projectId]);
  return projectId ? snap.rows.filter((r) => r.projectId === projectId) : snap.rows;
}

/**
 * Regista uma acção no Audit Log. A base de dados calcula o hash em cadeia e
 * rejeita justificações com menos de 10 caracteres. Devolve a mensagem de erro, ou null.
 */
export async function recordAudit(input: {
  projectId: string;
  action: AuditAction;
  entity: string;
  oldValue: string;
  newValue: string;
  justification: string;
  delta?: number;
}): Promise<string | null> {
  if (input.justification.trim().length < MIN_JUSTIFICATION)
    return `Justificação obrigatória (mínimo ${MIN_JUSTIFICATION} caracteres).`;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "Sessão expirada — inicie sessão novamente.";
  const { data, error } = await supabase
    .from("audit_log")
    .insert({
      project_id: input.projectId,
      user_id: auth.user.id,
      user_email: auth.user.email ?? "",
      action: input.action,
      entity: input.entity,
      old_value: input.oldValue,
      new_value: input.newValue,
      justification: input.justification.trim(),
      delta: input.delta ?? 0,
    })
    .select("*")
    .single();
  if (error) return error.message;
  rows = [map(data), ...rows];
  emit();
  return null;
}

/** Recalcula a cadeia de hashes no servidor. */
export async function verifyAuditChain(projectId: string): Promise<{ intact: boolean; message: string }> {
  const { data, error } = await supabase.rpc("verify_audit_chain", { _project_id: projectId });
  if (error) return { intact: false, message: `Erro ao verificar: ${error.message}` };
  const r = (Array.isArray(data) ? data[0] : data) as { intact: boolean; message: string } | undefined;
  return r ?? { intact: true, message: "íntegro (0 entradas)" };
}

/** Tenta apagar uma entrada — usado só para demonstrar que a base de dados recusa. */
export async function tryDeleteAudit(id: string): Promise<string> {
  const { error, count } = await supabase.from("audit_log").delete({ count: "exact" }).eq("id", id);
  if (error) return `Recusado pela base de dados: ${error.message}`;
  return count ? "Apagado (inesperado!)" : "Recusado pela base de dados: nenhuma linha pode ser apagada (sem permissão).";
}
