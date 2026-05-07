import { useMemo } from "react";
import * as THREE from "three";
import "@react-three/fiber";

export type PhaseKey = "fundacao" | "pilares" | "lajes" | "alvenaria" | "cobertura" | "acabamentos";

const COLORS: Record<PhaseKey, string> = {
  fundacao: "#6b7280",
  pilares: "#1e3a5f",
  lajes: "#94a3b8",
  alvenaria: "#c97b4a",
  cobertura: "#5c2018",
  acabamentos: "#e8d5b7",
};

const HIGHLIGHT = "#f59e0b";

// Building footprint
const W = 12; // X
const D = 8;  // Z
const FLOORS = 3;
const FLOOR_H = 3;
const COL_X = [-W / 2 + 0.4, 0, W / 2 - 0.4];
const COL_Z = [-D / 2 + 0.4, D / 2 - 0.4];

function phaseColor(phase: PhaseKey, selected: PhaseKey | null, visible: boolean) {
  if (!visible) return null;
  if (selected && selected === phase) return HIGHLIGHT;
  if (selected && selected !== phase) return COLORS[phase];
  return COLORS[phase];
}

function PhaseGroup({
  phase,
  selected,
  onSelect,
  children,
}: {
  phase: PhaseKey;
  selected: PhaseKey | null;
  onSelect: (p: PhaseKey) => void;
  children: (color: string, opacity: number) => React.ReactNode;
}) {
  const isSel = selected === phase;
  const dim = selected !== null && !isSel;
  const color = isSel ? HIGHLIGHT : COLORS[phase];
  const opacity = dim ? 0.18 : 1;
  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(phase);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children(color, opacity)}
    </group>
  );
}

function mat(color: string, opacity: number) {
  return (
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      roughness={0.7}
      metalness={0.05}
    />
  );
}

export default function BuildingModel({
  selected,
  onSelect,
  visiblePhases,
}: {
  selected: PhaseKey | null;
  onSelect: (p: PhaseKey) => void;
  visiblePhases: Set<PhaseKey>;
}) {
  const columnPositions = useMemo(() => {
    const arr: [number, number][] = [];
    for (const x of COL_X) for (const z of COL_Z) arr.push([x, z]);
    return arr;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* FUNDAÇÃO */}
      {visiblePhases.has("fundacao") && (
        <PhaseGroup phase="fundacao" selected={selected} onSelect={onSelect}>
          {(c, o) => (
            <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[W + 1.2, 0.8, D + 1.2]} />
              {mat(c, o)}
            </mesh>
          )}
        </PhaseGroup>
      )}

      {/* PILARES */}
      {visiblePhases.has("pilares") && (
        <PhaseGroup phase="pilares" selected={selected} onSelect={onSelect}>
          {(c, o) => (
            <>
              {Array.from({ length: FLOORS }).map((_, f) =>
                columnPositions.map(([x, z], i) => (
                  <mesh
                    key={`${f}-${i}`}
                    position={[x, f * FLOOR_H + FLOOR_H / 2, z]}
                    castShadow
                  >
                    <boxGeometry args={[0.45, FLOOR_H, 0.45]} />
                    {mat(c, o)}
                  </mesh>
                ))
              )}
            </>
          )}
        </PhaseGroup>
      )}

      {/* LAJES */}
      {visiblePhases.has("lajes") && (
        <PhaseGroup phase="lajes" selected={selected} onSelect={onSelect}>
          {(c, o) => (
            <>
              {Array.from({ length: FLOORS }).map((_, f) => (
                <mesh
                  key={f}
                  position={[0, (f + 1) * FLOOR_H, 0]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[W, 0.22, D]} />
                  {mat(c, o)}
                </mesh>
              ))}
            </>
          )}
        </PhaseGroup>
      )}

      {/* ALVENARIA */}
      {visiblePhases.has("alvenaria") && (
        <PhaseGroup phase="alvenaria" selected={selected} onSelect={onSelect}>
          {(c, o) => (
            <>
              {Array.from({ length: FLOORS }).map((_, f) => {
                const y = f * FLOOR_H + FLOOR_H / 2;
                return (
                  <group key={f}>
                    {/* front (with gap = window) */}
                    <mesh position={[-W / 4, y, D / 2]}>
                      <boxGeometry args={[W / 2 - 1, FLOOR_H - 0.4, 0.18]} />
                      {mat(c, o)}
                    </mesh>
                    <mesh position={[W / 4, y, D / 2]}>
                      <boxGeometry args={[W / 2 - 1, FLOOR_H - 0.4, 0.18]} />
                      {mat(c, o)}
                    </mesh>
                    {/* back */}
                    <mesh position={[0, y, -D / 2]}>
                      <boxGeometry args={[W, FLOOR_H - 0.4, 0.18]} />
                      {mat(c, o)}
                    </mesh>
                    {/* left */}
                    <mesh position={[-W / 2, y, 0]}>
                      <boxGeometry args={[0.18, FLOOR_H - 0.4, D]} />
                      {mat(c, o)}
                    </mesh>
                    {/* right */}
                    <mesh position={[W / 2, y, 0]}>
                      <boxGeometry args={[0.18, FLOOR_H - 0.4, D]} />
                      {mat(c, o)}
                    </mesh>
                  </group>
                );
              })}
            </>
          )}
        </PhaseGroup>
      )}

      {/* COBERTURA */}
      {visiblePhases.has("cobertura") && (
        <PhaseGroup phase="cobertura" selected={selected} onSelect={onSelect}>
          {(c, o) => {
            const y = FLOORS * FLOOR_H + 0.2;
            const shape = new THREE.Shape();
            shape.moveTo(-W / 2 - 0.3, 0);
            shape.lineTo(W / 2 + 0.3, 0);
            shape.lineTo(0, 1.6);
            shape.lineTo(-W / 2 - 0.3, 0);
            return (
              <mesh
                position={[0, y, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              >
                <extrudeGeometry args={[shape, { depth: D + 0.6, bevelEnabled: false }]} />
                {mat(c, o)}
              </mesh>
            );
          }}
        </PhaseGroup>
      )}

      {/* ACABAMENTOS — janelas / porta */}
      {visiblePhases.has("acabamentos") && (
        <PhaseGroup phase="acabamentos" selected={selected} onSelect={onSelect}>
          {(c, o) => (
            <>
              {Array.from({ length: FLOORS }).map((_, f) => {
                const y = f * FLOOR_H + FLOOR_H / 2;
                return (
                  <mesh key={f} position={[0, y, D / 2 + 0.02]}>
                    <boxGeometry args={[1.6, 1.4, 0.06]} />
                    {mat(c, o)}
                  </mesh>
                );
              })}
              <mesh position={[-3, 1, D / 2 + 0.02]}>
                <boxGeometry args={[1.2, 2.2, 0.06]} />
                {mat(c, o)}
              </mesh>
            </>
          )}
        </PhaseGroup>
      )}

      {/* Ground */}
      <mesh position={[0, -0.81, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#e6e9ef" roughness={1} />
      </mesh>
    </group>
  );
}

export const PHASE_COLORS = COLORS;