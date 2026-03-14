import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useDemoFixtures, useActiveIndustry } from "@/contexts/DemoContext";
import { formatDistanceToNow } from "date-fns";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";
import { Link } from "wouter";
import { DashCard, TrustRing, MaybeLink, getScoreColor } from "./atoms";
import { InteractiveGlobe } from "@/components/ui/interactive-globe";

type LiveChangeEvent = {
  id: string;
  message: string;
  detail: string;
  createdAt: Date;
};

function inferContractDomain(action: string, entityType?: string | null): string {
  const source = `${action} ${entityType ?? ""}`.toLowerCase();
  if (source.includes("relationship")) return "Relationship Custody";
  if (source.includes("trust")) return "Trust Score";
  if (source.includes("match")) return "Blind Matching";
  if (
    source.includes("deal_room") ||
    source.includes("deal room") ||
    source.includes("nda") ||
    source.includes("docusign")
  ) {
    return "Deal Room";
  }
  if (source.includes("payout") || source.includes("attribution")) {
    return "Attribution";
  }
  if (source.includes("intent")) return "Intent";
  return "Platform";
}

function humanizeAuditAction(action: string): string {
  return action
    .replace(/^docusign_/, "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, ch => ch.toUpperCase())
    .replace(/\bNda\b/g, "NDA")
    .replace(/\bKyb\b/g, "KYB")
    .replace(/\bAml\b/g, "AML")
    .replace(/\bOfac\b/g, "OFAC");
}

export function PrincipalDashboardContent() {
  const demo = useDemoFixtures();
  const isDemo = !!demo;
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: stats } = trpc.user.getStats.useQuery(undefined, {
    enabled: !demo,
  });
  const trustScore = Number(demo?.user.trustScore ?? stats?.trustScore ?? 0);
  const scoreColor = getScoreColor(trustScore);
  const { data: liveRelationships } = trpc.relationship.list.useQuery(
    undefined,
    { enabled: !demo }
  );
  const relationships = demo?.relationships ?? liveRelationships ?? [];
  const { data: liveDealRooms } = trpc.dealRoom.list.useQuery(undefined, {
    enabled: !demo,
  });
  const { data: liveAuditEntries } = trpc.audit.list.useQuery(
    { limit: 120 },
    { enabled: !isDemo }
  );
  const dr = (demo?.dealRooms ?? liveDealRooms ?? [])[0] as any;
  const [showChanges, setShowChanges] = useState(false);
  const opsEvents =
    (
      demo as unknown as {
        opsEvents?: Array<{
          id: number;
          level: string;
          kind: string;
          message: string;
          minutesAgo: number;
        }>;
        opsTelemetry?: { updatedAt?: string; blockersOpen?: number };
      } | null
    )?.opsEvents ?? [];
  const blockersOpen = Number(
    (demo as unknown as { opsTelemetry?: { blockersOpen?: number } } | null)
      ?.opsTelemetry?.blockersOpen ?? 3
  );
  const freshness = (
    demo as unknown as { opsTelemetry?: { updatedAt?: string } } | null
  )?.opsTelemetry?.updatedAt;
  const liveChangeEvents = useMemo<LiveChangeEvent[]>(() => {
    if (isDemo) return [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const liveRooms = liveDealRooms ?? [];
    return (liveAuditEntries ?? [])
      .map(entry => {
        const createdAt = new Date(entry.createdAt);
        if (
          Number.isNaN(createdAt.getTime()) ||
          createdAt.getTime() < cutoff
        ) {
          return null;
        }

        const action = String(entry.action ?? "update");
        const domain = inferContractDomain(action, entry.entityType);
        const normalizedEntityType = String(entry.entityType ?? "")
          .replace(/_/g, " ")
          .trim();
        const entityId = Number(entry.entityId ?? 0);
        let entityLabel = normalizedEntityType || "platform";
        if (entityId > 0 && entry.entityType === "relationship") {
          const rel = relationships.find(
            item => Number((item as { id?: number }).id ?? 0) === entityId
          ) as { name?: string; company?: string } | undefined;
          entityLabel = rel?.name ?? rel?.company ?? `Relationship #${entityId}`;
        } else if (entityId > 0 && entry.entityType === "deal_room") {
          const room = liveRooms.find(
            item => Number((item as { id?: number }).id ?? 0) === entityId
          ) as { name?: string } | undefined;
          entityLabel = room?.name ?? `Deal Room #${entityId}`;
        } else if (entityId > 0 && normalizedEntityType) {
          entityLabel = `${normalizedEntityType} #${entityId}`;
        }

        const actor = entry.userId ? `User #${entry.userId}` : "System";
        return {
          id: String(entry.id),
          message: `${domain}: ${humanizeAuditAction(action)}`,
          detail: `${entityLabel} · ${actor} · ${createdAt.toLocaleString()}`,
          createdAt,
        };
      })
      .filter((event): event is LiveChangeEvent => !!event)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6);
  }, [isDemo, liveAuditEntries, liveDealRooms, relationships]);
  const liveFreshness = useMemo(() => {
    if (isDemo) return null;
    const timestamp = liveAuditEntries?.[0]?.createdAt;
    if (!timestamp) return null;
    const asDate = new Date(timestamp);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }, [isDemo, liveAuditEntries]);
  const changesUpdatedLabel = isDemo
    ? freshness
      ? `Updated ${formatDistanceToNow(new Date(freshness), { addSuffix: true })}`
      : "Updated now"
    : liveFreshness
      ? `Updated ${formatDistanceToNow(liveFreshness, { addSuffix: true })}`
      : "No audit updates yet";
  const certaintyHistory = [42, 46, 51, 58, 62, 68, 73];

  return (
    <FadeInView>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="dash-heading text-3xl">Asset Register</h1>
          <p className="mt-1 text-sm text-[#1E3A5F]/60">
            {demo
              ? "Your asset is sealed until you choose otherwise."
              : "Loading..."}
          </p>
        </div>
        <div className="hidden lg:block shrink-0 -mt-4 -mr-2">
          <InteractiveGlobe
            size={200}
            dotColor="rgba(30, 58, 95, ALPHA)"
            arcColor="rgba(196, 151, 42, 0.4)"
            markerColor="rgba(37, 99, 235, 0.9)"
            autoRotateSpeed={0.001}
          />
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-[#1E3A5F]/15 bg-[#0A1628] px-4 py-3 text-white">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/55 mb-2">
          Live Proof
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              label: "Qualified Demand 24h",
              value: `${Math.min(3, demo?.matches.length ?? 0)}`,
              delta: "+19%",
              href: "/deal-flow?filter=demand",
            },
            {
              label: "Escrow Momentum",
              value: dr ? `${dr.escrowProgress ?? 0}%` : "0%",
              delta: "+4%",
              href: "/deal-rooms",
            },
            {
              label: "Disclosure Safety",
              value: "0 leaks",
              delta: "Sealed defaults",
              href: "/compliance",
            },
          ].map(item => (
            <MaybeLink key={item.label} href={item.href} demo={!!demo}>
              <div className="rounded-lg bg-white/5 px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors h-full">
                <p className="text-[10px] uppercase tracking-widest text-white/45">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-white mt-1">
                  {item.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#22D4F5] mt-1">
                  {item.delta}
                </p>
              </div>
            </MaybeLink>
          ))}
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-[#1E3A5F]/15 bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1E3A5F]/55">
            Close Risk
          </p>
          <button
            className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F]/70"
            onClick={() => setShowChanges(value => !value)}
          >
            {showChanges ? "Hide 24h Changes" : "What Changed 24h"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {[
            {
              label: "Compliance Blocker",
              value: "1 open",
              risk: "High",
              tone: "text-[#DC2626]",
              href: "/compliance?status=blocked",
            },
            {
              label: "Document Readiness",
              value: "84% complete",
              risk: "Moderate",
              tone: "text-[#F59E0B]",
              href: "/deal-rooms?tab=documents",
            },
            {
              label: "Counterparty SLA",
              value: "<6h median",
              risk: "Low",
              tone: "text-[#059669]",
              href: "/counterparty-intelligence",
            },
          ].map(metric => (
            <MaybeLink key={metric.label} href={metric.href} demo={!!demo}>
              <div className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2 cursor-pointer hover:bg-[#1E3A5F]/10 transition-colors h-full">
                <p className="text-[10px] uppercase tracking-wider text-[#1E3A5F]/55">
                  {metric.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0A1628]">
                  {metric.value}
                </p>
                <p
                  className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${metric.tone}`}
                >
                  Risk: {metric.risk}
                </p>
              </div>
            </MaybeLink>
          ))}
        </div>
        {showChanges && (
          <div className="mt-3 rounded-lg border border-[#1E3A5F]/10 bg-[#0A1628] p-3 text-white">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                Last 24h
              </p>
              <p className="text-[10px] text-white/45">
                {changesUpdatedLabel}
              </p>
            </div>
            <div className="space-y-2">
              {isDemo ? (
                opsEvents.map(event => (
                  <div key={event.id} className="rounded bg-white/5 px-2 py-1.5">
                    <p className="text-xs font-semibold">{event.message}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">
                      {event.kind} · {event.level} · {event.minutesAgo}m ago
                    </p>
                  </div>
                ))
              ) : liveChangeEvents.length > 0 ? (
                liveChangeEvents.map(event => (
                  <div key={event.id} className="rounded bg-white/5 px-2 py-1.5">
                    <p className="text-xs font-semibold">{event.message}</p>
                    <p className="text-[10px] tracking-wider text-white/50">
                      {event.detail}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded bg-white/5 px-2 py-2">
                  <p className="text-xs font-semibold">
                    No audited changes were recorded in the last 24h.
                  </p>
                  <p className="text-[10px] tracking-wider text-white/50">
                    Relationship Custody: {relationships.length} · Deal Room:{" "}
                    {(liveDealRooms ?? []).length} · Trust Score: {trustScore}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <StaggerContainer>
        <StaggerItem>
          <DashCard title="Trust Score" dataTour="trust-score" className="mb-4">
            <div className="flex items-center gap-4">
              <TrustRing score={trustScore} size={120} strokeWidth={8} />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/50">
                  Industry Lens
                </p>
                <p className="text-sm font-semibold text-[#0A1628]">
                  {industry}
                </p>
                <p className="text-xs text-[#1E3A5F]/50 mt-1">
                  Basic verification tier
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Verification Depth", value: "Basic+" },
                {
                  label: "Counterparty Confidence",
                  value: `${Math.min(95, Math.round(trustScore + 10))}%`,
                },
                { label: "Upgrade Delta", value: "Tier 2 ready" },
              ].map(metric => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-2 py-2"
                >
                  <p className="text-[9px] uppercase tracking-widest text-[#1E3A5F]/50">
                    {metric.label}
                  </p>
                  <p className="text-xs font-semibold text-[#0A1628] mt-1">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <MaybeLink
                href="/counterparty-intelligence?minTrust=80"
                demo={!!demo}
              >
                <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E3A5F]/70 hover:bg-[#1E3A5F]/15">
                  Review Qualified Buyers
                </button>
              </MaybeLink>
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard
            title="Sealed Relationships"
            dataTour="relationships"
            className="mb-4"
          >
            <div className="space-y-2">
              {relationships.slice(0, 3).map((rel: any) => (
                <div
                  key={rel.id}
                  className="card-elevated px-3 py-2.5 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-semibold text-[#0A1628]">
                      {rel.name ?? `Relationship #${rel.id}`}
                    </p>
                    <p className="text-xs text-[#1E3A5F]/50">
                      {rel.company ?? rel.relationshipType ?? "Counterparty"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#C4972A]">
                    Sealed
                  </span>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard
            title="Compliance Passport"
            dataTour="verification"
            className="mb-4"
          >
            {isDemo ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["KYB", "OFAC", "AML"].map(check => (
                    <div
                      key={check}
                      className="flex items-center justify-center rounded bg-[#059669]/10 text-[#059669] font-semibold py-2"
                    >
                      {check} OK
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#1E3A5F]/50 mt-3">
                  Upgrade to unlock institutional investor mandates.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-[#1E3A5F]/70">
                  Complete verification to enable compliance-backed matching and
                  governance workflows.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/verification"
                    className="rounded bg-[#1E3A5F]/10 px-2 py-1 text-[11px] font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/15"
                  >
                    Verify Identity
                  </Link>
                  <Link
                    href="/compliance"
                    className="rounded bg-[#1E3A5F]/10 px-2 py-1 text-[11px] font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/15"
                  >
                    Run Checks
                  </Link>
                </div>
              </>
            )}
          </DashCard>
        </StaggerItem>

        {dr && (
          <StaggerItem>
            <DashCard title={dr.name} dataTour="payout" className="mb-4">
              <div className="flex items-baseline gap-3 mb-3">
                <SmoothCounter
                  value={dr.escrowCurrent / 1e6}
                  prefix="$"
                  suffix="M committed"
                  className="text-3xl font-bold text-[#0A1628]"
                />
                <span className="text-sm text-[#1E3A5F]/50">
                  of ${(dr.escrowTarget / 1e6).toFixed(0)}M target
                </span>
              </div>
              <div className="h-2 bg-[#0A1628]/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#C4972A] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${dr.escrowProgress ?? 0}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="text-xs text-[#1E3A5F]/50 mt-2">
                {dr.escrowProgress ?? 0}% · {dr.counterparty}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Committed Ratio",
                    value: `${Math.round((dr.escrowCurrent / Math.max(1, dr.escrowTarget)) * 100)}%`,
                  },
                  {
                    label: "Docs Complete",
                    value: `${Math.min(99, dr.documentCount * 12)}%`,
                  },
                  { label: "Audit Continuity", value: "100%" },
                ].map(metric => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-2 py-2"
                  >
                    <p className="text-[9px] uppercase tracking-widest text-[#1E3A5F]/50">
                      {metric.label}
                    </p>
                    <p className="text-xs font-semibold text-[#0A1628] mt-1">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-end gap-1">
                {certaintyHistory.map((point, idx) => (
                  <div
                    key={`${point}-${idx}`}
                    className="w-3 rounded-t bg-[#2563EB]/70"
                    style={{ height: `${Math.max(8, point * 0.6)}px` }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[#1E3A5F]/50">
                Escrow certainty trend (7d)
              </p>
            </DashCard>
          </StaggerItem>
        )}

        <StaggerItem>
          <DashCard title="Qualified Demand (Sealed)" className="mb-4">
            <div className="space-y-2">
              {(demo?.matches ?? []).map((match, idx) => (
                <div
                  key={match.id}
                  data-tour={idx === 0 ? "match-card" : undefined}
                  className="card-elevated px-3 py-2.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">
                      {match.tag}
                    </p>
                    <p className="text-xs text-[#1E3A5F]/50 mt-0.5">
                      {match.assetClass} · {match.dealSize}
                    </p>
                    <div className="mt-1 flex gap-1.5">
                      <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                        Pending Consent
                      </span>
                      <span className="rounded-full bg-[#2563EB]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                        Sealed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1E3A5F]/10 text-[#1E3A5F]/60">
                      SEALED
                    </span>
                    <span className="text-xs font-bold text-[#C4972A]">
                      {match.compatibilityScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Active Deal Room" className="mb-4">
            <div className="space-y-2">
              {(demo?.dealRooms ?? []).map((room, idx) => (
                <div
                  key={room.id}
                  data-tour={idx === 0 ? "deal-room" : undefined}
                  className="card-elevated px-3 py-2.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{room.name}</span>
                    <span className="text-xs uppercase tracking-wider text-[#2563EB] font-bold">
                      {room.stage}
                    </span>
                  </div>
                  <div className="mb-1 flex gap-1.5">
                    <span className="rounded-full bg-[#059669]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                      NDA Active
                    </span>
                    <span className="rounded-full bg-[#C4972A]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C4972A]">
                      Milestone-Tracked
                    </span>
                  </div>
                  <p className="text-xs text-[#1E3A5F]/50">
                    {room.counterparty}
                  </p>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Sealed Disclosure Ledger" className="mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                {
                  label: "Sealed Matches",
                  value: demo?.matches.length ?? 0,
                  color: "#1E3A5F",
                },
                {
                  label: "NDAs Executed",
                  value: demo?.dealRooms.length ?? 0,
                  color: "#F59E0B",
                },
                {
                  label: "Uncontrolled Disclosures",
                  value: 0,
                  color: "#059669",
                },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-2xl font-bold" style={{ color }}>
                    {value}
                  </p>
                  <p className="text-xs text-[#1E3A5F]/50 mt-1 leading-tight">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Execution Blockers">
            <div className="space-y-2">
              {[
                {
                  label: "Legal approval pending for allocator disclosure",
                  impact: 96,
                },
                {
                  label: "Vendor diligence memo not countersigned",
                  impact: 82,
                },
                {
                  label: "Escrow milestone addendum awaiting review",
                  impact: 74,
                },
              ]
                .sort((a, b) => b.impact - a.impact)
                .map(blocker => (
                  <div
                    key={blocker.label}
                    className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/8 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#0A1628]">
                        {blocker.label}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                        Impact {blocker.impact}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[#1E3A5F]/55">
                State: {blockersOpen} blockers active.
              </p>
              <MaybeLink href="/deal-rooms" demo={!!demo}>
                <button className="btn-gold rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Resolve Top Blocker
                </button>
              </MaybeLink>
            </div>
          </DashCard>
        </StaggerItem>

        <StaggerItem>
          <DashCard title="Verification Tier">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0A1628]">
                  Current: Basic Tier
                </p>
                <p className="text-xs text-[#1E3A5F]/60 mt-0.5">
                  Upgrade to Enhanced to unlock Tier 3 investor mandates
                </p>
              </div>
              <MaybeLink href="/verification" demo={!!demo}>
                <motion.button
                  className="text-xs px-3 py-1.5 border border-[#C4972A]/40 text-[#C4972A] font-semibold uppercase tracking-wider hover:bg-[#C4972A]/5"
                  whileHover={{ scale: 1.02 }}
                >
                  Upgrade
                </motion.button>
              </MaybeLink>
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
