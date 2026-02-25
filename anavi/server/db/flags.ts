import { and, eq, or, isNull, gt, desc } from "drizzle-orm";
import { userFlags } from "../../drizzle/schema";
import type { UserFlag } from "../../drizzle/schema";
import { getDb } from "./connection";

/**
 * Returns all active (non-expired) flags for the given user.
 */
export async function getUserFlags(userId: number): Promise<UserFlag[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const rows = await db
    .select()
    .from(userFlags)
    .where(
      and(
        eq(userFlags.userId, userId),
        or(isNull(userFlags.expiresAt), gt(userFlags.expiresAt, now))
      )
    );
  return rows as UserFlag[];
}

export async function createUserFlag(
  data: typeof userFlags.$inferInsert
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userFlags).values(data);
  return result[0].insertId;
}

export async function deleteUserFlag(flagId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userFlags).where(eq(userFlags.id, flagId));
}

export async function listUserFlags(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { flags: [], page, limit };
  const offset = (page - 1) * limit;
  const flags = await db
    .select()
    .from(userFlags)
    .orderBy(desc(userFlags.createdAt))
    .limit(limit)
    .offset(offset);
  return { flags, page, limit };
}
