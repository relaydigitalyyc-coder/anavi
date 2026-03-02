import { useAuth } from "@/_core/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  attemptedPath?: string;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { capabilities } = useAppMode();
  const { user, loading } = useAuth({
    redirectOnUnauthenticated: capabilities.requireAuthRedirect,
  });

  if (loading) return null;
  if (capabilities.requireAuthRedirect && !user) return null;
  return <>{children}</>;
}
