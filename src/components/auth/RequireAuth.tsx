import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-surface-sunken text-muted-foreground text-sm">
        A verificar sessão…
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
