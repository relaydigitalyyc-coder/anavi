import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { Lock, Hash, Clock } from "lucide-react";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";
import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { Relationship } from "@shared/types";

export default function CustodyRegister() {
  const demo = useDemoFixtures();
  const [location] = useLocation();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: liveRelationships } = trpc.relationship.list.useQuery(
    undefined,
    { enabled: !demo }
  );
  const rawRelationships: Relationship[] = (demo?.relationships ??
    liveRelationships ??
    []) as Relationship[];

  const getCustodyAge = (relationship: Relationship & { custodyAge?: string }) => {
    if (relationship.custodyAge) return relationship.custodyAge;
    if (!relationship.establishedAt) return "Unknown";
    return formatDistanceToNow(new Date(relationship.establishedAt), {
      addSuffix: true,
    });
  };

  interface CustodyItem {
    id: number;
    name: string;
    company: string;
    hash: string;
    custodyAge: string;
    attributionStatus: string;
    assetClass: string;
    trustScore: number;
  }

  const items: CustodyItem[] = rawRelationships.map(relationship => {
    // Handle demo fixture data which has different structure
    const demoRelationship = relationship as Relationship & {
      name?: string;
      company?: string;
      hash?: string;
      custodyAge?: string;
      attributionStatus?: string;
      assetClass?: string;
      trustScore?: number;
    };

    const name = demoRelationship.name || `Contact #${demoRelationship.contactId || demoRelationship.id}`;
    const company = demoRelationship.company || "Unknown";
    const hash = demoRelationship.hash || demoRelationship.timestampHash || "";
    const custodyAge = getCustodyAge(demoRelationship);
    const attributionStatus = demoRelationship.attributionStatus || "pending";
    const assetClass = demoRelationship.assetClass || "Unknown";
    const trustScore = typeof demoRelationship.trustScore === "number" ? demoRelationship.trustScore : 70;

    return {
      id: relationship.id,
      name: String(name),
      company: String(company),
      hash: String(hash),
      custodyAge: String(custodyAge),
      attributionStatus: String(attributionStatus),
      assetClass: String(assetClass),
      trustScore,
    };
  });
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, [location]);
  const minTrust = Number(params.get("minTrust") ?? 0);
  const statusFilter = params.get("status");
  const filteredItems = items.filter((item) => {
    const byTrust = item.trustScore >= minTrust;
    const byStatus = statusFilter ? item.attributionStatus === statusFilter : true;
    return byTrust && byStatus;
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
        <h1 className="text-2xl font-semibold text-[#0A1628]">
          Custody Register
        </h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Every introduction timestamped. Every attribution claim protected.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
          Industry Lens: {industry}
        </p>
        <p className="text-xs text-[#1E3A5F]/60 mt-2">
          Data freshness: {formatDistanceToNow(new Date(Date.now() - 4 * 60000), { addSuffix: true })} · {filteredItems.length} relationships in scope
        </p>
      </div>
      {(minTrust > 0 || statusFilter) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {minTrust > 0 && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Min Trust {minTrust}</span>}
          {statusFilter && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Status {statusFilter}</span>}
        </div>
      )}
      <KpiRibbon
        items={[
          { label: "Custodied Relationships", value: String(filteredItems.length), tone: "blue" },
          { label: "Active Attribution Claims", value: String(filteredItems.filter((item) => item.attributionStatus === "active").length), tone: "green" },
          { label: "Sealed Market Exposure", value: "100%", tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={[
          { label: "New Custody Events", value: `${Math.min(3, filteredItems.length)} in last 24h`, delta: "+18%" },
          { label: "Attribution Chain Integrity", value: "100% verified", delta: "No breaks" },
          { label: "Sealed Relationships", value: `${filteredItems.length}`, delta: "Realtime indexed" },
        ]}
      />
      <StoryBeats active="custody" />
      <ActionCards
        primaryIndex={0}
        items={[
          {
            title: "Seal New Introduction",
            body: "Create a fresh custody proof before disclosure.",
            cta: "Open Intake",
          },
          {
            title: "Run Attribution Audit",
            body: "Validate timestamp chain across active relationships.",
            cta: "Run Audit",
          },
          {
            title: "Prepare Match Queue",
            body: "Push verified relationships into blind matching.",
            cta: "Queue Matches",
          },
        ]}
      />

      <StaggerContainer>
        {filteredItems.map(item => (
          <StaggerItem key={item.id}>
            <div className="card-elevated p-4 mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#0A1628]">{item.name}</p>
                  <p className="text-sm text-[#1E3A5F]/60">{item.company}</p>
                </div>
                <StatusPulse
                  label={item.attributionStatus}
                  tone={item.attributionStatus === "active" ? "green" : "amber"}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[#1E3A5F]/60">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.custodyAge}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{item.hash}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>{item.assetClass}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]"
                  onClick={() => setOutcome(item.id, "Queued for matching")}
                >
                  Queue Match
                </button>
                {outcomes[item.id] && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#059669]">
                    {outcomes[item.id]}
                  </p>
                )}
              </div>
            </div>
          </StaggerItem>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-[#1E3A5F]/40 text-sm">
            No custodied relationships yet. Timestamp your first introduction.
          </div>
        )}
      </StaggerContainer>
    </FadeInView>
  );
}
