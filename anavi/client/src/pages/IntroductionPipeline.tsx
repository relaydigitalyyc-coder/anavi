import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

const PIPELINE_STAGES = ["Custodied", "Matched", "Consented", "Deal Room", "Closing", "Attributed"] as const;

export default function IntroductionPipeline() {
  const demo = useDemoFixtures();
  const [location] = useLocation();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: liveMatches } = trpc.match.list.useQuery(undefined, { enabled: !demo });
  const rawMatches = (demo?.matches ?? liveMatches ?? []) as unknown as Array<Record<string, unknown>>;
  const matches: Array<{
    id: number;
    tag: string;
    assetClass: string;
    dealSize: string;
    compatibilityScore: number;
    status: string;
  }> = rawMatches.map((match) => {
    const id = typeof match.id === "number" ? match.id : Number(match.id);
    const tag = "tag" in match && match.tag
      ? match.tag
      : match.counterpartyCompany
        ? `Counterparty - ${match.counterpartyCompany}`
        : `Match #${id}`;
    const assetClass = "assetClass" in match && match.assetClass ? match.assetClass : "Private Markets";
    const dealSize = "dealSize" in match && match.dealSize ? match.dealSize : "TBD";
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
  const filteredMatches = matches.filter((match) => {
    const byScore = match.compatibilityScore >= minScore;
    const byStatus = statusFilter ? match.status === statusFilter : true;
    return byScore && byStatus;
  });
  const [outcomes, setOutcomes] = useState<Record<number, string>>({});
  const setOutcome = (id: number, message: string) => {
    setOutcomes((prev) => ({ ...prev, [id]: message }));
    window.setTimeout(() => {
      setOutcomes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2200);
  };

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Introduction Pipeline</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">Every introduction. Every stage. Every attribution claim.</p>
        <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
          Industry Lens: {industry}
        </p>
        <p className="text-xs text-[#1E3A5F]/60 mt-2">
          Data freshness: updated 5m ago · {filteredMatches.length} pipeline opportunities
        </p>
      </div>
      {(minScore > 0 || statusFilter) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {minScore > 0 && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Min Score {minScore}</span>}
          {statusFilter && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Status {statusFilter}</span>}
        </div>
      )}
      <KpiRibbon
        items={[
          { label: "Pipeline Deals", value: String(matches.length), tone: "blue" },
          { label: "Avg Match Quality", value: `${(matches.reduce((sum, match) => sum + match.compatibilityScore, 0) / Math.max(1, matches.length)).toFixed(0)}%`, tone: "green" },
          { label: "Ready For Deal Room", value: String(matches.filter((match) => match.status.includes("consent")).length), tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={[
          { label: "Matches Advanced 24h", value: `${Math.min(2, matches.length)}`, delta: "+22%" },
          { label: "Consent Conversions", value: `${matches.filter((match) => match.status.includes("consent")).length}`, delta: "In progress" },
          { label: "Deal Room Opens", value: `${Math.min(1, matches.length)}`, delta: "Execution ready" },
        ]}
      />
      <StoryBeats active="match" />
      <ActionCards
        primaryIndex={0}
        items={[
          {
            title: "Advance Highest-Score Matches",
            body: "Push top opportunities into mutual consent workflows.",
            cta: "Advance Pipeline",
          },
          {
            title: "Escalate Delayed Deals",
            body: "Resolve stale relationships before they decay.",
            cta: "Escalate",
          },
          {
            title: "Activate Deal Rooms",
            body: "Move approved matches into controlled execution.",
            cta: "Open Rooms",
          },
        ]}
      />

      <div className="grid grid-cols-6 gap-2 mb-4">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1E3A5F]/40">{stage}</p>
          </div>
        ))}
      </div>

      <StaggerContainer>
        {filteredMatches.map((match) => (
          <StaggerItem key={match.id}>
            <div className="card-elevated p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#0A1628] text-sm">{match.tag}</p>
                  <p className="text-xs text-[#1E3A5F]/50 mt-0.5">{match.assetClass} · {match.dealSize}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#C4972A]">{match.compatibilityScore}%</span>
                  <StatusPulse
                    label={match.status.replace(/_/g, " ")}
                    tone={match.status.includes("consent") ? "amber" : "blue"}
                  />
                  <button
                    className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]"
                    onClick={() => setOutcome(match.id, "Escalated")}
                  >
                    Escalate
                  </button>
                </div>
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
