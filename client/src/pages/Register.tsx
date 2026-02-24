import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#DC2626" };
  if (score <= 2) return { score, label: "Fair", color: "#F59E0B" };
  if (score <= 3) return { score, label: "Good", color: "#2563EB" };
  return { score, label: "Strong", color: "#16A34A" };
}

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function validate(): string | null {
    if (!fullName.trim()) return "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName.trim(), email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Registration failed. Please try again.");
        return;
      }

      window.location.href = "/onboarding";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border bg-white text-sm outline-none transition-colors focus:ring-2";

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

          <h2 className="text-2xl font-bold mb-1" style={{ color: "#0A1628" }}>Apply for Access</h2>
          <p className="text-sm mb-8" style={{ color: "#6B7280" }}>Create your account to join the network</p>

          {error && (
            <div className="mb-6 rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: "#0A1628" }}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
                style={{ height: 48, padding: "0 16px", borderColor: "#D1DCF0", color: "#0A1628" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D1DCF0")}
              />
            </div>

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
                className={inputClass}
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
                  placeholder="Minimum 8 characters"
                  className={inputClass}
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
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{ backgroundColor: i <= strength.score ? strength.color : "#E5E7EB" }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" style={{ color: strength.color }} />
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: "#0A1628" }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputClass}
                  style={{ height: 48, padding: "0 48px 0 16px", borderColor: "#D1DCF0", color: "#0A1628" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#D1DCF0")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ height: 48, borderRadius: 8, backgroundColor: "#C4972A" }}
            >
              {loading ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "#2563EB" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
