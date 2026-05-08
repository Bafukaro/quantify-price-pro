import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { PhaseKey } from "./BuildingModel";
import { PHASE_COLORS } from "./BuildingModel";

const HIGHLIGHT = "#f59e0b";

function classify(name: string): PhaseKey {
  const n = name.toLowerCase();
  if (/(found|footing|sapata|fundac)/.test(n)) return "fundacao";
  if (/(column|pilar|coluna)/.test(n)) return "pilares";
  if (/(slab|floor|laje|deck)/.test(n)) return "lajes";
  if (/(wall|alven|parede|mason)/.test(n)) return "alvenaria";
  if (/(roof|cober|telha)/.test(n)) return "cobertura";
  if (/(window|door|janela|porta|finish|acab)/.test(n)) return "acabamentos";
  return "acabamentos";
}

export default function UploadedModel({
  url,
  ext,
  selected,
  visiblePhases,
  onSelect,
  onLoaded,
}: {
  url: string;
  ext: "gltf" | "glb" | "obj";
  selected: PhaseKey | null;
  visiblePhases: Set<PhaseKey>;
  onSelect: (p: PhaseKey) => void;
  onLoaded?: (counts: Record<PhaseKey, number>) => void;
}) {
  const [root, setRoot] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (ext === "obj") {
          const loader = new OBJLoader();
          loader.load(url, (obj) => active && setRoot(obj));
        } else {
          const loader = new GLTFLoader();
          loader.load(url, (gltf) => active && setRoot(gltf.scene));
        }
      } catch (e) {
        console.error("Model load failed", e);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [url, ext]);

  // Tag each mesh with a phase + center & scale model
  const { tagged, counts } = useMemo(() => {
    const counts: Record<PhaseKey, number> = {
      fundacao: 0, pilares: 0, lajes: 0, alvenaria: 0, cobertura: 0, acabamentos: 0,
    };
    if (!root) return { tagged: null, counts };

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

    let i = 0;
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const phase = classify(mesh.name || mesh.parent?.name || `mesh${i}`);
        (mesh.userData as any).phase = phase;
        counts[phase]++;
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
    return { tagged: root, counts };
  }, [root]);

  useEffect(() => {
    if (tagged && onLoaded) onLoaded(counts);
  }, [tagged]); // eslint-disable-line

  // Apply colors / visibility based on selected & visible
  useEffect(() => {
    if (!tagged) return;
    tagged.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const phase = (mesh.userData as any).phase as PhaseKey;
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
  }, [tagged, selected, visiblePhases]);

  if (!tagged) return null;

  return (
    <primitive
      object={tagged}
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const p = (e.object?.userData as any)?.phase as PhaseKey | undefined;
        if (p) onSelect(p);
      }}
    />
  );
}
