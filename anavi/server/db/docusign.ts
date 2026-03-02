import { and, eq } from "drizzle-orm";
import {
  docusignDocuments,
  docusignEnvelopeRecipients,
  docusignEnvelopes,
  docusignOauthStates,
  docusignOauthTokens,
  docusignWebhookEvents,
} from "../../drizzle/schema";
import { getDb } from "./connection";

type EnvelopeStatus =
  | "draft"
  | "created"
  | "sent"
  | "delivered"
  | "completed"
  | "declined"
  | "voided"
  | "expired"
  | "error";

const STATUS_ORDER: Record<EnvelopeStatus, number> = {
  draft: 0,
  created: 1,
  sent: 2,
  delivered: 3,
  completed: 4,
  declined: 4,
  voided: 4,
  expired: 4,
  error: 4,
};

export async function createDocusignEnvelopeGraph(input: {
  dealRoomId: number;
  dealId?: number;
  providerEnvelopeId: string;
  templateId?: string;
  subject: string;
  status?: EnvelopeStatus;
  createdByUserId: number;
  recipients: Array<{
    providerRecipientId: string;
    role: "signer" | "viewer" | "cc";
    routingOrder: number;
    name: string;
    email: string;
    userId?: number;
    status?: "created" | "sent" | "delivered" | "signed" | "declined" | "completed";
  }>;
  documents: Array<{
    providerDocumentId: string;
    dealRoomDocumentId?: number;
    name: string;
    sha256PreSend?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const envelopeRes = await db.insert(docusignEnvelopes).values({
    dealRoomId: input.dealRoomId,
    dealId: input.dealId,
    providerEnvelopeId: input.providerEnvelopeId,
    templateId: input.templateId,
    subject: input.subject,
    status: input.status ?? "created",
    createdByUserId: input.createdByUserId,
  });
  const envelopeId = envelopeRes[0].insertId;

  if (input.recipients.length > 0) {
    await db.insert(docusignEnvelopeRecipients).values(
      input.recipients.map((recipient) => ({
        envelopeId,
        providerRecipientId: recipient.providerRecipientId,
        role: recipient.role,
        routingOrder: recipient.routingOrder,
        name: recipient.name,
        email: recipient.email,
        userId: recipient.userId,
        status: recipient.status ?? "created",
      }))
    );
  }

  if (input.documents.length > 0) {
    await db.insert(docusignDocuments).values(
      input.documents.map((document) => ({
        envelopeId,
        providerDocumentId: document.providerDocumentId,
        dealRoomDocumentId: document.dealRoomDocumentId,
        name: document.name,
        sha256PreSend: document.sha256PreSend,
      }))
    );
  }

  return envelopeId;
}

export async function getDocusignEnvelopeById(envelopeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(docusignEnvelopes)
    .where(eq(docusignEnvelopes.id, envelopeId))
    .limit(1);
  return rows[0];
}

export async function getDocusignEnvelopeByProviderId(providerEnvelopeId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(docusignEnvelopes)
    .where(eq(docusignEnvelopes.providerEnvelopeId, providerEnvelopeId))
    .limit(1);
  return rows[0];
}

export async function listDocusignEnvelopesByDealRoom(dealRoomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(docusignEnvelopes)
    .where(eq(docusignEnvelopes.dealRoomId, dealRoomId));
}

export async function listDocusignRecipientsByEnvelopeId(envelopeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(docusignEnvelopeRecipients)
    .where(eq(docusignEnvelopeRecipients.envelopeId, envelopeId));
}

export async function listDocusignDocumentsByEnvelopeId(envelopeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(docusignDocuments)
    .where(eq(docusignDocuments.envelopeId, envelopeId));
}

export async function updateDocusignEnvelopeStatusMonotonic(input: {
  envelopeId: number;
  status: EnvelopeStatus;
  providerEventAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;

  const existing = await getDocusignEnvelopeById(input.envelopeId);
  if (!existing) return;

  const currentRank = STATUS_ORDER[existing.status];
  const nextRank = STATUS_ORDER[input.status];
  if (nextRank < currentRank) return;

  await db
    .update(docusignEnvelopes)
    .set({
      status: input.status,
      lastProviderEventAt: input.providerEventAt ?? new Date(),
      sentAt: input.status === "sent" ? new Date() : existing.sentAt,
      completedAt: input.status === "completed" ? new Date() : existing.completedAt,
      voidedAt: input.status === "voided" ? new Date() : existing.voidedAt,
      updatedAt: new Date(),
    })
    .where(eq(docusignEnvelopes.id, input.envelopeId));
}

export async function updateDocusignRecipientStatus(input: {
  envelopeId: number;
  providerRecipientId: string;
  status: "created" | "sent" | "delivered" | "signed" | "declined" | "completed";
}) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(docusignEnvelopeRecipients)
    .set({
      status: input.status,
      signedAt: input.status === "signed" || input.status === "completed" ? new Date() : null,
      declinedAt: input.status === "declined" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(docusignEnvelopeRecipients.envelopeId, input.envelopeId),
        eq(docusignEnvelopeRecipients.providerRecipientId, input.providerRecipientId)
      )
    );
}

export async function findWebhookEventByProviderEventId(providerEventId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(docusignWebhookEvents)
    .where(eq(docusignWebhookEvents.providerEventId, providerEventId))
    .limit(1);
  return rows[0];
}

export async function insertWebhookEvent(input: {
  providerEventId: string;
  providerEnvelopeId: string;
  eventType: string;
  payloadJson: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(docusignWebhookEvents).values({
    providerEventId: input.providerEventId,
    providerEnvelopeId: input.providerEnvelopeId,
    eventType: input.eventType,
    payloadJson: input.payloadJson,
    processStatus: "pending",
  });
  return result[0].insertId;
}

export async function markWebhookEventProcessed(eventId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(docusignWebhookEvents)
    .set({
      processStatus: "processed",
      processedAt: new Date(),
    })
    .where(eq(docusignWebhookEvents.id, eventId));
}

export async function markWebhookEventFailed(eventId: number, errorMessage: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(docusignWebhookEvents)
    .set({
      processStatus: "failed",
      errorMessage,
      processedAt: new Date(),
    })
    .where(eq(docusignWebhookEvents.id, eventId));
}

export async function createDocusignOauthState(input: {
  userId: number;
  state: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(docusignOauthStates).values({
    userId: input.userId,
    state: input.state,
    codeVerifier: input.codeVerifier,
    redirectUri: input.redirectUri,
    expiresAt: input.expiresAt,
  });
  return result[0].insertId;
}

export async function getDocusignOauthState(state: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(docusignOauthStates)
    .where(eq(docusignOauthStates.state, state))
    .limit(1);
  return rows[0];
}

export async function consumeDocusignOauthState(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(docusignOauthStates)
    .set({ usedAt: new Date() })
    .where(eq(docusignOauthStates.id, id));
}

export async function upsertDocusignOauthToken(input: {
  userId: number;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiresAt?: Date;
  providerUserId?: string;
  providerAccountId?: string;
  providerBaseUri?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(docusignOauthTokens).values({
    userId: input.userId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    scope: input.scope,
    tokenType: input.tokenType,
    expiresAt: input.expiresAt,
    providerUserId: input.providerUserId,
    providerAccountId: input.providerAccountId,
    providerBaseUri: input.providerBaseUri,
  }).onDuplicateKeyUpdate({
    set: {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      scope: input.scope,
      tokenType: input.tokenType,
      expiresAt: input.expiresAt,
      providerUserId: input.providerUserId,
      providerAccountId: input.providerAccountId,
      providerBaseUri: input.providerBaseUri,
      updatedAt: new Date(),
    },
  });
}

export async function getDocusignOauthTokenByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(docusignOauthTokens)
    .where(eq(docusignOauthTokens.userId, userId))
    .limit(1);
  return rows[0];
}

export async function clearDocusignOauthTokenByUserId(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(docusignOauthTokens).where(eq(docusignOauthTokens.userId, userId));
}
