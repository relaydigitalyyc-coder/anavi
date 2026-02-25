import { eq, desc, and, gte, lte } from "drizzle-orm";
import { dealAnalytics, conversionFunnels, deals, calendarEvents } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getDealAnalytics(userId: number, filters?: {
  periodType?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(dealAnalytics)
    .where(eq(dealAnalytics.userId, userId))
    .$dynamic();
  
  if (filters?.periodType) {
    query = query.where(eq(dealAnalytics.periodType, filters.periodType));
  }
  if (filters?.startDate) {
    query = query.where(gte(dealAnalytics.periodStart, filters.startDate));
  }
  if (filters?.endDate) {
    query = query.where(lte(dealAnalytics.periodEnd, filters.endDate));
  }
  
  return query.orderBy(desc(dealAnalytics.periodStart)).limit(filters?.limit || 12);
}

export async function createDealAnalytics(data: {
  userId: number;
  periodType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  periodStart: Date;
  periodEnd: Date;
  totalDeals?: number;
  newDeals?: number;
  closedDeals?: number;
  lostDeals?: number;
  totalPipelineValue?: string;
  closedValue?: string;
  lostValue?: string;
  conversionRate?: string;
  avgDealCycleTime?: number;
  avgDealSize?: string;
  dealsBySource?: Record<string, number>;
  valueBySource?: Record<string, number>;
  dealsByStage?: Record<string, number>;
  valueByStage?: Record<string, number>;
  dealsByFOType?: Record<string, number>;
  conversionByFOType?: Record<string, number>;
  topRelationshipSources?: Array<{id: number, name: string, deals: number, value: number}>;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(dealAnalytics).values(data);
  return result;
}

export async function getConversionFunnels(userId: number, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(conversionFunnels)
    .where(and(
      eq(conversionFunnels.userId, userId),
      gte(conversionFunnels.periodStart, periodStart),
      lte(conversionFunnels.periodEnd, periodEnd)
    ))
    .orderBy(conversionFunnels.stageOrder);
}

export async function calculateDealAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const userDeals = await db.select().from(deals)
    .where(eq(deals.originatorId, userId));
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const totalDeals = userDeals.length;
  const closedDeals = userDeals.filter(d => d.stage === 'completed').length;
  const lostDeals = userDeals.filter(d => d.stage === 'cancelled').length;
  const activeDeals = userDeals.filter(d => !['completed', 'cancelled'].includes(d.stage || '')).length;
  
  const totalPipelineValue = userDeals
    .filter(d => !['completed', 'cancelled'].includes(d.stage || ''))
    .reduce((sum, d) => sum + Number(d.dealValue || 0), 0);
  
  const closedValue = userDeals
    .filter(d => d.stage === 'completed')
    .reduce((sum, d) => sum + Number(d.dealValue || 0), 0);
  
  const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0;
  
  const closedDealsWithDates = userDeals.filter(d => 
    d.stage === 'completed' && d.createdAt && d.updatedAt
  );
  const avgCycleTime = closedDealsWithDates.length > 0
    ? closedDealsWithDates.reduce((sum, d) => {
        const created = new Date(d.createdAt).getTime();
        const updated = new Date(d.updatedAt).getTime();
        return sum + (updated - created) / (1000 * 60 * 60 * 24);
      }, 0) / closedDealsWithDates.length
    : 0;
  
  const dealsByStage: Record<string, number> = {};
  userDeals.forEach(d => {
    const stage = d.stage || 'unknown';
    dealsByStage[stage] = (dealsByStage[stage] || 0) + 1;
  });
  
  return {
    totalDeals,
    activeDeals,
    closedDeals,
    lostDeals,
    totalPipelineValue,
    closedValue,
    conversionRate: conversionRate.toFixed(1),
    avgDealCycleTime: Math.round(avgCycleTime),
    dealsByStage,
    recentDeals: userDeals.filter(d => new Date(d.createdAt) >= thirtyDaysAgo).length
  };
}

export async function getMeetingHistory(userId: number, targetId: number, targetType: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(calendarEvents)
    .where(and(
      eq(calendarEvents.userId, userId),
      eq(calendarEvents.relatedTargetId, targetId)
    ))
    .orderBy(desc(calendarEvents.startTime))
    .limit(20);
}
