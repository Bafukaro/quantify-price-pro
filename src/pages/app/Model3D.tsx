import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import BuildingModel, { PhaseKey, PHASE_COLORS } from "@/components/three/BuildingModel";
import UploadedModel from "@/components/three/UploadedModel";
import { phase3DInfo, fmtMT, type Phase3D } from "@/data/mock";
import { Box, Eye, EyeOff, RotateCcw, Layers, Upload } from "lucide-react";

const ALL: Phase3D[] = ["fundacao", "pilares", "lajes", "alvenaria", "cobertura", "acabamentos"];

export default function Model3D() {
  const [selected, setSelected] = useState<PhaseKey | null>(null);
  const [visible, setVisible] = useState<Set<Phase3D>>(new Set(ALL));
  const [uploaded, setUploaded] = useState<{ url: string; ext: "gltf" | "glb" | "obj"; name: string } | null>(null);
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

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const lower = f.name.toLowerCase();
    let ext: "gltf" | "glb" | "obj" | null = null;
    if (lower.endsWith(".glb")) ext = "glb";
    else if (lower.endsWith(".gltf")) ext = "gltf";
    else if (lower.endsWith(".obj")) ext = "obj";
    if (!ext) {
      alert("Formato não suportado. Use .gltf, .glb ou .obj");
      return;
    }
    if (uploaded) URL.revokeObjectURL(uploaded.url);
    const url = URL.createObjectURL(f);
    setUploaded({ url, ext, name: f.name });
    setSelected(null);
    setVisible(new Set(ALL));
  };

  const info = selected ? phase3DInfo[selected] : null;
  const total = info ? info.items.reduce((a, i) => a + i.qty * i.preco, 0) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-xl bg-surface-elevated border border-border shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Modelo 3D · {uploaded ? `Carregado: ${uploaded.name}` : "Demonstração procedural (carregue .gltf / .obj)"}
            </div>
            <h2 className="font-display text-3xl mt-1">remake_house_dr_mendes</h2>
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
              accept=".gltf,.glb,.obj"
              onChange={onFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
            >
              <Upload className="size-4" /> Importar modelo 3D (.gltf / .obj)
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Canvas */}
        <div className="rounded-xl bg-surface-elevated border border-border shadow-soft overflow-hidden">
          <div className="h-[560px] bg-gradient-to-b from-[hsl(220_30%_94%)] to-[hsl(220_25%_88%)]">
            <Canvas shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[18, 14, 22]} fov={42} />
              <ambientLight intensity={0.55} />
              <directionalLight
                position={[12, 18, 8]}
                intensity={1.1}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <Suspense fallback={null}>
                {uploaded ? (
                  <UploadedModel
                    url={uploaded.url}
                    ext={uploaded.ext}
                    selected={selected}
                    visiblePhases={visible}
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
                <Environment preset="city" />
              </Suspense>
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
            <span className="flex items-center gap-1.5"><Box className="size-3" /> 18 colunas · 3 pisos · 288 m²/piso</span>
            <span>·</span>
            <span>Geometria simplificada extraída do modelo Archicad</span>
          </div>
        </div>

        {/* Phase panel */}
        <aside className="space-y-3">
          <div className="rounded-xl bg-surface-elevated border border-border shadow-soft p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3" /> Fases construtivas
            </div>
            <div className="mt-3 space-y-1.5">
              {ALL.map((p) => {
                const phaseTotal = phase3DInfo[p].items.reduce((a, i) => a + i.qty * i.preco, 0);
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
                          {phase3DInfo[p].label}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {fmtMT(phaseTotal)}
                        </div>
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
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/60">Custo desta fase</div>
                <div className="font-display text-2xl text-warning">{fmtMT(total!)}</div>
              </div>
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
              {info.items.length} linhas · valores em MT
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
              {info.items.map((i) => (
                <tr key={i.item} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono">{i.item}</td>
                  <td className="px-4 py-2.5">{i.desc}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{i.un}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{i.qty.toLocaleString("pt-PT")}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{i.preco.toLocaleString("pt-PT")}</td>
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