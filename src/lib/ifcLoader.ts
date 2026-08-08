import * as THREE from "three";
import type { RebarTakeoff } from "./rebar";
import type { IfcClassPayload } from "@/workers/ifcWorker";

export type IfcProgress = { stage: "download" | "parse" | "geometry" | "merge"; elements: number };

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
  onProgress?: (p: IfcProgress) => void
): Promise<THREE.Group> {
  const worker = new Worker(new URL("../workers/ifcWorker.ts", import.meta.url), {
    type: "module",
  });

  try {
    const payload = await new Promise<{ classes: IfcClassPayload[]; rebar: RebarTakeoff | null }>(
      (resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          const msg = e.data;
          if (msg?.type === "progress") onProgress?.(msg as IfcProgress);
          else if (msg?.type === "result") resolve(msg);
          else if (msg?.type === "error") reject(new Error(msg.message));
        };
        worker.onerror = (e) => reject(new Error(e.message || "Worker IFC falhou"));
        worker.postMessage({ url });
      }
    );

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
    };
    return group;
  } finally {
    worker.terminate();
  }
}
