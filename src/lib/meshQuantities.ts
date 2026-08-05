import * as THREE from "three";

export type MeshQuantity = {
  volumeM3: number;
  areaM2: number;
  triangles: number;
  valid: boolean;
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _ab = new THREE.Vector3();
const _ac = new THREE.Vector3();
const _cross = new THREE.Vector3();

/**
 * Volume (m³, via teorema da divergência sobre triângulos) e área de superfície
 * (m²) reais da malha, no espaço-mundo (unidades do ficheiro — IFC/GLTF em metros).
 * Deve ser chamado ANTES de qualquer re-escala de visualização.
 */
export function computeMeshQuantity(mesh: THREE.Mesh): MeshQuantity {
  const geom = mesh.geometry as THREE.BufferGeometry | undefined;
  const pos = geom?.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!pos || pos.count < 3) return { volumeM3: 0, areaM2: 0, triangles: 0, valid: false };

  const index = geom!.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  if (!Number.isFinite(triCount) || triCount < 1)
    return { volumeM3: 0, areaM2: 0, triangles: 0, valid: false };

  const m = mesh.matrixWorld;
  let vol6 = 0;
  let area2 = 0;
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    _a.fromBufferAttribute(pos, i0).applyMatrix4(m);
    _b.fromBufferAttribute(pos, i1).applyMatrix4(m);
    _c.fromBufferAttribute(pos, i2).applyMatrix4(m);
    vol6 += _a.dot(_ab.copy(_b).cross(_c));
    _ab.copy(_b).sub(_a);
    _ac.copy(_c).sub(_a);
    area2 += _cross.copy(_ab).cross(_ac).length();
  }
  const volumeM3 = Math.abs(vol6) / 6;
  const areaM2 = area2 / 2;
  const valid = Number.isFinite(volumeM3) && Number.isFinite(areaM2) && areaM2 > 0;
  return {
    volumeM3: valid ? volumeM3 : 0,
    areaM2: valid ? areaM2 : 0,
    triangles: triCount,
    valid,
  };
}
