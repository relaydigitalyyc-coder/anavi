import { useLocation } from "wouter";
import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

export default function DemandRoom() {
  const demo = useDemoFixtures();
  const [location] = useLocation();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const matches = demo?.matches ?? [];
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, [location]);
  const minScore = Number(params.get("minScore") ?? 0);
  const statusFilter = params.get("status");
  const filteredMatches = matches.filter(match => {
    const byScore = match.compatibilityScore >= minScore;
    const byStatus = statusFilter ? match.status === statusFilter : true;
    return byScore && byStatus;
  });
  const [outcomes, setOutcomes] = useState<Record<number, string>>({});
  const setOutcome = (id: number, outcome: string) => {
    setOutcomes(prev => ({ ...prev, [id]: outcome }));
    window.setTimeout(() => {
      setOutcomes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2200);
  };

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Demand Room</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Qualified counterparty interactions. You control every disclosure.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
          Industry Lens: {industry}
        </p>
        <p className="text-xs text-[#1E3A5F]/60 mt-2">
          Data freshness: {formatDistanceToNow(new Date(Date.now() - 3 * 60000), { addSuffix: true })} · {filteredMatches.length}{" "}
          counterparties in scope
        </p>
      </div>
      {(minScore > 0 || statusFilter) && (
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
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <button className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
          Set Redaction Rules
        </button>
        <button className="rounded bg-[#F59E0B]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
          Require Legal Approval
        </button>
        <button className="rounded bg-[#059669]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
          Open Controlled Disclosure
        </button>
      </div>
      <KpiRibbon
        items={[
          {
            label: "Qualified Demand",
            value: String(filteredMatches.length),
            tone: "blue",
          },
          {
            label: "Avg Buyer Fit",
            value: `${(filteredMatches.reduce((sum, match) => sum + match.compatibilityScore, 0) / Math.max(1, filteredMatches.length)).toFixed(0)}%`,
            tone: "green",
          },
          {
            label: "Consent Pending",
            value: String(filteredMatches.length),
            tone: "gold",
          },
        ]}
      />
      <LiveProofStrip
        items={[
          {
            label: "Qualified Inbound 24h",
            value: `${Math.min(3, filteredMatches.length)}`,
            delta: "+19%",
          },
          {
            label: "NDA Ready Counterparties",
            value: `${filteredMatches.length}`,
            delta: "Queued",
          },
          {
            label: "Disclosure Safety",
            value: "Sealed by default",
            delta: "No leaks",
          },
        ]}
      />
      <StoryBeats active="match" />
      <ActionCards
        primaryIndex={0}
        items={[
          {
            title: "Issue NDA Wave",
            body: "Open simultaneous NDA flow for top counterparties.",
            cta: "Issue NDAs",
          },
          {
            title: "Tighten Exposure Window",
            body: "Restrict disclosure scope and enforce expiry controls.",
            cta: "Set Controls",
          },
          {
            title: "Escalate To Deal Room",
            body: "Advance consented counterparties into execution.",
            cta: "Escalate",
          },
        ]}
      />

      <StaggerContainer>
        {filteredMatches.map(match => (
          <StaggerItem key={match.id}>
            <div className="card-elevated p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0A1628]">
                  {match.tag}
                </p>
                <p className="text-xs text-[#1E3A5F]/50 mt-0.5">
                  Trust {match.compatibilityScore} - {match.assetClass} -{" "}
                  {match.dealSize}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StatusPulse label="View" tone="blue" />
                  <StatusPulse label="Requires Consent" tone="amber" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPulse label="Pending Consent" tone="amber" />
                <motion.button
                  className="text-xs px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded font-medium"
                  whileHover={{ scale: 1.04 }}
                  onClick={() =>
                    setOutcome(match.id, "Controlled disclosure opened")
                  }
                >
                  Open NDA
                </motion.button>
              </div>
            </div>
            {outcomes[match.id] && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                {outcomes[match.id]}
              </p>
            )}
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
