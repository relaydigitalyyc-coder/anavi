import { eq, desc, or, inArray, sql } from "drizzle-orm";
import { matches, users, dealParticipants } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createMatch(data: typeof matches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matches).values(data);
  return result[0].insertId;
}

export async function getMatchesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .orderBy(desc(matches.createdAt));
}

export type MatchWithCounterparty = Awaited<ReturnType<typeof getMatchesWithCounterpartyByUser>>[number];

export async function getMatchesWithCounterpartyByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const userMatches = await db
    .select()
    .from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .orderBy(desc(matches.createdAt));

  const counterpartyIds = userMatches.map((m) =>
    m.user1Id === userId ? m.user2Id : m.user1Id
  );
  const uniqueIds = Array.from(new Set(counterpartyIds));

  if (uniqueIds.length === 0) {
    return userMatches.map((m) => ({
      ...m,
      counterpartyName: null as string | null,
      counterpartyCompany: null as string | null,
      counterpartyHandle: null as string | null,
      counterpartyVerificationTier: "none" as const,
      counterpartyDealCount: 0,
      mutualConsent: false,
    }));
  }

  const counterpartyUsers = await db
    .select({
      id: users.id,
      name: users.name,
      company: users.company,
      verificationTier: users.verificationTier,
    })
    .from(users)
    .where(inArray(users.id, uniqueIds));

  const cpMap = new Map(counterpartyUsers.map((u) => [u.id, u]));

  const dealCountResults = await db
    .select({ userId: dealParticipants.userId, cnt: sql<number>`count(*)` })
    .from(dealParticipants)
    .where(inArray(dealParticipants.userId, uniqueIds))
    .groupBy(dealParticipants.userId);

  const dealCountMap = new Map(dealCountResults.map((r) => [r.userId, Number(r.cnt)]));

  return userMatches.map((m) => {
    const cpId = m.user1Id === userId ? m.user2Id : m.user1Id;
    const cp = cpMap.get(cpId);
    const mutualConsent = !!(m.user1Consent && m.user2Consent);
    return {
      ...m,
      counterpartyName: cp?.name ?? null,
      counterpartyCompany: cp?.company ?? null,
      counterpartyHandle: null as string | null,
      counterpartyVerificationTier: cp?.verificationTier ?? "none",
      counterpartyDealCount: dealCountMap.get(cpId) ?? 0,
      mutualConsent: !!mutualConsent,
    };
  });
}

export async function updateMatch(id: number, data: Partial<typeof matches.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matches).set({ ...data, updatedAt: new Date() }).where(eq(matches.id, id));
}
