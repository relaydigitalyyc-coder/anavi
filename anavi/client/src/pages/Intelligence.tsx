import { BarChart3, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { FadeInView } from "@/components/PageTransition";

function formatSector(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Intelligence() {
  const { data: sectorOverview, isLoading: loadingSector } = trpc.intelligence.sectorOverview.useQuery();
  const { data: marketDepth, isLoading: loadingDepth } = trpc.intelligence.marketDepth.useQuery();

  const loading = loadingSector || loadingDepth;
  const hasData = (sectorOverview?.length ?? 0) > 0 || (marketDepth?.length ?? 0) > 0;

  return (
    <FadeInView>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A1628]/10 text-[#1E3A5F]">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A1628]">Intelligence</h1>
            <p className="text-sm text-[#1E3A5F]/70">Market depth and sector analytics from your deal flow</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-[#0A1628]/10 bg-white/50">
            <p className="text-[#1E3A5F]/70">Loading intelligence data…</p>
          </div>
        ) : !hasData ? (
          <div className="rounded-xl border border-[#0A1628]/10 bg-white/50 p-12 text-center">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 text-[#1E3A5F]/50" />
            <h2 className="text-lg font-semibold text-[#0A1628]">No market data yet</h2>
            <p className="mt-2 text-sm text-[#1E3A5F]/80">
              Add intents (buy, sell, invest) to see sector breakdowns and market depth here.
            </p>
            <Link href="/dashboard">
              <a
                className="mt-6 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#2563EB" }}
              >
                Back to Dashboard
              </a>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {sectorOverview && sectorOverview.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-[#0A1628]">Active intents by sector</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sectorOverview.map(({ sector, count }) => (
                    <div
                      key={sector}
                      className="flex items-center justify-between rounded-xl border border-[#0A1628]/10 bg-white p-4 shadow-sm"
                    >
                      <span className="font-medium text-[#0A1628]">{formatSector(sector)}</span>
                      <span
                        className="rounded-full px-3 py-1 text-sm font-semibold"
                        style={{ backgroundColor: "rgba(37, 99, 235, 0.15)", color: "#1E40AF" }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {marketDepth && marketDepth.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-[#0A1628]">Market depth (buyers vs sellers)</h2>
                <div className="space-y-4">
                  {marketDepth.map(({ sector, buyers, sellers }) => (
                    <div
                      key={sector}
                      className="rounded-xl border border-[#0A1628]/10 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-[#0A1628]">{formatSector(sector)}</span>
                        <span className="text-[#1E3A5F]/70">
                          {buyers} buyers · {sellers} sellers
                        </span>
                      </div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-[#0A1628]/5">
                        <div
                          className="bg-[#2563EB]/60"
                          style={{ width: `${(buyers / (buyers + sellers || 1)) * 100}%` }}
                        />
                        <div
                          className="bg-[#059669]/60"
                          style={{ width: `${(sellers / (buyers + sellers || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 flex gap-4 text-xs text-[#1E3A5F]/60">
                        <span>Buyers</span>
                        <span>Sellers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-4">
              <Link href="/dashboard">
                <a className="text-sm font-medium text-[#2563EB] hover:underline">← Back to Dashboard</a>
              </Link>
            </div>
          </div>
        )}
      </div>
    </FadeInView>
  );
}
