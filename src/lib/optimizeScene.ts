import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PhaseKey } from "@/components/three/BuildingModel";
import { PHASE_COLORS } from "@/components/three/BuildingModel";

/** A partir de quantas repetições da MESMA geometria vale a pena instanciar. */
const INSTANCE_MIN = 8;

export type OptimizedScene = {
  group: THREE.Group;
  /** nº de draw calls resultantes (uma por grupo merged/instanced) */
  draws: number;
  /** nº de meshes originais que foram agrupados */
  sources: number;
  instanced: number;
};

/** Normaliza uma geometria para position+normal não-indexada (requisito do merge). */
function normalize(src: THREE.BufferGeometry): THREE.BufferGeometry | null {
  const pos = src.getAttribute("position");
  if (!pos || pos.count < 3) return null;
  let base: THREE.BufferGeometry;
  try {
    base = src.index ? src.toNonIndexed() : src.clone();
  } catch {
    return null;
  }
  const out = new THREE.BufferGeometry();
  const p = base.getAttribute("position");
  if (!p) return null;
  out.setAttribute("position", p.clone());
  const n = base.getAttribute("normal");
  if (n) out.setAttribute("normal", n.clone());
  if (base !== src) base.dispose();
  if (!n) out.computeVertexNormals();
  return out;
}

/**
 * Reconstrói a árvore de render agrupando geometria por FASE:
 *  - geometrias repetidas (≥ INSTANCE_MIN) → THREE.InstancedMesh
 *  - restantes → um único BufferGeometry merged por fase
 * Resultado: ~1-2 draw calls por fase em vez de um por elemento.
 * NÃO altera dados de quantidades — só a representação visual.
 */
export function buildOptimizedScene(
  root: THREE.Object3D,
  phaseOf: (mesh: THREE.Mesh) => PhaseKey
): OptimizedScene {
  root.updateMatrixWorld(true);

  const byPhase = new Map<PhaseKey, THREE.Mesh[]>();
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const phase = phaseOf(mesh);
    const list = byPhase.get(phase);
    if (list) list.push(mesh);
    else byPhase.set(phase, [mesh]);
  });

  const group = new THREE.Group();
  group.name = "OptimizedModel";
  let draws = 0;
  let sources = 0;
  let instanced = 0;

  byPhase.forEach((list, phase) => {
    sources += list.length;
    const material = new THREE.MeshStandardMaterial({
      color: PHASE_COLORS[phase],
      metalness: 0.05,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });

    // --- Caminho rápido IFC ---
    // O worker já devolve UMA malha fundida por classe IFC. Voltar a passar essa
    // geometria por toNonIndexed()+mergeGeometries só multiplica memória e pode
    // corromper/perder geometria (era o caso da Alvenaria, que aparecia como um
    // painel branco). Aqui reutilizamos a geometria original e só aplicamos a
    // matriz de mundo à malha — o nº de draw calls mantém-se igual ao nº de
    // classes IFC da fase (1-3), portanto não há regressão de performance.
    const allIfc = list.every((m) => !!(m.userData as any)?.ifcClass && !!m.geometry?.getAttribute("position"));
    if (allIfc) {
      list.forEach((m) => {
        const clone = new THREE.Mesh(m.geometry, material);
        clone.applyMatrix4(m.matrixWorld);
        clone.frustumCulled = true;
        clone.castShadow = false;
        clone.receiveShadow = false;
        clone.userData = {
          phase,
          ifcClass: (m.userData as any).ifcClass,
          elementIds: (m.userData as any).elementIds,
          sharedGeometry: true,
        };
        clone.name = `${phase}__${(m.userData as any).ifcClass}`;
        group.add(clone);
        draws += 1;
      });
      return;
    }

    // Agrupar por identidade de geometria para detectar repetições.
    const byGeom = new Map<string, THREE.Mesh[]>();
    list.forEach((m) => {
      const key = m.geometry.uuid;
      const g = byGeom.get(key);
      if (g) g.push(m);
      else byGeom.set(key, [m]);
    });


    const mergePool: THREE.BufferGeometry[] = [];

    byGeom.forEach((group_) => {
      if (group_.length >= INSTANCE_MIN) {
        const geom = normalize(group_[0].geometry);
        if (!geom) return;
        const inst = new THREE.InstancedMesh(geom, material, group_.length);
        group_.forEach((m, i) => inst.setMatrixAt(i, m.matrixWorld));
        inst.instanceMatrix.needsUpdate = true;
        inst.computeBoundingSphere();
        inst.frustumCulled = true;
        inst.castShadow = false;
        inst.receiveShadow = false;
        inst.userData = { phase };
        inst.name = `${phase}__instanced`;
        group.add(inst);
        draws += 1;
        instanced += group_.length;
      } else {
        group_.forEach((m) => {
          const geom = normalize(m.geometry);
          if (!geom) return;
          geom.applyMatrix4(m.matrixWorld);
          mergePool.push(geom);
        });
      }
    });

    if (mergePool.length > 0) {
      let merged: THREE.BufferGeometry | null = null;
      try {
        merged = mergeGeometries(mergePool, false);
      } catch {
        merged = null;
      }
      mergePool.forEach((g) => g.dispose());
      if (merged) {
        merged.computeBoundingSphere();
        const mesh = new THREE.Mesh(merged, material);
        mesh.frustumCulled = true;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.userData = { phase };
        mesh.name = `${phase}__merged`;
        group.add(mesh);
        draws += 1;
      }
    }
  });

  return { group, draws, sources, instanced };
}

export function disposeScene(obj: THREE.Object3D | null) {
  if (!obj) return;
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as any).isMesh && !(mesh as any).isInstancedMesh) return;
    // Geometria partilhada com a árvore original (caminho rápido IFC): não
    // libertar aqui, senão o modelo desaparece ao mudar de fase/override.
    if (!(mesh.userData as any)?.sharedGeometry) mesh.geometry?.dispose?.();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    mats.forEach((m) => {
      const sm = m as THREE.MeshStandardMaterial;
      (["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"] as const).forEach((k) => {
        const tex = (sm as any)[k];
        if (tex && typeof tex.dispose === "function") tex.dispose();
      });
      m.dispose?.();
    });
  });
}
