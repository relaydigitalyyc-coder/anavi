import { eq, desc, or, inArray, and } from "drizzle-orm";
import { relationships, contactHandles, users } from "../../drizzle/schema";
import { getDb } from "./connection";
import { getLastRelationshipHash, generateRelationshipHash } from "../_core/hashchain";

export async function createRelationship(data: {
  ownerId: number;
  contactId: number;
  relationshipType?: string;
  introducedBy?: number;
  notes?: string;
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishedAt = new Date();
  const prevHash = await getLastRelationshipHash(data.ownerId);
  const { hash: timestampHash, proof: timestampProof } = generateRelationshipHash({
    ownerId: data.ownerId,
    contactId: data.contactId,
    establishedAt: establishedAt.toISOString(),
    prevHash,
  });

  const result = await db.insert(relationships).values({
    ownerId: data.ownerId,
    contactId: data.contactId,
    timestampHash,
    timestampProof,
    establishedAt,
    relationshipType: (data.relationshipType as "direct" | "introduction" | "referral" | "network" | "professional" | "personal") || "direct",
    introducedBy: data.introducedBy,
    notes: data.notes,
    tags: data.tags,
    attributionChain: data.introducedBy ? [data.introducedBy] : [],
  });

  return { id: result[0].insertId, timestampHash, timestampProof, establishedAt };
}

export async function getRelationshipsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relationships).where(eq(relationships.ownerId, ownerId)).orderBy(desc(relationships.createdAt));
}

export async function getRelationshipById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(relationships).where(eq(relationships.id, id)).limit(1);
  return result[0];
}

export async function getRelationshipByHash(hash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(relationships)
    .where(eq(relationships.timestampHash, hash))
    .limit(1);
  return result[0];
}

export async function getRelationshipForAttribution(ownerId: number, contactId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.ownerId, ownerId),
        eq(relationships.contactId, contactId)
      )
    )
    .orderBy(desc(relationships.establishedAt))
    .limit(1);
  return result[0];
}

export async function updateRelationship(id: number, data: Partial<typeof relationships.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(relationships).set({ ...data, updatedAt: new Date() }).where(eq(relationships.id, id));
}

export async function getRelationshipNetwork(userId: number) {
  const db = await getDb();
  if (!db) return { nodes: [], edges: [] };
  
  const rels = await db.select().from(relationships)
    .where(or(eq(relationships.ownerId, userId), eq(relationships.contactId, userId)));
  
  const userIds = new Set<number>();
  rels.forEach(r => {
    userIds.add(r.ownerId);
    userIds.add(r.contactId);
    if (r.introducedBy) userIds.add(r.introducedBy);
  });
  
  const usersData = userIds.size > 0 
    ? await db.select().from(users).where(inArray(users.id, Array.from(userIds)))
    : [];
  
  const nodes = usersData.map(u => ({
    id: u.id,
    name: u.name || 'Unknown',
    company: u.company,
    trustScore: u.trustScore,
    verificationTier: u.verificationTier,
  }));
  
  const edges = rels.map(r => ({
    id: r.id,
    source: r.ownerId,
    target: r.contactId,
    strength: r.strengthScore,
    type: r.relationshipType,
    introducedBy: r.introducedBy,
  }));
  
  return { nodes, edges };
}

// ============================================================================
// CONTACT HANDLES
// ============================================================================

export async function addContactHandle(data: typeof contactHandles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactHandles).values(data);
  return result[0].insertId;
}

export async function getContactHandles(userId?: number, relationshipId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(contactHandles).where(eq(contactHandles.userId, userId));
  }
  if (relationshipId) {
    return db.select().from(contactHandles).where(eq(contactHandles.relationshipId, relationshipId));
  }
  return [];
}
