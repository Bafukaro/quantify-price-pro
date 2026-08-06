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
import {
  useProjectModel,
  useProjectOverrides,
  useProjectMeshes,
  uploadProjectModel,
  setProjectModelMeshes,
  setProjectMeshOverride,
  useProjects,
} from "@/data/store";
import { Box, Eye, EyeOff, RotateCcw, Layers, Upload, AlertTriangle, Download, FileSpreadsheet } from "lucide-react";

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

  const [selected, setSelected] = useState<PhaseKey | null>(null);
  const [visible, setVisible] = useState<Set<Phase3D>>(new Set(ALL));
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hdrEnabled, setHdrEnabled] = useState(false);
  const [sceneWarning, setSceneWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setLoadState("loading");
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
    () => buildBoQSource({ location: project?.location, meshes, overrides }),
    [project?.location, meshes, overrides]
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
                A processar {uploaded.name}…
              </div>
            )}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
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
                <div className="max-w-sm text-center space-y-3">
                  <AlertTriangle className="size-8 text-destructive mx-auto" />
                  <div className="font-medium">Não foi possível abrir o modelo</div>
                  <div className="text-xs text-muted-foreground">{loadError}</div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-xs hover:bg-muted"
                  >
                    <Upload className="size-3.5" /> Escolher outro ficheiro
                  </button>
                </div>
              </div>
            )}
            <Canvas shadows dpr={[1, 2]}>
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
                    onLoaded={(m) => {
                      setProjectModelMeshes(projectId, m);
                      if (m.length === 0) {
                        setLoadError("Modelo carregado mas sem geometria (0 meshes).");
                        setLoadState("error");
                      } else {
                        setLoadState("ready");
                      }
                    }}
                    onError={(msg) => {
                      setLoadError(msg);
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
                <ContactShadows position={[0, -0.79, 0]} opacity={0.35} blur={2.5} far={20} />
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
        </aside>
      </div>

      {/* BoQ for selected phase */}
      {info && (
        <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="text-sm font-medium">
              Decomposição — <span className="text-accent">{info.label}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {info.lines.length} linhas · valores em MT
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
                  <td className="px-4 py-2.5">{i.desc}</td>
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