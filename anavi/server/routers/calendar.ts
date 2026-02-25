import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const calendarRouter = router({
  // Get calendar connections
  connections: protectedProcedure.query(async ({ ctx }) => {
    return db.getCalendarConnections(ctx.user.id);
  }),

  // Connect calendar
  connect: protectedProcedure
    .input(z.object({
      provider: z.enum(['google', 'outlook', 'apple']),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      calendarId: z.string().optional(),
      calendarName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createCalendarConnection({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true, connectionId: result };
    }),

  // Disconnect calendar
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCalendarConnection(input.connectionId);
      return { success: true };
    }),

  // Get events
  events: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      eventType: z.string().optional(),
      relatedDealId: z.number().optional(),
      relatedTargetId: z.number().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      return db.getCalendarEvents(ctx.user.id, {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  // Create event
  createEvent: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      meetingLink: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      allDay: z.boolean().default(false),
      timezone: z.string().default('UTC'),
      eventType: z.enum(['meeting', 'call', 'follow_up', 'due_diligence', 'deal_room', 'pitch', 'closing', 'reminder', 'other']).default('meeting'),
      relatedDealId: z.number().optional(),
      relatedTargetId: z.number().optional(),
      relatedContactId: z.number().optional(),
      attendees: z.array(z.object({
        name: z.string(),
        email: z.string(),
        status: z.string(),
      })).optional(),
      reminders: z.array(z.number()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createCalendarEvent({
        ...input,
        userId: ctx.user.id,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
      });
      return { success: true, eventId: result };
    }),

  // Update event
  updateEvent: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
      notes: z.string().optional(),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { eventId, startTime, endTime, ...rest } = input;
      await db.updateCalendarEvent(eventId, {
        ...rest,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      });
      return { success: true };
    }),

  // Delete event
  deleteEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCalendarEvent(input.eventId);
      return { success: true };
    }),

  // Get reminders
  reminders: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'completed', 'snoozed', 'cancelled']).optional(),
      targetType: z.string().optional(),
      priority: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return db.getFollowUpReminders(ctx.user.id, input);
    }),

  // Create reminder
  createReminder: protectedProcedure
    .input(z.object({
      targetType: z.enum(['family_office', 'contact', 'deal', 'relationship']),
      targetId: z.number(),
      targetName: z.string().optional(),
      title: z.string(),
      notes: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      dueDate: z.string(),
      reminderTime: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createFollowUpReminder({
        ...input,
        userId: ctx.user.id,
        dueDate: new Date(input.dueDate),
        reminderTime: input.reminderTime ? new Date(input.reminderTime) : undefined,
      });
      return { success: true, reminderId: result };
    }),

  // Update reminder
  updateReminder: protectedProcedure
    .input(z.object({
      reminderId: z.number(),
      title: z.string().optional(),
      notes: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      dueDate: z.string().optional(),
      status: z.enum(['pending', 'completed', 'snoozed', 'cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { reminderId, dueDate, ...rest } = input;
      await db.updateFollowUpReminder(reminderId, {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedAt: input.status === 'completed' ? new Date() : undefined,
      });
      return { success: true };
    }),

  // Get meeting history with target
  meetingHistory: protectedProcedure
    .input(z.object({
      targetId: z.number(),
      targetType: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getMeetingHistory(ctx.user.id, input.targetId, input.targetType);
    }),
});
