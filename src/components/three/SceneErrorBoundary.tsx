import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Rendered inside the Canvas when the scene subtree throws. */
  fallback?: ReactNode;
  onError?: (message: string) => void;
};

type State = { failed: boolean };

/**
 * Catches render/asset errors inside the R3F scene graph (e.g. a remote HDR
 * failing to load) so the Canvas never goes blank — we swap in a basic
 * light rig and keep the viewer interactive.
 */
export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    const msg = (error as any)?.message ?? String(error);
    console.warn("[3D] scene subtree failed, using fallback lighting:", msg);
    this.props.onError?.(msg);
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <>
            <ambientLight intensity={0.6} />
            <hemisphereLight args={["#ffffff", "#334155", 0.9]} />
            <directionalLight position={[10, 15, 8]} intensity={1} />
          </>
        )
      );
    }
    return <>{this.props.children}</>;
  }
}
