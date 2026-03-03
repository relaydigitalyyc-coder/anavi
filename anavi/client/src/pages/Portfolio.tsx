import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { mapRawPayouts, type RawPayout } from "@/lib/payoutUtils";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StatusPulse,
  StoryBeats,
} from "@/components/PersonaSurface";

export default function Portfolio() {
  const demo = useDemoFixtures();
  const [location] = useLocation();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: livePayouts } = trpc.payout.list.useQuery(undefined, { enabled: !demo });
  const rawPositions = (demo?.payouts ?? livePayouts ?? []) as RawPayout[];
  const positions = mapRawPayouts(rawPositions).map(payout => ({
    ...payout,
    irr: payout.irr ?? null,
    vintage: payout.vintage ?? null,
  }));
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, [location]);
  const minIrr = Number(params.get("minIrr") ?? 0);
  const statusFilter = params.get("status");
  const period = params.get("period") ?? "QTD";
  const filteredPositions = positions.filter((position) => {
    const byIrr = position.irr != null ? position.irr >= minIrr : minIrr <= 0;
    const byStatus = statusFilter ? position.status === statusFilter : true;
    return byIrr && byStatus;
  });

  const totalDeployed = filteredPositions.reduce((sum, payout) => sum + payout.amount, 0);
  const avgIrr = filteredPositions.filter((position) => position.irr != null).reduce((sum, position) => sum + (position.irr ?? 0), 0) / Math.max(1, filteredPositions.filter((position) => position.irr != null).length);
  const tvpi = 1 + avgIrr / 100;
  const dpi = 0.42;
  const rvpi = Math.max(0.1, tvpi - dpi);

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A1628]">Portfolio</h1>
          <p className="text-sm text-[#1E3A5F]/60 mt-1">Capital deployed across verified opportunities.</p>
          <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
            Industry Lens: {industry}
          </p>
          <p className="text-xs text-[#1E3A5F]/60 mt-2">
            Data freshness: updated 4m ago · {filteredPositions.length} visible positions
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#0A1628]">${(totalDeployed / 1e6).toFixed(2)}M</p>
          <p className="text-xs text-[#1E3A5F]/50">total deployed</p>
        </div>
      </div>
      <KpiRibbon
        items={[
          { label: "Total Deployed", value: `$${(totalDeployed / 1e6).toFixed(2)}M`, tone: "blue" },
          { label: "Avg IRR", value: `${avgIrr.toFixed(1)}%`, tone: "green" },
          { label: "Institutional Readiness", value: "Verified", tone: "gold" },
        ]}
      />
      {(minIrr > 0 || statusFilter) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {minIrr > 0 && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Min IRR {minIrr}%</span>}
          {statusFilter && <span className="rounded-full bg-[#1E3A5F]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#1E3A5F]/70">Status {statusFilter}</span>}
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <button className="rounded bg-[#2563EB]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
          Publish Snapshot
        </button>
        <button className="rounded bg-[#1E3A5F]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F]/70">
          Export Statement
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: "TVPI", value: tvpi.toFixed(2) + "x" },
          { label: "DPI", value: dpi.toFixed(2) + "x" },
          { label: "RVPI", value: rvpi.toFixed(2) + "x" },
          { label: "Report Period", value: period.toUpperCase() },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-[#1E3A5F]/15 bg-[#1E3A5F]/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/50">{metric.label}</p>
            <p className="text-sm font-semibold text-[#0A1628] mt-1">{metric.value}</p>
          </div>
        ))}
      </div>
      <LiveProofStrip
        items={[
          { label: "Performance Uplift 24h", value: "+0.4% blended", delta: "Momentum" },
          { label: "Capital Calls Settled", value: `${Math.min(2, positions.length)}`, delta: "On schedule" },
          { label: "Attribution Coverage", value: "100% positions", delta: "Traceable" },
        ]}
      />
      <StoryBeats active="economics" />
      <ActionCards
        primaryIndex={2}
        items={[
          {
            title: "Rebalance Mandates",
            body: "Adjust sector allocations based on trust-weighted opportunities.",
            cta: "Rebalance",
          },
          {
            title: "Launch Follow-On",
            body: "Activate follow-on capital for outperforming positions.",
            cta: "Deploy Follow-On",
          },
          {
            title: "Publish LP Snapshot",
            body: "Push an institutional portfolio summary to stakeholders.",
            cta: "Publish Snapshot",
          },
        ]}
      />

      <StaggerContainer>
        {filteredPositions.map((payout) => (
          <StaggerItem key={payout.id}>
            <div className="card-elevated p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#0A1628]">{payout.deal}</p>
                {payout.vintage != null && (
                  <p className="text-xs text-[#1E3A5F]/50 mt-0.5">Vintage {payout.vintage}</p>
                )}
                {payout.irr != null && (
                  <p className="text-xs text-[#059669] font-bold mt-0.5">{payout.irr}% IRR</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0A1628]">
                  ${payout.amount.toLocaleString()}
                </p>
                <StatusPulse
                  label={payout.status}
                  tone={payout.status === "deployed" ? "green" : "amber"}
                />
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
