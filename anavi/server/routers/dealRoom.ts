import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import {
  createProviderEnvelope,
  createProviderRecipientView,
  isDocusignConfigured,
  sendProviderEnvelope,
} from "../services/docusign";

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

  getNdaEnvelopes: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const room = await db.getDealRoomById(input.dealRoomId);
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Deal room not found" });
      const access = await db.getDealRoomAccessByUserAndRoom(input.dealRoomId, ctx.user.id);
      if (!access) throw new TRPCError({ code: "FORBIDDEN", message: "No access to this deal room" });

      const envelopes = await db.listDocusignEnvelopesByDealRoom(input.dealRoomId);
      const withRecipients = await Promise.all(
        envelopes.map(async (envelope) => ({
          ...envelope,
          recipients: await db.listDocusignRecipientsByEnvelopeId(envelope.id),
        }))
      );
      return {
        provider: isDocusignConfigured() ? "docusign" : "mock",
        envelopes: withRecipients,
      };
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

  createNdaEnvelope: protectedProcedure
    .input(
      z.object({
        dealRoomId: z.number(),
        subject: z.string().min(1).max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const room = await db.getDealRoomById(input.dealRoomId);
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Deal room not found" });
      const access = await db.getDealRoomAccessByUserAndRoom(input.dealRoomId, ctx.user.id);
      if (!access) throw new TRPCError({ code: "FORBIDDEN", message: "No access to this deal room" });

      const existing = await db.listDocusignEnvelopesByDealRoom(input.dealRoomId);
      const existingOpen = existing.find((envelope) =>
        ["draft", "created", "sent", "delivered"].includes(envelope.status)
      );
      if (existingOpen) {
        return {
          envelopeId: existingOpen.id,
          providerEnvelopeId: existingOpen.providerEnvelopeId,
          status: existingOpen.status,
          reused: true,
          provider: isDocusignConfigured() ? "docusign" : "mock",
        };
      }

      const roomAccess = await db.getDealRoomAccessByRoom(input.dealRoomId);
      if (roomAccess.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No recipients in deal room access list" });
      }

      const recipients = await Promise.all(
        roomAccess.map(async (roomAccessRow, index) => {
          const user = await db.getUserById(roomAccessRow.userId);
          if (!user?.email || !user.name) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Recipient user ${roomAccessRow.userId} is missing name/email for DocuSign`,
            });
          }
          return {
            role: "signer" as const,
            routingOrder: index + 1,
            name: user.name,
            email: user.email,
            userId: user.id,
          };
        })
      );

      const provider = await createProviderEnvelope({
        subject: input.subject ?? `NDA - ${room.name}`,
        templateId: room.ndaTemplateId ? String(room.ndaTemplateId) : undefined,
        recipients,
        documents: [
          {
            name: `${room.name} NDA`,
          },
        ],
        authUserId: ctx.user.id,
      });

      const envelopeId = await db.createDocusignEnvelopeGraph({
        dealRoomId: input.dealRoomId,
        dealId: room.dealId ?? undefined,
        providerEnvelopeId: provider.providerEnvelopeId,
        templateId: room.ndaTemplateId ? String(room.ndaTemplateId) : undefined,
        subject: input.subject ?? `NDA - ${room.name}`,
        status: provider.status as
          | "draft"
          | "created"
          | "sent"
          | "delivered"
          | "completed"
          | "declined"
          | "voided"
          | "expired"
          | "error",
        createdByUserId: ctx.user.id,
        recipients: provider.recipients,
        documents: provider.documents,
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "docusign_nda_envelope_created",
        entityType: "deal_room",
        entityId: input.dealRoomId,
        newState: {
          envelopeId,
          providerEnvelopeId: provider.providerEnvelopeId,
          status: provider.status,
        },
      });

      return {
        envelopeId,
        providerEnvelopeId: provider.providerEnvelopeId,
        status: provider.status,
        reused: false,
        provider: isDocusignConfigured() ? "docusign" : "mock",
      };
    }),

  sendNdaEnvelope: protectedProcedure
    .input(z.object({ envelopeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const envelope = await db.getDocusignEnvelopeById(input.envelopeId);
      if (!envelope) throw new TRPCError({ code: "NOT_FOUND", message: "Envelope not found" });

      const provider = await sendProviderEnvelope(envelope.providerEnvelopeId, ctx.user.id);
      await db.updateDocusignEnvelopeStatusMonotonic({
        envelopeId: envelope.id,
        status: provider.status as
          | "draft"
          | "created"
          | "sent"
          | "delivered"
          | "completed"
          | "declined"
          | "voided"
          | "expired"
          | "error",
      });
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "docusign_nda_envelope_sent",
        entityType: "deal_room",
        entityId: envelope.dealRoomId,
        newState: { envelopeId: envelope.id, status: provider.status },
      });
      return { envelopeId: envelope.id, status: provider.status };
    }),

  getNdaSignUrl: protectedProcedure
    .input(
      z.object({
        envelopeId: z.number(),
        returnUrl: z.string().url(),
      })
    )
    .query(async ({ ctx, input }) => {
      const envelope = await db.getDocusignEnvelopeById(input.envelopeId);
      if (!envelope) throw new TRPCError({ code: "NOT_FOUND", message: "Envelope not found" });
      const recipientRows = await db.listDocusignRecipientsByEnvelopeId(envelope.id);
      const recipient = recipientRows.find((row) => row.userId === ctx.user.id);
      if (!recipient) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Current user is not a signer on this envelope" });
      }
      const view = await createProviderRecipientView({
        providerEnvelopeId: envelope.providerEnvelopeId,
        providerRecipientId: recipient.providerRecipientId,
        name: recipient.name,
        email: recipient.email,
        clientUserId: recipient.userId ? String(recipient.userId) : undefined,
        returnUrl: input.returnUrl,
        authUserId: ctx.user.id,
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "docusign_signing_view_created",
        entityType: "deal_room",
        entityId: envelope.dealRoomId,
        newState: { envelopeId: envelope.id },
      });

      return { envelopeId: envelope.id, signingUrl: view.url };
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
