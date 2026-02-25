import { eq, desc, and, gte, lte, or, sql } from "drizzle-orm";
import { auditLog } from "../../drizzle/schema";
import { createHash } from 'crypto';
import { getDb } from "./connection";

const GENESIS_HASH = "0";

function computeAuditHash(
  prevHash: string,
  payload: { userId?: number; action: string; entityType: string; entityId?: number; previousState?: unknown; newState?: unknown; metadata?: unknown; createdAt: string }
): string {
  const canonical = JSON.stringify({
    prevHash,
    userId: payload.userId ?? null,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    previousState: payload.previousState ?? null,
    newState: payload.newState ?? null,
    metadata: payload.metadata ?? null,
    createdAt: payload.createdAt,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export async function logAuditEvent(data: Omit<typeof auditLog.$inferInsert, "hash" | "prevHash">) {
  const db = await getDb();
  if (!db) return;

  const last = await db.select({ hash: auditLog.hash }).from(auditLog).orderBy(desc(auditLog.id)).limit(1);
  const prevHash = last[0]?.hash ?? GENESIS_HASH;

  const createdAt = new Date().toISOString();
  const hash = computeAuditHash(prevHash, {
    userId: data.userId ?? undefined,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId ?? undefined,
    previousState: data.previousState ?? undefined,
    newState: data.newState ?? undefined,
    metadata: data.metadata ?? undefined,
    createdAt,
  });

  await db.insert(auditLog).values({
    ...data,
    prevHash,
    hash,
  });
}

export async function getAuditLog(entityType?: string, entityId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (entityType) conditions.push(eq(auditLog.entityType, entityType));
  if (entityId) conditions.push(eq(auditLog.entityId, entityId));
  
  const query = db.select().from(auditLog);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(auditLog.createdAt)).limit(limit);
  }
  return query.orderBy(desc(auditLog.createdAt)).limit(limit);
}

export type AuditLogFilters = {
  userId?: number;
  entityType?: string;
  entityId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  cursor?: { createdAt: Date; id: number };
};

export async function queryAuditLog(
  filters: AuditLogFilters,
  requestorId: number,
  isAdmin: boolean
): Promise<{ items: typeof auditLog.$inferSelect[]; nextCursor: { createdAt: Date; id: number } | null }> {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null };

  const limit = Math.min(filters.limit ?? 100, 500);
  const conditions: ReturnType<typeof eq>[] = [];

  if (!isAdmin && filters.userId !== undefined && filters.userId !== requestorId) {
    return { items: [], nextCursor: null };
  }
  if (!isAdmin) conditions.push(eq(auditLog.userId, requestorId));
  else if (filters.userId !== undefined) conditions.push(eq(auditLog.userId, filters.userId));

  if (filters.entityType) conditions.push(eq(auditLog.entityType, filters.entityType));
  if (filters.entityId !== undefined) conditions.push(eq(auditLog.entityId, filters.entityId));
  if (filters.startDate) conditions.push(gte(auditLog.createdAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(auditLog.createdAt, filters.endDate));

  const orderBy = desc(auditLog.createdAt);
  if (filters.cursor) {
    conditions.push(
      or(
        sql`${auditLog.createdAt} < ${filters.cursor.createdAt}`,
        sql`(${auditLog.createdAt} = ${filters.cursor.createdAt} AND ${auditLog.id} < ${filters.cursor.id})`
      ) as ReturnType<typeof eq>
    );
  }

  const baseQuery = db.select().from(auditLog).orderBy(orderBy).limit(limit + 1);
  const rows = conditions.length > 0 ? await baseQuery.where(and(...conditions)) : await baseQuery;
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit
    ? { createdAt: items[items.length - 1]!.createdAt, id: items[items.length - 1]!.id }
    : null;

  return { items, nextCursor };
}

export async function exportAuditLogCSV(
  filters: AuditLogFilters,
  _requestorId: number,
  isAdmin: boolean
): Promise<string> {
  const { items } = await queryAuditLog({ ...filters, limit: 10000 }, _requestorId, isAdmin);
  const header = "timestamp,userId,action,entityType,entityId,previousState,newState,hash\n";
  const rows = items.map(
    (r) =>
      `${r.createdAt.toISOString()},${r.userId ?? ""},${escapeCsv(r.action)},${escapeCsv(r.entityType)},${r.entityId ?? ""},"${escapeCsv(JSON.stringify(r.previousState ?? ""))}","${escapeCsv(JSON.stringify(r.newState ?? ""))}",${r.hash ?? ""}`
  );
  return header + rows.join("\n");
}

function escapeCsv(val: string): string {
  return val.replace(/"/g, '""');
}
