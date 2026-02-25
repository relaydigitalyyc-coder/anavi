import { createHash } from "crypto";
import { eq, desc } from "drizzle-orm";
import { relationships } from "../../drizzle/schema";
import { getDb } from "../db";

export const GENESIS_HASH = "0".repeat(64);

export interface RelationshipHashPayload {
  ownerId: number;
  contactId: number;
  establishedAt: string;
  prevHash: string;
}

/**
 * Returns the most recent timestampHash for a given owner, or the genesis
 * hash (64 zeros) if the user has no prior relationships or DB is unavailable.
 */
export async function getLastRelationshipHash(ownerId: number): Promise<string> {
  const db = await getDb();
  if (!db) return GENESIS_HASH;

  const last = await db
    .select({ timestampHash: relationships.timestampHash })
    .from(relationships)
    .where(eq(relationships.ownerId, ownerId))
    .orderBy(desc(relationships.establishedAt))
    .limit(1);

  return last[0]?.timestampHash ?? GENESIS_HASH;
}

/**
 * Generates a SHA-256 hash and base64 proof for a relationship.
 * Payload is JSON-serialised deterministically and hashed.
 */
export function generateRelationshipHash(payload: RelationshipHashPayload): {
  hash: string;
  proof: string;
} {
  const canonical = JSON.stringify({
    ownerId: payload.ownerId,
    contactId: payload.contactId,
    establishedAt: payload.establishedAt,
    prevHash: payload.prevHash,
  });

  const hash = createHash("sha256").update(canonical).digest("hex");
  const proof = Buffer.from(canonical).toString("base64");

  return { hash, proof };
}

/**
 * Verifies that a stored hash matches the stored proof.
 */
export function verifyRelationshipHash(hash: string, proof: string): boolean {
  try {
    const canonical = Buffer.from(proof, "base64").toString("utf8");
    const recomputed = createHash("sha256").update(canonical).digest("hex");
    return recomputed === hash;
  } catch {
    return false;
  }
}
