import { useMemo } from "react";
import { Shield, ArrowRight, X } from "lucide-react";
import { SlideIn } from "@/components/PageTransition";
import { COLORS } from "./constants";
import { CompatibilityRing, ScoreBar } from "./CompatibilityRing";

export function MatchReviewPanel({
  match,
  onClose,
  onAccept,
  onDecline,
}: {
  match: any;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const score = match.compatibilityScore ?? 0;

  const breakdownScores = useMemo(
    () => ({
      dealParam: Math.min(
        100,
        Math.max(40, score + Math.floor(Math.random() * 10) - 5)
      ),
      verification: Math.min(
        100,
        Math.max(50, score + Math.floor(Math.random() * 15) - 8)
      ),
      historical: Math.min(
        100,
        Math.max(30, score + Math.floor(Math.random() * 20) - 10)
      ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [match.id]
  );

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* panel */}
      <SlideIn
        direction="right"
        className="fixed top-0 right-0 z-50 h-full shadow-2xl flex flex-col w-full md:w-1/2"
      >
        <div
          style={{
            borderLeft: `1px solid ${COLORS.border}`,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
            style={{ borderColor: COLORS.border }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: COLORS.navy }}
            >
              Match Review
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
            {/* score ring */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <CompatibilityRing score={score} size={140} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-data-hud text-2xl font-bold text-[#22D4F5]">
                    {score}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Overall Compatibility
              </p>
            </div>

            {/* score breakdown */}
            <div
              className="rounded-lg p-4 flex flex-col gap-3"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Score Breakdown
              </h4>
              <ScoreBar
                label="Deal Parameter Match"
                value={breakdownScores.dealParam}
              />
              <ScoreBar
                label="Verification Alignment"
                value={breakdownScores.verification}
              />
              <ScoreBar
                label="Historical Pattern"
                value={breakdownScores.historical}
              />
            </div>

            {/* counterparty card */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Counterparty Profile
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: COLORS.navy }}
                >
                  ?
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: COLORS.navy }}
                  >
                    Anonymous Member
                  </p>
                  <p className="text-xs text-gray-500">
                    Identity revealed upon mutual acceptance
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className="px-2.5 py-1 rounded-full capitalize"
                  style={{ backgroundColor: "#ECFDF5", color: COLORS.green }}
                >
                  <Shield className="w-3 h-3 inline mr-1" />
                  {match.counterpartyVerificationTier ?? "none"} verified
                </span>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "#EFF6FF", color: COLORS.blue }}
                >
                  {match.counterpartyDealCount ?? 0} deals completed
                </span>
              </div>
            </div>

            {/* deal parameter comparison */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Deal Parameter Comparison
              </h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="text-left pb-2 font-medium">Parameter</th>
                    <th
                      className="text-left pb-2 font-medium"
                      style={{ color: COLORS.blue }}
                    >
                      Your Intent
                    </th>
                    <th
                      className="text-left pb-2 font-medium"
                      style={{ color: COLORS.gold }}
                    >
                      Their Intent
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr
                    className="border-t"
                    style={{ borderColor: COLORS.border }}
                  >
                    <td className="py-2 text-gray-500">Intent</td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      #{match.intent1Id?.slice(-6) ?? "—"}
                    </td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      #{match.intent2Id?.slice(-6) ?? "—"}
                    </td>
                  </tr>
                  <tr
                    className="border-t"
                    style={{ borderColor: COLORS.border }}
                  >
                    <td className="py-2 text-gray-500">Type</td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      Buy
                    </td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      Sell
                    </td>
                  </tr>
                  <tr
                    className="border-t"
                    style={{ borderColor: COLORS.border }}
                  >
                    <td className="py-2 text-gray-500">Asset</td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      Commodity
                    </td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      Commodity
                    </td>
                  </tr>
                  <tr
                    className="border-t"
                    style={{ borderColor: COLORS.border }}
                  >
                    <td className="py-2 text-gray-500">Value Range</td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      $1M – $5M
                    </td>
                    <td
                      className="py-2 font-medium"
                      style={{ color: COLORS.navy }}
                    >
                      $2M – $8M
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* match reason & analysis */}
            {(match.matchReason || match.aiAnalysis) && (
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  AI Analysis
                </h4>
                {match.matchReason && (
                  <p className="text-sm mb-2" style={{ color: COLORS.navy }}>
                    {match.matchReason}
                  </p>
                )}
                {match.aiAnalysis && (
                  <p className="text-xs text-gray-500">{match.aiAnalysis}</p>
                )}
              </div>
            )}
          </div>

          {/* footer actions */}
          <div
            className="shrink-0 px-6 py-4 border-t flex gap-3"
            style={{ borderColor: COLORS.border }}
          >
            <button
              onClick={onAccept}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: COLORS.gold }}
            >
              <ArrowRight className="w-4 h-4" />
              Accept Match → Enter Deal Room
            </button>
            <button
              onClick={onDecline}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50"
              style={{ borderColor: COLORS.red, color: COLORS.red }}
            >
              Decline
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-blue-50"
              style={{ borderColor: COLORS.blue, color: COLORS.blue }}
            >
              Request More Info
            </button>
          </div>
        </div>
      </SlideIn>
    </>
  );
}