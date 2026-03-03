import { formatDistanceToNow } from "date-fns";
import { Shield, ChevronRight } from "lucide-react";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { COLORS } from "./constants";
import { LoadingSkeleton } from "./CompatibilityRing";

export function IncomingTab({
  matches,
  loading,
  onReview,
  onDecline,
}: {
  matches: any[];
  loading: boolean;
  onReview: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  if (loading) return <LoadingSkeleton />;

  if (matches.length === 0) {
    return (
      <div className="py-12">
        <EmptyState {...EMPTY_STATES.matches} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {matches.map((m: any, index: number) => {
        const score = m.compatibilityScore ?? 0;
        const scoreColor =
          score >= 80 ? COLORS.green : score >= 60 ? COLORS.gold : COLORS.red;

        return (
          <div
            key={m.id}
            className={`card-elevated p-6 flex flex-col sm:flex-row gap-6 hover:translate-y-[-2px] transition-transform ${index === 0 ? "border-[#22D4F5]/25" : ""}`}
            style={
              index === 0
                ? {
                    boxShadow:
                      "0 4px 24px rgb(10 22 40 / 0.08), 0 0 0 1px rgb(34 212 245 / 0.20)",
                  }
                : undefined
            }
          >
            {/* score column */}
            <div className="flex flex-col items-center justify-center shrink-0 w-28">
              <span className="bg-[#C4972A]/15 text-[#C4972A] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
                MATCH
              </span>
              <span className="font-data-hud text-2xl font-bold text-[#22D4F5]">
                {score}%
              </span>
              <div
                className="w-full h-1.5 rounded-full mt-2"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor: scoreColor,
                  }}
                />
              </div>
            </div>

            {/* details */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium mb-1"
                style={{ color: COLORS.navy }}
              >
                {m.matchReason ||
                  "AI-identified opportunity based on your intents"}
              </p>
              {m.aiAnalysis && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {m.aiAnalysis}
                </p>
              )}

              <div
                className="flex items-center gap-3 text-xs text-gray-500 mb-3 p-3 rounded-md"
                style={{ backgroundColor: COLORS.surface }}
              >
                <Shield
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: COLORS.green }}
                />
                <span className="capitalize">
                  {m.counterpartyVerificationTier ?? "none"}
                </span>
                <span className="text-gray-300">|</span>
                <span>{m.counterpartyDealCount ?? 0} deals completed</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div
                  className="rounded-md p-3"
                  style={{ backgroundColor: "#EFF6FF" }}
                >
                  <span
                    className="font-semibold block mb-1"
                    style={{ color: COLORS.blue }}
                  >
                    Your Intent
                  </span>
                  <span className="text-gray-600">
                    Intent #
                    {m.intent1Id != null ? String(m.intent1Id).slice(-6) : "—"}
                  </span>
                </div>
                <div
                  className="rounded-md p-3"
                  style={{ backgroundColor: "#FFFBEB" }}
                >
                  <span
                    className="font-semibold block mb-1"
                    style={{ color: COLORS.gold }}
                  >
                    Their Intent
                  </span>
                  <span className="text-gray-600">
                    Intent #
                    {m.intent2Id != null ? String(m.intent2Id).slice(-6) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
              <button
                onClick={() => onReview(m.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: COLORS.blue }}
              >
                Review Match <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDecline(m.id)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: COLORS.border, color: "#6B7280" }}
              >
                Decline
              </button>
              <span className="text-xs text-gray-400 text-right mt-auto">
                {m.createdAt
                  ? formatDistanceToNow(new Date(m.createdAt), {
                      addSuffix: true,
                    })
                  : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}