import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Cache the initialized IfcAPI across calls to avoid re-instantiating WASM.
let ifcApiPromise: Promise<any> | null = null;

async function getIfcApi() {
  if (!ifcApiPromise) {
    ifcApiPromise = (async () => {
      const WebIFC: any = await import("web-ifc");
      const api = new WebIFC.IfcAPI();
      // WASM served from /public/wasm/ (see public/wasm/web-ifc.wasm)
      api.SetWasmPath("/wasm/");
      await api.Init();
      return api;
    })();
  }
  return ifcApiPromise;
}

/**
 * Parse an IFC file (fetched from `url`) into a THREE.Group of meshes.
 * Each mesh receives userData.ifcClass so downstream classification
 * (in UploadedModel) can map IFCCOLUMN/IFCSLAB/... to construction phases.
 */
export async function loadIFC(url: string): Promise<THREE.Group> {
  const api = await getIfcApi();
  let buf: ArrayBuffer | null = await fetch(url).then((r) => r.arrayBuffer());
  let bytes: Uint8Array | null = new Uint8Array(buf);
  const modelID: number = api.OpenModel(bytes);
  // Release raw file bytes as soon as web-ifc has parsed them.
  bytes = null;
  buf = null;

  const group = new THREE.Group();
  group.name = "IFCModel";

  // Bucket per-element geometries by IFC class so we can merge each bucket into
  // ONE mesh. Real IFC files have 800+ elements — one Three.js mesh per element
  // (with its own material) blows up GPU + JS memory. Merging cuts draw calls
  // dramatically and lets us dispose per-element geometries after merge.
  const buckets = new Map<
    string,
    { geoms: THREE.BufferGeometry[]; color: THREE.Color; opacity: number }
  >();

  api.StreamAllMeshes(modelID, (flatMesh: any) => {
    const expressID = flatMesh.expressID;
    let ifcClass = "IFCELEMENT";
    try {
      const line = api.GetLine(modelID, expressID);
      if (line && typeof line.type === "number") {
        ifcClass = api.GetNameFromTypeCode(line.type) || ifcClass;
      }
    } catch {
      /* ignore lookup failures per element */
    }

    const placedGeoms = flatMesh.geometries;
    const size = placedGeoms.size();
    for (let i = 0; i < size; i++) {
      const placed = placedGeoms.get(i);
      const geom = api.GetGeometry(modelID, placed.geometryExpressID);
      const verts: Float32Array = api.GetVertexArray(
        geom.GetVertexData(),
        geom.GetVertexDataSize()
      );
      const indices: Uint32Array = api.GetIndexArray(
        geom.GetIndexData(),
        geom.GetIndexDataSize()
      );

      // web-ifc interleaves position(3) + normal(3) per vertex.
      const vertexCount = verts.length / 6;
      const positions = new Float32Array(vertexCount * 3);
      const normals = new Float32Array(vertexCount * 3);
      for (let v = 0; v < vertexCount; v++) {
        positions[v * 3 + 0] = verts[v * 6 + 0];
        positions[v * 3 + 1] = verts[v * 6 + 1];
        positions[v * 3 + 2] = verts[v * 6 + 2];
        normals[v * 3 + 0] = verts[v * 6 + 3];
        normals[v * 3 + 1] = verts[v * 6 + 4];
        normals[v * 3 + 2] = verts[v * 6 + 5];
      }

      const bufGeom = new THREE.BufferGeometry();
      bufGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      bufGeom.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      bufGeom.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      bufGeom.applyMatrix4(new THREE.Matrix4().fromArray(placed.flatTransformation));

      const color = placed.color;
      let bucket = buckets.get(ifcClass);
      if (!bucket) {
        bucket = {
          geoms: [],
          color: new THREE.Color(color.x, color.y, color.z),
          opacity: color.w,
        };
        buckets.set(ifcClass, bucket);
      }
      bucket.geoms.push(bufGeom);

      geom.delete?.();
    }
    flatMesh.delete?.();
  });

  api.CloseModel(modelID);

  // Merge each bucket → one mesh per IFC class. Mesh name = IFC class so the
  // downstream classifier in UploadedModel maps it straight to a phase.
  buckets.forEach((bucket, ifcClass) => {
    if (bucket.geoms.length === 0) return;
    let merged: THREE.BufferGeometry | null = null;
    try {
      merged = mergeGeometries(bucket.geoms, false);
    } catch {
      merged = null;
    }
    // Free per-element geometries now that they're merged (or failed).
    bucket.geoms.forEach((g) => g.dispose());
    bucket.geoms.length = 0;
    if (!merged) return;

    const material = new THREE.MeshStandardMaterial({
      color: bucket.color,
      transparent: bucket.opacity < 1,
      opacity: bucket.opacity,
      side: THREE.DoubleSide,
      metalness: 0.05,
      roughness: 0.85,
    });
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = ifcClass;
    mesh.userData = { ifcClass };
    group.add(mesh);
  });

  // Rotate whole model from IFC Z-up → three.js Y-up.
  group.rotation.x = -Math.PI / 2;
  group.updateMatrixWorld(true);
  return group;
}