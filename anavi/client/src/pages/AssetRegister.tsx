import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { motion } from "framer-motion";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

export default function AssetRegister() {
  const demo = useDemoFixtures();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const dealRooms = demo?.dealRooms ?? [];

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A1628]">Asset Register</h1>
          <p className="text-sm text-[#1E3A5F]/60 mt-1">Your assets. Sealed until you choose otherwise.</p>
          <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
            Industry Lens: {industry}
          </p>
        </div>
        <motion.button
          className="text-xs px-4 py-2 bg-[#C4972A] text-white font-semibold uppercase tracking-wider"
          whileHover={{ scale: 1.02 }}
        >
          + List New Asset
        </motion.button>
      </div>
      <KpiRibbon
        items={[
          { label: "Sealed Assets", value: String(dealRooms.length), tone: "blue" },
          { label: "Capital Progress", value: `${(dealRooms.reduce((sum, room) => sum + room.escrowProgress, 0) / Math.max(1, dealRooms.length)).toFixed(0)}%`, tone: "green" },
          { label: "Disclosure Leaks", value: "0", tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={[
          { label: "Assets Sealed 24h", value: `${Math.min(1, dealRooms.length)}`, delta: "+1" },
          { label: "Disclosure Events", value: "0 uncontrolled", delta: "Protected" },
          { label: "Escrow Momentum", value: `${(dealRooms.reduce((sum, room) => sum + room.escrowProgress, 0) / Math.max(1, dealRooms.length)).toFixed(0)}%`, delta: "+6%" },
        ]}
      />
      <StoryBeats active="custody" />
      <ActionCards
        primaryIndex={0}
        items={[
          {
            title: "Seal New Asset",
            body: "Register additional assets with controlled disclosure.",
            cta: "Open Registry",
          },
          {
            title: "Raise Readiness Audit",
            body: "Validate all diligence artifacts before scaling outreach.",
            cta: "Run Audit",
          },
          {
            title: "Prepare Investor Route",
            body: "Push sealed assets into qualified demand channels.",
            cta: "Route Demand",
          },
        ]}
      />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        {[
          { label: "Best Case", timeline: "Close in 12 days", confidence: "92%" },
          { label: "Base Case", timeline: "Close in 19 days", confidence: "81%" },
          { label: "Delay Case", timeline: "Close in 31 days", confidence: "63%" },
        ].map((scenario) => (
          <div key={scenario.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/55">{scenario.label}</p>
            <p className="mt-1 text-sm font-semibold text-[#0A1628]">{scenario.timeline}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[#2563EB]">
              Confidence {scenario.confidence}
            </p>
          </div>
        ))}
      </div>

      <StaggerContainer>
        {dealRooms.map((dr) => (
          <StaggerItem key={dr.id}>
            <div className="card-elevated p-5 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#0A1628]">{dr.name}</p>
                  <p className="text-sm text-[#1E3A5F]/60 mt-0.5">{dr.counterparty}</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-[#1E3A5F]/10 text-[#1E3A5F]/60 font-bold uppercase rounded-full">
                  {dr.stage}
                </span>
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <StatusPulse label="Sealed" tone="blue" />
                <StatusPulse label={dr.ndaStatus === "executed" ? "NDA Executed" : "NDA Pending"} tone={dr.ndaStatus === "executed" ? "green" : "amber"} />
                <StatusPulse label={dr.escrowProgress >= 50 ? "Execution Healthy" : "Execution Watch"} tone={dr.escrowProgress >= 50 ? "green" : "amber"} />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[#1E3A5F]/50 mb-1">
                  <span>Capital Committed</span>
                  <span>${(dr.escrowCurrent / 1e6).toFixed(1)}M / ${(dr.escrowTarget / 1e6).toFixed(0)}M</span>
                </div>
                <div className="h-1.5 bg-[#0A1628]/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#C4972A] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${dr.escrowProgress}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              <div className="flex gap-4 text-xs text-[#1E3A5F]/50">
                <span>{dr.documentCount} documents</span>
                <span>{dr.auditEvents} audit events</span>
                <span>NDA: {dr.ndaStatus}</span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
