import { useAuth } from "@/_core/hooks/useAuth";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { trpc } from "@/lib/trpc";
import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Lock,
  Shield,
  Target,
  TrendingUp,
  Clock,
  Fingerprint,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Link } from "wouter";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";
import { toast } from "sonner";
import { DASHBOARD, NOTIFICATIONS, TOASTS } from "@/lib/copy";
import { NOTIFICATION_STYLES, DEFAULT_STYLE, MARKET_DEPTH, PENDING_ACTIONS } from "./constants";
import {
  getScoreColor,
  TrustRing,
  DashCard,
  WelcomeBanner,
  DashboardSkeleton,
  MaybeLink,
  getGreeting,
  MarketDepthBar,
} from "./atoms";export function OriginatorDashboardContent() {
  const demo = useDemoFixtures();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { user: liveUser } = useAuth();
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
  const [moduleHintDismissed, setModuleHintDismissed] = useState(() => {
    try {
      return localStorage.getItem("anavi_originator_module_hint_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const handleDismissWelcome = useCallback(() => {
    localStorage.setItem("anavi_welcomed", "true");
    setWelcomePersona(null);
  }, []);

  const user = demo ? demo.user : liveUser;

  const { data: stats, isLoading: statsLoading } = trpc.user.getStats.useQuery(
    undefined,
    { enabled: !demo }
  );
  const { data: notificationsData, isLoading: notificationsLoading } =
    trpc.notification.list.useQuery({ limit: 10 }, { enabled: !demo });
  const { data: payouts } = trpc.payout.list.useQuery(undefined, {
    enabled: !demo,
  });

  useEffect(() => {
    document.title = "Dashboard | ANAVI";
  }, []);

  const loading = demo ? false : statsLoading || notificationsLoading;

  // Demo notifications have a slightly different shape — normalize here.
  // Map fixture time strings to approximate Date offsets so relative timestamps are accurate.
  const FIXTURE_TIME_OFFSETS: Record<string, number> = {
    "30 minutes ago": 30 * 60 * 1000,
    "1 hour ago": 1 * 60 * 60 * 1000,
    "2 hours ago": 2 * 60 * 60 * 1000,
    "4 hours ago": 4 * 60 * 60 * 1000,
    Yesterday: 24 * 60 * 60 * 1000,
    "2 days ago": 2 * 24 * 60 * 60 * 1000,
    "3 days ago": 3 * 24 * 60 * 60 * 1000,
  };
  const demoNotifications = demo?.notifications.map(n => ({
    id: String(n.id),
    type: n.type,
    title: n.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    message: n.message,
    createdAt: new Date(
      Date.now() - (FIXTURE_TIME_OFFSETS[n.time] ?? 0)
    ).toISOString(),
  }));
  const notifications = demoNotifications ?? notificationsData ?? [];

  const trustScore = Number(demo?.user.trustScore ?? stats?.trustScore ?? 0);
  const scoreColor = getScoreColor(trustScore);
  const maxDepth = Math.max(
    ...MARKET_DEPTH.map(m => Math.max(m.buyers, m.sellers))
  );

  const trustScoreDelta = demo ? 3 : (stats?.trustScoreDelta ?? 0);
  const nextPayoutAmount = demo
    ? 92000
    : parseFloat(String(stats?.pendingPayouts ?? "0"));

  // Demo data for new widgets
  const demoRelationships = demo?.relationships ?? [
    {
      id: 1,
      name: "Al-Futtaim Group",
      custodyAge: "2 years",
      attributionStatus: "Active",
    },
    {
      id: 2,
      name: "Riyadh Solar JV",
      custodyAge: "11 months",
      attributionStatus: "Pending Payout",
    },
  ];
  const demoIntents = demo?.intents ?? [
    { id: 1, type: "buy", assetClass: "Solar", size: "$10M - $50M" },
    { id: 2, type: "sell", assetClass: "Real Estate", size: "$5M - $20M" },
  ];
  const matchBands = {
    top: (demo?.matches ?? []).filter((match) => match.compatibilityScore >= 90).length,
    mid: (demo?.matches ?? []).filter((match) => match.compatibilityScore >= 80 && match.compatibilityScore < 90).length,
    low: (demo?.matches ?? []).filter((match) => match.compatibilityScore < 80).length,
  };
  const relationshipPaths = (demo?.relationships ?? []).slice(0, 3).map((relationship, index) => ({
    id: relationship.id,
    label: `${relationship.name} -> ${(demo?.matches[index]?.assetClass ?? "Private Markets")} mandate`,
    confidence: Math.max(72, Math.min(96, Number(relationship.trustScore) + 2)),
    status: relationship.attributionStatus,
  }));
  const stalledPipeline = (demo?.matches ?? [])
    .map((match) => ({
      id: match.id,
      label: match.tag,
      hours: Math.max(18, 56 - match.compatibilityScore / 2),
      risk: match.compatibilityScore >= 90 ? "moderate" : "high",
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 3);
  const telemetry = (demo as unknown as { opsTelemetry?: { activity24h?: number; activity7d?: number } } | null)?.opsTelemetry;
  const activityVelocity = {
    now24h: Number(telemetry?.activity24h ?? 12),
    now7d: Number(telemetry?.activity7d ?? 44),
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {welcomePersona && (
        <WelcomeBanner
          name={user?.name?.split(" ")[0] ?? "there"}
          persona={welcomePersona}
          onDismiss={handleDismissWelcome}
        />
      )}
      {/* E13: Personalized greeting */}
      <FadeInView>
        <div
          data-tour="dashboard"
          className="mb-6 flex items-baseline justify-between"
        >
          <div>
            <h1 className="dash-heading text-3xl">
              {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1 text-sm text-[#1E3A5F]/60">
              {notifications.length > 0
                ? `${notifications.length} new notification${notifications.length > 1 ? "s" : ""}`
                : "You're all caught up"}{" "}
              &middot;{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-[#C4972A]">
              Industry Lens: {industry}
            </p>
          </div>
        </div>
      </FadeInView>

      {/* Trust Score Hero Section - Elevated and Wider */}
      <StaggerContainer className="mb-6">
        <StaggerItem>
          <MaybeLink href="/verification" demo={!!demo}>
            <div
              data-tour="trust-score"
              className="group cursor-pointer card-elevated p-8 text-center hover:translate-y-[-2px] transition-transform duration-200"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
                {DASHBOARD.trustScore.title}
              </h3>

              <div className="relative mx-auto w-[180px] transition-transform duration-200 group-hover:scale-105">
                <TrustRing score={trustScore} size={180} strokeWidth={10} />
                <span
                  className="font-data-hud text-5xl font-bold absolute inset-0 flex items-center justify-center"
                  style={{ color: scoreColor }}
                >
                  <SmoothCounter value={Math.round(trustScore)} duration={1} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-left">
                {[
                  { label: "Verification Depth", value: demo ? "Tier 2+" : "Tiered" },
                  { label: "Counterparty Acceptance", value: `${Math.min(99, Math.max(68, Math.round(trustScore + 12)))}%` },
                  { label: "Audit Integrity", value: "Immutable" },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-2 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#1E3A5F]/50">{metric.label}</p>
                    <p className="text-xs font-semibold text-[#0A1628] mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <MaybeLink href="/verification" demo={!!demo}>
                  <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                    Review Verification
                  </button>
                </MaybeLink>
                <MaybeLink href="/custody?minTrust=80&status=active" demo={!!demo}>
                  <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                    Warm Relationships
                  </button>
                </MaybeLink>
              </div>

              <p className="mt-4 text-xs text-[#1E3A5F]/60">
                <TrendingUp
                  className="mr-1 inline h-3 w-3"
                  style={{ color: trustScoreDelta > 0 ? "#059669" : "#F59E0B" }}
                />
                <span
                  style={{ color: trustScoreDelta > 0 ? "#059669" : "#F59E0B" }}
                >
                  {DASHBOARD.trustScore.scoreChange(trustScoreDelta)}
                </span>
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(demo?.user.tier ?? stats?.verificationLevel) && (
                  <span className="inline-block rounded-full bg-[#0A1628]/10 px-3 py-1 text-xs font-semibold text-[#0A1628]">
                    {demo?.user.tier ?? stats?.verificationLevel} Verification
                    Tier
                  </span>
                )}
                {/* Placeholder for Whitelist Status */}
                <span className="inline-block rounded-full bg-[#059669]/10 px-3 py-1 text-xs font-semibold text-[#059669]">
                  {DASHBOARD.trustScore.whitelistStatus} Active
                </span>
              </div>

              <p className="mt-3 text-xs text-[#1E3A5F]/50 max-w-xs mx-auto">
                {DASHBOARD.trustScore.compoundNature}
              </p>

              {!demo && (
                <p className="mt-3 text-[10px] uppercase tracking-wider text-[#1E3A5F]/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {DASHBOARD.trustScore.breakdownCta}
                </p>
              )}
            </div>
          </MaybeLink>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 gap-6 py-2 lg:grid-cols-[280px_1fr_280px]">
        {!moduleHintDismissed && (
          <div className="lg:col-span-3 mb-2 rounded-lg border border-[#2563EB]/20 bg-[#2563EB]/8 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">Module Hint</p>
                <p className="mt-1 text-sm text-[#1E3A5F]/75">
                  Start on `Pipeline Stall Alerts`, then action `Escalate Blockers` to clear near-term throughput risk.
                </p>
              </div>
              <button
                className="rounded px-2 py-1 text-xs font-semibold text-[#1E3A5F]/50 hover:bg-[#1E3A5F]/8"
                onClick={() => {
                  setModuleHintDismissed(true);
                  try {
                    localStorage.setItem("anavi_originator_module_hint_dismissed", "true");
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {/* ───────── Left Column ───────── */}
        <StaggerContainer className="space-y-6">
          {/* Your Active Intents Widget */}
          <StaggerItem>
            <DashCard title={DASHBOARD.activeIntents.title}>
              {demoIntents.length > 0 ? (
                <div className="space-y-3">
                  {demoIntents.map(intent => (
                    <div
                      key={intent.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${intent.type === "buy" ? "bg-[#2563EB]/10" : "bg-[#C4972A]/10"}`}
                      >
                        {intent.type === "buy" ? (
                          <Target className="h-4 w-4 text-[#2563EB]" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-[#C4972A]" />
                        )}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-[#0A1628]">
                          {intent.type.toUpperCase()} {intent.assetClass}
                        </p>
                        <p className="text-xs text-[#1E3A5F]/60">
                          {intent.size}
                        </p>
                      </div>
                    </div>
                  ))}
                  <MaybeLink href="/deal-matching" demo={!!demo}>
                    <button className="mt-2 text-xs font-semibold text-[#2563EB] hover:text-[#2563EB]/80 uppercase tracking-wider transition-colors">
                      {DASHBOARD.activeIntents.manageCta}
                    </button>
                  </MaybeLink>
                </div>
              ) : (
                <EmptyState
                  {...EMPTY_STATES.intents}
                  title={DASHBOARD.activeIntents.noIntents}
                />
              )}
            </DashCard>
          </StaggerItem>

          {/* Relationship Custody Widget */}
          <StaggerItem>
            <DashCard
              title={DASHBOARD.custodiedRelationships.title}
              dataTour="relationships"
            >
              {demoRelationships.length > 0 ? (
                <div className="space-y-3">
                  {demoRelationships.map(rel => (
                    <div
                      key={rel.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]/5">
                        <Fingerprint className="h-4 w-4 text-[#1E3A5F]/60" />
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-[#0A1628]">
                          {rel.name}
                        </p>
                        <p className="text-xs text-[#1E3A5F]/60">
                          {DASHBOARD.custodiedRelationships.custodyAge}{" "}
                          {rel.custodyAge} &middot; {rel.attributionStatus}
                        </p>
                      </div>
                    </div>
                  ))}
                  <p className="mt-4 text-xs text-[#1E3A5F]/50 flex items-center gap-1">
                    <Lock className="h-3 w-3" />{" "}
                    {DASHBOARD.custodiedRelationships.attributionCue}
                  </p>
                  <MaybeLink href="/relationships" demo={!!demo}>
                    <button
                      className="btn-gold w-full rounded-lg px-4 py-3 text-sm font-semibold transition-transform active:scale-[0.97] mt-4"
                      onClick={() => {
                        if (!demo)
                          toast.success(TOASTS.navigatingRelationships);
                      }}
                    >
                      {DASHBOARD.custodiedRelationships.protectCta}
                    </button>
                  </MaybeLink>
                  <MaybeLink href="/relationships" demo={!!demo}>
                    <button className="w-full rounded-lg border border-[#D1DCF0] bg-white px-4 py-3 text-sm font-semibold text-[#1E3A5F] transition-colors hover:bg-[#F3F7FC] mt-2">
                      {DASHBOARD.custodiedRelationships.viewRegisterCta}
                    </button>
                  </MaybeLink>
                </div>
              ) : (
                <>
                  <EmptyState
                    {...EMPTY_STATES.relationships}
                    title={DASHBOARD.custodiedRelationships.noRelationships}
                  />
                  <MaybeLink href="/relationships" demo={!!demo}>
                    <button
                      className="btn-gold w-full rounded-lg px-4 py-3 text-sm font-semibold transition-transform active:scale-[0.97] mt-4"
                      onClick={() => {
                        if (!demo)
                          toast.success(TOASTS.navigatingRelationships);
                      }}
                    >
                      {DASHBOARD.custodiedRelationships.protectCta}
                    </button>
                  </MaybeLink>
                </>
              )}
            </DashCard>
          </StaggerItem>

          {/* Create Intent Button - now part of Active Intents widget, but keeping data-tour for compatibility */}
          <StaggerItem>
            <MaybeLink href="/deal-matching" demo={!!demo}>
              <button
                data-tour="create-intent"
                className="btn-gold w-full rounded-lg px-4 py-3 text-sm font-semibold transition-transform active:scale-[0.97] hidden" // Hidden as it's now in Active Intents
                onClick={() => {
                  if (!demo) toast.success(TOASTS.navigatingDealMatching);
                }}
              >
                Create Intent
              </button>
            </MaybeLink>
          </StaggerItem>
        </StaggerContainer>

        {/* ───────── Center Column ───────── */}
        <FadeInView delay={0.1}>
          {/* Blind Matches — always present so onboardingTour can target it. */}
          <div data-tour="deal-matching" className="mb-6">
            <h2 className="mb-3 dash-heading text-xl">
              {DASHBOARD.blindMatches.title}
            </h2>
            {demo && demo.matches.length > 0 ? (
              <StaggerContainer className="space-y-3">
                {demo.matches.map((m, idx) => (
                  <StaggerItem key={m.id}>
                    <div
                      data-tour={idx === 0 ? "match-card" : undefined}
                      className="card-elevated border-l-4 border-l-[#C4972A] p-4 hover:translate-y-[-2px] relative overflow-hidden"
                    >
                      {/* Sealed Intelligence Brief Aesthetic */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628]/5 to-transparent pointer-events-none" />
                      <div className="absolute top-0 right-0 h-16 w-16 bg-[#C4972A]/5 rounded-bl-full" />

                      <div className="mb-2 flex items-start justify-between gap-2 z-10 relative">
                        <span className="rounded-full bg-[#C4972A]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C4972A]">
                          {DASHBOARD.blindMatches.sealedStatus} — {m.assetClass}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-[#1E3A5F]/40" />
                          <span className="text-[10px] uppercase tracking-wider text-[#1E3A5F]/40">
                            {DASHBOARD.blindMatches.sealedStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[#0A1628] mb-2 z-10 relative">
                        {m.tag}
                      </p>
                      <div className="mb-2 flex flex-wrap gap-1.5 z-10 relative">
                        <span className="rounded-full bg-[#059669]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                          Verified Passport
                        </span>
                        <span className="rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                          Identity Sealed
                        </span>
                      </div>
                      <div className="flex items-center gap-3 z-10 relative">
                        <span className="text-xs text-[#1E3A5F]/60 bg-[#1E3A5F]/5 rounded px-2 py-0.5">
                          {m.dealSize}
                        </span>
                        <span
                          className="ml-auto font-data-hud text-sm font-bold"
                          style={{
                            color:
                              m.compatibilityScore >= 90
                                ? "#059669"
                                : "#C4972A",
                          }}
                        >
                          {m.compatibilityScore}% match
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[#1E3A5F]/55 z-10 relative">
                        <span>Mutual consent required for disclosure</span>
                        <span className="font-semibold text-[#1E3A5F]/70">Blind Matching</span>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="card-elevated p-6">
                <EmptyState
                  {...EMPTY_STATES.matches}
                  title={DASHBOARD.blindMatches.noMatches}
                />
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <MaybeLink href="/pipeline?minScore=85&status=pending_consent" demo={!!demo}>
                <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                  Open High-Score Pipeline
                </button>
              </MaybeLink>
            </div>
          </div>

          {/* Deal Rooms — always present, even if empty */}
          <div className="mb-6">
            <h2 className="mb-3 dash-heading text-xl">
              {DASHBOARD.dealRooms.title}
            </h2>
            {demo && demo.dealRooms.length > 0 ? (
              <StaggerContainer className="space-y-3">
                {demo.dealRooms.map((dr, idx) => (
                  <StaggerItem key={dr.id}>
                    <div
                      data-tour={idx === 0 ? "deal-room" : undefined}
                      className="card-elevated border-l-4 border-l-[#2563EB] p-4 hover:translate-y-[-2px]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0A1628]">
                          {dr.name}
                        </p>
                        <span className="rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                          {dr.stage}
                        </span>
                      </div>
                      <p className="text-xs text-[#1E3A5F]/60 mb-3">
                        {dr.counterparty}
                      </p>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[#059669]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                          Verified Counterparty
                        </span>
                        <span className="rounded-full bg-[#C4972A]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C4972A]">
                          Attribution-Protected
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#1E3A5F]/50 mb-1">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />{" "}
                          {DASHBOARD.dealRooms.documents} {dr.documentCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{" "}
                          {DASHBOARD.dealRooms.auditEvents} {dr.auditEvents}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#1E3A5F]/50 mb-3">
                        {DASHBOARD.dealRooms.immutableAuditTrail}
                      </p>
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] text-[#1E3A5F]/50 mb-1">
                          <span>{DASHBOARD.dealRooms.escrowLabel}</span>
                          <span>{dr.escrowProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0A1628]/6">
                          <div
                            className="h-full rounded-full bg-[#059669]"
                            style={{ width: `${dr.escrowProgress}%` }}
                          />
                        </div>
                      </div>
                      <MaybeLink href="/deal-rooms" demo={!!demo}>
                        <button className="mt-2 text-xs font-semibold text-[#2563EB] hover:text-[#2563EB]/80 uppercase tracking-wider transition-colors">
                          {DASHBOARD.dealRooms.enterCta}
                        </button>
                      </MaybeLink>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="card-elevated p-6">
                <EmptyState
                  {...EMPTY_STATES.dealRooms}
                  title={DASHBOARD.dealRooms.noDealRooms}
                />
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <MaybeLink href="/pipeline?status=pending_consent" demo={!!demo}>
                <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                  Resolve Room Blockers
                </button>
              </MaybeLink>
            </div>
          </div>

          <div data-tour="activity-feed">
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
          </div>
          {/* /data-tour="activity-feed" */}
        </FadeInView>

        {/* ───────── Right Column ───────── */}
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <DashCard title="Match Quality Distribution">
              <div className="space-y-2">
                {[
                  { label: "90-100", value: matchBands.top, tone: "bg-[#059669]" },
                  { label: "80-89", value: matchBands.mid, tone: "bg-[#2563EB]" },
                  { label: "<80", value: matchBands.low, tone: "bg-[#F59E0B]" },
                ].map((band) => {
                  const total = Math.max(1, matchBands.top + matchBands.mid + matchBands.low);
                  const width = Math.max(8, Math.round((band.value / total) * 100));
                  return (
                    <div key={band.label}>
                      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#1E3A5F]/60">
                        <span>{band.label}</span>
                        <span className="font-bold text-[#0A1628]">{band.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#1E3A5F]/10">
                        <div className={`h-full rounded-full ${band.tone}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#1E3A5F]/55">State: quality mix is weighted to top-decile opportunities.</p>
                <MaybeLink href="/pipeline?minScore=90" demo={!!demo}>
                  <button className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Triage Top Decile
                  </button>
                </MaybeLink>
              </div>
            </DashCard>
          </StaggerItem>

          <StaggerItem>
            <DashCard title="Relationship Path Confidence">
              <div className="space-y-2">
                {relationshipPaths.map((path) => (
                  <div key={path.id} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#0A1628]">{path.label}</p>
                      <span className="text-xs font-bold text-[#059669]">{path.confidence}%</span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#1E3A5F]/55">
                      Risk: {path.confidence >= 88 ? "Low" : "Moderate"} · {String(path.status).replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#1E3A5F]/55">State: warm paths available and attribution-safe.</p>
                <MaybeLink href="/custody?minTrust=85" demo={!!demo}>
                  <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F]/70">
                    Open Warm Paths
                  </button>
                </MaybeLink>
              </div>
            </DashCard>
          </StaggerItem>

          <StaggerItem>
            <DashCard title="Pipeline Stall Alerts">
              <div className="space-y-2">
                {stalledPipeline.map((stall) => (
                  <div key={stall.id} className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/8 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#0A1628]">{stall.label}</p>
                      <span className="rounded-full bg-[#F59E0B]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F59E0B]">
                        {stall.hours.toFixed(0)}h stalled
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#1E3A5F]/55">
                      Risk: {stall.risk}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#1E3A5F]/55">State: escalation needed on delayed deals.</p>
                <MaybeLink href="/pipeline?status=pending_consent" demo={!!demo}>
                  <button className="rounded bg-[#F59E0B]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                    Escalate Blockers
                  </button>
                </MaybeLink>
              </div>
            </DashCard>
          </StaggerItem>

          <StaggerItem>
            <DashCard title="Activity Velocity">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/55">24h</p>
                  <p className="mt-1 text-xl font-bold text-[#0A1628]">{activityVelocity.now24h}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#059669]">+18%</p>
                </div>
                <div className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/55">7d</p>
                  <p className="mt-1 text-xl font-bold text-[#0A1628]">{activityVelocity.now7d}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#2563EB]">Sustained</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#1E3A5F]/55">State: operator throughput is accelerating.</p>
                <MaybeLink href="/pipeline" demo={!!demo}>
                  <button className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Rebalance Queue
                  </button>
                </MaybeLink>
              </div>
            </DashCard>
          </StaggerItem>

          {/* E10: Market Depth — horizontal bar chart */}
          <StaggerItem>
            <DashCard title={DASHBOARD.marketDepth.title}>
              <div className="space-y-4">
                {MARKET_DEPTH.map((m, i) => (
                  <div key={m.sector}>
                    <p className="mb-1.5 text-xs font-semibold text-[#0A1628]">
                      {m.sector}
                    </p>
                    <MarketDepthBar
                      label={DASHBOARD.marketDepth.buyersLabel.toLowerCase()}
                      value={m.buyers}
                      max={maxDepth}
                      index={i * 2}
                    />
                    <MarketDepthBar
                      label={DASHBOARD.marketDepth.sellersLabel.toLowerCase()}
                      value={m.sellers}
                      max={maxDepth}
                      index={i * 2 + 1}
                    />
                  </div>
                ))}
                <div className="flex items-center gap-4 border-t border-[#D1DCF0] pt-2 text-[10px] text-[#1E3A5F]/60">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#2563EB]" />{" "}
                    {DASHBOARD.marketDepth.buyersLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#C4972A]" />{" "}
                    {DASHBOARD.marketDepth.sellersLabel}
                  </span>
                </div>
              </div>
            </DashCard>
          </StaggerItem>

          {/* Compliance Status Widget */}
          <StaggerItem>
            <DashCard
              title={DASHBOARD.complianceStatus.title}
              dataTour="verification"
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#0A1628] mb-2">
                  {DASHBOARD.complianceStatus.passportSummary}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#059669]" />
                    <span className="text-[#0A1628]">
                      {DASHBOARD.complianceStatus.kybStatus} Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#059669]" />
                    <span className="text-[#0A1628]">
                      {DASHBOARD.complianceStatus.ofacStatus} Clear
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#059669]" />
                    <span className="text-[#0A1628]">
                      {DASHBOARD.complianceStatus.amlStatus} Passed
                    </span>
                  </div>
                  <MaybeLink href="/compliance" demo={!!demo}>
                    <button className="text-xs font-semibold text-[#2563EB] hover:text-[#2563EB]/80 uppercase tracking-wider transition-colors text-left">
                      {DASHBOARD.complianceStatus.viewPassportCta}
                    </button>
                  </MaybeLink>
                </div>

                <p className="text-xs font-semibold text-[#0A1628] mb-2">
                  Pending Actions:
                </p>
                {PENDING_ACTIONS.length > 0 ? (
                  <div className="space-y-3">
                    {PENDING_ACTIONS.map(a => (
                      <div
                        key={a.text}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F]/5">
                          <a.Icon className="h-4 w-4 text-[#1E3A5F]/60" />
                        </span>
                        <span className="flex-1 text-[#0A1628] font-medium">
                          {a.text}
                        </span>
                        <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F59E0B]">
                          {DASHBOARD.complianceStatus.badgeRequired}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#1E3A5F]/60">
                    {DASHBOARD.complianceStatus.noPendingActions}
                  </p>
                )}
              </div>
            </DashCard>
          </StaggerItem>

          {/* Recent Payouts */}
          <StaggerItem>
            <div data-tour="payout">
              <DashCard title={DASHBOARD.payouts.title}>
                <p className="mb-3 text-lg font-bold text-[#0A1628]">
                  {DASHBOARD.payouts.nextPayoutLabel}{" "}
                  <span className="text-[#059669]">
                    $
                    <SmoothCounter
                      value={nextPayoutAmount}
                      prefix=""
                      duration={1.2}
                    />
                  </span>
                </p>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Escrow Certainty", value: "High" },
                    { label: "Attribution Link", value: "On-chain" },
                    { label: "Fee Clarity", value: "Pre-agreed" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-2 py-2">
                      <p className="text-[9px] uppercase tracking-widest text-[#1E3A5F]/50">{metric.label}</p>
                      <p className="text-xs font-semibold text-[#0A1628] mt-1">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <MaybeLink href="/attribution?status=triggered" demo={!!demo}>
                    <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                      View Triggered Payouts
                    </button>
                  </MaybeLink>
                </div>
                <p className="mb-4 text-xs text-[#1E3A5F]/50 flex items-center gap-1">
                  <Info className="h-3 w-3" />{" "}
                  {DASHBOARD.payouts.lifetimeAttribution} $1.5M
                </p>
                {demo ? (
                  demo.payouts.length > 0 ? (
                    <div className="space-y-2">
                      {demo.payouts.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between card-elevated px-3 py-2.5 text-sm hover:translate-y-[-1px]"
                        >
                          <div>
                            <span className="font-semibold text-[#0A1628]">
                              ${p.amount.toLocaleString()}
                            </span>
                            <span className="ml-2 text-xs text-[#1E3A5F]/60">
                              {p.deal}
                            </span>
                            {"originatorShare" in p &&
                              (p as { originatorShare?: number })
                                .originatorShare && (
                                <span className="ml-2 text-xs font-data-mono text-[#059669]">
                                  ({DASHBOARD.payouts.originationShare}{" "}
                                  {
                                    (p as { originatorShare: number })
                                      .originatorShare
                                  }
                                  %)
                                </span>
                              )}
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              p.status === "triggered" ||
                              p.status === "deployed"
                                ? "bg-[#059669]/15 text-[#059669]"
                                : p.status === "pending" ||
                                    p.status === "fundraising"
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
                    <EmptyState
                      {...EMPTY_STATES.payouts}
                      title={DASHBOARD.payouts.noPayouts}
                    />
                  )
                ) : payouts && payouts.length > 0 ? (
                  <div className="space-y-2">
                    {payouts.slice(0, 3).map(p => (
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
                          {p.attributionPercentage && (
                            <span className="ml-2 text-xs text-[#C4972A] font-medium">
                              {parseFloat(
                                String(p.attributionPercentage)
                              ).toFixed(0)}
                              % originator
                            </span>
                          )}
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
                  <EmptyState
                    {...EMPTY_STATES.payouts}
                    title={DASHBOARD.payouts.noPayouts}
                  />
                )}
              </DashCard>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Apply CTA — onboardingTour "completion" target + demo "apply" target */}
      <FadeInView delay={0.3}>
        <div data-tour="completion" className="mt-8">
          <div data-tour="apply" className="flex justify-center">
            <MaybeLink href="/onboarding" demo={!!demo}>
              {" "}
              {/* Use MaybeLink for /onboarding */}
              <motion.button
                className="px-8 py-3 border border-[#C4972A]/40 text-[#C4972A] text-sm uppercase tracking-widest font-semibold hover:bg-[#C4972A]/5 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Request Full Access
              </motion.button>
            </MaybeLink>
          </div>
        </div>
      </FadeInView>
    </>
  );
}

