import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db/connection";
import { spvs, capitalCommitments } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export const stubsRouter = router({
  spvList: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(spvs).orderBy(desc(spvs.createdAt)).limit(50);
  }),

  capitalCommitments: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(capitalCommitments).orderBy(desc(capitalCommitments.createdAt)).limit(50);
  }),

  tradingPositions: protectedProcedure.query(async () => {
    return [] as Array<{ id: number; symbol: string; name: string; quantity: number; avgPrice: number; currentPrice: number; pnl: number }>;
  }),

  feeSchedule: protectedProcedure.query(async () => {
    return [] as Array<{ id: number; type: string; amount: number; date: string; status: string }>;
  }),

  memberList: protectedProcedure.query(async () => {
    return [] as Array<{ id: number; name: string; email: string; status: string; joinedAt: string }>;
  }),

  cryptoAssets: protectedProcedure.query(async () => {
    return [] as Array<{ id: number; symbol: string; name: string; balance: number; value: number }>;
  }),
});
