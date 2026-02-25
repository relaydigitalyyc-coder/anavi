import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/demo"];

function getRedirectUrl(attemptedPath: string): string {
  if (!attemptedPath || attemptedPath === "/" || PUBLIC_PATHS.includes(attemptedPath)) {
    return "/login";
  }
  return `/login?redirect=${encodeURIComponent(attemptedPath)}`;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Path that triggered this route (for redirect param). Defaults to current location. */
  attemptedPath?: string;
}

/**
 * Protects routes by redirecting unauthenticated users to login.
 * Preserves intended path in ?redirect= for post-login navigation.
 * Shows loading state until auth is resolved (no flash of protected content).
 */
export function ProtectedRoute({ children, attemptedPath }: ProtectedRouteProps) {
  const [location] = useLocation();
  const path = attemptedPath ?? location;
  const redirectUrl = getRedirectUrl(path);

  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: redirectUrl,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // useAuth is redirecting
  }

  return <>{children}</>;
}
