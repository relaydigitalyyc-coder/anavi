import type { DealParticipant } from "../../drizzle/schema";

export type PayoutSplit = {
  userId: number;
  role: string;
  payoutType:
    | "originator_fee"
    | "introducer_fee"
    | "advisor_fee"
    | "lifetime_attribution"
    | "milestone_bonus"
    | "success_fee";
  attributionPercentage: number;
  amount: number;
  isFollowOn: boolean;
  relationshipId?: number | null;
};

export type FollowOnAttribution = {
  userId: number;
  relationshipId: number;
  attributionPercentage: number;
};

const ORIGINATOR_MIN = 40;
const ORIGINATOR_MAX = 60;
const FOLLOW_ON_PCT = 10;

export function calculatePayoutSplits(
  dealValue: number,
  feeRate: number,
  participants: DealParticipant[],
  followOnAttributions: FollowOnAttribution[] = [],
): PayoutSplit[] {
  if (participants.length === 0) return [];

  const totalFees = dealValue * feeRate;
  const splits: PayoutSplit[] = [];

  // Originator split (clamped to 40–60% per white paper)
  const originator = participants.find((p) => p.role === "originator");
  let originatorAmount = 0;
  if (originator) {
    const rawPct = Number(originator.attributionPercentage ?? 50);
    const clampedPct = Math.min(
      ORIGINATOR_MAX,
      Math.max(ORIGINATOR_MIN, rawPct),
    );
    originatorAmount = totalFees * (clampedPct / 100);
    splits.push({
      userId: originator.userId,
      role: "originator",
      payoutType: "originator_fee",
      attributionPercentage: clampedPct,
      amount: originatorAmount,
      isFollowOn: false,
      relationshipId: originator.relationshipId,
    });
  }

  // Follow-on attribution (10% each, lifetime attribution)
  let followOnTotal = 0;
  for (const fo of followOnAttributions) {
    const foAmount = totalFees * (FOLLOW_ON_PCT / 100);
    followOnTotal += foAmount;
    splits.push({
      userId: fo.userId,
      role: "introducer",
      payoutType: "lifetime_attribution",
      attributionPercentage: FOLLOW_ON_PCT,
      amount: foAmount,
      isFollowOn: true,
      relationshipId: fo.relationshipId,
    });
  }

  // Remaining pool distributed proportionally among non-originators
  const remaining = totalFees - originatorAmount - followOnTotal;
  if (remaining > 0) {
    const others = participants.filter((p) => p.role !== "originator");
    const totalOtherPct = others.reduce(
      (s, p) => s + Number(p.attributionPercentage ?? 0),
      0,
    );
    if (totalOtherPct > 0) {
      for (const p of others) {
        const pct = Number(p.attributionPercentage ?? 0);
        if (pct <= 0) continue;
        const share = (pct / totalOtherPct) * remaining;
        const payoutType =
          p.role === "introducer"
            ? ("introducer_fee" as const)
            : p.role === "advisor"
              ? ("advisor_fee" as const)
              : ("success_fee" as const);
        splits.push({
          userId: p.userId,
          role: p.role,
          payoutType,
          attributionPercentage: pct,
          amount: share,
          isFollowOn: false,
          relationshipId: p.relationshipId,
        });
      }
    }
  }

  return splits;
}
