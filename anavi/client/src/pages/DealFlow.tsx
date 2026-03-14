import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

const formatUsdCompact = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

export function buildStatusFilterSet(statusFilter: string | null) {
  if (!statusFilter) return null;
  if (statusFilter === "pending_consent") {
    return new Set([
      "pending",
      "user1_interested",
      "user2_interested",
      "nda_pending",
    ]);
  }
  return new Set([statusFilter]);
}

export default function DealFlow() {
  const demo = useDemoFixtures();
  const [location, setLocation] = useLocation();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: liveMatches } = trpc.match.list.useQuery(undefined, {
    enabled: !demo,
  });
  const { data: liveStats } = trpc.match.liveStats.useQuery(undefined, {
    enabled: !demo,
  });
  const utils = trpc.useUtils();
  const rawMatches = (demo?.matches ?? liveMatches ?? []) as unknown as Array<
    Record<string, unknown>
  >;
  const matches: Array<{
    id: number;
    tag: string;
    assetClass: string;
    dealSize: string;
    compatibilityScore: number;
    status: string;
  }> = rawMatches.map(match => {
    const id = typeof match.id === "number" ? match.id : Number(match.id);
    const tag =
      "tag" in match && match.tag
        ? match.tag
        : match.counterpartyCompany
          ? `Counterparty - ${match.counterpartyCompany}`
          : `Match #${id}`;
    const assetClass =
      "assetClass" in match && match.assetClass
        ? match.assetClass
        : "Private Markets";
    const dealSize =
      "dealSize" in match && match.dealSize ? match.dealSize : "TBD";
    const compatibilityScore = Number(match.compatibilityScore ?? 0);
    const status = String(match.status ?? "pending");
    return {
      id,
      tag: String(tag),
      assetClass: String(assetClass),
      dealSize: String(dealSize),
      compatibilityScore,
      status,
    };
  });
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, [location]);
  const minScore = Number(params.get("minScore") ?? 0);
  const statusFilter = params.get("status");
  const assetFilter = params.get("assetClass");
  const statusFilterSet = buildStatusFilterSet(statusFilter);
  const filteredMatches = matches.filter(match => {
    const byScore = match.compatibilityScore >= minScore;
    const byStatus = statusFilterSet ? statusFilterSet.has(match.status) : true;
    const byAsset = assetFilter
      ? match.assetClass.toLowerCase() === assetFilter.toLowerCase()
      : true;
    return byScore && byStatus && byAsset;
  });
  const [outcomes, setOutcomes] = useState<Record<number, string>>({});

  const expressInterestMutation = trpc.match.expressInterest.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.match.list.invalidate(),
        utils.match.liveStats.invalidate(),
      ]);
    },
  });
  const createDealRoomMutation = trpc.match.createDealRoom.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.match.list.invalidate(),
        utils.match.liveStats.invalidate(),
      ]);
    },
  });
  const queueNdaMutation = trpc.match.queueNda.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.match.list.invalidate(),
        utils.match.liveStats.invalidate(),
      ]);
    },
  });
  const escalateMutation = trpc.match.escalate.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.match.list.invalidate(),
        utils.match.liveStats.invalidate(),
      ]);
    },
  });

  const anyPending =
    expressInterestMutation.isPending ||
    createDealRoomMutation.isPending ||
    queueNdaMutation.isPending ||
    escalateMutation.isPending;
  const freshnessText = demo
    ? "updated moments ago"
    : liveStats?.lastUpdatedAt
      ? `updated ${formatDistanceToNow(new Date(liveStats.lastUpdatedAt), { addSuffix: true })}`
      : "syncing";

  const topDecileMinScore = useMemo(() => {
    if (matches.length === 0) return 90;
    const scores = matches
      .map(match => match.compatibilityScore)
      .sort((a, b) => a - b);
    const index = Math.max(0, Math.ceil(scores.length * 0.9) - 1);
    return Math.max(1, Math.round(scores[index] ?? 90));
  }, [matches]);

  const ndaCandidate = useMemo(() => {
    return [...matches]
      .filter(
        match =>
          match.status !== "declined" &&
          match.status !== "expired" &&
          match.status !== "deal_room_created"
      )
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0];
  }, [matches]);

  const liveProofItems = demo
    ? [
        {
          label: "New Verified Matches",
          value: `${Math.min(4, matches.length)} in 24h`,
          delta: "+31%",
        },
        {
          label: "Median Diligence Time",
          value: "2.4 days",
          delta: "-0.8d",
        },
        {
          label: "Identity Exposure",
          value: "0 unauthorized",
          delta: "Sealed",
        },
      ]
    : [
        {
          label: "New Verified Matches",
          value: `${liveStats?.liveProof.newVerifiedMatches24h ?? 0} in 24h`,
          delta: `${liveStats?.pipeline.total ?? 0} active pipeline`,
        },
        {
          label: "Median Diligence Time",
          value:
            liveStats?.liveProof.diligenceMedianDays != null
              ? `${liveStats.liveProof.diligenceMedianDays} days`
              : "No diligence sample",
          delta: `${liveStats?.pipeline.dueDiligence ?? 0} in diligence`,
        },
        {
          label: "Capital Allocation Ready",
          value: `${formatUsdCompact(liveStats?.liveProof.capitalAllocationReady ?? 0)} available`,
          delta: `${formatUsdCompact(liveStats?.capital.committed ?? 0)} committed`,
        },
      ];

  const setOutcome = (id: number, message: string) => {
    setOutcomes(prev => ({ ...prev, [id]: message }));
    window.setTimeout(() => {
      setOutcomes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2400);
  };

  function routeDealFlow(filters: {
    minScore?: number | null;
    status?: string | null;
    assetClass?: string | null;
  }) {
    const next = new URLSearchParams();
    if ((filters.minScore ?? 0) > 0) {
      next.set("minScore", String(filters.minScore));
    }
    if (filters.status) {
      next.set("status", filters.status);
    }
    if (filters.assetClass) {
      next.set("assetClass", filters.assetClass);
    }
    const query = next.toString();
    setLocation(query ? `/deal-flow?${query}` : "/deal-flow");
  }

  async function handleActionCard(index: number) {
    if (anyPending) return;

    if (index === 0) {
      routeDealFlow({ minScore: topDecileMinScore, assetClass: assetFilter });
      return;
    }

    if (index === 1) {
      const consentFilters = { status: "pending_consent", assetClass: assetFilter };
      if (demo) {
        routeDealFlow(consentFilters);
        toast("Showing consent pipeline");
        return;
      }
      if (!ndaCandidate) {
        routeDealFlow(consentFilters);
        toast("No eligible matches available to queue NDA");
        return;
      }

      try {
        await queueNdaMutation.mutateAsync({ matchId: ndaCandidate.id });
        setOutcome(ndaCandidate.id, "Queued NDA");
        toast.success("Top eligible match queued for NDA");
      } catch (e: any) {
        toast.error(e?.message ?? "NDA queue failed");
      }
      routeDealFlow(consentFilters);
      return;
    }

    if (index === 2) {
      setLocation("/attribution");
    }
  }

  async function handlePrimary(
    matchId: number,
    isExpressAndMaybeOpen: boolean
  ) {
    if (demo) {
      setOutcome(matchId, isExpressAndMaybeOpen ? "Opened room" : "Queued NDA");
      return;
    }
    try {
      if (isExpressAndMaybeOpen) {
        const res = await expressInterestMutation.mutateAsync({ matchId });
        if (res.mutualInterest) {
          await createDealRoomMutation.mutateAsync({ matchId });
          setOutcome(matchId, "Opened room");
          toast.success("Deal room created");
        } else {
          // No mutual interest yet; queue NDA as the next action to signal pipeline intent
          await queueNdaMutation.mutateAsync({ matchId });
          setOutcome(matchId, "Queued NDA");
          toast.success("Interest expressed. NDA queued");
        }
      } else {
        await queueNdaMutation.mutateAsync({ matchId });
        setOutcome(matchId, "Queued NDA");
        toast.success("NDA queued");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    }
  }

  async function handleEscalate(matchId: number) {
    if (demo) {
      setOutcome(matchId, "Escalated");
      return;
    }
    try {
      await escalateMutation.mutateAsync({ matchId });
      setOutcome(matchId, "Escalated");
      toast.success("Escalated");
    } catch (e: any) {
      toast.error(e?.message ?? "Escalation failed");
    }
  }

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Deal Flow</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Verified counterparties only. Identities sealed until mutual consent.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
          Industry Lens: {industry}
        </p>
        <p className="text-xs text-[#1E3A5F]/60 mt-2">
          Data freshness: {freshnessText} · {filteredMatches.length} visible
          opportunities
        </p>
      </div>
      {(minScore > 0 || statusFilter || assetFilter) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {minScore > 0 && (
            <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">
              Min Score {minScore}
            </span>
          )}
          {statusFilter && (
            <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">
              Status {statusFilter}
            </span>
          )}
          {assetFilter && (
            <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">
              Asset {assetFilter}
            </span>
          )}
        </div>
      )}
      <KpiRibbon
        items={[
          {
            label: "Blind Opportunities",
            value: String(matches.length),
            tone: "blue",
          },
          {
            label: "Avg Compatibility",
            value: `${(matches.reduce((sum, match) => sum + match.compatibilityScore, 0) / Math.max(1, matches.length)).toFixed(0)}%`,
            tone: "green",
          },
          { label: "Verified Counterparties", value: "100%", tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={liveProofItems}
      />
      <StoryBeats active="match" />
      <ActionCards
        primaryIndex={0}
        onAction={(_, index) => {
          void handleActionCard(index);
        }}
        items={[
          {
            title: "Prioritize Top Decile Matches",
            body: "Auto-sequence highest quality opportunities.",
            cta: "Prioritize",
          },
          {
            title: "Open Consent Pipeline",
            body: "Move eligible deals into NDA execution instantly.",
            cta: "Open NDAs",
          },
          {
            title: "Route to Attribution",
            body: "Review reserve decisions in the attribution ledger.",
            cta: "Open Attribution",
          },
        ]}
      />

      <StaggerContainer>
        {filteredMatches.map((match, idx) => (
          <StaggerItem key={match.id}>
            <div className="card-elevated p-5 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-[#059669]" />
                    <StatusPulse label="Verified Counterparty" tone="green" />
                  </div>
                  <p className="font-semibold text-[#0A1628]">{match.tag}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#C4972A]">
                    {match.compatibilityScore}%
                  </p>
                  <p className="text-xs text-[#1E3A5F]/50">compatibility</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#1E3A5F]/60 mb-4">
                <span className="px-2 py-0.5 bg-[#1E3A5F]/8 rounded">
                  {match.assetClass}
                </span>
                <span>{match.dealSize}</span>
                <span className="px-2 py-0.5 bg-[#1E3A5F]/8 rounded uppercase font-bold">
                  SEALED
                </span>
                <span className="px-2 py-0.5 bg-[#F59E0B]/15 text-[#F59E0B] rounded uppercase font-bold">
                  Requires Consent
                </span>
              </div>

              <div className="flex gap-2">
                <motion.button
                  className="flex-1 py-2 bg-[#2563EB] text-white text-xs font-semibold uppercase tracking-wider rounded"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={anyPending}
                  onClick={() => handlePrimary(match.id, idx === 0)}
                >
                  {idx === 0 ? "Express Interest - NDA" : "Queue Interest"}
                </motion.button>
                <motion.button
                  className="px-4 py-2 border border-[#1E3A5F]/20 text-[#1E3A5F]/50 text-xs font-semibold uppercase tracking-wider rounded"
                  whileHover={{ scale: 1.02 }}
                  disabled={anyPending}
                  onClick={() => handleEscalate(match.id)}
                >
                  Pass
                </motion.button>
              </div>
              {outcomes[match.id] && (
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                  {outcomes[match.id]}
                </p>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
