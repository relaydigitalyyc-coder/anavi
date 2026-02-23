import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="relative min-h-screen bg-mesh flex items-center justify-center overflow-hidden font-sans">

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "oklch(0.65 0.19 230 / 0.06)", filter: "blur(80px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "oklch(0.65 0.22 280 / 0.05)", filter: "blur(80px)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "oklch(0.72 0.14 70 / 0.04)", filter: "blur(60px)" }} />

      {/* Glass panel */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="glass-dark rounded-2xl p-8 md:p-10 space-y-6">

          {/* Wordmark */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="text-2xl font-bold text-white tracking-tight">@navi</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D4F5] animate-glow-pulse" />
            </div>
            <p className="text-sm text-white/40">The Private Market Operating System</p>
          </div>

          {/* Form — keep existing handleSubmit */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#22D4F5]/50 focus:bg-white/[0.08] transition-all duration-200 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#22D4F5]/50 focus:bg-white/[0.08] transition-all duration-200 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C4972A] text-[#060A12] font-semibold text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </motion.button>
          </form>

          {/* Footer links */}
          <div className="flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-white/30 hover:text-white/60 transition-colors">
              Forgot password?
            </Link>
            <Link href="/register" className="text-white/30 hover:text-white/60 transition-colors">
              Create account
            </Link>
          </div>

        </div>
      </motion.div>

    </div>
  );
}
