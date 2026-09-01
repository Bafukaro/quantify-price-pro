import * as THREE from "three";

export type IsolatedElement = {
  geometry: THREE.BufferGeometry;
  /** Dimensão máxima da caixa envolvente (unidades do ficheiro, tipicamente metros). */
  size: THREE.Vector3;
  volumeM3: number;
  areaM2: number;
  triangles: number;
  ifcClass: string | null;
  phase: string | null;
};

/**
 * Extrai a geometria de UM elemento IFC a partir da malha fundida por classe,
 * sem desfazer o merge: cada vértice guarda o seu expressID em
 * `userData.elementIds`, portanto basta copiar os triângulos cujo primeiro
 * vértice pertence ao elemento pedido.
 */
export function extractElement(
  root: THREE.Object3D | null,
  elementId: number | null
): IsolatedElement | null {
  if (!root || elementId == null) return null;

  const positions: number[] = [];
  let ifcClass: string | null = null;
  let phase: string | null = null;

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const ids = (mesh.userData as any)?.elementIds as
      | Uint32Array
      | THREE.BufferAttribute
      | undefined;
    if (!ids) return;
    const idArr: ArrayLike<number> | null =
      ids instanceof Uint32Array ? ids : ((ids as any)?.array as Uint32Array) ?? null;
    if (!idArr) return;

    const pos = mesh.geometry?.getAttribute("position");
    if (!pos) return;
    const index = mesh.geometry.index;
    mesh.updateMatrixWorld(true);
    const m = mesh.matrixWorld;
    const v = new THREE.Vector3();
    const triCount = index ? index.count / 3 : pos.count / 3;

    for (let t = 0; t < triCount; t++) {
      const a = index ? index.getX(t * 3) : t * 3;
      if (idArr[a] !== elementId) continue;
      for (let k = 0; k < 3; k++) {
        const vi = index ? index.getX(t * 3 + k) : t * 3 + k;
        v.fromBufferAttribute(pos as THREE.BufferAttribute, vi).applyMatrix4(m);
        positions.push(v.x, v.y, v.z);
      }
      if (!ifcClass) ifcClass = ((mesh.userData as any)?.ifcClass as string) ?? null;
      if (!phase) phase = ((mesh.userData as any)?.phase as string) ?? null;
    }
  });

  if (positions.length < 9) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const box = geometry.boundingBox ?? new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  // Centrar na origem para a vista isolada.
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.computeBoundingSphere();

  // Volume pelo teorema da divergência + área somando triângulos.
  let vol = 0;
  let area = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();
  for (let i = 0; i < positions.length; i += 9) {
    a.set(positions[i], positions[i + 1], positions[i + 2]);
    b.set(positions[i + 3], positions[i + 4], positions[i + 5]);
    c.set(positions[i + 6], positions[i + 7], positions[i + 8]);
    vol += a.dot(ab.copy(b).cross(c)) / 6;
    ab.copy(b).sub(a);
    ac.copy(c).sub(a);
    area += cross.copy(ab).cross(ac).length() / 2;
  }

  return {
    geometry,
    size,
    volumeM3: Math.abs(vol),
    areaM2: area,
    triangles: positions.length / 9,
    ifcClass,
    phase,
  };
}
