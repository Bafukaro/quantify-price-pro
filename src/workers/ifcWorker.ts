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

/**
 * Agrupamento de elementos IFC com dimensões reais (bounding box no espaço-mundo).
 * É a base do BoQ detalhado: nº de pilares por secção/altura, espessura de lajes,
 * espessura e área de paredes, etc.
 */
export type ElementGroup = {
  ifcClass: string;
  count: number;
  /** dimensões médias do bounding box em metros (dy = vertical) */
  dx: number;
  dy: number;
  dz: number;
  volumeM3: number;
  areaM2: number;
  /** true quando o grupo agrega geometrias de dimensões variadas */
  mixed: boolean;
};


/** Métricas de diagnóstico do worker (tempos por etapa, buffers, contagens). */
export type IfcWorkerMetrics = {
  fileBytes: number;
  elements: number;
  classes: number;
  vertices: number;
  triangles: number;
  invalid: number;
  /** bytes transferidos para a thread principal (positions+normals+indices) */
  transferBytes: number;
  stages: { stage: string; ms: number }[];
  totalMs: number;
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

/** Cronómetro simples por etapa. */
function createTimer() {
  const stages: { stage: string; ms: number }[] = [];
  const t0 = performance.now();
  let last = t0;
  let current = "init";
  return {
    mark(next: string) {
      const now = performance.now();
      stages.push({ stage: current, ms: +(now - last).toFixed(1) });
      last = now;
      current = next;
    },
    finish() {
      const now = performance.now();
      stages.push({ stage: current, ms: +(now - last).toFixed(1) });
      return { stages, totalMs: +(now - t0).toFixed(1) };
    },
    get stage() {
      return current;
    },
  };
}

async function run(url: string) {
  const timer = createTimer();
  let fileBytes = 0;
  const { api, WebIFC } = await getApi();
  timer.mark("download");
  post({ type: "progress", stage: "download", elements: 0 });

  const buf = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.arrayBuffer();
  });
  fileBytes = buf.byteLength;
  timer.mark("parse");
  post({ type: "progress", stage: "parse", elements: 0 });
  const modelID: number = api.OpenModel(new Uint8Array(buf));
  timer.mark("geometry");

  const buckets = new Map<string, Bucket>();
  let processed = 0;

  /** Dados por elemento IFC (bbox + quantidades) — base do BoQ detalhado. */
  type Elem = {
    ifcClass: string;
    minX: number; minY: number; minZ: number;
    maxX: number; maxY: number; maxZ: number;
    volumeM3: number;
    areaM2: number;
  };
  const elems = new Map<number, Elem>();


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

        // Bounding box do elemento (espaço-mundo, Y-up) para dimensões reais.
        let e = elems.get(expressID);
        if (!e) {
          e = {
            ifcClass,
            minX: Infinity, minY: Infinity, minZ: Infinity,
            maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity,
            volumeM3: 0, areaM2: 0,
          };
          elems.set(expressID, e);
        }
        for (let v = 0; v < vertexCount; v++) {
          const px = positions[v * 3], py = positions[v * 3 + 1], pz = positions[v * 3 + 2];
          if (px < e.minX) e.minX = px;
          if (py < e.minY) e.minY = py;
          if (pz < e.minZ) e.minZ = pz;
          if (px > e.maxX) e.maxX = px;
          if (py > e.maxY) e.maxY = py;
          if (pz > e.maxZ) e.maxZ = pz;
        }
        e.volumeM3 += Math.abs(vol6) / 6;
        e.areaM2 += area2 / 2;


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
  timer.mark("rebar");

  let rebar: RebarTakeoff | null = null;
  try {
    rebar = extractRebar(api, modelID, WebIFC);
  } catch {
    rebar = null;
  }
  api.CloseModel(modelID);
  timer.mark("merge");

  const classes: IfcClassPayload[] = [];
  const transfer: Transferable[] = [];
  let vertices = 0;
  let triangles = 0;
  let invalid = 0;
  let transferBytes = 0;
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
    vertices += b.vertexTotal;
    triangles += b.triangles;
    invalid += b.invalid;
    transferBytes += positions.byteLength + normals.byteLength + indices.byteLength;
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

  // ---- Agrupamento por classe + dimensões (BoQ detalhado) ----
  const r5 = (v: number) => Math.round(v * 20) / 20; // arredondar a 5 cm
  const grouping = new Map<string, ElementGroup & { _sx: number; _sy: number; _sz: number }>();
  elems.forEach((e) => {
    const dx = Math.max(0, e.maxX - e.minX);
    const dy = Math.max(0, e.maxY - e.minY);
    const dz = Math.max(0, e.maxZ - e.minZ);
    const key = `${e.ifcClass}|${r5(dx)}|${r5(dy)}|${r5(dz)}`;
    let g = grouping.get(key);
    if (!g) {
      g = {
        ifcClass: e.ifcClass, count: 0, dx: 0, dy: 0, dz: 0,
        volumeM3: 0, areaM2: 0, mixed: false, _sx: 0, _sy: 0, _sz: 0,
      };
      grouping.set(key, g);
    }
    g.count += 1;
    g._sx += dx; g._sy += dy; g._sz += dz;
    g.volumeM3 += e.volumeM3;
    g.areaM2 += e.areaM2;
  });

  // Limitar a 12 grupos por classe: os restantes fundem-se numa linha "variados".
  const byClass = new Map<string, (ElementGroup & { _sx: number; _sy: number; _sz: number })[]>();
  grouping.forEach((g) => {
    const l = byClass.get(g.ifcClass);
    if (l) l.push(g);
    else byClass.set(g.ifcClass, [g]);
  });
  const elementGroups: ElementGroup[] = [];
  byClass.forEach((list, ifcClass) => {
    list.sort((a, b) => b.count - a.count || b.volumeM3 - a.volumeM3);
    const keep = list.slice(0, 12);
    const rest = list.slice(12);
    keep.forEach((g) =>
      elementGroups.push({
        ifcClass,
        count: g.count,
        dx: +(g._sx / g.count).toFixed(3),
        dy: +(g._sy / g.count).toFixed(3),
        dz: +(g._sz / g.count).toFixed(3),
        volumeM3: +g.volumeM3.toFixed(4),
        areaM2: +g.areaM2.toFixed(3),
        mixed: false,
      })
    );
    if (rest.length) {
      const count = rest.reduce((a, g) => a + g.count, 0);
      elementGroups.push({
        ifcClass,
        count,
        dx: +(rest.reduce((a, g) => a + g._sx, 0) / count).toFixed(3),
        dy: +(rest.reduce((a, g) => a + g._sy, 0) / count).toFixed(3),
        dz: +(rest.reduce((a, g) => a + g._sz, 0) / count).toFixed(3),
        volumeM3: +rest.reduce((a, g) => a + g.volumeM3, 0).toFixed(4),
        areaM2: +rest.reduce((a, g) => a + g.areaM2, 0).toFixed(3),
        mixed: true,
      });
    }
  });

  const { stages, totalMs } = timer.finish();
  const metrics: IfcWorkerMetrics = {
    fileBytes,
    elements: processed,
    classes: classes.length,
    vertices,
    triangles,
    invalid,
    transferBytes,
    stages,
    totalMs,
  };
  post({ type: "result", classes, rebar, elementGroups, elements: processed, metrics }, transfer);

}

self.onmessage = (e: MessageEvent) => {
  const { url } = e.data ?? {};
  run(url).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[ifcWorker] falhou", err);
    post({
      type: "error",
      message: err?.message ?? "Falha ao processar IFC",
      name: err?.name ?? "Error",
      stack: typeof err?.stack === "string" ? String(err.stack).slice(0, 1500) : undefined,
    });
  });
};
