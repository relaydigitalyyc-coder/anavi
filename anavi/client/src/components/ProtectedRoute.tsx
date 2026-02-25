interface ProtectedRouteProps {
  children: React.ReactNode;
  attemptedPath?: string;
}

/**
 * Auth gate disabled — all routes are publicly accessible.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
