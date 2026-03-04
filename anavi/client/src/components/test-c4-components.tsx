import * as React from "react";
import { FlowRibbon } from "./FlowRibbon";
import { DecisionCard } from "./DecisionCard";
import { InlineProofChip } from "./InlineProofChip";
import { MicroKpiRail } from "./MicroKpiRail";

export function TestC4Components() {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-[#0A1628] mb-6">C4 Dashboard Flow Elegance System Components</h1>
      
      <section>
        <h2 className="text-lg font-semibold mb-4">1. FlowRibbon</h2>
        <FlowRibbon
          now="3 active diligence sessions"
          next="Review compliance checklist"
          risk="Medium - 2 open items"
          valueAtStake="$4.2M"
        />
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-4">2. DecisionCard</h2>
        <DecisionCard
          title="Approve Investor Access"
          primaryAction="Grant Access"
          onPrimaryAction={() => console.log("Primary action")}
          secondaryAction="Review Terms"
          onSecondaryAction={() => console.log("Secondary action")}
          confidence="High (92%)"
          freshness="Updated 2 hours ago"
        >
          <p className="text-gray-600">
            Investor has completed all KYC requirements and passed automated compliance checks.
            Granting access will enable them to view deal materials and submit bids.
          </p>
        </DecisionCard>
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-4">3. InlineProofChip (all variants)</h2>
        <div className="flex flex-wrap gap-4">
          <InlineProofChip variant="verified" />
          <InlineProofChip variant="sealed" />
          <InlineProofChip variant="attribution-locked" />
          <InlineProofChip variant="audit-trail" />
          <InlineProofChip variant="verified" label="Custom Verified Label" />
        </div>
      </section>
      
      <section>
        <h2 className="text-lg font-semibold mb-4">4. MicroKpiRail (all variants)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MicroKpiRail
            label="Conversion Rate"
            value="24.7%"
            trend="up"
            threshold=">20%"
            status="green"
          />
          <MicroKpiRail
            label="Risk Score"
            value="68"
            trend="down"
            threshold="<50"
            status="amber"
          />
          <MicroKpiRail
            label="Deal Velocity"
            value="14 days"
            trend="flat"
            threshold="<21 days"
            status="red"
          />
          <MicroKpiRail
            label="Active Investors"
            value={42}
            threshold=">30"
            status="green"
          />
        </div>
      </section>
    </div>
  );
}