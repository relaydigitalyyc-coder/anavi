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
} from "./atoms";
export function InvestorDashboardContent() {
  const demo = useDemoFixtures();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const isDemo = !!demo;
  const { data: stats } = trpc.user.getStats.useQuery(undefined, { enabled: !demo });
  const trustScore = Number(demo?.user.trustScore ?? stats?.trustScore ?? 0);
  const scoreColor = getScoreColor(trustScore);
  const telemetry = (demo as unknown as { opsTelemetry?: { updatedAt?: string; snapshotPeriod?: string } } | null)?.opsTelemetry;
  const reportPeriod = telemetry?.snapshotPeriod ?? "QTD";
  const { data: liveRelationships } = trpc.relationship.list.useQuery(undefined, { enabled: !demo });
  const { data: livePayouts } = trpc.payout.list.useQuery(undefined, { enabled: !demo });
  const { data: liveMatches } = trpc.match.list.useQuery(undefined, { enabled: !demo });
  const { data: liveDealRooms } = trpc.dealRoom.list.useQuery(undefined, { enabled: !demo });

  const relationships = demo?.relationships ?? liveRelationships ?? [];
  const portfolioPositions = demo?.payouts ?? livePayouts ?? [];
  const matches = [...(demo?.matches ?? (liveMatches as any[]) ?? [])].map((m: any) => ({
    id: typeof m.id === "number" ? m.id : Number(m.id),
    tag: m.tag ?? (m.counterpartyCompany ? `Counterparty - ${m.counterpartyCompany}` : `Match #${m.id}`),
    assetClass: m.assetClass ?? "Private Markets",
    dealSize: m.dealSize ?? "TBD",
    compatibilityScore: Number(m.compatibilityScore ?? 0),
  }));

  const deploymentCapacity = demo
    ? { available: 196000000, committed: 2850000, deployed: 141150000, total: 340000000 }
    : null;

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="dash-heading text-3xl">Deal Flow Intelligence</h1>
          <p className="mt-1 text-sm text-[#1E3A5F]/60">
            {demo
              ? `${demo.matches.length} blind matches active · ${demo.dealRooms.length} deal room requires action`
              : "Loading deal flow..."}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[#1E3A5F]/45">
            {telemetry?.updatedAt
              ? `Last updated ${formatDistanceToNow(new Date(telemetry.updatedAt), { addSuffix: true })} · ${reportPeriod}`
              : `Last updated now · ${reportPeriod}`}
          </p>
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-[#1E3A5F]/15 bg-[#0A1628] px-4 py-3 text-white">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/55 mb-2">Live Proof</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "New Verified Matches", value: `${Math.min(4, demo?.matches.length ?? 0)} in 24h`, delta: "+31%" },
            { label: "Diligence Compression", value: "2.4d median", delta: "-0.8d" },
            { label: "Capital Allocation Ready", value: "$196M available", delta: "Realtime" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-white/45">{item.label}</p>
              <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#22D4F5] mt-1">{item.delta}</p>
            </div>
          ))}
        </div>
      </div>

      <StaggerContainer>
        <StaggerItem>
          <DashCard title="Trust Score" dataTour="trust-score" className="mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <TrustRing score={trustScore} size={120} strokeWidth={8} />
                <span
                  className="font-data-hud text-3xl font-bold absolute inset-0 flex items-center justify-center"
                  style={{ color: scoreColor }}
                >
                  <SmoothCounter value={Math.round(trustScore)} duration={1} />
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/50">Industry Lens</p>
                <p className="text-sm font-semibold text-[#0A1628]">{industry}</p>
                <p className="text-xs text-[#1E3A5F]/50 mt-1">{isDemo ? "Institutional verification active" : "Basic verification tier"}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Verification Depth", value: "Institutional" },
                { label: "Counterparty Acceptance", value: `${Math.min(99, Math.round(trustScore + 8))}%` },
                { label: "Audit Integrity", value: "Immutable" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-2 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-[#1E3A5F]/50">{metric.label}</p>
                  <p className="text-xs font-semibold text-[#0A1628] mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <MaybeLink href="/counterparty-intelligence?minTrust=85&permission=view" demo={!!demo}>
                <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                  Open Trusted Counterparties
                </button>
              </MaybeLink>
            </div>
            <p className="mt-2 text-xs text-[#1E3A5F]/55">
              Institutional confidence signal for first-pass underwriting decisions.
            </p>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Counterparty Network" dataTour="relationships" className="mb-4">
            <div className="space-y-2">
              {relationships.slice(0, 3).map((rel: any) => (
                <div key={rel.id} className="card-elevated px-3 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-[#0A1628]">{rel.name ?? `Relationship #${rel.id}`}</p>
                    <p className="text-xs text-[#1E3A5F]/50">{rel.company ?? rel.relationshipType ?? "Counterparty"}</p>
                  </div>
                  <span className="text-xs font-bold text-[#059669]">Trust {rel.trustScore ?? "–"}</span>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Compliance Passport" dataTour="verification" className="mb-4">
            {isDemo ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["KYB", "OFAC", "AML"].map((check) => (
                    <div key={check} className="flex items-center justify-center rounded bg-[#059669]/10 text-[#059669] font-semibold py-2">
                      {check} OK
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#1E3A5F]/50 mt-3">
                  Shared compliance passport reduces duplicated diligence.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-[#1E3A5F]/70">
                  Complete verification to enable compliance-backed matching and investor workflows.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/verification" className="rounded bg-[#1E3A5F]/10 px-2 py-1 text-[11px] font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/15">
                    Verify Identity
                  </Link>
                  <Link href="/compliance" className="rounded bg-[#1E3A5F]/10 px-2 py-1 text-[11px] font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/15">
                    Run Checks
                  </Link>
                </div>
              </>
            )}
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Capital Deployment" className="mb-4">
            {deploymentCapacity ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Available", value: `$${(deploymentCapacity.available / 1e6).toFixed(0)}M`, color: "#059669" },
                  { label: "Committed", value: `$${(deploymentCapacity.committed / 1e6).toFixed(1)}M`, color: "#F59E0B" },
                  { label: "Deployed", value: `$${(deploymentCapacity.deployed / 1e6).toFixed(0)}M`, color: "#2563EB" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <span style={{ color }}>
                      <SmoothCounter
                        value={parseFloat(value.replace(/[$M]/g, ""))}
                        prefix="$"
                        suffix="M"
                        className="text-2xl font-bold"
                      />
                    </span>
                    <p className="text-xs text-[#1E3A5F]/50 mt-1 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-16 animate-shimmer rounded" />
            )}
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Active Deal Flow" className="mb-4">
            <div className="space-y-2">
              {matches.map((match, idx) => (
                <div
                  key={match.id}
                  data-tour={idx === 0 ? "match-card" : undefined}
                  className="card-elevated px-3 py-2.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">{match.tag}</p>
                    <p className="text-xs text-[#1E3A5F]/50 mt-0.5">{match.assetClass} · {match.dealSize}</p>
                    <div className="mt-1 flex gap-1.5">
                      <span className="rounded-full bg-[#059669]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                        Verified
                      </span>
                      <span className="rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                        Sealed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#C4972A]">{match.compatibilityScore}%</span>
                    <MaybeLink href={`/deal-flow?assetClass=${encodeURIComponent(match.assetClass)}&minScore=80`} demo={!!demo}>
                      <motion.button
                        className="text-xs px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded font-medium"
                        whileHover={{ scale: 1.04 }}
                        aria-label="Open in Deal Flow"
                      >
                        Open in Deal Flow
                      </motion.button>
                    </MaybeLink>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <MaybeLink href="/deal-flow?minScore=90&status=pending_consent" demo={!!demo}>
                <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                  Focus Top Decile
                </button>
              </MaybeLink>
            </div>
            <p className="mt-2 text-xs text-[#1E3A5F]/55">
              Opportunity queue ordered for actionability, not raw volume.
            </p>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Portfolio Performance" dataTour="payout" className="mb-4">
            <div className="mb-2 grid grid-cols-3 gap-2">
              {[
                { label: "Escrow Certainty", value: "High" },
                { label: "Fee Clarity", value: "Pre-agreed" },
                { label: "Attribution", value: "Linked" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-2 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-[#1E3A5F]/50">{metric.label}</p>
                  <p className="text-xs font-semibold text-[#0A1628] mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {portfolioPositions.map((payout) => (
                <div key={payout.id} className="card-elevated px-3 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">{("deal" in payout && payout.deal) ? payout.deal : (payout as any).payoutType ? String((payout as any).payoutType).replace(/_/g, " ") : `Payout #${payout.id}`}</span>
                    {"irr" in payout && (
                      <span className="ml-2 text-xs text-[#059669] font-medium">{(payout as { irr: number }).irr}% IRR</span>
                    )}
                  </div>
                  <span className="font-bold text-[#0A1628]">{typeof payout.amount === "number" ? `$${(payout.amount / 1e6).toFixed(2)}M` : `$${parseFloat(String(payout.amount ?? 0))}`}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <MaybeLink href="/portfolio?minIrr=15&period=qtd" demo={!!demo}>
                <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                  Open High-IRR Positions
                </button>
              </MaybeLink>
            </div>
            <p className="mt-2 text-xs text-[#1E3A5F]/55">
              Performance, risk, and attribution shown on one reporting horizon.
            </p>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Active Deal Rooms">
            <div className="space-y-2">
              {Array.from([...(demo?.dealRooms ?? []), ...((liveDealRooms as any[]) ?? [])] as any[]).map((dr, idx) => (
                <div
                  key={dr.id}
                  data-tour={idx === 0 ? "deal-room" : undefined}
                  className="card-elevated px-3 py-2.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{dr.name}</span>
                    <span className="text-xs uppercase tracking-wider text-[#2563EB] font-bold">{dr.stage ?? dr.status ?? "Active"}</span>
                  </div>
                  <div className="mb-1 flex gap-1.5">
                    <span className="rounded-full bg-[#059669]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                      Verified Counterparty
                    </span>
                    <span className="rounded-full bg-[#C4972A]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C4972A]">
                      Attribution Safe
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#0A1628]/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#2563EB] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${dr.escrowProgress ?? 0}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <p className="text-xs text-[#1E3A5F]/50 mt-1">{(dr.escrowProgress ?? 0)}% escrow · {(dr.auditEvents ?? 0)} audit events</p>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>
      </StaggerContainer>

      <FadeInView delay={0.3}>
        <div data-tour="apply" className="mt-8 flex justify-center">
          <MaybeLink href="/onboarding" demo={!!demo}>
            <motion.button
              className="btn-gold px-8 py-3 text-sm uppercase tracking-widest font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Request Full Access
            </motion.button>
          </MaybeLink>
        </div>
      </FadeInView>
    </FadeInView>
  );
}
