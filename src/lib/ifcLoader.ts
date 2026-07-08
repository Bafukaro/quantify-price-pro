import * as THREE from "three";

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
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  const modelID: number = api.OpenModel(new Uint8Array(buf));

  const group = new THREE.Group();
  group.name = "IFCModel";

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

      const color = placed.color;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color.x, color.y, color.z),
        transparent: color.w < 1,
        opacity: color.w,
        side: THREE.DoubleSide,
        metalness: 0.05,
        roughness: 0.85,
      });

      const mesh = new THREE.Mesh(bufGeom, material);
      mesh.applyMatrix4(new THREE.Matrix4().fromArray(placed.flatTransformation));
      // IFC is Z-up; convert to Y-up so it sits correctly next to gltf/obj models.
      // We apply the rotation on the mesh itself so the group bounding box is correct.
      mesh.name = `${ifcClass}_${expressID}`;
      mesh.userData = { ifcClass, expressID };
      group.add(mesh);

      geom.delete?.();
    }
    flatMesh.delete?.();
  });

  api.CloseModel(modelID);

  // Rotate whole model from IFC Z-up → three.js Y-up.
  group.rotation.x = -Math.PI / 2;
  group.updateMatrixWorld(true);
  return group;
}