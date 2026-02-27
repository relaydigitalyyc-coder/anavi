import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";

// ============================================================================
// CORE USER & AUTHENTICATION
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Verification & Trust
  verificationTier: mysqlEnum("verificationTier", ["none", "basic", "enhanced", "institutional"]).default("none").notNull(),
  trustScore: decimal("trustScore", { precision: 5, scale: 2 }).default("0.00"),
  verificationBadge: varchar("verificationBadge", { length: 32 }),
  kybStatus: mysqlEnum("kybStatus", ["pending", "in_review", "approved", "rejected"]).default("pending"),
  kycStatus: mysqlEnum("kycStatus", ["pending", "in_review", "approved", "rejected"]).default("pending"),
  
  // Onboarding
  participantType: mysqlEnum("participantType", ["originator", "investor", "developer", "institutional", "acquirer"]),
  onboardingStep: int("onboardingStep").default(0),
  onboardingCompleted: boolean("onboardingCompleted").default(false),
  
  // Profile
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 128 }),
  bio: text("bio"),
  avatar: text("avatar"),
  website: varchar("website", { length: 512 }),
  location: varchar("location", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  
  // Investment Profile (for investors/developers)
  investmentFocus: json("investmentFocus").$type<string[]>(),
  dealVerticals: json("dealVerticals").$type<string[]>(),
  typicalDealSize: varchar("typicalDealSize", { length: 64 }),
  geographicFocus: json("geographicFocus").$type<string[]>(),
  yearsExperience: int("yearsExperience"),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  
  // Compliance
  sanctionsCleared: boolean("sanctionsCleared").default(false),
  pepStatus: boolean("pepStatus").default(false),
  adverseMediaCleared: boolean("adverseMediaCleared").default(true),
  complianceLastChecked: timestamp("complianceLastChecked"),
  jurisdictions: json("jurisdictions").$type<string[]>(),
  
  // Stats
  totalDeals: int("totalDeals").default(0),
  totalDealValue: decimal("totalDealValue", { precision: 18, scale: 2 }).default("0.00"),
  totalEarnings: decimal("totalEarnings", { precision: 18, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ============================================================================
// VERIFICATION DOCUMENTS
// ============================================================================

export const verificationDocuments = mysqlTable("verification_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", [
    "government_id", "passport", "business_license", "incorporation_docs",
    "proof_of_address", "bank_statement", "tax_document", "accreditation_letter"
  ]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  reviewNotes: text("reviewNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// TRUST SCORE HISTORY
// ============================================================================

export const trustScoreHistory = mysqlTable("trust_score_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  previousScore: decimal("previousScore", { precision: 5, scale: 2 }),
  newScore: decimal("newScore", { precision: 5, scale: 2 }).notNull(),
  changeReason: varchar("changeReason", { length: 255 }).notNull(),
  changeSource: mysqlEnum("changeSource", [
    "deal_completion", "peer_review", "verification_upgrade", "compliance_check",
    "dispute_resolution", "time_decay", "manual_adjustment"
  ]).notNull(),
  relatedEntityId: int("relatedEntityId"),
  relatedEntityType: varchar("relatedEntityType", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// PEER REVIEWS
// ============================================================================

export const peerReviews = mysqlTable("peer_reviews", {
  id: int("id").autoincrement().primaryKey(),
  reviewerId: int("reviewerId").notNull(),
  revieweeId: int("revieweeId").notNull(),
  dealId: int("dealId"),
  rating: int("rating").notNull(), // 1-5
  professionalism: int("professionalism"), // 1-5
  reliability: int("reliability"), // 1-5
  communication: int("communication"), // 1-5
  comment: text("comment"),
  isAnonymous: boolean("isAnonymous").default(false),
  isVerified: boolean("isVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// RELATIONSHIPS (CUSTODY)
// ============================================================================

export const relationships = mysqlTable("relationships", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // Who owns/introduced this relationship
  contactId: int("contactId").notNull(), // The contact in the relationship
  
  // Cryptographic Custody
  timestampHash: varchar("timestampHash", { length: 128 }).notNull(), // SHA-256 hash for proof
  timestampProof: text("timestampProof"), // Full cryptographic proof
  establishedAt: timestamp("establishedAt").notNull(), // When relationship was established
  
  // Relationship Details
  relationshipType: mysqlEnum("relationshipType", [
    "direct", "introduction", "referral", "network", "professional", "personal"
  ]).default("direct"),
  strength: mysqlEnum("strength", ["weak", "moderate", "strong", "very_strong"]).default("moderate"),
  strengthScore: decimal("strengthScore", { precision: 5, scale: 2 }).default("50.00"),
  
  // Exposure Controls
  isBlind: boolean("isBlind").default(true), // Hidden until mutual consent
  exposureLevel: mysqlEnum("exposureLevel", ["hidden", "partial", "full"]).default("hidden"),
  consentGiven: boolean("consentGiven").default(false),
  consentGivenAt: timestamp("consentGivenAt"),
  
  // Attribution
  introducedBy: int("introducedBy"), // Who introduced this relationship
  attributionChain: json("attributionChain").$type<number[]>(), // Chain of introducers
  
  // Value Tracking
  totalDealValue: decimal("totalDealValue", { precision: 18, scale: 2 }).default("0.00"),
  totalEarnings: decimal("totalEarnings", { precision: 18, scale: 2 }).default("0.00"),
  dealCount: int("dealCount").default(0),
  
  // Communication
  lastContactAt: timestamp("lastContactAt"),
  contactFrequency: mysqlEnum("contactFrequency", ["daily", "weekly", "monthly", "quarterly", "yearly", "rare"]),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// CONTACT HANDLES (Communication Hub)
// ============================================================================

export const contactHandles = mysqlTable("contact_handles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  relationshipId: int("relationshipId"),
  
  platform: mysqlEnum("platform", [
    "email", "phone", "telegram", "discord", "whatsapp", "slack",
    "linkedin", "twitter", "signal", "wechat", "other"
  ]).notNull(),
  handle: varchar("handle", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  isVerified: boolean("isVerified").default(false),
  isPrimary: boolean("isPrimary").default(false),
  groupChatLink: text("groupChatLink"),
  groupChatName: varchar("groupChatName", { length: 255 }),
  
  lastActiveAt: timestamp("lastActiveAt"),
  messageCount: int("messageCount").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// USER FLAGS (whitelist / blacklist / watchlist)
// ============================================================================

export const userFlags = mysqlTable("user_flags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flagType: mysqlEnum("flagType", ["whitelist", "blacklist", "watchlist"]).notNull(),
  reason: text("reason"),
  flaggedBy: int("flaggedBy"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  type: mysqlEnum("type", [
    "match_found", "deal_update", "document_shared", "signature_requested",
    "payout_received", "compliance_alert", "relationship_request", "system"
  ]).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  
  relatedEntityType: varchar("relatedEntityType", { length: 64 }),
  relatedEntityId: int("relatedEntityId"),
  
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  
  actionUrl: varchar("actionUrl", { length: 512 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

export type InsertUser = typeof users.$inferInsert;

export type UserFlag = typeof userFlags.$inferSelect;

export type InsertUserFlag = typeof userFlags.$inferInsert;

export type VerificationDocument = typeof verificationDocuments.$inferSelect;

export type TrustScoreHistoryEntry = typeof trustScoreHistory.$inferSelect;

export type PeerReview = typeof peerReviews.$inferSelect;

export type Relationship = typeof relationships.$inferSelect;

export type ContactHandle = typeof contactHandles.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
