import { eq, desc, sql } from "drizzle-orm";
import { spvs, capitalCalls, capitalCommitments, capitalCallResponses, users } from "../../drizzle/schema";
import { getDb } from "./connection";

function toNum(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export async function getSPVsWithSummary(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(spvs)
    .orderBy(desc(spvs.createdAt))
    .limit(limit);

  const result = [];
  for (const spv of rows) {
    const [lpCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(capitalCommitments)
      .where(eq(capitalCommitments.spvId, spv.id));
    const lpCount = lpCountRow?.count ?? 0;

    const totalReceived = toNum(spv.totalDistributed) || (await getTotalReceivedForSPV(db, spv.id));

    result.push({
      id: spv.id,
      name: spv.name,
      targetRaise: toNum(spv.targetRaise),
      totalCommitted: toNum(spv.totalCommitted),
      totalCalled: toNum(spv.totalCalled),
      totalReceived,
      lpCount,
      status: spv.status ?? "fundraising",
    });
  }
  return result;
}

async function getTotalReceivedForSPV(db: Awaited<ReturnType<typeof getDb>>, spvId: number): Promise<number> {
  if (!db) return 0;
  const calls = await db.select().from(capitalCalls).where(eq(capitalCalls.spvId, spvId));
  let total = 0;
  for (const c of calls) {
    total += toNum(c.totalReceived);
  }
  return total;
}

export async function getCapitalCallsWithSPV(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const calls = await db
    .select({
      call: capitalCalls,
      spvName: spvs.name,
    })
    .from(capitalCalls)
    .innerJoin(spvs, eq(capitalCalls.spvId, spvs.id))
    .orderBy(desc(capitalCalls.createdAt))
    .limit(limit);

  const result = [];
  for (const { call, spvName } of calls) {
    const responses = await db
      .select()
      .from(capitalCallResponses)
      .where(eq(capitalCallResponses.capitalCallId, call.id));
    const responseList = responses.map((r) => ({
      lpName: "LP", // would need join to lpProfiles/users
      amount: toNum(r.amountPaid ?? r.amountDue),
      status: r.status === "paid" ? "paid" : "pending",
    }));
    result.push({
      id: call.id,
      spvId: call.spvId,
      spvName: spvName ?? "",
      callNumber: call.callNumber,
      callAmount: toNum(call.callAmount),
      callPercentage: toNum(call.callPercentage),
      dueDate: call.dueDate ? new Date(call.dueDate).toISOString().slice(0, 10) : "",
      status: call.status === "complete" ? "complete" : "sent",
      totalCalled: toNum(call.totalCalled),
      totalReceived: toNum(call.totalReceived),
      responses: responseList,
    });
  }
  return result;
}

export async function getCommitmentsWithDetails(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      commitment: capitalCommitments,
      spvName: spvs.name,
      userName: users.name,
    })
    .from(capitalCommitments)
    .innerJoin(spvs, eq(capitalCommitments.spvId, spvs.id))
    .innerJoin(users, eq(capitalCommitments.userId, users.id))
    .orderBy(desc(capitalCommitments.createdAt))
    .limit(limit);

  return rows.map(({ commitment, spvName, userName }) => ({
    id: commitment.id,
    lpName: userName ?? "Unknown LP",
    spv: spvName ?? "",
    committed: toNum(commitment.commitmentAmount),
    called: toNum(commitment.amountCalled),
    funded: toNum(commitment.amountFunded),
    unfunded: toNum(commitment.unfundedCommitment) || toNum(commitment.commitmentAmount) - toNum(commitment.amountFunded),
  }));
}
