import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import { LocalLightRig } from "./SafeEnvironment";
import { PHASE_COLORS } from "./BuildingModel";
import type { PhaseKey } from "./BuildingModel";

/**
 * Vista 3D isolada de UM elemento: a geometria já vem centrada na origem
 * (ver `extractElement`), aqui só é re-escalada para caber na câmara.
 */
export default function ElementViewer({
  geometry,
  phase,
  height = 260,
}: {
  geometry: THREE.BufferGeometry;
  phase?: PhaseKey | null;
  height?: number;
}) {
  const { scaled, color } = useMemo(() => {
    const g = geometry;
    g.computeBoundingBox();
    const size = new THREE.Vector3();
    g.boundingBox?.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return {
      scaled: 4 / maxDim,
      color: (phase && PHASE_COLORS[phase]) || "#7c8fa6",
    };
  }, [geometry, phase]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <div style={{ height }} className="w-full bg-gradient-to-b from-[hsl(220_30%_96%)] to-[hsl(220_25%_90%)]">
      <Canvas dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault position={[6, 5, 7]} fov={40} />
        <LocalLightRig />
        <group scale={scaled}>
          <mesh geometry={geometry}>
            <meshStandardMaterial color={color} metalness={0.05} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[geometry, 25]} />
            <lineBasicMaterial color="#0f2942" transparent opacity={0.5} />
          </lineSegments>
        </group>
        <Grid
          args={[20, 20]}
          position={[0, -2.4, 0]}
          cellColor="#b8c4d1"
          sectionColor="#93a3b5"
          fadeDistance={26}
          infiniteGrid
        />
        <OrbitControls enablePan autoRotate autoRotateSpeed={0.8} minDistance={3} maxDistance={24} />
      </Canvas>
    </div>
  );
}
