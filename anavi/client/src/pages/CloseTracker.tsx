import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { CheckCircle, Circle } from "lucide-react";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

const DEMO_MILESTONES = [
  { label: "Thesis Protection Active", done: true },
  { label: "First Qualified Match", done: true },
  { label: "NDA Executed", done: true },
  { label: "Due Diligence Complete", done: false },
  { label: "$18M Committed (next escrow trigger)", done: false },
  { label: "Regulatory Sign-off", done: false },
  { label: "Full Funding Close - $30M", done: false },
];

export default function CloseTracker() {
  const demo = useDemoFixtures();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const dr = demo?.dealRooms[0];
  const blockers = [
    { id: 1, label: "Legal addendum approval", impact: 95, owner: "Counsel" },
    { id: 2, label: "Counterparty diligence memo signature", impact: 84, owner: "Counterparty Ops" },
    { id: 3, label: "Escrow release checklist reconciliation", impact: 73, owner: "Finance" },
  ].sort((a, b) => b.impact - a.impact);

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Close Tracker</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          {dr ? dr.name : "No active raise"} - milestone-by-milestone close coordination.
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
          Industry Lens: {industry}
        </p>
      </div>
      <KpiRibbon
        items={[
          { label: "Milestones Complete", value: `${DEMO_MILESTONES.filter((milestone) => milestone.done).length}/${DEMO_MILESTONES.length}`, tone: "blue" },
          { label: "Committed Capital", value: dr ? `$${(dr.escrowCurrent / 1e6).toFixed(1)}M` : "$0.0M", tone: "green" },
          { label: "Next Trigger", value: "$18M", tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={[
          { label: "Milestones Cleared 24h", value: `${Math.min(1, DEMO_MILESTONES.filter((milestone) => milestone.done).length)}`, delta: "Progressing" },
          { label: "Escrow Progress Delta", value: dr ? `${dr.escrowProgress}%` : "0%", delta: "+4%" },
          { label: "Close Readiness", value: "High confidence", delta: "On track" },
        ]}
      />
      <StoryBeats active="dealRoom" />
      <ActionCards
        primaryIndex={2}
        items={[
          {
            title: "Resolve Next Blocker",
            body: "Focus diligence on the current milestone gate.",
            cta: "Open Blockers",
          },
          {
            title: "Accelerate Capital Calls",
            body: "Notify counterparties and compress response windows.",
            cta: "Send Calls",
          },
          {
            title: "Prepare Closing Pack",
            body: "Bundle legal, escrow, and attribution records for close.",
            cta: "Generate Pack",
          },
        ]}
      />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        {[
          { label: "Best Case", detail: "Close in 9 business days", tone: "green" as const },
          { label: "Base Case", detail: "Close in 14 business days", tone: "blue" as const },
          { label: "Delay Case", detail: "Close in 23 business days", tone: "amber" as const },
        ].map((scenario) => (
          <div key={scenario.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/55">{scenario.label}</p>
            <p className="mt-1 text-sm font-semibold text-[#0A1628]">{scenario.detail}</p>
            <div className="mt-1">
              <StatusPulse label="Timeline Mode" tone={scenario.tone} />
            </div>
          </div>
        ))}
      </div>

      <StaggerContainer>
        <StaggerItem>
          <div className="card-elevated p-5 mb-4">
            <h3 className="text-sm font-semibold text-[#0A1628] mb-4">Closing Milestones</h3>
            <div className="space-y-3">
              {DEMO_MILESTONES.map((milestone, index) => (
                <div key={index} className="flex items-center gap-3">
                  {milestone.done
                    ? <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    : <Circle className="w-4 h-4 text-[#1E3A5F]/20 shrink-0" />
                  }
                  <span className={`text-sm ${milestone.done ? "text-[#0A1628]" : "text-[#1E3A5F]/40"}`}>
                    {milestone.label}
                  </span>
                  {!milestone.done && index === DEMO_MILESTONES.findIndex((item) => !item.done) && (
                    <span className="ml-auto text-xs px-2 py-0.5 bg-[#F59E0B]/15 text-[#F59E0B] font-bold uppercase rounded-full">
                      Next
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {dr && (
          <StaggerItem>
            <div className="card-elevated p-5">
              <h3 className="text-sm font-semibold text-[#0A1628] mb-2">Escrow Status</h3>
              <p className="text-2xl font-bold text-[#C4972A]">
                ${(dr.escrowCurrent / 1e6).toFixed(1)}M
                <span className="text-sm font-normal text-[#1E3A5F]/50 ml-2">
                  of ${(dr.escrowTarget / 1e6).toFixed(0)}M committed
                </span>
              </p>
              <p className="text-xs text-[#1E3A5F]/50 mt-1">
                Next release trigger: $18M committed
              </p>
            </div>
          </StaggerItem>
        )}

        <StaggerItem>
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold text-[#0A1628] mb-3">Blocker Queue</h3>
            <div className="space-y-2">
              {blockers.map((blocker, index) => (
                <div key={blocker.id} className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/8 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#0A1628]">{blocker.label}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                      Impact {blocker.impact}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-[#1E3A5F]/55">
                      Owner: {blocker.owner}
                    </p>
                    {index === 0 && <StatusPulse label="Primary" tone="amber" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </FadeInView>
  );
}
