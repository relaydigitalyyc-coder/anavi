import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, Shield } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Invalid email or password");
        return;
      }

      const data = await res.json().catch(() => ({}));
      const next = data?.user?.onboardingCompleted ? "/dashboard" : "/onboarding";
      window.location.href = next;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white" style={{ backgroundColor: "#0A1628" }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <Shield className="h-8 w-8" style={{ color: "#C4972A" }} />
            <span className="text-2xl font-bold tracking-tight">ANAVI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            The Private Market<br />Operating System
          </h1>
          <p className="text-lg opacity-70 max-w-md">
            Institutional-grade infrastructure for private capital allocation, deal flow management, and LP-GP coordination.
          </p>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-3xl font-bold" style={{ color: "#C4972A" }}>$13T+</p>
            <p className="text-sm opacity-60 mt-1">Assets Under Management</p>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#C4972A" }}>500+</p>
            <p className="text-sm opacity-60 mt-1">Network Members</p>
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#C4972A" }}>99.9%</p>
            <p className="text-sm opacity-60 mt-1">Platform Uptime</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8" style={{ backgroundColor: "#F3F7FC" }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Shield className="h-7 w-7" style={{ color: "#C4972A" }} />
            <span className="text-xl font-bold tracking-tight" style={{ color: "#0A1628" }}>ANAVI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "#0A1628" }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "#6B7280" }}>Sign in to your account to continue</p>

          {error && (
            <div className="mb-6 rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "#0A1628" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.com"
                className="w-full rounded-lg border bg-white text-sm outline-none transition-colors focus:ring-2"
                style={{ height: 48, padding: "0 16px", borderColor: "#D1DCF0", color: "#0A1628" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D1DCF0")}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "#0A1628" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border bg-white text-sm outline-none transition-colors focus:ring-2"
                  style={{ height: 48, padding: "0 48px 0 16px", borderColor: "#D1DCF0", color: "#0A1628" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#D1DCF0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password">
                <a className="text-sm font-medium hover:underline" style={{ color: "#2563EB" }}>
                  Forgot password?
                </a>
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ height: 48, borderRadius: 8, backgroundColor: "#0A1628" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: "#6B7280" }}>
            Don't have an account?{" "}
            <Link href="/register" className="font-medium hover:underline" style={{ color: "#C4972A" }}>
              Apply for Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
