import { eq, desc, and, gte, lte } from "drizzle-orm";
import { calendarConnections, calendarEvents, followUpReminders } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getCalendarConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(calendarConnections)
    .where(eq(calendarConnections.userId, userId))
    .orderBy(desc(calendarConnections.createdAt));
}

export async function createCalendarConnection(data: {
  userId: number;
  provider: "google" | "outlook" | "apple";
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
  calendarName?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(calendarConnections).values(data);
  return result;
}

export async function updateCalendarConnection(id: number, data: {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  syncEnabled?: boolean;
  lastSyncAt?: Date;
  syncStatus?: "active" | "paused" | "error";
}) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(calendarConnections)
    .set(data)
    .where(eq(calendarConnections.id, id));
}

export async function deleteCalendarConnection(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  return db.delete(calendarConnections)
    .where(eq(calendarConnections.id, id));
}

export async function getCalendarEvents(userId: number, filters?: {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  relatedDealId?: number;
  relatedTargetId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(calendarEvents)
    .where(eq(calendarEvents.userId, userId))
    .$dynamic();
  
  if (filters?.startDate) {
    query = query.where(gte(calendarEvents.startTime, filters.startDate));
  }
  if (filters?.endDate) {
    query = query.where(lte(calendarEvents.endTime, filters.endDate));
  }
  if (filters?.eventType) {
    query = query.where(eq(calendarEvents.eventType, filters.eventType as any));
  }
  if (filters?.relatedDealId) {
    query = query.where(eq(calendarEvents.relatedDealId, filters.relatedDealId));
  }
  if (filters?.relatedTargetId) {
    query = query.where(eq(calendarEvents.relatedTargetId, filters.relatedTargetId));
  }
  
  return query.orderBy(calendarEvents.startTime).limit(filters?.limit || 100);
}

export async function createCalendarEvent(data: {
  userId: number;
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  timezone?: string;
  eventType?: "meeting" | "call" | "follow_up" | "due_diligence" | "deal_room" | "pitch" | "closing" | "reminder" | "other";
  relatedDealId?: number;
  relatedTargetId?: number;
  relatedContactId?: number;
  attendees?: Array<{name: string, email: string, status: string}>;
  reminders?: number[];
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(calendarEvents).values(data);
  return result;
}

export async function updateCalendarEvent(id: number, data: Partial<{
  title: string;
  description: string;
  location: string;
  meetingLink: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "tentative" | "cancelled";
  notes: string;
  outcome: string;
}>) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(calendarEvents)
    .set(data)
    .where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  return db.delete(calendarEvents)
    .where(eq(calendarEvents.id, id));
}

// Follow-up reminders
export async function getFollowUpReminders(userId: number, filters?: {
  status?: "pending" | "completed" | "snoozed" | "cancelled";
  targetType?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  priority?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(followUpReminders)
    .where(eq(followUpReminders.userId, userId))
    .$dynamic();
  
  if (filters?.status) {
    query = query.where(eq(followUpReminders.status, filters.status));
  }
  if (filters?.targetType) {
    query = query.where(eq(followUpReminders.targetType, filters.targetType as any));
  }
  if (filters?.dueBefore) {
    query = query.where(lte(followUpReminders.dueDate, filters.dueBefore));
  }
  if (filters?.dueAfter) {
    query = query.where(gte(followUpReminders.dueDate, filters.dueAfter));
  }
  if (filters?.priority) {
    query = query.where(eq(followUpReminders.priority, filters.priority as any));
  }
  
  return query.orderBy(followUpReminders.dueDate).limit(filters?.limit || 50);
}

export async function createFollowUpReminder(data: {
  userId: number;
  targetType: "family_office" | "contact" | "deal" | "relationship";
  targetId: number;
  targetName?: string;
  title: string;
  notes?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate: Date;
  reminderTime?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(followUpReminders).values(data);
  return result;
}

export async function updateFollowUpReminder(id: number, data: Partial<{
  title: string;
  notes: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date;
  reminderTime: Date;
  status: "pending" | "completed" | "snoozed" | "cancelled";
  completedAt: Date;
  snoozedUntil: Date;
  snoozeCount: number;
}>) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(followUpReminders)
    .set(data)
    .where(eq(followUpReminders.id, id));
}
