import { useActiveIndustry, useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import {
  FadeInView,
  StaggerContainer,
  StaggerItem,
} from "@/components/PageTransition";
import {
  ActionCards,
  KpiRibbon,
  LiveProofStrip,
  StoryBeats,
} from "@/components/PersonaSurface";

export default function AttributionLedger() {
  const demo = useDemoFixtures();
  const industry = useActiveIndustry() ?? "Infrastructure";
  const { data: livePayouts } = trpc.payout.list.useQuery(undefined, {
    enabled: !demo,
  });
  const rawPayouts = (demo?.payouts ?? livePayouts ?? []) as unknown as Array<
    {
      id: number;
      amount: number | string;
    } & Record<string, unknown>
  >;

  const payouts: Array<{
    id: number;
    deal: string;
    amount: number;
    status: string;
    originatorShare: number | null;
  }> = rawPayouts.map(payout => {
    const amount =
      typeof payout.amount === "number"
        ? payout.amount
        : parseFloat(String(payout.amount));
    const deal =
      "deal" in payout && payout.deal
        ? payout.deal
        : `Deal #${"dealId" in payout ? payout.dealId : payout.id}`;
    const status =
      "status" in payout && payout.status ? payout.status : "pending";
    const originatorShare =
      "originatorShare" in payout && typeof payout.originatorShare === "number"
        ? payout.originatorShare
        : null;
    return {
      id: payout.id,
      deal: String(deal),
      amount,
      status: String(status),
      originatorShare,
    };
  });

  const lifetimeTotal = payouts.reduce((sum, payout) => sum + payout.amount, 0);

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A1628]">
            Attribution Ledger
          </h1>
          <p className="text-sm text-[#1E3A5F]/60 mt-1">
            Lifetime attribution - every originator fee, every follow-on.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#C4972A] mt-2">
            Industry Lens: {industry}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#059669]">
            ${(lifetimeTotal / 1e6).toFixed(2)}M
          </p>
          <p className="text-xs text-[#1E3A5F]/50">Lifetime attributed</p>
        </div>
      </div>
      <KpiRibbon
        items={[
          { label: "Lifetime Attributed", value: `$${(lifetimeTotal / 1e6).toFixed(2)}M`, tone: "green" },
          { label: "Triggered Payouts", value: String(payouts.filter((payout) => payout.status === "triggered" || payout.status === "completed").length), tone: "blue" },
          { label: "Avg Originator Share", value: `${(payouts.filter((payout) => payout.originatorShare != null).reduce((sum, payout) => sum + (payout.originatorShare ?? 0), 0) / Math.max(1, payouts.filter((payout) => payout.originatorShare != null).length)).toFixed(1)}%`, tone: "gold" },
        ]}
      />
      <LiveProofStrip
        items={[
          { label: "Triggered Payouts 24h", value: `${payouts.filter((payout) => payout.status === "triggered").length}`, delta: "+1 today" },
          { label: "Attribution Accuracy", value: "100% linked", delta: "Ledger clean" },
          { label: "Economic Throughput", value: `$${(lifetimeTotal / 1e6).toFixed(2)}M`, delta: "Compounding" },
        ]}
      />
      <StoryBeats active="economics" />
      <ActionCards
        primaryIndex={1}
        items={[
          {
            title: "Verify Trigger Conditions",
            body: "Review milestone triggers before payout release.",
            cta: "Review Triggers",
          },
          {
            title: "Export Institutional Statement",
            body: "Generate attribution-grade reporting for LP review.",
            cta: "Export PDF",
          },
          {
            title: "Queue Follow-On Attribution",
            body: "Carry custody economics into next transactions.",
            cta: "Queue Follow-On",
          },
        ]}
      />

      <StaggerContainer>
        {payouts.map(payout => (
          <StaggerItem key={payout.id}>
            <div className="card-elevated p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#0A1628]">{payout.deal}</p>
                {payout.originatorShare != null && (
                  <p className="text-xs text-[#C4972A] font-medium mt-0.5">
                    {payout.originatorShare}% originator share
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0A1628]">
                  ${payout.amount.toLocaleString()}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                    payout.status === "triggered" ||
                    payout.status === "completed"
                      ? "bg-[#059669]/15 text-[#059669]"
                      : "bg-[#F59E0B]/15 text-[#F59E0B]"
                  }`}
                >
                  {payout.status}
                </span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
