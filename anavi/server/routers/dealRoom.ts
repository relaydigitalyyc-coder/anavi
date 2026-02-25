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

  getDocuments: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ input }) => {
      return db.getDocumentsByDealRoom(input.dealRoomId);
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
