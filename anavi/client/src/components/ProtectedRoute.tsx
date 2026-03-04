import { useAuth } from "@/_core/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  attemptedPath?: string;
}

function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F3F7FC]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C4972A]/20 border-t-[#C4972A]" />
        <p className="text-sm text-[#1E3A5F]/50 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { capabilities } = useAppMode();

  if (!capabilities.requireAuthRedirect) {
    return <>{children}</>;
  }

  return <AuthGate>{children}</AuthGate>;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading) return <LoadingSkeleton />;
  if (!user) return null;
  return <>{children}</>;
}
