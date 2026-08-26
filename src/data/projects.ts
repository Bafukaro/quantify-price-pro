import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PhaseKey } from "@/components/three/BuildingModel";
import { aggregateByPhase, phaseTotal, PHASES } from "@/lib/phaseQuantities";
import { setPriceCity } from "@/data/priceDb";
import type { RebarTakeoff } from "@/lib/rebar";
import type { ElementGroup } from "@/workers/ifcWorker";

export type ModelExt = "gltf" | "glb" | "obj" | "ifc";

export type StoredMeshInfo = {
  id: string;
  name: string;
  phase: PhaseKey;
  confidence: number;
  reason: string;
  volumeM3?: number;
  areaM2?: number;
  elementCount?: number;
  valid?: boolean;
};

export type ProjectPhase = { name: string; pct: number };

/** Substituição manual de um preço do BoQ (persistida em projects.price_overrides). */
export type PriceOverride = {
  price: number;
  original: number;
  by: string;
  at: string;
  reason: string;
  supplier: string;
  note?: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
  structureType: string | null;
  phase: string;
  totalMT: number;
  spentPct: number;
  alerts: number;
  phases: ProjectPhase[];
  updatedAt: string;
  model: { path: string; name: string; ext: ModelExt; size: number } | null;
  meshes: StoredMeshInfo[];
  overrides: Record<string, PhaseKey>;
  quantities: Record<string, unknown> | null;
  priceOverrides: Record<string, PriceOverride>;
};

export type ProjectModelState = {
  url: string;
  ext: ModelExt;
  name: string;
  size: number;
  meshes: StoredMeshInfo[];
};

const DEFAULT_PHASES: ProjectPhase[] = [
  { name: "Preliminares", pct: 0 },
  { name: "Estrutura", pct: 0 },
  { name: "Alvenaria", pct: 0 },
  { name: "Instalações", pct: 0 },
  { name: "Acabamentos", pct: 0 },
  { name: "Exteriores", pct: 0 },
];

// ---------------- store plumbing ----------------
let projects: Project[] = [];
let loaded = false;
let loading = false;
const modelUrls = new Map<string, string>();
let snapshot = { projects, urls: modelUrls, loaded, v: 0 };
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = { projects, urls: modelUrls, loaded, v: snapshot.v + 1 };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const getSnapshot = () => snapshot;

function mapRow(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    client: r.client ?? "—",
    location: r.location ?? "—",
    structureType: r.structure_type ?? null,
    phase: r.phase ?? "Fase 0 — Preliminares",
    totalMT: Number(r.total_mt ?? 0),
    spentPct: Number(r.spent_pct ?? 0),
    alerts: Number(r.alerts ?? 0),
    // jsonb tem default '[]' — um array vazio deve cair nas fases padrão para
    // que TODOS os projectos tenham cronograma editável.
    phases: ((r.phases as ProjectPhase[])?.length ? (r.phases as ProjectPhase[]) : DEFAULT_PHASES),
    updatedAt: String(r.updated_at ?? "").slice(0, 10),
    model: r.model_path
      ? { path: r.model_path, name: r.model_name, ext: r.model_ext as ModelExt, size: Number(r.model_size ?? 0) }
      : null,
    meshes: (r.meshes as StoredMeshInfo[]) ?? [],
    overrides: (r.overrides as Record<string, PhaseKey>) ?? {},
    quantities: (r.quantities as Record<string, unknown>) ?? null,
    priceOverrides: (r.price_overrides as Record<string, PriceOverride>) ?? {},
  };
}

/** Valor total = quantidades reais extraídas × preços da Base de Preços (mesma fonte do ecrã). */
export function computeProjectTotals(p: {
  location: string;
  meshes: StoredMeshInfo[];
  overrides: Record<string, PhaseKey>;
}) {
  setPriceCity(p.location);
  const { byPhase, elementsTotal, invalidTotal } = aggregateByPhase(p.meshes as any, p.overrides);
  const byPhaseOut: Record<string, { volumeM3: number; areaM2: number; elements: number; total: number }> = {};
  let total = 0;
  for (const ph of PHASES) {
    const q = byPhase[ph];
    const t = phaseTotal(ph, q);
    total += t;
    byPhaseOut[ph] = { volumeM3: q.volumeM3, areaM2: q.areaM2, elements: q.elements, total: t };
  }
  return { total, quantities: { byPhase: byPhaseOut, elementsTotal, invalidTotal, computedAt: new Date().toISOString() } };
}

async function signModel(p: Project) {
  if (!p.model) return;
  if (modelUrls.get(p.id)?.startsWith("blob:")) return;
  const { data } = await supabase.storage.from("models").createSignedUrl(p.model.path, 60 * 60 * 8);
  if (data?.signedUrl) {
    modelUrls.set(p.id, data.signedUrl);
    emit();
  }
}

// ---------------- migração do localStorage ----------------
const LEGACY_KEY = "sqi.projects.v1";
const LEGACY_OVERRIDES_KEY = "sqi.modelOverrides.v1";

async function migrateLegacy(userId: string) {
  const flag = `sqi.migrated.${userId}`;
  if (typeof window === "undefined" || localStorage.getItem(flag)) return false;
  let legacy: any[] = [];
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
  } catch {
    legacy = [];
  }
  let overrides: Record<string, Record<string, PhaseKey>> = {};
  try {
    overrides = JSON.parse(localStorage.getItem(LEGACY_OVERRIDES_KEY) || "{}");
  } catch {
    overrides = {};
  }
  if (!Array.isArray(legacy) || legacy.length === 0) {
    localStorage.setItem(flag, "1");
    return false;
  }
  const rows = legacy.map((p) => ({
    owner_id: userId,
    legacy_id: String(p.id),
    name: p.name,
    client: p.client ?? "—",
    location: p.location ?? "—",
    phase: p.phase ?? "Fase 0 — Preliminares",
    total_mt: Number(p.totalMT ?? 0),
    spent_pct: Number(p.spentPct ?? 0),
    alerts: Number(p.alerts ?? 0),
    phases: p.phases?.length ? p.phases : DEFAULT_PHASES,
    overrides: overrides[p.id] ?? {},
  }));
  const { error } = await supabase.from("projects").upsert(rows as any, { onConflict: "owner_id,legacy_id" });
  if (error) {
    console.error("migração de projectos falhou", error);
    return false;
  }
  localStorage.setItem(flag, "1");
  return true;
}

export async function loadProjects(force = false) {
  if (loading || (loaded && !force)) return;
  loading = true;
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      projects = [];
      loaded = true;
      emit();
      return;
    }
    await migrateLegacy(auth.user.id);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    projects = (data ?? []).map(mapRow);
    loaded = true;
    emit();
    projects.forEach((p) => void signModel(p));
  } catch (e) {
    console.error("loadProjects", e);
    loaded = true;
    emit();
  } finally {
    loading = false;
  }
}

export function clearProjects() {
  projects = [];
  modelUrls.clear();
  loaded = false;
  emit();
}

export function useProjects() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!loaded && !loading) void loadProjects();
  return projects;
}

export function useProjectsLoaded() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return loaded;
}

export type NewProjectInput = {
  name: string;
  client: string;
  location: string;
  totalMT?: number;
  phase?: string;
  structureType?: string;
};

export async function addProject(input: NewProjectInput): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: auth.user.id,
      name: input.name,
      client: input.client || "—",
      location: input.location || "—",
      structure_type: input.structureType ?? null,
      phase: input.phase ?? "Fase 0 — Preliminares",
      total_mt: input.totalMT ?? 0,
      phases: DEFAULT_PHASES,
    } as any)
    .select("*")
    .single();
  if (error || !data) {
    console.error("addProject", error);
    return null;
  }
  projects = [mapRow(data), ...projects];
  emit();
  return data.id as string;
}

async function patchProject(id: string, patch: Record<string, unknown>, local: Partial<Project>) {
  projects = projects.map((p) => (p.id === id ? { ...p, ...local } : p));
  emit();
  const { error } = await supabase.from("projects").update(patch as any).eq("id", id);
  if (error) console.error("patchProject", error);
}

/** Carrega o ficheiro para o Storage e associa-o ao projecto (sobrevive a reload/dispositivo). */
export async function uploadProjectModel(projectId: string, file: File): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return "Sessão expirada.";
  const lower = file.name.toLowerCase();
  const ext = (["glb", "gltf", "obj", "ifc"] as ModelExt[]).find((e) => lower.endsWith("." + e));
  if (!ext) return "Formato não suportado. Use .ifc, .gltf, .glb ou .obj";
  if (file.size === 0) return "Ficheiro vazio (0 bytes).";

  const path = `${auth.user.id}/${projectId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const { error } = await supabase.storage.from("models").upload(path, file, { upsert: true });
  if (error) return `Falha ao guardar o ficheiro: ${error.message}`;

  // Vista imediata a partir do ficheiro local; a URL assinada assume depois do reload.
  modelUrls.set(projectId, URL.createObjectURL(file));
  await patchProject(
    projectId,
    { model_path: path, model_name: file.name, model_ext: ext, model_size: file.size, meshes: [], quantities: null },
    { model: { path, name: file.name, ext, size: file.size }, meshes: [], quantities: null }
  );
  return null;
}

export function useProjectModel(projectId: string): ProjectModelState | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const p = projects.find((x) => x.id === projectId);
  if (!p?.model) return null;
  const url = modelUrls.get(projectId);
  if (!url) return null;
  return { url, ext: p.model.ext, name: p.model.name, size: p.model.size, meshes: p.meshes };
}

/** True quando o projecto tem ficheiro guardado (mesmo antes da URL assinada chegar). */
export function useProjectHasModel(projectId: string) {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return !!projects.find((x) => x.id === projectId)?.model;
}

export function useProjectOverrides(projectId: string): Record<string, PhaseKey> {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return projects.find((x) => x.id === projectId)?.overrides ?? {};
}

export function useProjectMeshes(projectId: string): StoredMeshInfo[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return projects.find((x) => x.id === projectId)?.meshes ?? [];
}

async function persistQuantities(
  id: string,
  meshes: StoredMeshInfo[],
  overrides: Record<string, PhaseKey>,
  rebar?: RebarTakeoff | null,
  elementGroups?: ElementGroup[]
) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  const { total, quantities } = computeProjectTotals({ location: p.location, meshes, overrides });
  const keptRebar = rebar !== undefined ? rebar : ((p.quantities as any)?.rebar ?? null);
  const keptGroups =
    elementGroups !== undefined ? elementGroups : ((p.quantities as any)?.elementGroups ?? []);
  const q = { ...quantities, rebar: keptRebar, elementGroups: keptGroups };
  await patchProject(
    id,
    { meshes, overrides, quantities: q, total_mt: Math.round(total) },
    { meshes, overrides, quantities: q, totalMT: Math.round(total) }
  );
}

export function setProjectModelMeshes(
  projectId: string,
  meshes: StoredMeshInfo[],
  rebar: RebarTakeoff | null = null,
  elementGroups: ElementGroup[] = []
) {
  const p = projects.find((x) => x.id === projectId);
  if (!p) return;
  void persistQuantities(projectId, meshes, p.overrides, rebar, elementGroups);
}

/** Takeoff de armadura persistido (IfcReinforcingBar), quando o ficheiro o continha. */
export function useProjectRebar(projectId: string): RebarTakeoff | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const p = projects.find((x) => x.id === projectId);
  return ((p?.quantities as any)?.rebar as RebarTakeoff | null) ?? null;
}

/** Grupos de elementos IFC (dimensões reais) usados no BoQ detalhado. */
export function useProjectElementGroups(projectId: string): ElementGroup[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const p = projects.find((x) => x.id === projectId);
  return ((p?.quantities as any)?.elementGroups as ElementGroup[]) ?? [];
}

/** Quantidades agregadas por fase (byPhase) persistidas no projecto. */
export function useProjectQuantities(projectId: string): Record<string, { volumeM3: number; areaM2: number; elements: number }> | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const p = projects.find((x) => x.id === projectId);
  return ((p?.quantities as any)?.byPhase as Record<string, { volumeM3: number; areaM2: number; elements: number }>) ?? null;
}

// ---------------- preços editados manualmente no BoQ ----------------

export function useProjectPriceOverrides(projectId: string): Record<string, PriceOverride> {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return projects.find((x) => x.id === projectId)?.priceOverrides ?? {};
}

/** Guarda (ou remove, com null) a substituição manual de um preço do BoQ. */
export async function setProjectPriceOverride(
  projectId: string,
  key: string,
  ov: PriceOverride | null
) {
  const p = projects.find((x) => x.id === projectId);
  if (!p) return;
  const next = { ...p.priceOverrides };
  if (ov) next[key] = ov;
  else delete next[key];
  await patchProject(projectId, { price_overrides: next }, { priceOverrides: next });
}


/** Percentagem de execução declarada pelo utilizador para uma fase do projecto. */
export function setProjectPhasePct(projectId: string, phaseName: string, pct: number) {
  const p = projects.find((x) => x.id === projectId);
  if (!p) return;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const base = p.phases?.length ? p.phases : DEFAULT_PHASES;
  const phases = base.map((f) => (f.name === phaseName ? { ...f, pct: clamped } : f));
  const spentPct = Math.round(phases.reduce((a, f) => a + f.pct, 0) / (phases.length || 1));
  void patchProject(projectId, { phases, spent_pct: spentPct }, { phases, spentPct });
}

export function setProjectMeshOverride(projectId: string, meshId: string, phase: PhaseKey) {
  const p = projects.find((x) => x.id === projectId);
  if (!p) return;
  void persistQuantities(projectId, p.meshes, { ...p.overrides, [meshId]: phase });
}

export function clearProjectMeshOverrides(projectId: string) {
  const p = projects.find((x) => x.id === projectId);
  if (!p) return;
  void persistQuantities(projectId, p.meshes, {});
}

export async function removeProjectModel(projectId: string) {
  const p = projects.find((x) => x.id === projectId);
  if (!p?.model) return;
  await supabase.storage.from("models").remove([p.model.path]);
  modelUrls.delete(projectId);
  await patchProject(
    projectId,
    { model_path: null, model_name: null, model_ext: null, model_size: null, meshes: [], quantities: null, total_mt: 0 },
    { model: null, meshes: [], quantities: null, totalMT: 0 }
  );
}
