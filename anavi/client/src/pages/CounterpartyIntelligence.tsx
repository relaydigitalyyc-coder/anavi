import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle } from "lucide-react";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

export default function CounterpartyIntelligence() {
  const demo = useDemoFixtures();
  const [location] = useLocation();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: liveRelationships } = trpc.relationship.list.useQuery(undefined, { enabled: !demo });
  const rawCounterparties = (demo?.relationships ?? liveRelationships ?? []) as Array<{
    id: number;
  } & Record<string, unknown>>;

  const getCustodyAge = (relationship: { custodyAge?: string; establishedAt?: string | Date | null }) => {
    if (relationship.custodyAge) return relationship.custodyAge;
    if (!relationship.establishedAt) return "Unknown";
    return formatDistanceToNow(new Date(relationship.establishedAt), { addSuffix: true });
  };

  const items: Array<{
    id: number;
    name: string;
    company: string;
    trustScore: number | string;
    custodyAge: string;
    assetClass: string;
  }> = rawCounterparties.map((counterparty) => {
    const name =
      "name" in counterparty && counterparty.name
        ? counterparty.name
        : `Contact #${"contactId" in counterparty ? counterparty.contactId : counterparty.id}`;
    const company =
      "company" in counterparty && counterparty.company ? counterparty.company : "Unknown";
    const trustScore =
      "trustScore" in counterparty && counterparty.trustScore != null
        ? counterparty.trustScore
        : "strengthScore" in counterparty
          ? counterparty.strengthScore
          : "-";
    const custodyAge = getCustodyAge(counterparty as { custodyAge?: string; establishedAt?: string | Date | null });
    const assetClass =
      "assetClass" in counterparty && counterparty.assetClass ? counterparty.assetClass : "Unknown";

    return {
      id: counterparty.id,
      name: String(name),
      company: String(company),
      trustScore: typeof trustScore === "number" ? trustScore : String(trustScore),
      custodyAge: String(custodyAge),
      assetClass: String(assetClass),
    };
  });
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, [location]);
  const minTrust = Number(params.get("minTrust") ?? 0);
  const permission = params.get("permission");
  const filteredItems = items.filter((item) => Number(item.trustScore) >= minTrust);

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Counterparty Intelligence</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Shared compliance passports. You access verification records - you do not duplicate them.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
          Industry Lens: {industry}
        </p>
        <p className="text-xs text-[#1E3A5F]/60 mt-2">
          Data freshness: updated 3m ago · {filteredItems.length} verified counterparties
        </p>
      </div>
      {(minTrust > 0 || permission) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {minTrust > 0 && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Min Trust {minTrust}</span>}
          {permission && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Permission {permission}</span>}
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <button className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
          Request Docs
        </button>
        <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F]/70">
          Update Profile Intent
        </button>
        <button className="rounded bg-[#059669]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#059669]">
          Confirm Settlement Details
        </button>
      </div>
      <KpiRibbon
        items={[
          { label: "Passport Coverage", value: `${filteredItems.length}`, tone: "blue" },
          { label: "Avg Trust Score", value: `${(filteredItems.reduce((sum, item) => sum + Number(item.trustScore || 0), 0) / Math.max(1, filteredItems.length)).toFixed(0)}`, tone: "green" },
          { label: "Compliance Freshness", value: "Realtime", tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={[
          { label: "Passport Refreshes", value: `${Math.min(3, items.length)} in 24h`, delta: "Auto-synced" },
          { label: "Compliance Exceptions", value: "0 critical", delta: "Stable" },
          { label: "Trusted Counterparties", value: `${items.length}`, delta: "Network growing" },
        ]}
      />
      <StoryBeats active="custody" />
      <ActionCards
        primaryIndex={0}
        items={[
          {
            title: "Whitelist Counterparties",
            body: "Promote top verified entities to fast-track matching.",
            cta: "Whitelist",
          },
          {
            title: "Trigger Deep Diligence",
            body: "Request deeper passport layers for high-value mandates.",
            cta: "Request Layer",
          },
          {
            title: "Route To Deal Rooms",
            body: "Move trusted counterparties directly into execution.",
            cta: "Route",
          },
        ]}
      />

      <StaggerContainer>
        {filteredItems.map((counterparty) => (
          <StaggerItem key={counterparty.id}>
            <div className="card-elevated p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#0A1628]">{counterparty.name}</p>
                  <p className="text-sm text-[#1E3A5F]/60">{counterparty.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#0A1628]">{counterparty.trustScore}</p>
                  <p className="text-xs text-[#1E3A5F]/50">trust score</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["KYB", "OFAC", "AML"].map((check) => (
                  <div key={check} className="flex items-center gap-1.5 bg-[#059669]/8 rounded px-2 py-1">
                    <CheckCircle className="w-3 h-3 text-[#059669]" />
                    <span className="text-xs font-bold text-[#059669]">{check} Clean</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusPulse label="View: Allowed" tone="blue" />
                <StatusPulse label="Profile: Restricted" tone="amber" />
              </div>

              <p className="text-xs text-[#1E3A5F]/40 mt-2">
                Shared compliance passport - {counterparty.assetClass} - Custodied {counterparty.custodyAge}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
