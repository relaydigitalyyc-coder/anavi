import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  createDocusignOauthAuthorizeUrl,
  createProviderEnvelope,
  createProviderRecipientView,
  exchangeDocusignOauthCode,
  getProviderEnvelope,
  isDocusignConfigured,
  mapEnvelopeEventToStatus,
  runDocusignDiagnostics,
  sendProviderEnvelope,
  verifyDocusignConnectSignature,
  voidProviderEnvelope,
} from "../services/docusign";
import { ENV } from "../_core/env";

const envelopeRecipientSchema = z.object({
  role: z.enum(["signer", "viewer", "cc"]),
  routingOrder: z.number().int().min(1).default(1),
  name: z.string().min(1).max(255),
  email: z.string().email().max(320),
  userId: z.number().int().optional(),
});

const envelopeDocumentSchema = z.object({
  dealRoomDocumentId: z.number().int().optional(),
  name: z.string().min(1).max(255),
  fileUrl: z.string().url().optional(),
  sha256PreSend: z.string().max(128).optional(),
});

export const docusignRouter = router({
  getConfigStatus: protectedProcedure.query(async ({ ctx }) => {
    const oauthToken = await db.getDocusignOauthTokenByUserId(ctx.user.id);
    return {
      configured: isDocusignConfigured(),
      executionMode: ENV.docusignExecutionMode,
      env: ENV.docusignEnv,
      accountIdPresent: Boolean(ENV.docusignAccountId),
      baseUriPresent: Boolean(ENV.docusignBaseUri),
      impersonatedUserPresent: Boolean(ENV.docusignImpersonatedUserId),
      privateKeyPresent: Boolean(ENV.docusignRsaPrivateKey),
      hmacSecretPresent: Boolean(ENV.docusignConnectHmacSecret),
      mcpUrlPresent: Boolean(ENV.docusignMcpUrl),
      mcpClientIdPresent: Boolean(ENV.docusignMcpClientId),
      mcpClientSecretPresent: Boolean(ENV.docusignMcpClientSecret),
      oauthRedirectUriPresent: Boolean(ENV.docusignOauthRedirectUri),
      oauthClientSecretPresent: Boolean(ENV.docusignOauthClientSecret),
      hasStoredOauthToken: Boolean(oauthToken),
    };
  }),

  getOauthStatus: protectedProcedure.query(async ({ ctx }) => {
    const token = await db.getDocusignOauthTokenByUserId(ctx.user.id);
    return {
      connected: Boolean(token),
      expiresAt: token?.expiresAt ?? null,
      accountId: token?.providerAccountId ?? null,
      baseUri: token?.providerBaseUri ?? null,
      scope: token?.scope ?? null,
    };
  }),

  runDiagnostics: protectedProcedure.query(async ({ ctx }) => {
    return runDocusignDiagnostics(ctx.user.id);
  }),

  getOauthAuthorizeUrl: protectedProcedure
    .input(
      z.object({
        redirectUri: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorizeUrl = await createDocusignOauthAuthorizeUrl({
        userId: ctx.user.id,
        redirectUri: input.redirectUri,
      });
      return { authorizeUrl };
    }),

  completeOauthCode: protectedProcedure
    .input(
      z.object({
        state: z.string().min(1),
        code: z.string().min(1),
        redirectUri: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await exchangeDocusignOauthCode({
        userId: ctx.user.id,
        state: input.state,
        code: input.code,
        redirectUri: input.redirectUri,
      });
      return {
        connected: true,
        ...result,
      };
    }),

  disconnectOauth: protectedProcedure.mutation(async ({ ctx }) => {
    await db.clearDocusignOauthTokenByUserId(ctx.user.id);
    return { disconnected: true };
  }),

  createEnvelope: protectedProcedure
    .input(
      z.object({
        dealRoomId: z.number().int(),
        dealId: z.number().int().optional(),
        templateId: z.string().max(128).optional(),
        subject: z.string().min(1).max(255),
        recipients: z.array(envelopeRecipientSchema).min(1),
        documents: z.array(envelopeDocumentSchema).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await createProviderEnvelope({
        subject: input.subject,
        templateId: input.templateId,
        recipients: input.recipients,
        documents: input.documents,
        authUserId: ctx.user.id,
      });

      const envelopeId = await db.createDocusignEnvelopeGraph({
        dealRoomId: input.dealRoomId,
        dealId: input.dealId,
        providerEnvelopeId: provider.providerEnvelopeId,
        templateId: input.templateId,
        subject: input.subject,
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
        action: "docusign_envelope_created",
        entityType: "deal_room",
        entityId: input.dealRoomId,
        newState: {
          envelopeId,
          providerEnvelopeId: provider.providerEnvelopeId,
          subject: input.subject,
        },
      });

      return {
        envelopeId,
        providerEnvelopeId: provider.providerEnvelopeId,
        status: provider.status,
      };
    }),

  sendEnvelope: protectedProcedure
    .input(
      z.object({
        envelopeId: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const envelope = await db.getDocusignEnvelopeById(input.envelopeId);
      if (!envelope) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Envelope not found" });
      }

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
        action: "docusign_envelope_sent",
        entityType: "deal_room",
        entityId: envelope.dealRoomId,
        newState: {
          envelopeId: envelope.id,
          providerEnvelopeId: envelope.providerEnvelopeId,
          status: provider.status,
        },
      });

      return {
        envelopeId: envelope.id,
        providerEnvelopeId: envelope.providerEnvelopeId,
        status: provider.status,
      };
    }),

  createRecipientView: protectedProcedure
    .input(
      z.object({
        envelopeId: z.number().int(),
        recipientId: z.number().int().optional(),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const envelope = await db.getDocusignEnvelopeById(input.envelopeId);
      if (!envelope) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Envelope not found" });
      }

      const recipients = await db.listDocusignRecipientsByEnvelopeId(envelope.id);
      const recipient = input.recipientId
        ? recipients.find((item) => item.id === input.recipientId)
        : recipients.find((item) => item.role === "signer");
      if (!recipient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
      }

      const response = await createProviderRecipientView({
        providerEnvelopeId: envelope.providerEnvelopeId,
        providerRecipientId: recipient.providerRecipientId,
        name: recipient.name,
        email: recipient.email,
        clientUserId: recipient.userId ? String(recipient.userId) : undefined,
        returnUrl: input.returnUrl,
        authUserId: ctx.user.id,
      });

      return {
        envelopeId: envelope.id,
        recipientId: recipient.id,
        signingUrl: response.url,
      };
    }),

  getEnvelope: protectedProcedure
    .input(
      z.object({
        envelopeId: z.number().int(),
      })
    )
    .query(async ({ ctx, input }) => {
      const envelope = await db.getDocusignEnvelopeById(input.envelopeId);
      if (!envelope) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Envelope not found" });
      }

      const provider = await getProviderEnvelope(envelope.providerEnvelopeId, ctx.user.id);
      const recipients = await db.listDocusignRecipientsByEnvelopeId(envelope.id);
      const documents = await db.listDocusignDocumentsByEnvelopeId(envelope.id);

      return {
        envelope,
        provider,
        recipients,
        documents,
      };
    }),

  voidEnvelope: protectedProcedure
    .input(
      z.object({
        envelopeId: z.number().int(),
        reason: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const envelope = await db.getDocusignEnvelopeById(input.envelopeId);
      if (!envelope) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Envelope not found" });
      }

      const provider = await voidProviderEnvelope(envelope.providerEnvelopeId, input.reason, ctx.user.id);
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
        action: "docusign_envelope_voided",
        entityType: "deal_room",
        entityId: envelope.dealRoomId,
        newState: {
          envelopeId: envelope.id,
          providerEnvelopeId: envelope.providerEnvelopeId,
          status: provider.status,
          reason: input.reason,
        },
      });

      return {
        envelopeId: envelope.id,
        providerEnvelopeId: envelope.providerEnvelopeId,
        status: provider.status,
      };
    }),

  connectWebhook: publicProcedure
    .input(
      z.object({
        eventId: z.string().max(128),
        envelopeId: z.string().max(128),
        eventType: z.string().max(128),
        payload: z.record(z.string(), z.unknown()),
        signature: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const duplicate = await db.findWebhookEventByProviderEventId(input.eventId);
      if (duplicate) {
        return { accepted: true, duplicate: true };
      }

      const eventRowId = await db.insertWebhookEvent({
        providerEventId: input.eventId,
        providerEnvelopeId: input.envelopeId,
        eventType: input.eventType,
        payloadJson: input.payload,
      });

      try {
        const envelope = await db.getDocusignEnvelopeByProviderId(input.envelopeId);
        if (envelope) {
          const status = mapEnvelopeEventToStatus(input.eventType);
          await db.updateDocusignEnvelopeStatusMonotonic({
            envelopeId: envelope.id,
            status,
          });
        }

        await db.markWebhookEventProcessed(eventRowId);
        return { accepted: true, duplicate: false };
      } catch (error) {
        await db.markWebhookEventFailed(eventRowId, String(error));
        throw error;
      }
    }),

  verifyConnectSignature: publicProcedure
    .input(
      z.object({
        rawBodyBase64: z.string(),
        signature: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const raw = Buffer.from(input.rawBodyBase64, "base64");
      return { valid: verifyDocusignConnectSignature(raw, input.signature) };
    }),
});
