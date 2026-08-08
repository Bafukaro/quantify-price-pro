/// <reference lib="webworker" />
/**
 * IFC parsing worker.
 *
 * Corre TODO o trabalho pesado fora da thread principal:
 *  - parsing do ficheiro IFC (web-ifc / WASM)
 *  - transformação das geometrias para espaço-mundo
 *  - correcção do up-vector (IFC Z-up → three.js Y-up) BAKED nos vértices
 *  - cálculo de quantidades reais (volume m³ / área m²) por elemento
 *  - merge por classe IFC (um buffer por classe)
 *
 * Devolve buffers transferíveis — a thread principal só cria BufferGeometry.
 */
import { extractRebar, type RebarTakeoff } from "@/lib/rebar";

export type IfcClassPayload = {
  ifcClass: string;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  color: [number, number, number, number];
  elementCount: number;
  invalid: number;
  volumeM3: number;
  areaM2: number;
  triangles: number;
};

type Bucket = {
  posChunks: Float32Array[];
  normChunks: Float32Array[];
  idxChunks: Uint32Array[];
  vertexTotal: number;
  indexTotal: number;
  color: [number, number, number, number];
  elements: Set<number>;
  invalid: number;
  volumeM3: number;
  areaM2: number;
  triangles: number;
};

let apiPromise: Promise<{ api: any; WebIFC: any }> | null = null;
async function getApi() {
  if (!apiPromise) {
    apiPromise = (async () => {
      const WebIFC: any = await import("web-ifc");
      const api = new WebIFC.IfcAPI();
      api.SetWasmPath("/wasm/");
      await api.Init();
      return { api, WebIFC };
    })();
  }
  return apiPromise;
}

function post(msg: any, transfer?: Transferable[]) {
  (self as any).postMessage(msg, transfer ?? []);
}

async function run(url: string) {
  const { api, WebIFC } = await getApi();
  post({ type: "progress", stage: "download", elements: 0 });

  const buf = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.arrayBuffer();
  });
  post({ type: "progress", stage: "parse", elements: 0 });
  const modelID: number = api.OpenModel(new Uint8Array(buf));

  const buckets = new Map<string, Bucket>();
  let processed = 0;

  api.StreamAllMeshes(modelID, (flatMesh: any) => {
    const expressID = flatMesh.expressID;
    let ifcClass = "IFCELEMENT";
    try {
      const line = api.GetLine(modelID, expressID);
      if (line && typeof line.type === "number") {
        ifcClass = api.GetNameFromTypeCode(line.type) || ifcClass;
      }
    } catch {
      /* ignore */
    }

    const placedGeoms = flatMesh.geometries;
    const size = placedGeoms.size();
    for (let i = 0; i < size; i++) {
      const placed = placedGeoms.get(i);
      const geom = api.GetGeometry(modelID, placed.geometryExpressID);
      const verts: Float32Array = api.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
      const rawIdx: Uint32Array = api.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());
      const m = placed.flatTransformation as number[];

      const vertexCount = verts.length / 6;
      const positions = new Float32Array(vertexCount * 3);
      const normals = new Float32Array(vertexCount * 3);

      for (let v = 0; v < vertexCount; v++) {
        const x = verts[v * 6 + 0];
        const y = verts[v * 6 + 1];
        const z = verts[v * 6 + 2];
        // matriz 4x4 column-major
        const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
        // up-fix Z-up → Y-up (rotação -90° em X), aplicada AOS VÉRTICES
        positions[v * 3 + 0] = wx;
        positions[v * 3 + 1] = wz;
        positions[v * 3 + 2] = -wy;

        const nx = verts[v * 6 + 3];
        const ny = verts[v * 6 + 4];
        const nz = verts[v * 6 + 5];
        let rx = m[0] * nx + m[4] * ny + m[8] * nz;
        let ry = m[1] * nx + m[5] * ny + m[9] * nz;
        let rz = m[2] * nx + m[6] * ny + m[10] * nz;
        const len = Math.hypot(rx, ry, rz) || 1;
        rx /= len; ry /= len; rz /= len;
        normals[v * 3 + 0] = rx;
        normals[v * 3 + 1] = rz;
        normals[v * 3 + 2] = -ry;
      }

      let bucket = buckets.get(ifcClass);
      if (!bucket) {
        const c = placed.color;
        bucket = {
          posChunks: [], normChunks: [], idxChunks: [],
          vertexTotal: 0, indexTotal: 0,
          color: [c.x, c.y, c.z, c.w],
          elements: new Set<number>(),
          invalid: 0, volumeM3: 0, areaM2: 0, triangles: 0,
        };
        buckets.set(ifcClass, bucket);
      }
      bucket.elements.add(expressID);

      const invalid = vertexCount < 3 || rawIdx.length < 3;
      if (invalid) {
        bucket.invalid += 1;
      } else {
        // Quantidades reais deste elemento (teorema da divergência).
        let vol6 = 0;
        let area2 = 0;
        const triCount = rawIdx.length / 3;
        for (let t = 0; t < triCount; t++) {
          const i0 = rawIdx[t * 3] * 3, i1 = rawIdx[t * 3 + 1] * 3, i2 = rawIdx[t * 3 + 2] * 3;
          const ax = positions[i0], ay = positions[i0 + 1], az = positions[i0 + 2];
          const bx = positions[i1], by = positions[i1 + 1], bz = positions[i1 + 2];
          const cx = positions[i2], cy = positions[i2 + 1], cz = positions[i2 + 2];
          // a · (b × c)
          const cbx = by * cz - bz * cy;
          const cby = bz * cx - bx * cz;
          const cbz = bx * cy - by * cx;
          vol6 += ax * cbx + ay * cby + az * cbz;
          // |(b-a) × (c-a)|
          const ux = bx - ax, uy = by - ay, uz = bz - az;
          const vx = cx - ax, vy = cy - ay, vz = cz - az;
          const nx2 = uy * vz - uz * vy;
          const ny2 = uz * vx - ux * vz;
          const nz2 = ux * vy - uy * vx;
          area2 += Math.hypot(nx2, ny2, nz2);
        }
        bucket.volumeM3 += Math.abs(vol6) / 6;
        bucket.areaM2 += area2 / 2;
        bucket.triangles += triCount;

        // Merge por classe: reindexar com offset de vértices.
        const offset = bucket.vertexTotal;
        const idx = new Uint32Array(rawIdx.length);
        for (let k = 0; k < rawIdx.length; k++) idx[k] = rawIdx[k] + offset;
        bucket.posChunks.push(positions);
        bucket.normChunks.push(normals);
        bucket.idxChunks.push(idx);
        bucket.vertexTotal += vertexCount;
        bucket.indexTotal += idx.length;
      }

      geom.delete?.();
    }
    flatMesh.delete?.();

    processed += 1;
    if (processed % 25 === 0) post({ type: "progress", stage: "geometry", elements: processed });
  });

  post({ type: "progress", stage: "merge", elements: processed });

  let rebar: RebarTakeoff | null = null;
  try {
    rebar = extractRebar(api, modelID, WebIFC);
  } catch {
    rebar = null;
  }
  api.CloseModel(modelID);

  const classes: IfcClassPayload[] = [];
  const transfer: Transferable[] = [];
  buckets.forEach((b, ifcClass) => {
    if (b.vertexTotal === 0) return;
    const positions = new Float32Array(b.vertexTotal * 3);
    const normals = new Float32Array(b.vertexTotal * 3);
    const indices = new Uint32Array(b.indexTotal);
    let po = 0, io = 0;
    for (let i = 0; i < b.posChunks.length; i++) {
      positions.set(b.posChunks[i], po);
      normals.set(b.normChunks[i], po);
      po += b.posChunks[i].length;
      indices.set(b.idxChunks[i], io);
      io += b.idxChunks[i].length;
    }
    b.posChunks.length = 0; b.normChunks.length = 0; b.idxChunks.length = 0;
    classes.push({
      ifcClass,
      positions, normals, indices,
      color: b.color,
      elementCount: b.elements.size,
      invalid: b.invalid,
      volumeM3: b.volumeM3,
      areaM2: b.areaM2,
      triangles: b.triangles,
    });
    transfer.push(positions.buffer, normals.buffer, indices.buffer);
  });

  post({ type: "result", classes, rebar, elements: processed }, transfer);
}

self.onmessage = (e: MessageEvent) => {
  const { url } = e.data ?? {};
  run(url).catch((err) => post({ type: "error", message: err?.message ?? "Falha ao processar IFC" }));
};
