import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const dealRoomRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getDealRoomsByUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const room = await db.getDealRoomById(input.id);
      if (!room) throw new TRPCError({ code: 'NOT_FOUND' });
      return room;
    }),

  getMyAccess: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const access = await db.getDealRoomAccessByUserAndRoom(input.dealRoomId, ctx.user.id);
      if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this deal room' });
      const room = await db.getDealRoomById(input.dealRoomId);
      if (!room) throw new TRPCError({ code: 'NOT_FOUND' });
      const allAccess = await db.getDealRoomAccessByRoom(input.dealRoomId);
      const bothSigned = room.ndaRequired ? allAccess.every((a) => a.ndaSigned === true) : true;
      return { access, room, bothSigned };
    }),

  getDocuments: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const room = await db.getDealRoomById(input.dealRoomId);
      if (!room) throw new TRPCError({ code: 'NOT_FOUND' });
      const userAccess = await db.getDealRoomAccessByUserAndRoom(input.dealRoomId, ctx.user.id);
      if (!userAccess) throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this deal room' });

      const docs = await db.getDocumentsByDealRoom(input.dealRoomId);
      if (room.ndaRequired && !userAccess.ndaSigned) {
        return docs.filter((d) => d.category === 'nda');
      }
      return docs;
    }),

  signNda: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const access = await db.getDealRoomAccessByUserAndRoom(input.dealRoomId, ctx.user.id);
      if (!access) throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this deal room' });
      if (access.ndaSigned) {
        const allAccess = await db.getDealRoomAccessByRoom(input.dealRoomId);
        const bothSigned = allAccess.every((a) => a.ndaSigned === true);
        return { success: true, alreadySigned: true, bothSigned };
      }

      await db.updateDealRoomAccess(input.dealRoomId, ctx.user.id, {
        ndaSigned: true,
        ndaSignedAt: new Date(),
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'nda_signed',
        entityType: 'deal_room',
        entityId: input.dealRoomId,
        newState: { ndaSigned: true },
      });

      const allAccess = await db.getDealRoomAccessByRoom(input.dealRoomId);
      const bothSigned = allAccess.every((a) => a.ndaSigned === true);
      return { success: true, alreadySigned: false, bothSigned };
    }),

  requestSignature: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await db.getDocumentById(input.documentId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      await db.updateDocument(input.documentId, {
        requiresSignature: true,
        signatureStatus: "pending",
        signatureProvider: "anavi_stub",
      });
      return { success: true, status: "pending" };
    }),
});
