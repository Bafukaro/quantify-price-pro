import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import BuildingModel, { PhaseKey, PHASE_COLORS } from "@/components/three/BuildingModel";
import UploadedModel, { type MeshInfo } from "@/components/three/UploadedModel";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import SafeEnvironment, { LocalLightRig } from "@/components/three/SafeEnvironment";
import { phase3DInfo, fmtMT, type Phase3D } from "@/data/mock";
import { setPriceCity } from "@/data/priceDb";
import { buildBoQSource } from "@/lib/boqSource";
import { exportPhaseExcel, exportPhasePDF } from "@/lib/exports";
import { exportRebarExcel, exportRebarPDF } from "@/lib/rebarExports";
import {
  useProjectModel,
  useProjectOverrides,
  useProjectMeshes,
  uploadProjectModel,
  setProjectModelMeshes,
  setProjectMeshOverride,
  useProjects,
  useProjectRebar,
} from "@/data/store";
import type { IfcWorkerMetrics } from "@/lib/ifcLoader";
import { Box, Eye, EyeOff, RotateCcw, Layers, Upload, AlertTriangle, Download, FileSpreadsheet, Activity, RefreshCw } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  init: "Arranque WASM",
  download: "Descarregar ficheiro",
  parse: "Interpretar IFC",
  geometry: "Extrair geometria",
  rebar: "Takeoff de armadura",
  merge: "Merge/optimização",
};

const fmtBytes = (b: number) =>
  b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

const ALL: Phase3D[] = ["fundacao", "pilares", "lajes", "alvenaria", "cobertura", "acabamentos"];

type Model3DProps = { projectId?: string };

export default function Model3D({ projectId: projectIdProp }: Model3DProps = {}) {
  const [params] = useSearchParams();
  const projects = useProjects();
  const projectId =
    projectIdProp ?? params.get("p") ?? params.get("projectId") ?? projects[0]?.id ?? "p-001";
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  // Preços resolvidos pela cidade do projecto (Maputo vs Lichinga).
  setPriceCity(project?.location);

  const uploaded = useProjectModel(projectId);
  const overrides = useProjectOverrides(projectId) as Record<string, PhaseKey>;
  const meshes = useProjectMeshes(projectId) as MeshInfo[];
  const rebar = useProjectRebar(projectId);

  const [selected, setSelected] = useState<PhaseKey | null>(null);
  const [visible, setVisible] = useState<Set<Phase3D>>(new Set(ALL));
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hdrEnabled, setHdrEnabled] = useState(false);
  const [sceneWarning, setSceneWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: string; elements: number } | null>(null);
  const [errorDetail, setErrorDetail] = useState<{ detail?: string; stage?: string } | null>(null);
  const [metrics, setMetrics] = useState<IfcWorkerMetrics | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [rotSteps, setRotSteps] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const retryLoad = () => {
    setLoadError(null);
    setErrorDetail(null);
    setMetrics(null);
    setProgress(null);
    setLoadState("loading");
    setReloadKey((k) => k + 1);
  };

  const togglePhase = (p: Phase3D) => {
    setVisible((prev) => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });
  };

  const focusPhase = (p: Phase3D) => {
    setSelected((prev) => (prev === p ? null : p));
    if (!visible.has(p)) {
      setVisible((v) => new Set(v).add(p));
    }
  };

  const reset = () => {
    setSelected(null);
    setVisible(new Set(ALL));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelected(null);
    setVisible(new Set(ALL));
    setLoadError(null);
    setErrorDetail(null);
    setMetrics(null);
    setLoadState("loading");
    setProgress(null);
    const err = await uploadProjectModel(projectId, f);
    if (err) {
      setLoadError(err);
      setLoadState("error");
    }
  };

  const ambiguous = useMemo(
    () => meshes.filter((m) => m.confidence < 0.6).slice(0, 30),
    [meshes]
  );

  // === Fonte única: quantidades reais extraídas da malha (ou caso de estudo) ===
  const boq = useMemo(
    () => buildBoQSource({ location: project?.location, meshes, overrides, rebar }),
    [project?.location, meshes, overrides, rebar]
  );
  const hasReal = boq.hasReal;
  const extraction = { elementsTotal: boq.elementsTotal, invalidTotal: boq.invalidTotal };
  const phaseData = boq.sections;

  const info = selected ? phaseData[selected] : null;
  const total = info ? info.total : null;
  const counts = useMemo(() => {
    const c: Record<PhaseKey, number> = { fundacao: 0, pilares: 0, lajes: 0, alvenaria: 0, cobertura: 0, acabamentos: 0 };
    meshes.forEach((m) => { c[overrides[m.id] ?? m.phase]++; });
    return c;
  }, [meshes, overrides]);

  // Derive header stats from real data (loaded meshes when available, else project mock).
  const modelTitle = uploaded?.name?.replace(/\.[^.]+$/, "") ?? project?.name ?? "Modelo do projecto";
  const elementCount = meshes.length;
  const columnCount = counts.pilares;
  const slabCount = counts.lajes;
  const totalMeta = uploaded
    ? `${elementCount} elementos${columnCount ? ` · ${columnCount} pilares` : ""}${
        slabCount ? ` · ${slabCount} lajes` : ""
      }`
    : project?.phase
    ? `Sem modelo carregado · ${project.phase}`
    : "Sem modelo carregado";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Modelo 3D · Projecto {projectId}
              {uploaded ? ` · ${uploaded.name}` : " · Demonstração procedural (carregue .ifc / .gltf / .obj)"}
            </div>
            <h2 className="font-display text-3xl mt-1">{modelTitle}</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Clique numa fase para isolar e ver o custo. Use o rato para orbitar / zoom.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm hover:bg-muted"
            >
              <RotateCcw className="size-4" /> Repor vista
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".ifc,.gltf,.glb,.obj"
              onChange={onFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
            >
              <Upload className="size-4" /> Importar modelo 3D (.ifc / .gltf / .obj)
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Canvas */}
        <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
          <div className="h-[560px] bg-gradient-to-b from-[hsl(220_30%_94%)] to-[hsl(220_25%_88%)] relative">
            {uploaded && loadState === "loading" && (
              <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 rounded-md bg-background/80 backdrop-blur border border-border px-3 py-1.5 text-xs text-muted-foreground shadow-soft">
                <div className="size-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                {progress
                  ? `${
                      progress.stage === "download"
                        ? "A obter ficheiro"
                        : progress.stage === "parse"
                        ? "A interpretar IFC"
                        : progress.stage === "merge"
                        ? "A optimizar geometria"
                        : "A extrair geometria"
                    }${progress.elements ? ` · ${progress.elements} elementos` : ""}…`
                  : `A processar ${uploaded.name}…`}
              </div>
            )}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
              {uploaded && (
                <button
                  onClick={() => setRotSteps((s) => (s + 1) % 4)}
                  className="rounded-md border border-border bg-background/80 text-muted-foreground px-2.5 py-1.5 text-[11px] font-medium backdrop-blur hover:bg-muted"
                  title="Corrigir orientação (rodar 90° no eixo X)"
                >
                  Orientação: {rotSteps * 90}°
                </button>
              )}
              <button
                onClick={() => setHdrEnabled((v) => !v)}
                className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition ${
                  hdrEnabled
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/80 text-muted-foreground border-border hover:bg-muted"
                }`}
                title="Ambiente HDR remoto (opcional, requer rede)"
              >
                HDR remoto: {hdrEnabled ? "ligado" : "desligado"}
              </button>
              {sceneWarning && (
                <span className="rounded-md bg-background/80 backdrop-blur border border-border px-2 py-1 text-[10px] text-muted-foreground max-w-[220px] text-right">
                  Ambiente HDR indisponível — luz local activa.
                </span>
              )}
            </div>
            {loadState === "error" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-background/85 p-6">
                <div className="max-w-md text-center space-y-3">
                  <AlertTriangle className="size-8 text-destructive mx-auto" />
                  <div className="font-medium">Não foi possível abrir o modelo</div>
                  <div className="text-xs text-muted-foreground">{loadError}</div>
                  {errorDetail?.stage && (
                    <div className="text-[11px] text-muted-foreground">
                      Etapa que falhou:{" "}
                      <span className="font-mono">
                        {STAGE_LABELS[errorDetail.stage] ?? errorDetail.stage}
                      </span>
                    </div>
                  )}
                  {errorDetail?.detail && (
                    <pre className="text-left text-[10px] font-mono bg-muted/60 border border-border rounded-md p-2 max-h-24 overflow-auto whitespace-pre-wrap">
                      {errorDetail.detail}
                    </pre>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={retryLoad}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90"
                    >
                      <RefreshCw className="size-3.5" /> Tentar novamente
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-xs hover:bg-muted"
                    >
                      <Upload className="size-3.5" /> Escolher outro ficheiro
                    </button>
                  </div>
                </div>
              </div>
            )}
            <Canvas shadows={!uploaded} dpr={uploaded ? [1, 1.5] : [1, 2]}>
              <PerspectiveCamera makeDefault position={[18, 14, 22]} fov={42} />
              <LocalLightRig />
              <SafeEnvironment
                enabled={hdrEnabled}
                onError={(m) => setSceneWarning(m)}
              />
              <SceneErrorBoundary onError={(m) => setSceneWarning(m)}>
              <Suspense fallback={null}>
                {uploaded ? (
                  <UploadedModel
                    url={uploaded.url}
                    ext={uploaded.ext}
                    selected={selected}
                    visiblePhases={visible}
                    overrides={overrides}
                    rotationX={(rotSteps * Math.PI) / 2}
                    reloadKey={reloadKey}
                    onProgress={(p) => setProgress(p)}
                    onMetrics={(m) => setMetrics(m)}
                    onLoaded={(m, rb) => {
                      setProjectModelMeshes(projectId, m, rb);
                      setProgress(null);
                      if (m.length === 0) {
                        setLoadError("Modelo carregado mas sem geometria (0 meshes).");
                        setLoadState("error");
                      } else {
                        setLoadState("ready");
                      }
                    }}
                    onError={(msg, detail, stage) => {
                      setLoadError(msg);
                      setErrorDetail({ detail, stage });
                      setLoadState("error");
                    }}
                    onSelect={(p) => focusPhase(p)}
                  />
                ) : (
                  <BuildingModel
                    selected={selected}
                    onSelect={(p) => focusPhase(p)}
                    visiblePhases={visible}
                  />
                )}
                {!uploaded && (
                  <ContactShadows position={[0, -0.79, 0]} opacity={0.35} blur={2.5} far={20} />
                )}
              </Suspense>
              </SceneErrorBoundary>
              <OrbitControls
                enablePan
                target={[0, 4, 0]}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={10}
                maxDistance={50}
              />
            </Canvas>
          </div>
          <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Box className="size-3" /> {totalMeta}</span>
            {uploaded && (
              <>
                <span>·</span>
                <span>Classificação automática por metadados IFC / geometria</span>
              </>
            )}
          </div>
        </div>

        {/* Phase panel */}
        <aside className="space-y-3">
          <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3" /> Fases construtivas
            </div>
            <div className="mt-2 text-[10px] leading-snug">
              {hasReal ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 text-success px-2 py-0.5">
                  Quantidades extraídas do ficheiro ({extraction.elementsTotal} elementos)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 text-warning px-2 py-0.5">
                  Sem modelo carregado — valores de caso de estudo
                </span>
              )}
              {hasReal && extraction.invalidTotal > 0 && (
                <div className="mt-1.5 text-warning">
                  Quantidade não determinada para {extraction.invalidTotal} elementos (geometria inválida).
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              {ALL.map((p) => {
                const pd = phaseData[p];
                const phaseTotal = pd.total;
                const isSel = selected === p;
                const isVis = visible.has(p);
                return (
                  <div
                    key={p}
                    className={`group flex items-center gap-2 rounded-md border transition ${
                      isSel ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <button
                      onClick={() => focusPhase(p)}
                      className="flex-1 flex items-center gap-2.5 p-2.5 text-left"
                    >
                      <span
                        className="size-3 rounded-sm shrink-0"
                        style={{ background: PHASE_COLORS[p] }}
                      />
                      <span className="flex-1">
                        <div className="text-sm font-medium leading-tight">
                          {pd.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {fmtMT(phaseTotal)}
                        </div>
                        {hasReal && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {pd.volumeM3 > 0 ? `${pd.volumeM3.toFixed(2)} m³` : "— m³"} ·{" "}
                            {pd.areaM2 > 0 ? `${pd.areaM2.toFixed(1)} m²` : "— m²"} · {pd.elements} el.
                          </div>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => togglePhase(p)}
                      className="p-2 mr-1 rounded hover:bg-muted text-muted-foreground"
                      title={isVis ? "Ocultar" : "Mostrar"}
                    >
                      {isVis ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected phase detail */}
          {metrics && (
            <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
                <Activity className="size-3" /> Métricas do worker IFC
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div><div className="text-[9px] uppercase text-muted-foreground">Ficheiro</div>{fmtBytes(metrics.fileBytes)}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Tempo total</div>{(metrics.totalMs / 1000).toFixed(2)} s</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Elementos</div>{metrics.elements}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Classes IFC</div>{metrics.classes}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Vértices</div>{metrics.vertices.toLocaleString("pt-PT")}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Triângulos</div>{metrics.triangles.toLocaleString("pt-PT")}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Buffers transferidos</div>{fmtBytes(metrics.transferBytes)}</div>
                <div><div className="text-[9px] uppercase text-muted-foreground">Geometria inválida</div>{metrics.invalid}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Tempo por etapa</div>
                {metrics.stages.map((s) => {
                  const pct = Math.min(100, (s.ms / Math.max(metrics.totalMs, 1)) * 100);
                  return (
                    <div key={s.stage} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span>{STAGE_LABELS[s.stage] ?? s.stage}</span>
                        <span className="font-mono text-muted-foreground">
                          {s.ms >= 1000 ? `${(s.ms / 1000).toFixed(2)} s` : `${s.ms.toFixed(0)} ms`}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {info && (
            <div className="rounded-xl bg-primary text-primary-foreground shadow-elegant p-5 animate-fade-in">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                Fase seleccionada
              </div>
              <div className="font-display text-xl mt-1">{info.label}</div>
              <div className="text-xs text-white/70 mt-1">{info.desc}</div>
              {hasReal && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono text-white/80">
                  <div><div className="text-white/50 text-[9px] uppercase">Volume</div>{info.volumeM3.toFixed(2)} m³</div>
                  <div><div className="text-white/50 text-[9px] uppercase">Área</div>{info.areaM2.toFixed(1)} m²</div>
                  <div><div className="text-white/50 text-[9px] uppercase">Elementos</div>{info.elements}</div>
                </div>
              )}
              {hasReal && info.invalid > 0 && (
                <div className="mt-2 text-[11px] text-warning">
                  Quantidade não determinada para {info.invalid} elementos.
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/60">
                  Custo desta fase {hasReal ? "· quantidade real × preço da base" : "· caso de estudo"}
                </div>
                <div className="font-display text-2xl text-warning">{fmtMT(total!)}</div>
              </div>
            </div>
          )}

          {uploaded && meshes.length > 0 && (
            <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Classificação automática
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                {ALL.map((p) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: PHASE_COLORS[p] }} />
                    <span className="text-muted-foreground">{phaseData[p].label}:</span>
                    <span className="font-mono">{counts[p]}</span>
                  </div>
                ))}
              </div>
              {ambiguous.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="size-3" />
                    {ambiguous.length} elementos ambíguos — ajuste manual:
                  </div>
                  <div className="mt-2 max-h-56 overflow-auto space-y-1.5">
                    {ambiguous.map((m) => {
                      const cur = overrides[m.id] ?? m.phase;
                      return (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <div className="flex-1 truncate" title={`${m.name} · ${m.reason} · conf ${(m.confidence * 100).toFixed(0)}%`}>
                            <div className="truncate font-mono">{m.name}</div>
                            <div className="text-[10px] text-muted-foreground">{m.reason} · {(m.confidence * 100).toFixed(0)}%</div>
                          </div>
                          <select
                            value={cur}
                            onChange={(e) =>
                              setProjectMeshOverride(projectId, m.id, e.target.value as PhaseKey)
                            }
                            className="text-xs border border-border rounded px-1.5 py-1 bg-background"
                          >
                            {ALL.map((p) => (
                              <option key={p} value={p}>{phaseData[p].label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Armadura — takeoff real (IfcReinforcingBar) ou estimativa por rácio */}
          {hasReal && (
            <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Armadura (aço)
              </div>
              {rebar ? (
                <>
                  <div className="mt-2 text-[10px]">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 text-success px-2 py-0.5">
                      Extraída do ficheiro — IfcReinforcingBar
                    </span>
                  </div>
                  <table className="mt-3 w-full text-xs">
                    <thead className="text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="text-left py-1">Ø</th>
                        <th className="text-right py-1">Varões</th>
                        <th className="text-right py-1">Compr.</th>
                        <th className="text-right py-1">Massa</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {rebar.byDiameter.map((r) => (
                        <tr key={r.diameterMm} className="border-t border-border">
                          <td className="py-1">Ø{r.diameterMm}</td>
                          <td className="py-1 text-right">{r.bars.toLocaleString("pt-PT")}</td>
                          <td className="py-1 text-right">{r.lengthM.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} m</td>
                          <td className="py-1 text-right">{r.massKg.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} kg</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-accent/30">
                        <td className="py-1.5 font-medium">Total</td>
                        <td className="py-1.5 text-right">{rebar.totalBars.toLocaleString("pt-PT")}</td>
                        <td className="py-1.5 text-right">{rebar.totalLengthM.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} m</td>
                        <td className="py-1.5 text-right text-accent">{rebar.totalMassKg.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} kg</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        exportRebarExcel(project?.name ?? "Projecto", rebar, selected ? phaseData[selected].label : undefined)
                      }
                      className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 rounded-md text-[11px] hover:bg-muted"
                    >
                      <FileSpreadsheet className="size-3.5" /> Armadura (Excel)
                    </button>
                    <button
                      onClick={() =>
                        exportRebarPDF(project?.name ?? "Projecto", rebar, selected ? phaseData[selected].label : undefined)
                      }
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md text-[11px] font-medium hover:opacity-90"
                    >
                      <Download className="size-3.5" /> Armadura (PDF)
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2 text-[11px] leading-snug">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 text-warning px-2 py-0.5 text-[10px]">
                    Estimativa por rácio
                  </span>
                  <div className="mt-1.5 text-muted-foreground">
                    O ficheiro não contém armadura modelada (IfcReinforcingBar). As quantidades de
                    aço são estimadas por rácio kg/m³ de betão, por fase — não são extracção directa.
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* BoQ for selected phase */}
      {info && (
        <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="text-sm font-medium">
              Decomposição — <span className="text-accent">{info.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">
                {info.lines.length} linhas · valores em MT
              </span>
              <button
                onClick={() => exportPhaseExcel(project?.name ?? "Projecto", boq, selected!)}
                className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 rounded-md text-xs hover:bg-muted"
              >
                <FileSpreadsheet className="size-3.5" /> Exportar esta fase (Excel)
              </button>
              <button
                onClick={() => exportPhasePDF(project?.name ?? "Projecto", boq, selected!)}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md text-xs font-medium hover:opacity-90"
              >
                <Download className="size-3.5" /> Exportar esta fase (PDF)
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Item</th>
                <th className="px-4 py-2.5 text-left">Descrição</th>
                <th className="px-4 py-2.5 text-right">Un</th>
                <th className="px-4 py-2.5 text-right">Qtd</th>
                <th className="px-4 py-2.5 text-right">P.U.</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {info.lines.map((i) => (
                <tr key={i.item} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono">{i.item}</td>
                  <td className="px-4 py-2.5">
                    {i.desc}
                    {i.isSteel && (
                      <div className={`text-[10px] ${rebar ? "text-success" : "text-warning"}`}>
                        {rebar
                          ? "armadura modelada disponível no ficheiro — ver desagregação por diâmetro"
                          : "estimativa por rácio (sem armadura modelada no ficheiro)"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{i.un}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {i.qty.toLocaleString("pt-PT", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {i.priced ? i.preco.toLocaleString("pt-PT") : <span className="text-warning">sem preço</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">
                    {(i.qty * i.preco).toLocaleString("pt-PT")}
                  </td>
                </tr>
              ))}
              <tr className="bg-accent/5 border-t-2 border-accent/30">
                <td colSpan={5} className="px-4 py-3 text-right font-medium">Total da fase</td>
                <td className="px-4 py-3 text-right font-display text-lg text-accent">
                  {fmtMT(total!)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!info && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Seleccione uma fase no modelo 3D ou no painel lateral para ver os quantitativos e custos.
        </div>
      )}
    </div>
  );
}