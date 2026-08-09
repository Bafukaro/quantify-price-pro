import * as THREE from "three";
import type { RebarTakeoff } from "./rebar";
import type { IfcClassPayload, IfcWorkerMetrics } from "@/workers/ifcWorker";

export type IfcProgress = { stage: "download" | "parse" | "geometry" | "merge"; elements: number };
export type { IfcWorkerMetrics };

/** Erro do pipeline IFC com causa legível para o ecrã de erro. */
export class IfcLoadError extends Error {
  stage: string;
  detail?: string;
  constructor(message: string, stage: string, detail?: string) {
    super(message);
    this.name = "IfcLoadError";
    this.stage = stage;
    this.detail = detail;
  }
}

function humanCause(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("http 4") || m.includes("http 5") || m.includes("fetch"))
    return "Não foi possível descarregar o ficheiro do armazenamento (rede ou permissões).";
  if (m.includes("wasm") || m.includes("init"))
    return "O motor de leitura IFC (WASM) não arrancou. Recarregue a página e tente novamente.";
  if (m.includes("memory") || m.includes("allocation"))
    return "Memória insuficiente para este modelo — o ficheiro é demasiado grande para o navegador.";
  if (m.includes("openmodel") || m.includes("parse") || m.includes("invalid"))
    return "O ficheiro IFC parece inválido ou corrompido (schema não suportado).";
  return "Erro inesperado durante o processamento no worker.";
}

/**
 * Carrega um IFC usando um Web Worker: parsing, transformação, cálculo de
 * quantidades e merge por classe acontecem FORA da thread principal — a UI
 * mantém-se responsiva. Aqui só criamos BufferGeometry a partir dos buffers
 * transferidos (operação praticamente instantânea).
 *
 * O up-vector (IFC Z-up → three.js Y-up) já vem aplicado aos vértices,
 * portanto o grupo devolvido não precisa (nem deve) de rotação adicional.
 */
export async function loadIFC(
  url: string,
  onProgress?: (p: IfcProgress) => void,
  onMetrics?: (m: IfcWorkerMetrics) => void
): Promise<THREE.Group> {
  const t0 = performance.now();
  console.info("[IFC] a arrancar worker", { url });
  const worker = new Worker(new URL("../workers/ifcWorker.ts", import.meta.url), {
    type: "module",
  });

  try {
    const payload = await new Promise<{
      classes: IfcClassPayload[];
      rebar: RebarTakeoff | null;
      metrics?: IfcWorkerMetrics;
    }>(
      (resolve, reject) => {
        let lastStage = "init";
        worker.onmessage = (e: MessageEvent) => {
          const msg = e.data;
          if (msg?.type === "progress") {
            lastStage = msg.stage;
            console.debug("[IFC] etapa", msg.stage, msg.elements);
            onProgress?.(msg as IfcProgress);
          } else if (msg?.type === "result") {
            resolve(msg);
          } else if (msg?.type === "error") {
            console.error("[IFC] erro no worker", msg);
            reject(
              new IfcLoadError(humanCause(String(msg.message ?? "")), lastStage, String(msg.message ?? ""))
            );
          }
        };
        worker.onerror = (e) => {
          console.error("[IFC] worker crash", e);
          reject(
            new IfcLoadError(
              "O worker de processamento IFC terminou inesperadamente.",
              lastStage,
              e.message || `${e.filename ?? ""}:${e.lineno ?? ""}`
            )
          );
        };
        worker.postMessage({ url });
      }
    );

    if (payload.metrics) {
      console.info("[IFC] métricas do worker", payload.metrics);
      onMetrics?.(payload.metrics);
    }

    const group = new THREE.Group();
    group.name = "IFCModel";
    let invalidElements = 0;

    payload.classes.forEach((c) => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(c.positions, 3));
      geom.setAttribute("normal", new THREE.BufferAttribute(c.normals, 3));
      geom.setIndex(new THREE.BufferAttribute(c.indices, 1));
      geom.computeBoundingSphere();

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(c.color[0], c.color[1], c.color[2]),
        transparent: c.color[3] < 1,
        opacity: c.color[3],
        side: THREE.DoubleSide,
        metalness: 0.05,
        roughness: 0.85,
      });
      const mesh = new THREE.Mesh(geom, material);
      mesh.name = c.ifcClass;
      mesh.frustumCulled = true;
      mesh.userData = {
        ifcClass: c.ifcClass,
        elementCount: c.elementCount,
        invalidElements: c.invalid,
        // Quantidades reais já calculadas no worker (unidades do ficheiro).
        qty: {
          volumeM3: c.volumeM3,
          areaM2: c.areaM2,
          triangles: c.triangles,
          valid: c.areaM2 > 0,
        },
      };
      invalidElements += c.invalid;
      group.add(mesh);
    });

    group.userData = {
      ...group.userData,
      invalidElements,
      source: "ifc",
      rebar: payload.rebar,
      upFixed: true,
      metrics: payload.metrics ?? null,
    };
    console.info("[IFC] pronto em", Math.round(performance.now() - t0), "ms");
    return group;
  } finally {
    worker.terminate();
  }
}
