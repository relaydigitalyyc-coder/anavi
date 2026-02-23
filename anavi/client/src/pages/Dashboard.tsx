import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";
import { toast } from "sonner";

const NOTIFICATION_STYLES: Record<
  string,
  { border: string; badge: string; label: string }
> = {
  match_found: {
    border: "border-l-[#C4972A]",
    badge: "bg-[#C4972A]/15 text-[#C4972A]",
    label: "MATCH",
  },
  deal_update: {
    border: "border-l-[#2563EB]",
    badge: "bg-[#2563EB]/15 text-[#2563EB]",
    label: "DEAL ROOM",
  },
  payout_received: {
    border: "border-l-[#059669]",
    badge: "bg-[#059669]/15 text-[#059669]",
    label: "ATTRIBUTION",
  },
  compliance_alert: {
    border: "border-l-[#1E3A5F]",
    badge: "bg-[#1E3A5F]/15 text-[#1E3A5F]",
    label: "VERIFICATION",
  },
};

const DEFAULT_STYLE = {
  border: "border-l-[#0A1628]",
  badge: "bg-[#0A1628]/15 text-[#0A1628]",
  label: "INTELLIGENCE",
};

const MARKET_DEPTH = [
  { sector: "Solar", buyers: 47, sellers: 12 },
  { sector: "Oil & Gas", buyers: 23, sellers: 8 },
  { sector: "Real Estate", buyers: 34, sellers: 19 },
  { sector: "Infrastructure", buyers: 15, sellers: 6 },
];

const PENDING_ACTIONS = [
  { text: "Complete Tier 2 verification", Icon: Shield },
  { text: "Review 3 new matches", Icon: Target },
  { text: "Sign NDA for Deal Room #12", Icon: FileText },
];

function getScoreColor(score: number) {
  if (score > 70) return "#059669";
  if (score >= 40) return "#F59E0B";
  return "#DC2626";
}

function TrustRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="#0A1628"
        strokeWidth="8"
        opacity="0.12"
      />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        className="transition-all duration-700"
      />
    </svg>
  );
}

function DashCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-elevated p-6 ${className}`}>
      <h3 className="mb-4 data-label">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Welcome Banner (shown once after onboarding) ───────────────────────────
const PERSONA_SUBTITLES: Record<string, string> = {
  originator: "Your first relationship has been custodied. Deal matching is live.",
  investor:   "Your investment intent is broadcasting to verified counterparties.",
  developer:  "Your project is verified. Qualified capital matches are incoming.",
  allocator:  "Your fund mandate is active. Institutional pipeline is open.",
  acquirer:   "Your acquisition criteria are live. Confidential matches are sourcing.",
};

const PERSONA_LABELS: Record<string, string> = {
  originator: "Deal Originator",
  investor:   "Investor",
  developer:  "Project Developer",
  allocator:  "Institutional Allocator",
  acquirer:   "Strategic Acquirer",
};

function WelcomeBanner({ name, persona, onDismiss }: { name: string; persona: string; onDismiss: () => void }) {
  const subtitle = PERSONA_SUBTITLES[persona] ?? "Your profile is ready.";
  const personaLabel = PERSONA_LABELS[persona] ?? persona;
  return (
    <div className="mb-6 card-elevated border-l-4 border-l-[#C4972A] p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C4972A]/15">
          <svg className="h-4 w-4 text-[#C4972A]" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0A1628]">
            Welcome, {name}. Your {personaLabel} profile is ready.
          </p>
          <p className="mt-0.5 text-sm text-[#1E3A5F]/70">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="mt-0.5 shrink-0 rounded p-1 text-[#1E3A5F]/40 hover:bg-[#1E3A5F]/8 hover:text-[#1E3A5F]/70 transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 py-2 lg:grid-cols-[280px_1fr_280px]">
      <div className="space-y-6">
        <div className="card-elevated p-6">
          <div className="h-4 w-24 animate-shimmer rounded mb-4" />
          <div className="mx-auto h-[140px] w-[140px] animate-shimmer rounded-full" />
          <div className="mt-4 h-3 w-20 animate-shimmer rounded mx-auto" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-shimmer rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-24 animate-shimmer rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-shimmer rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-elevated p-6">
            <div className="h-4 w-32 animate-shimmer rounded mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 animate-shimmer rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function MarketDepthBar({ label, value, max, index = 0 }: { label: string; value: number; max: number; index?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right font-data-hud text-[10px] text-[#1E3A5F]/60">{value}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#0A1628]/6">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: label === "buyers" ? "#2563EB" : "#C4972A" }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [welcomePersona, setWelcomePersona] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem("anavi_onboarding");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const welcomed = localStorage.getItem("anavi_welcomed");
      if (welcomed) return null;
      return parsed.persona ?? null;
    } catch {
      return null;
    }
  });

  const handleDismissWelcome = useCallback(() => {
    localStorage.setItem("anavi_welcomed", "true");
    setWelcomePersona(null);
  }, []);

  const { data: stats, isLoading: statsLoading } = trpc.user.getStats.useQuery();
  const { data: notificationsData, isLoading: notificationsLoading } = trpc.notification.list.useQuery({
    limit: 10,
  });
  const { data: payouts } = trpc.payout.list.useQuery();

  useEffect(() => { document.title = "Dashboard | ANAVI"; }, []);

  const loading = statsLoading || notificationsLoading;
  const notifications = notificationsData ?? [];
  const rawScore = Number(stats?.trustScore ?? 0);
  const trustScore = rawScore > 100 ? rawScore / 10 : rawScore;
  const scoreColor = getScoreColor(trustScore);
  const maxDepth = Math.max(...MARKET_DEPTH.map((m) => Math.max(m.buyers, m.sellers)));

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {welcomePersona && (
        <WelcomeBanner
          name={user?.name?.split(" ")[0] ?? "there"}
          persona={welcomePersona}
          onDismiss={handleDismissWelcome}
        />
      )}
      {/* E13: Personalized greeting */}
      <FadeInView>
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="dash-heading text-3xl">
              {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1 text-sm text-[#1E3A5F]/60">
              {notifications.length > 0
                ? `${notifications.length} new notification${notifications.length > 1 ? "s" : ""}`
                : "You're all caught up"}{" "}
              &middot; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </FadeInView>

      <div className="grid grid-cols-1 gap-6 py-2 lg:grid-cols-[280px_1fr_280px]">
        {/* ───────── Left Column ───────── */}
        <StaggerContainer className="space-y-6">
          {/* Trust Score Widget — E11: clickable */}
          <StaggerItem>
            <Link href="/verification">
              <div className="group cursor-pointer card-elevated p-6 text-center hover:translate-y-[-2px]">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
                  Trust Score
                </h3>

                <div className="relative mx-auto w-[140px] transition-transform duration-200 group-hover:scale-105">
                  <TrustRing score={trustScore} />
                  <span
                    className="font-data-hud text-4xl font-bold absolute inset-0 flex items-center justify-center"
                    style={{ color: scoreColor }}
                  >
                    <SmoothCounter value={Math.round(trustScore)} duration={1} />
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#1E3A5F]/60">
                  <TrendingUp className="mr-1 inline h-3 w-3" style={{ color: "#059669" }} />
                  <span style={{ color: "#059669" }}>+3</span> this month
                </p>

                {stats?.verificationLevel && (
                  <span className="mt-3 inline-block rounded-full bg-[#0A1628]/10 px-3 py-1 text-xs font-semibold text-[#0A1628]">
                    {stats.verificationLevel}
                  </span>
                )}

                <p className="mt-2 text-[10px] uppercase tracking-wider text-[#1E3A5F]/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Click to view breakdown →
                </p>
              </div>
            </Link>
          </StaggerItem>

          {/* E12: Quick Actions with ElasticButton feel + toast */}
          <StaggerItem>
            <div className="space-y-2">
              <Link href="/deal-matching">
                <button
                  className="btn-gold w-full rounded-lg px-4 py-3 text-sm font-semibold transition-transform active:scale-[0.97]"
                  onClick={() => toast.success("Navigating to Deal Matching")}
                >
                  Create Intent
                </button>
              </Link>
              <Link href="/relationships">
                <button
                  className="w-full rounded-lg bg-[#C4972A] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#C4972A]/90 active:scale-[0.97]"
                  onClick={() => toast.success("Navigating to Relationships")}
                >
                  Protect Relationship
                </button>
              </Link>
              <Link href="/deal-matching">
                <button className="w-full rounded-lg border border-[#D1DCF0] bg-white px-4 py-3 text-sm font-semibold text-[#1E3A5F] transition-colors hover:bg-[#F3F7FC]">
                  View Matches
                </button>
              </Link>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* ───────── Center Column ───────── */}
        <FadeInView delay={0.1}>
          <h2 className="mb-4 dash-heading text-2xl">Activity</h2>

          {notifications.length > 0 ? (
            <StaggerContainer className="space-y-3">
              {notifications.map((n, idx) => {
                const style = NOTIFICATION_STYLES[n.type] ?? DEFAULT_STYLE;
                return (
                  <StaggerItem key={n.id}>
                    <div
                      className={`card-elevated border-l-4 p-4 hover:translate-y-[-2px] ${style.border}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
                        >
                          {style.label}
                        </span>
                        {/* E9: pulse dot on newest */}
                        {idx === 0 && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C4972A] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C4972A]" />
                          </span>
                        )}
                        <span className="font-data-mono text-[#1E3A5F]/50">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0A1628]">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm text-[#1E3A5F]/70">
                        {n.message}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          ) : (
            <div className="card-elevated p-6">
              <EmptyState {...EMPTY_STATES.notifications} />
            </div>
          )}
        </FadeInView>

        {/* ───────── Right Column ───────── */}
        <StaggerContainer className="space-y-6">
          {/* E10: Market Depth — horizontal bar chart */}
          <StaggerItem>
            <DashCard title="Market Depth">
              <div className="space-y-4">
                {MARKET_DEPTH.map((m, i) => (
                  <div key={m.sector}>
                    <p className="mb-1.5 text-xs font-semibold text-[#0A1628]">{m.sector}</p>
                    <MarketDepthBar label="buyers" value={m.buyers} max={maxDepth} index={i * 2} />
                    <MarketDepthBar label="sellers" value={m.sellers} max={maxDepth} index={i * 2 + 1} />
                  </div>
                ))}
                <div className="flex items-center gap-4 border-t border-[#D1DCF0] pt-2 text-[10px] text-[#1E3A5F]/60">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#2563EB]" /> Buyers</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#C4972A]" /> Sellers</span>
                </div>
              </div>
            </DashCard>
          </StaggerItem>

          {/* E14: Pending Actions with badges */}
          <StaggerItem>
            <DashCard title="Pending Actions">
              <div className="space-y-3">
                {PENDING_ACTIONS.map((a) => (
                  <div key={a.text} className="flex items-center gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]/5">
                      <a.Icon className="h-4 w-4 text-[#1E3A5F]/60" />
                    </span>
                    <span className="flex-1 text-[#0A1628]">{a.text}</span>
                    <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F59E0B]">
                      action
                    </span>
                  </div>
                ))}
              </div>
            </DashCard>
          </StaggerItem>

          {/* Recent Payouts */}
          <StaggerItem>
            <DashCard title="Recent Payouts">
              <p className="mb-3 text-lg font-bold text-[#0A1628]">
                Next Payout:{" "}
                <span className="text-[#059669]">
                  $<SmoothCounter value={92000} prefix="" duration={1.2} />
                </span>
              </p>
              {payouts && payouts.length > 0 ? (
                <div className="space-y-2">
                  {payouts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between card-elevated px-3 py-2.5 text-sm hover:translate-y-[-1px]"
                    >
                      <div>
                        <span className="font-semibold text-[#0A1628]">
                          ${parseFloat(p.amount).toLocaleString()}
                        </span>
                        <span className="ml-2 text-xs text-[#1E3A5F]/60">
                          {p.payoutType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          p.status === "completed"
                            ? "bg-[#059669]/15 text-[#059669]"
                            : p.status === "pending"
                              ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                              : "bg-[#2563EB]/15 text-[#2563EB]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState {...EMPTY_STATES.payouts} />
              )}
            </DashCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </DashboardLayout>
  );
}
