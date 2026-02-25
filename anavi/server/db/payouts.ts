import { eq, desc, and } from "drizzle-orm";
import { payouts, deals, dealParticipants } from "../../drizzle/schema";
import { getDb } from "./connection";
import {
  calculatePayoutSplits,
  type FollowOnAttribution,
} from "../_core/payoutCalc";

export async function createPayout(data: typeof payouts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payouts).values(data);
  return result[0].insertId;
}

export async function getPayoutsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(payouts)
    .where(eq(payouts.userId, userId))
    .orderBy(desc(payouts.createdAt));
}

export async function getPayoutsByDeal(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(payouts)
    .where(eq(payouts.dealId, dealId))
    .orderBy(desc(payouts.createdAt));
}

export async function getPayoutById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(payouts)
    .where(eq(payouts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Trigger payouts when deal closes. Idempotent — skips if deal_close payouts already exist. */
export async function triggerPayoutsOnDealClose(dealId: number) {
  const db = await getDb();
  if (!db) return;

  const deal = await db
    .select()
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);
  if (deal.length === 0) return;
  const d = deal[0];
  const dealValue = Number(d.dealValue ?? 0);
  if (dealValue <= 0) return;

  const existing = await db
    .select({ id: payouts.id })
    .from(payouts)
    .where(
      and(eq(payouts.dealId, dealId), eq(payouts.milestoneName, "deal_close")),
    );
  if (existing.length > 0) return;

  const participants = await db
    .select()
    .from(dealParticipants)
    .where(eq(dealParticipants.dealId, dealId));

  // Collect follow-on attributions for lifetime attribution payouts
  const followOns: FollowOnAttribution[] = [];
  if (d.isFollowOn && d.originalDealId) {
    const origParticipants = await db
      .select()
      .from(dealParticipants)
      .where(
        and(
          eq(dealParticipants.dealId, d.originalDealId),
          eq(dealParticipants.role, "originator"),
        ),
      );
    for (const op of origParticipants) {
      if (op.relationshipId) {
        followOns.push({
          userId: op.userId,
          relationshipId: op.relationshipId,
          attributionPercentage: 10,
        });
      }
    }
  }

  const feeRate = 0.02;
  const splits = calculatePayoutSplits(
    dealValue,
    feeRate,
    participants,
    followOns,
  );

  for (const split of splits) {
    await createPayout({
      dealId,
      userId: split.userId,
      amount: String(split.amount.toFixed(2)),
      currency: d.currency ?? "USD",
      payoutType: split.payoutType as typeof payouts.$inferInsert["payoutType"],
      attributionPercentage: String(split.attributionPercentage),
      relationshipId: split.relationshipId,
      status: "pending",
      milestoneId: `deal_close_${dealId}`,
      milestoneName: "deal_close",
      isFollowOn: split.isFollowOn,
      originalDealId: d.originalDealId,
    });
  }
}

export async function updatePayout(
  id: number,
  data: Partial<typeof payouts.$inferInsert>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(payouts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payouts.id, id));
}
