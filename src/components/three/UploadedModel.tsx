import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { loadIFC, IfcLoadError, type IfcProgress, type IfcWorkerMetrics, type ElementGroup, type IfcElement } from "@/lib/ifcLoader";
import { computeMeshQuantity } from "@/lib/meshQuantities";
import { buildOptimizedScene, disposeScene } from "@/lib/optimizeScene";
import type { RebarTakeoff } from "@/lib/rebar";
import type { PhaseKey } from "./BuildingModel";
import { PHASE_COLORS } from "./BuildingModel";

export type Classification = { phase: PhaseKey; confidence: number; reason: string };

const NAME_RULES: { rx: RegExp; phase: PhaseKey; reason: string }[] = [
  // Regras IFC explícitas (antes de qualquer heurística): elementos ambíguos
  // que nunca devem cair no fallback.
  { rx: /pile|estaca/i, phase: "fundacao", reason: "ifc:pile→fundação" },
  {
    rx: /(fan|duct|damper|airterminal|cable|flowsegment|flowterminal|sanitaryterminal|valve|wiring|mep|hvac)/i,
    phase: "instalacoes",
    reason: "ifc:MEP→instalações",
  },
  { rx: /(found|footing|sapata|fundac|footer|base)/i, phase: "fundacao", reason: "nome→fundação" },
  { rx: /(column|pilar|coluna|post)/i, phase: "pilares", reason: "nome→pilar" },
  { rx: /(slab|floor|laje|deck|piso)/i, phase: "lajes", reason: "nome→laje" },
  { rx: /(wall|alven|parede|mason|brick|tijolo)/i, phase: "alvenaria", reason: "nome→parede" },
  { rx: /(roof|cober|telha|truss)/i, phase: "cobertura", reason: "nome→cobertura" },
  { rx: /(window|door|janela|porta|finish|acab|paint|tile|ceram)/i, phase: "acabamentos", reason: "nome→acabamento" },
];

function classifyByName(...names: string[]): Classification | null {
  const joined = names.filter(Boolean).join(" ");
  for (const r of NAME_RULES) {
    if (r.rx.test(joined)) return { phase: r.phase, confidence: 0.95, reason: r.reason };
  }
  return null;
}

function classifyByMetadata(userData: any): Classification | null {
  if (!userData || typeof userData !== "object") return null;
  // Common BIM exporters: IFC class, layer, category
  const candidates = [
    userData.IfcClass, userData.ifcClass, userData.ifc_type, userData.type,
    userData.category, userData.Category, userData.layer, userData.Layer,
  ].filter((x) => typeof x === "string");
  for (const c of candidates) {
    const hit = classifyByName(c);
    if (hit) return { phase: hit.phase, confidence: 0.98, reason: `meta:${c}` };
  }
  return null;
}

function classifyByGeometry(mesh: THREE.Mesh, modelBox: THREE.Box3): Classification {
  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const modelSize = new THREE.Vector3(); modelBox.getSize(modelSize);
  const minY = modelBox.min.y;
  const relY = (center.y - minY) / Math.max(modelSize.y, 0.001);
  const verticality = size.y / Math.max(size.x, size.z, 0.001);
  const flatness = Math.max(size.x, size.z) / Math.max(size.y, 0.001);

  // Roof: top portion + flat
  if (relY > 0.85) return { phase: "cobertura", confidence: 0.55, reason: "geom:topo" };
  // Foundation: bottom + flat-ish
  if (relY < 0.08) return { phase: "fundacao", confidence: 0.6, reason: "geom:base" };
  // Tall thin → column
  if (verticality > 2.5 && size.x < modelSize.x * 0.15 && size.z < modelSize.z * 0.15)
    return { phase: "pilares", confidence: 0.55, reason: "geom:vertical-fino" };
  // Wide flat horizontal → slab
  if (flatness > 4 && size.y < modelSize.y * 0.08)
    return { phase: "lajes", confidence: 0.5, reason: "geom:horiz-plano" };
  // Vertical extended panel → wall
  if (verticality > 1.2 && (size.x > modelSize.x * 0.3 || size.z > modelSize.z * 0.3))
    return { phase: "alvenaria", confidence: 0.45, reason: "geom:painel-vertical" };
  return { phase: "acabamentos", confidence: 0.2, reason: "fallback" };
}

export type MeshInfo = {
  id: string;
  name: string;
  phase: PhaseKey;
  confidence: number;
  reason: string;
  /** Volume real (m³) calculado a partir da malha, em unidades do ficheiro. */
  volumeM3: number;
  /** Área de superfície real (m²) calculada a partir da malha. */
  areaM2: number;
  /** Nº de elementos IFC representados (1 para GLTF/OBJ; N para malha fundida por classe). */
  elementCount: number;
  /** false quando a geometria não permite calcular volume/área. */
  valid: boolean;
};

export default function UploadedModel({
  url,
  ext,
  selected,
  visiblePhases,
  overrides,
  onSelect,
  onLoaded,
  onSelectElement,
  onSceneReady,
  highlightElement,
  onError,
  onProgress,
  onMetrics,
  reloadKey = 0,
  rotationX = 0,
}: {
  url: string;
  ext: "gltf" | "glb" | "obj" | "ifc";
  selected: PhaseKey | null;
  visiblePhases: Set<PhaseKey>;
  overrides: Record<string, PhaseKey>;
  onSelect: (p: PhaseKey) => void;
  onLoaded?: (
    meshes: MeshInfo[],
    rebar: RebarTakeoff | null,
    elementGroups: ElementGroup[],
    elementList: IfcElement[]
  ) => void;
  /** Chamado quando o clique identifica um elemento IFC individual. */
  onSelectElement?: (elementId: number | null, ifcClass: string | null) => void;
  /** Elemento individual a destacar com caixa de selecção. */
  highlightElement?: IfcElement | null;
  onError?: (msg: string, detail?: string, stage?: string) => void;
  onProgress?: (p: IfcProgress) => void;
  onMetrics?: (m: IfcWorkerMetrics) => void;
  /** Incrementar para forçar nova tentativa de carregamento. */
  reloadKey?: number;
  /** Correcção manual de orientação (radianos, eixo X). */
  rotationX?: number;
}) {
  const [root, setRoot] = useState<THREE.Object3D | null>(null);

  // Dispose helper: walk a Three.js subtree and free geometries + materials.
  const disposeSubtree = (obj: THREE.Object3D | null) => {
    if (!obj) return;
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose?.();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      mats.forEach((m) => {
        const sm = m as THREE.MeshStandardMaterial;
        // free any textures the material references
        (["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"] as const).forEach((k) => {
          const tex = (sm as any)[k];
          if (tex && typeof tex.dispose === "function") tex.dispose();
        });
        m.dispose?.();
      });
    });
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (ext === "obj") {
          const loader = new OBJLoader();
          loader.load(
            url,
            (obj) => active && setRoot(obj),
            undefined,
            (err) => active && onError?.(`Falha ao carregar OBJ: ${(err as any)?.message ?? "ficheiro inválido"}`)
          );
        } else if (ext === "ifc") {
          try {
            const grp = await loadIFC(
              url,
              (p) => active && onProgress?.(p),
              (m) => active && onMetrics?.(m)
            );
            if (active) setRoot(grp);
            else disposeSubtree(grp);
          } catch (err: any) {
            if (active) {
              const isIfc = err instanceof IfcLoadError;
              onError?.(
                err?.message ?? "Ficheiro IFC inválido",
                isIfc ? err.detail : undefined,
                isIfc ? err.stage : undefined
              );
            }
          }
        } else {
          const loader = new GLTFLoader();
          loader.load(
            url,
            (gltf) => active && setRoot(gltf.scene),
            undefined,
            (err) => active && onError?.(`Falha ao carregar ${ext.toUpperCase()}: ${(err as any)?.message ?? "ficheiro inválido"}`)
          );
        }
      } catch (e) {
        console.error("Model load failed", e);
        onError?.("Erro inesperado ao carregar o modelo.");
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [url, ext, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Whenever `root` is replaced OR the component unmounts, dispose the previous
  // scene tree. Without this, every re-upload / project switch leaks GPU
  // memory for the previous IFC model and eventually crashes the tab.
  useEffect(() => {
    return () => disposeSubtree(root);
  }, [root]);

  // Tag each mesh with a phase + center & scale model
  const { tagged, meshes, rebar, elementGroups, elementList, fit } = useMemo(() => {
    const meshes: MeshInfo[] = [];
    const rebar = ((root?.userData as any)?.rebar as RebarTakeoff | null) ?? null;
    const elementGroups = ((root?.userData as any)?.elementGroups as ElementGroup[]) ?? [];
    const elementList = ((root?.userData as any)?.elementList as IfcElement[]) ?? [];
    if (!root)
      return {
        tagged: null,
        meshes,
        rebar: null as RebarTakeoff | null,
        elementGroups: [] as ElementGroup[],
        elementList: [] as IfcElement[],
        fit: null as { scale: number; offset: THREE.Vector3 } | null,
      };

    // 1) Quantidades REAIS — calculadas nas unidades originais do ficheiro,
    //    antes de qualquer re-escala de visualização.
    root.updateMatrixWorld(true);
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      // IFC: quantidades já vêm calculadas do worker — não repetir na UI thread.
      if (!(mesh.userData as any).qty) {
        (mesh.userData as any).qty = computeMeshQuantity(mesh);
      }
    });

    // Center + uniform scale to ~10 units max dimension
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 10 / maxDim;
    root.position.sub(center.multiplyScalar(scale));
    // shift up so model sits on ground
    root.position.y += (size.y * scale) / 2;
    const fit = { scale, offset: root.position.clone() };
    root.scale.setScalar(scale);
    // Recompute box in world after transforms for geometry heuristics
    root.updateMatrixWorld(true);
    const worldBox = new THREE.Box3().setFromObject(root);

    let i = 0;
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const cls =
          classifyByMetadata(mesh.userData) ||
          classifyByName(mesh.name, mesh.parent?.name || "") ||
          classifyByGeometry(mesh, worldBox);
        (mesh.userData as any).phase = cls.phase;
        (mesh.userData as any).meshId = mesh.uuid;
        const q = (mesh.userData as any).qty ?? { volumeM3: 0, areaM2: 0, valid: false };
        meshes.push({
          id: mesh.uuid,
          name: mesh.name || mesh.parent?.name || `mesh_${i}`,
          phase: cls.phase,
          confidence: cls.confidence,
          reason: cls.reason,
          volumeM3: q.volumeM3,
          areaM2: q.areaM2,
          elementCount: ((mesh.userData as any).elementCount as number) ?? 1,
          valid: !!q.valid,
        });
        i++;
      }
    });
    return { tagged: root, meshes, rebar, elementGroups, elementList, fit };
  }, [root]);

  useEffect(() => {
    if (tagged && onLoaded) onLoaded(meshes, rebar, elementGroups, elementList);
  }, [tagged]); // eslint-disable-line

  // Caixa de selecção do elemento individual (mesma transformação de ajuste
  // aplicada ao modelo, para coincidir com a geometria fundida no ecrã).
  const highlightBox = useMemo(() => {
    if (!highlightElement || !fit) return null;
    const s = fit.scale;
    const pad = 0.02;
    return {
      position: [
        highlightElement.cx * s + fit.offset.x,
        highlightElement.cy * s + fit.offset.y,
        highlightElement.cz * s + fit.offset.z,
      ] as [number, number, number],
      args: [
        Math.max(highlightElement.dx * s, 0.02) + pad,
        Math.max(highlightElement.dy * s, 0.02) + pad,
        Math.max(highlightElement.dz * s, 0.02) + pad,
      ] as [number, number, number],
    };
  }, [highlightElement, fit]);

  // === OPTIMIZAÇÃO DE RENDER ===
  // Uma malha merged (ou InstancedMesh) por FASE em vez de um mesh por elemento.
  // Reduz milhares de draw calls a ~6-12, mantendo o mostrar/esconder por fase.
  const optimized = useMemo(() => {
    if (!tagged) return null;
    return buildOptimizedScene(tagged, (mesh) => {
      const id = (mesh.userData as any).meshId as string;
      const base = (mesh.userData as any).phase as PhaseKey;
      return overrides[id] ?? base ?? "acabamentos";
    });
  }, [tagged, overrides]);

  useEffect(() => {
    return () => disposeScene(optimized?.group ?? null);
  }, [optimized]);

  // Apply colors / visibility based on selected & visible
  useEffect(() => {
    if (!optimized) return;
    optimized.group.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const phase = (mesh.userData as any).phase as PhaseKey;
      const visible = visiblePhases.has(phase);
      mesh.visible = visible;
      const isSel = selected === phase;
      const dim = selected !== null && !isSel;
      // Fase seleccionada mantém a cor original; as restantes ficam a 15% de opacidade.
      const color = PHASE_COLORS[phase];
      const apply = (m: THREE.Material) => {
        const sm = m as THREE.MeshStandardMaterial;
        if (sm.color) sm.color.set(color);
        sm.transparent = dim;
        sm.opacity = dim ? 0.15 : 1;
        sm.needsUpdate = true;
      };
      if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
      else if (mesh.material) apply(mesh.material as THREE.Material);
    });
  }, [optimized, selected, visiblePhases]);

  if (!optimized) return null;

  return (
    <group rotation-x={rotationX}>
      <primitive
        object={optimized.group}
        onClick={(e: any) => {
          // Só reage a gestos reais do utilizador — evita "cliques" sintéticos
          // disparados quando a cena é reconstruída no fim do carregamento.
          if (e?.nativeEvent && e.nativeEvent.isTrusted === false) return;
          if (e?.delta != null && e.delta > 5) return; // arrastar a câmara não é clique
          e.stopPropagation();
          const ud = (e.object?.userData as any) || {};

          const p = ud.phase as PhaseKey | undefined;
          if (p) onSelect(p);
          // Identidade individual: o vértice atingido conhece o seu expressID.
          const ids = ud.elementIds as Uint32Array | undefined;
          const vi = e.face?.a;
          if (onSelectElement) {
            if (ids && typeof vi === "number" && vi < ids.length) {
              onSelectElement(ids[vi], (ud.ifcClass as string) ?? null);
            } else {
              onSelectElement(null, (ud.ifcClass as string) ?? null);
            }
          }
        }}
      />
      {highlightBox && (
        <mesh position={highlightBox.position} raycast={() => null}>
          <boxGeometry args={highlightBox.args} />
          <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.95} />
        </mesh>
      )}
    </group>
  );
}
