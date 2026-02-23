import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen font-sans" style={{ backgroundColor: "#F3F7FC" }}>
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8" style={{ color: "#C4972A" }} />
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#0A1628" }}>
            ANAVI
          </span>
        </div>

        <h1 className="text-2xl font-bold" style={{ color: "#0A1628" }}>
          Reset password
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
          Enter the email address for your account and we’ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="mt-8 rounded-lg border px-4 py-4" style={{ backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }}>
            <p className="text-sm font-medium" style={{ color: "#059669" }}>
              If an account exists for that email, we’ve sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link href="/login">
              <a className="mt-4 inline-block text-sm font-medium hover:underline" style={{ color: "#2563EB" }}>
                Back to Sign in
              </a>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                className="rounded-lg border px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "#0A1628" }}>
                Email address
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
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ height: 48, borderRadius: 8, backgroundColor: "#2563EB" }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-medium" style={{ color: "#6B7280" }}>
          <ArrowLeft className="h-4 w-4" />
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}
