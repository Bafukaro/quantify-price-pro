import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { loadIFC } from "@/lib/ifcLoader";
import type { PhaseKey } from "./BuildingModel";
import { PHASE_COLORS } from "./BuildingModel";

const HIGHLIGHT = "#f59e0b";

export type Classification = { phase: PhaseKey; confidence: number; reason: string };

const NAME_RULES: { rx: RegExp; phase: PhaseKey; reason: string }[] = [
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

export type MeshInfo = { id: string; name: string; phase: PhaseKey; confidence: number; reason: string };

export default function UploadedModel({
  url,
  ext,
  selected,
  visiblePhases,
  overrides,
  onSelect,
  onLoaded,
  onError,
}: {
  url: string;
  ext: "gltf" | "glb" | "obj" | "ifc";
  selected: PhaseKey | null;
  visiblePhases: Set<PhaseKey>;
  overrides: Record<string, PhaseKey>;
  onSelect: (p: PhaseKey) => void;
  onLoaded?: (meshes: MeshInfo[]) => void;
  onError?: (msg: string) => void;
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
            const grp = await loadIFC(url);
            if (active) setRoot(grp);
            else disposeSubtree(grp);
          } catch (err: any) {
            if (active) onError?.(`Falha ao carregar IFC: ${err?.message ?? "ficheiro inválido"}`);
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
  }, [url, ext, onError]);

  // Whenever `root` is replaced OR the component unmounts, dispose the previous
  // scene tree. Without this, every re-upload / project switch leaks GPU
  // memory for the previous IFC model and eventually crashes the tab.
  useEffect(() => {
    return () => disposeSubtree(root);
  }, [root]);

  // Tag each mesh with a phase + center & scale model
  const { tagged, meshes } = useMemo(() => {
    const meshes: MeshInfo[] = [];
    if (!root) return { tagged: null, meshes };

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
        meshes.push({
          id: mesh.uuid,
          name: mesh.name || mesh.parent?.name || `mesh_${i}`,
          phase: cls.phase,
          confidence: cls.confidence,
          reason: cls.reason,
        });
        // Clone material so we can mutate per-mesh
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        i++;
      }
    });
    return { tagged: root, meshes };
  }, [root]);

  useEffect(() => {
    if (tagged && onLoaded) onLoaded(meshes);
  }, [tagged]); // eslint-disable-line

  // Apply colors / visibility based on selected & visible
  useEffect(() => {
    if (!tagged) return;
    tagged.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const baseId = (mesh.userData as any).meshId as string;
      const basePhase = (mesh.userData as any).phase as PhaseKey;
      const phase = overrides[baseId] ?? basePhase;
      const visible = visiblePhases.has(phase);
      mesh.visible = visible;
      const isSel = selected === phase;
      const dim = selected !== null && !isSel;
      const color = isSel ? HIGHLIGHT : PHASE_COLORS[phase];
      const apply = (m: THREE.Material) => {
        const sm = m as THREE.MeshStandardMaterial;
        if (sm.color) sm.color.set(color);
        sm.transparent = dim;
        sm.opacity = dim ? 0.18 : 1;
        sm.needsUpdate = true;
      };
      if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
      else if (mesh.material) apply(mesh.material as THREE.Material);
    });
  }, [tagged, selected, visiblePhases, overrides]);

  if (!tagged) return null;

  return (
    <primitive
      object={tagged}
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const ud = (e.object?.userData as any) || {};
        const id = ud.meshId as string | undefined;
        const p = (id && overrides[id]) || (ud.phase as PhaseKey | undefined);
        if (p) onSelect(p);
      }}
    />
  );
}
