import { eq, desc, and } from "drizzle-orm";
import { InsertUser, users, trustScoreHistory, peerReviews, complianceChecks as complianceChecksTable } from "../../drizzle/schema";
import { ENV } from '../_core/env';
import { getDb } from "./connection";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** F3: Trust score weights (delta per event). */
export const TRUST_SCORE_WEIGHTS: Record<string, number> = {
  deal_completion: 50,
  peer_review: 20,
  verification_upgrade: 15,
  compliance_check: 0,
  dispute_resolution: -30,
  time_decay: 0,
  manual_adjustment: 0,
  doc_approved: 15,
  doc_rejected: -10,
};

const TRUST_SCORE_CEIL = 1000;
const TRUST_SCORE_FLOOR = 0;

export async function updateUserTrustScore(
  userId: number,
  newScore: string,
  reason: string,
  source: string,
  relatedEntityId?: number,
  relatedEntityType?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  await db.insert(trustScoreHistory).values({
    userId,
    previousScore: user.trustScore,
    newScore,
    changeReason: reason,
    changeSource: source as "deal_completion" | "peer_review" | "verification_upgrade" | "compliance_check" | "dispute_resolution" | "time_decay" | "manual_adjustment",
    relatedEntityId: relatedEntityId ?? null,
    relatedEntityType: relatedEntityType ?? null,
  });

  await db.update(users).set({ trustScore: newScore, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** F3: Idempotent trust score recalculation from events. */
export async function recalculateTrustScore(
  userId: number,
  eventType: string,
  sourceId: number,
  entityType: string = "deal",
  deltaOverride?: number
) {
  const db = await getDb();
  if (!db) return;

  const delta = deltaOverride ?? TRUST_SCORE_WEIGHTS[eventType];
  if (delta === undefined || delta === 0) return;

  const changeSource = eventType === "doc_rejected" ? "verification_upgrade" : eventType;

  const existing = await db
    .select({ id: trustScoreHistory.id })
    .from(trustScoreHistory)
    .where(
      and(
        eq(trustScoreHistory.userId, userId),
        eq(trustScoreHistory.changeSource, changeSource as any),
        eq(trustScoreHistory.relatedEntityId, sourceId)
      )
    )
    .limit(1);
  if (existing.length > 0) return;

  const user = await getUserById(userId);
  if (!user) return;
  const prev = Number(user.trustScore ?? 0);
  const next = Math.max(TRUST_SCORE_FLOOR, Math.min(TRUST_SCORE_CEIL, prev + delta));
  const reason = delta >= 0 ? `+${delta} ${eventType}` : `${delta} ${eventType}`;
  await updateUserTrustScore(
    userId,
    String(next),
    reason,
    changeSource,
    sourceId,
    entityType
  );
}

export async function getTrustScoreHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(trustScoreHistory)
    .where(eq(trustScoreHistory.userId, userId))
    .orderBy(desc(trustScoreHistory.createdAt))
    .limit(limit);
}

// ─── Trust Score Component Maps (PRD-W1) ───────────────────────────────────────

const TIER_SCORES: Record<string, number> = {
  none: 0,
  basic: 33.33,
  enhanced: 66.66,
  institutional: 100,
};

/**
 * Calculates a normalized 0–100 trust score from live DB data.
 * Weights: verificationTier 30%, totalDeals 25%, peerReviews 20%, compliance 15%, tenure 10%.
 * Always writes trustScoreHistory and updates users.trustScore.
 */
export async function calculateTrustScore(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRows.length === 0) throw new Error(`User ${userId} not found`);
  const user = userRows[0]!;

  const reviewRows = await db
    .select()
    .from(peerReviews)
    .where(eq(peerReviews.revieweeId, userId));

  const checkRows = await db
    .select()
    .from(complianceChecksTable)
    .where(and(eq(complianceChecksTable.entityType, "user"), eq(complianceChecksTable.entityId, userId)));

  const tierRaw = TIER_SCORES[user.verificationTier ?? "none"] ?? 0;
  const totalDeals = user.totalDeals ?? 0;
  const dealRaw = Math.min(totalDeals / 20, 1) * 100;

  let reviewRaw = 0;
  if (reviewRows.length > 0) {
    const avgRating = reviewRows.reduce((sum, r) => sum + (r.rating ?? 1), 0) / reviewRows.length;
    reviewRaw = ((avgRating - 1) / 4) * 100;
  }

  let complianceRaw = 0;
  if (checkRows.length > 0) {
    const passed = checkRows.filter((c) => c.status === "passed").length;
    complianceRaw = (passed / checkRows.length) * 100;
  }

  const createdAt = user.createdAt ?? new Date();
  const monthsOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const tenureRaw = Math.min(monthsOld / 24, 1) * 100;

  const rawScore =
    tierRaw * 0.3 +
    dealRaw * 0.25 +
    reviewRaw * 0.2 +
    complianceRaw * 0.15 +
    tenureRaw * 0.1;

  const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

  await db.insert(trustScoreHistory).values({
    userId,
    previousScore: user.trustScore ?? "0.00",
    newScore: String(score),
    changeReason: "trust_score_recalculation",
    changeSource: "manual_adjustment",
  });

  await db
    .update(users)
    .set({ trustScore: String(score), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return score;
}

/** Badge assignment: score < 40 → none; ≥40 → basic; ≥70 + kyb → enhanced; ≥90 + all compliance → institutional */
export async function assignBadge(userId: number, score: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRows.length === 0) throw new Error(`User ${userId} not found`);
  const user = userRows[0]!;
  const kybStatus = user.kybStatus ?? "pending";

  const checkRows = await db
    .select()
    .from(complianceChecksTable)
    .where(and(eq(complianceChecksTable.entityType, "user"), eq(complianceChecksTable.entityId, userId)));
  const allCompliancePassed = checkRows.length > 0 && checkRows.every((c) => c.status === "passed");

  let badge: string | null = null;
  let verificationTier = "none";
  if (score >= 90 && allCompliancePassed) {
    badge = "institutional";
    verificationTier = "institutional";
  } else if (score >= 70 && kybStatus === "approved") {
    badge = "enhanced";
    verificationTier = "enhanced";
  } else if (score >= 40) {
    badge = "basic";
    verificationTier = "basic";
  }

  await db
    .update(users)
    .set({
      verificationBadge: badge,
      verificationTier: verificationTier as "none" | "basic" | "enhanced" | "institutional",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
