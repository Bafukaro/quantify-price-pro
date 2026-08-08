import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { loadIFC } from "@/lib/ifcLoader";
import { buildOptimizedScene, disposeScene } from "@/lib/optimizeScene";
import type { PhaseKey } from "@/components/three/BuildingModel";
import { useProjectModel, useProjectOverrides, useProjects } from "@/data/store";
import { Activity, Gauge, Play, Layers } from "lucide-react";

type Sample = { fps: number; frameMs: number; drawCalls: number; triangles: number; objects: number };
type Mode = "raw" | "optimized";

const SAMPLE_MS = 3000;

/** Roda a cena e amostra gl.info durante SAMPLE_MS, devolvendo médias. */
function Probe({ running, onDone }: { running: boolean; onDone: (s: Sample) => void }) {
  const { gl, scene } = useThree();
  const acc = useRef({ t0: 0, frames: 0, calls: 0, tris: 0 });

  useEffect(() => {
    if (running) acc.current = { t0: performance.now(), frames: 0, calls: 0, tris: 0 };
  }, [running]);

  useFrame(() => {
    scene.rotation.y += 0.01; // carga constante para medir render real
    if (!running) return;
    const a = acc.current;
    a.frames += 1;
    a.calls += gl.info.render.calls;
    a.tris += gl.info.render.triangles;
    const elapsed = performance.now() - a.t0;
    if (elapsed >= SAMPLE_MS && a.frames > 0) {
      let objects = 0;
      scene.traverse((o: any) => {
        if (o.isMesh || o.isInstancedMesh) objects += 1;
      });
      onDone({
        fps: (a.frames / elapsed) * 1000,
        frameMs: elapsed / a.frames,
        drawCalls: a.calls / a.frames,
        triangles: a.tris / a.frames,
        objects,
      });
    }
  });
  return null;
}

function Bench({
  root,
  mode,
  running,
  onDone,
}: {
  root: THREE.Object3D;
  mode: Mode;
  running: boolean;
  onDone: (s: Sample) => void;
}) {
  const overrides = {} as Record<string, PhaseKey>;
  const object = useMemo(() => {
    if (mode === "raw") return root;
    return buildOptimizedScene(root, (mesh) => {
      const base = (mesh.userData as any).phase as PhaseKey;
      return overrides[(mesh.userData as any).meshId] ?? base ?? "acabamentos";
    }).group;
  }, [root, mode]);

  useEffect(() => {
    return () => {
      if (mode === "optimized") disposeScene(object);
    };
  }, [object, mode]);

  return (
    <>
      <hemisphereLight args={["#ffffff", "#8a8f98", 2.2]} />
      <directionalLight position={[8, 14, 8]} intensity={1.1} />
      <primitive object={object} />
      <Probe running={running} onDone={onDone} />
    </>
  );
}

const fmt = (v: number, d = 1) => v.toLocaleString("pt-PT", { maximumFractionDigits: d });

function Delta({ before, after, lowerIsBetter }: { before: number; after: number; lowerIsBetter: boolean }) {
  if (!before) return <span className="text-muted-foreground">—</span>;
  const pct = ((after - before) / before) * 100;
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  return (
    <span className={good ? "text-success" : pct === 0 ? "text-muted-foreground" : "text-warning"}>
      {pct > 0 ? "+" : ""}
      {fmt(pct)}%
    </span>
  );
}

export default function Diagnostics() {
  const [params] = useSearchParams();
  const projects = useProjects();
  const projectId = params.get("p") ?? projects[0]?.id ?? "p-001";
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const uploaded = useProjectModel(projectId);

  const [root, setRoot] = useState<THREE.Object3D | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("raw");
  const [running, setRunning] = useState(false);
  const [queue, setQueue] = useState<Mode[]>([]);
  const [raw, setRaw] = useState<Sample | null>(null);
  const [opt, setOpt] = useState<Sample | null>(null);

  useEffect(() => {
    let active = true;
    setRoot(null);
    setRaw(null);
    setOpt(null);
    setLoadErr(null);
    if (!uploaded) return;
    const { url, ext } = uploaded;
    (async () => {
      try {
        if (ext === "ifc") {
          const g = await loadIFC(url);
          if (active) setRoot(g);
        } else if (ext === "obj") {
          const o = await new OBJLoader().loadAsync(url);
          if (active) setRoot(o);
        } else {
          const g = await new GLTFLoader().loadAsync(url);
          if (active) setRoot(g.scene);
        }
      } catch (e: any) {
        if (active) setLoadErr(e?.message ?? "Falha ao carregar o modelo.");
      }
    })();
    return () => {
      active = false;
    };
  }, [uploaded?.url, uploaded?.ext]);

  const meshCount = useMemo(() => {
    if (!root) return 0;
    let c = 0;
    root.traverse((o: any) => {
      if (o.isMesh) c += 1;
    });
    return c;
  }, [root]);

  const onDone = useCallback(
    (s: Sample) => {
      if (mode === "raw") setRaw(s);
      else setOpt(s);
      setRunning(false);
      setQueue((q) => {
        const [next, ...rest] = q;
        if (next) {
          setMode(next);
          setTimeout(() => setRunning(true), 400);
        }
        return rest;
      });
    },
    [mode]
  );

  const runAll = () => {
    setRaw(null);
    setOpt(null);
    setMode("raw");
    setQueue(["optimized"]);
    setTimeout(() => setRunning(true), 300);
  };

  const metrics: { label: string; get: (s: Sample) => number; d: number; lower: boolean }[] = [
    { label: "FPS médio", get: (s) => s.fps, d: 1, lower: false },
    { label: "Tempo de render / frame (ms)", get: (s) => s.frameMs, d: 2, lower: true },
    { label: "Draw calls por frame", get: (s) => s.drawCalls, d: 0, lower: true },
    { label: "Objectos renderizáveis na cena", get: (s) => s.objects, d: 0, lower: true },
    { label: "Triângulos por frame", get: (s) => s.triangles, d: 0, lower: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Diagnóstico de desempenho · Projecto {projectId}
            </div>
            <h2 className="font-display text-3xl mt-1">Render 3D — antes vs depois</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Mede FPS, draw calls e tempo de render do modelo de {project?.name ?? "—"} sem optimização
              (um mesh por elemento) e com optimização (merge por fase + instancing).
            </div>
          </div>
          <button
            onClick={runAll}
            disabled={!root || running || queue.length > 0}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Play className="size-4" /> {running ? "A medir…" : "Correr benchmark"}
          </button>
        </div>
      </div>

      {!uploaded && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Carregue um modelo 3D (.ifc / .gltf / .obj) no projecto para medir o desempenho real.
        </div>
      )}
      {loadErr && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {loadErr}
        </div>
      )}

      {uploaded && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/30 text-xs">
              <span className="inline-flex items-center gap-2">
                <Activity className="size-3.5" />
                Modo actual: <strong>{mode === "raw" ? "Sem optimização" : "Optimizado"}</strong>
              </span>
              <span className="text-muted-foreground">{meshCount} meshes de origem</span>
            </div>
            <div className="h-[420px] bg-gradient-to-b from-[hsl(220_30%_94%)] to-[hsl(220_25%_88%)]">
              {root ? (
                <Canvas camera={{ position: [14, 10, 14], fov: 45 }} dpr={1} shadows={false}>
                  <Bench root={root} mode={mode} running={running} onDone={onDone} />
                </Canvas>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  A carregar {uploaded.name}…
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-2">
                <Gauge className="size-3.5" /> Resultados ({SAMPLE_MS / 1000}s por modo)
              </div>
              <table className="mt-3 w-full text-xs">
                <thead className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="text-left py-1">Métrica</th>
                    <th className="text-right py-1">Antes</th>
                    <th className="text-right py-1">Depois</th>
                    <th className="text-right py-1">Δ</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {metrics.map((m) => (
                    <tr key={m.label} className="border-t border-border">
                      <td className="py-1.5 font-sans pr-2">{m.label}</td>
                      <td className="py-1.5 text-right">{raw ? fmt(m.get(raw), m.d) : "—"}</td>
                      <td className="py-1.5 text-right">{opt ? fmt(m.get(opt), m.d) : "—"}</td>
                      <td className="py-1.5 text-right">
                        {raw && opt ? (
                          <Delta before={m.get(raw)} after={m.get(opt)} lowerIsBetter={m.lower} />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!raw && !running && (
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Clique em “Correr benchmark” — mede primeiro sem optimização, depois optimizado.
                </div>
              )}
            </div>

            <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-2">
                <Layers className="size-3.5" /> Método
              </div>
              <ul className="mt-2 space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
                <li>Cena em rotação contínua para forçar render em todos os frames.</li>
                <li>FPS e tempo de frame medidos pelo relógio do browser durante {SAMPLE_MS / 1000}s.</li>
                <li>Draw calls e triângulos lidos de <span className="font-mono">renderer.info.render</span>.</li>
                <li>Optimizado = merge de geometria por fase + InstancedMesh para repetições.</li>
                <li>Valores dependem da máquina — compare sempre antes vs depois na mesma sessão.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}