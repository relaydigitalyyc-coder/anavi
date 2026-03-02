import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ============================================================================
// DOCUSIGN INTEGRATION ACCOUNTS
// ============================================================================

export const docusignAccounts = mysqlTable("docusign_accounts", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["docusign"]).notNull().default("docusign"),
  environment: mysqlEnum("environment", ["demo", "prod"]).notNull().default("demo"),
  integrationKey: varchar("integrationKey", { length: 64 }).notNull(),
  accountId: varchar("accountId", { length: 128 }).notNull(),
  baseUri: varchar("baseUri", { length: 255 }).notNull(),
  impersonatedUserId: varchar("impersonatedUserId", { length: 128 }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// ENVELOPES
// ============================================================================

export const docusignEnvelopes = mysqlTable("docusign_envelopes", {
  id: int("id").autoincrement().primaryKey(),
  dealRoomId: int("dealRoomId").notNull(),
  dealId: int("dealId"),
  providerEnvelopeId: varchar("providerEnvelopeId", { length: 128 }).notNull().unique(),
  templateId: varchar("templateId", { length: 128 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", [
    "draft",
    "created",
    "sent",
    "delivered",
    "completed",
    "declined",
    "voided",
    "expired",
    "error",
  ])
    .notNull()
    .default("draft"),
  sentAt: timestamp("sentAt"),
  completedAt: timestamp("completedAt"),
  voidedAt: timestamp("voidedAt"),
  lastProviderEventAt: timestamp("lastProviderEventAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// ENVELOPE RECIPIENTS
// ============================================================================

export const docusignEnvelopeRecipients = mysqlTable("docusign_envelope_recipients", {
  id: int("id").autoincrement().primaryKey(),
  envelopeId: int("envelopeId").notNull(),
  providerRecipientId: varchar("providerRecipientId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["signer", "viewer", "cc"]).notNull().default("signer"),
  routingOrder: int("routingOrder").notNull().default(1),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  userId: int("userId"),
  status: mysqlEnum("status", [
    "created",
    "sent",
    "delivered",
    "signed",
    "declined",
    "completed",
  ])
    .notNull()
    .default("created"),
  signedAt: timestamp("signedAt"),
  declinedAt: timestamp("declinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// ENVELOPE DOCUMENTS
// ============================================================================

export const docusignDocuments = mysqlTable("docusign_documents", {
  id: int("id").autoincrement().primaryKey(),
  envelopeId: int("envelopeId").notNull(),
  providerDocumentId: varchar("providerDocumentId", { length: 64 }).notNull(),
  dealRoomDocumentId: int("dealRoomDocumentId"),
  name: varchar("name", { length: 255 }).notNull(),
  sha256PreSend: varchar("sha256PreSend", { length: 128 }),
  sha256PostComplete: varchar("sha256PostComplete", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// WEBHOOK EVENTS (IDEMPOTENT STORE)
// ============================================================================

export const docusignWebhookEvents = mysqlTable("docusign_webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  providerEventId: varchar("providerEventId", { length: 128 }).notNull().unique(),
  providerEnvelopeId: varchar("providerEnvelopeId", { length: 128 }).notNull(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  payloadJson: json("payloadJson").$type<Record<string, unknown>>().notNull(),
  processStatus: mysqlEnum("processStatus", ["pending", "processed", "failed"])
    .notNull()
    .default("pending"),
  errorMessage: text("errorMessage"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

// ============================================================================
// OAUTH AUTHORIZATION STATE + TOKEN STORE
// ============================================================================

export const docusignOauthStates = mysqlTable("docusign_oauth_states", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  state: varchar("state", { length: 128 }).notNull().unique(),
  codeVerifier: varchar("codeVerifier", { length: 255 }).notNull(),
  redirectUri: varchar("redirectUri", { length: 512 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const docusignOauthTokens = mysqlTable("docusign_oauth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  scope: varchar("scope", { length: 512 }),
  tokenType: varchar("tokenType", { length: 32 }),
  expiresAt: timestamp("expiresAt"),
  providerUserId: varchar("providerUserId", { length: 128 }),
  providerAccountId: varchar("providerAccountId", { length: 128 }),
  providerBaseUri: varchar("providerBaseUri", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocusignAccount = typeof docusignAccounts.$inferSelect;
export type DocusignEnvelope = typeof docusignEnvelopes.$inferSelect;
export type DocusignEnvelopeRecipient = typeof docusignEnvelopeRecipients.$inferSelect;
export type DocusignDocument = typeof docusignDocuments.$inferSelect;
export type DocusignWebhookEvent = typeof docusignWebhookEvents.$inferSelect;
export type DocusignOauthState = typeof docusignOauthStates.$inferSelect;
export type DocusignOauthToken = typeof docusignOauthTokens.$inferSelect;
