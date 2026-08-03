import { Suspense } from "react";
import { Environment } from "@react-three/drei";
import SceneErrorBoundary from "./SceneErrorBoundary";

/** Local, network-independent light rig. Always rendered. */
export function LocalLightRig() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffffff", "#334155", 0.85]} />
      <directionalLight position={[12, 18, 8]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-14, 8, -10]} intensity={0.35} />
    </>
  );
}

/**
 * Optional remote HDR environment. Opt-in only: when `enabled` is false we
 * render nothing extra and the local rig lights the scene. If the HDR fetch
 * fails the error boundary silently drops it instead of blanking the canvas.
 */
export default function SafeEnvironment({
  enabled,
  preset = "city",
  onError,
}: {
  enabled: boolean;
  preset?: "city" | "sunset" | "dawn" | "warehouse" | "apartment" | "studio";
  onError?: (msg: string) => void;
}) {
  if (!enabled) return null;
  return (
    <SceneErrorBoundary fallback={null} onError={onError}>
      <Suspense fallback={null}>
        <Environment preset={preset} />
      </Suspense>
    </SceneErrorBoundary>
  );
}
