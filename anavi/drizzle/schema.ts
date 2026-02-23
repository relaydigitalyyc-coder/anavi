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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

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
// INTENTS (For Blind Matching)
// ============================================================================

export const intents = mysqlTable("intents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  intentType: mysqlEnum("intentType", ["buy", "sell", "invest", "seek_investment", "partner"]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "matched", "expired", "cancelled"]).default("active"),
  
  // Intent Details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Asset/Deal Specifics
  assetType: mysqlEnum("assetType", [
    "commodity", "real_estate", "equity", "debt", "infrastructure",
    "renewable_energy", "mining", "oil_gas", "business", "other"
  ]),
  assetSubtype: varchar("assetSubtype", { length: 128 }),
  
  // Value Parameters
  minValue: decimal("minValue", { precision: 18, scale: 2 }),
  maxValue: decimal("maxValue", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  // Location/Jurisdiction
  targetLocations: json("targetLocations").$type<string[]>(),
  excludedLocations: json("excludedLocations").$type<string[]>(),
  
  // Timing
  targetTimeline: varchar("targetTimeline", { length: 64 }),
  expiresAt: timestamp("expiresAt"),
  
  // AI Matching
  embedding: json("embedding").$type<number[]>(), // Vector embedding for semantic matching
  keywords: json("keywords").$type<string[]>(),
  matchPreferences: json("matchPreferences").$type<Record<string, unknown>>(),
  
  // Privacy
  isAnonymous: boolean("isAnonymous").default(true),
  visibilityLevel: mysqlEnum("visibilityLevel", ["private", "network", "verified", "public"]).default("verified"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// MATCHES
// ============================================================================

export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  
  intent1Id: int("intent1Id").notNull(),
  intent2Id: int("intent2Id").notNull(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id").notNull(),
  
  // Match Quality
  compatibilityScore: decimal("compatibilityScore", { precision: 5, scale: 2 }).notNull(),
  matchReason: text("matchReason"),
  aiAnalysis: text("aiAnalysis"),
  
  // Status
  status: mysqlEnum("status", [
    "pending", "user1_interested", "user2_interested", "mutual_interest",
    "nda_pending", "deal_room_created", "declined", "expired"
  ]).default("pending"),
  
  // Consent
  user1Consent: boolean("user1Consent").default(false),
  user2Consent: boolean("user2Consent").default(false),
  user1ConsentAt: timestamp("user1ConsentAt"),
  user2ConsentAt: timestamp("user2ConsentAt"),
  
  // Deal Room
  dealRoomId: int("dealRoomId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// DEALS
// ============================================================================

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Deal Type & Value
  dealType: mysqlEnum("dealType", [
    "commodity_trade", "real_estate", "equity_investment", "debt_financing",
    "joint_venture", "acquisition", "partnership", "other"
  ]).notNull(),
  dealValue: decimal("dealValue", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  // Pipeline Stage
  stage: mysqlEnum("stage", [
    "lead", "qualification", "due_diligence", "negotiation",
    "documentation", "closing", "completed", "cancelled"
  ]).default("lead"),
  
  // Parties
  originatorId: int("originatorId").notNull(),
  buyerId: int("buyerId"),
  sellerId: int("sellerId"),
  
  // Deal Room
  dealRoomId: int("dealRoomId"),
  
  // Milestones
  currentMilestone: varchar("currentMilestone", { length: 128 }),
  milestones: json("milestones").$type<Array<{
    id: string;
    name: string;
    status: "pending" | "in_progress" | "completed";
    completedAt?: string;
    payoutTrigger?: boolean;
  }>>(),
  
  // Dates
  expectedCloseDate: timestamp("expectedCloseDate"),
  actualCloseDate: timestamp("actualCloseDate"),
  
  // Compliance
  complianceStatus: mysqlEnum("complianceStatus", ["pending", "cleared", "flagged", "blocked"]).default("pending"),
  complianceNotes: text("complianceNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// DEAL PARTICIPANTS
// ============================================================================

export const dealParticipants = mysqlTable("deal_participants", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId").notNull(),
  
  role: mysqlEnum("role", [
    "originator", "buyer", "seller", "introducer", "advisor",
    "legal", "escrow", "observer"
  ]).notNull(),
  
  // Attribution & Economics
  attributionPercentage: decimal("attributionPercentage", { precision: 5, scale: 2 }),
  expectedPayout: decimal("expectedPayout", { precision: 18, scale: 2 }),
  actualPayout: decimal("actualPayout", { precision: 18, scale: 2 }),
  payoutStatus: mysqlEnum("payoutStatus", ["pending", "partial", "completed"]).default("pending"),
  
  // Relationship Attribution
  introducedBy: int("introducedBy"),
  relationshipId: int("relationshipId"),
  
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  leftAt: timestamp("leftAt"),
});

// ============================================================================
// DEAL ROOMS
// ============================================================================

export const dealRooms = mysqlTable("deal_rooms", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId"),
  matchId: int("matchId"),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  status: mysqlEnum("status", ["active", "archived", "closed"]).default("active"),
  accessLevel: mysqlEnum("accessLevel", ["private", "participants", "invited"]).default("participants"),
  
  // NDA
  ndaRequired: boolean("ndaRequired").default(true),
  ndaTemplateId: int("ndaTemplateId"),
  
  // Settings
  settings: json("settings").$type<{
    allowDownloads: boolean;
    watermarkDocuments: boolean;
    requireNda: boolean;
    autoExpireAccess: boolean;
    expiryDays?: number;
  }>(),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// DEAL ROOM ACCESS
// ============================================================================

export const dealRoomAccess = mysqlTable("deal_room_access", {
  id: int("id").autoincrement().primaryKey(),
  dealRoomId: int("dealRoomId").notNull(),
  userId: int("userId").notNull(),
  
  accessLevel: mysqlEnum("accessLevel", ["view", "comment", "edit", "admin"]).default("view"),
  
  ndaSigned: boolean("ndaSigned").default(false),
  ndaSignedAt: timestamp("ndaSignedAt"),
  ndaDocumentId: int("ndaDocumentId"),
  
  invitedBy: int("invitedBy"),
  expiresAt: timestamp("expiresAt"),
  
  lastAccessedAt: timestamp("lastAccessedAt"),
  accessCount: int("accessCount").default(0),
  
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  dealRoomId: int("dealRoomId"),
  dealId: int("dealId"),
  userId: int("userId"),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  mimeType: varchar("mimeType", { length: 128 }),
  
  // Versioning
  version: int("version").default(1),
  parentDocumentId: int("parentDocumentId"),
  isLatest: boolean("isLatest").default(true),
  
  // Classification
  category: mysqlEnum("category", [
    "nda", "contract", "financial", "legal", "technical",
    "due_diligence", "presentation", "correspondence", "other"
  ]),
  tags: json("tags").$type<string[]>(),
  
  // E-Signature
  requiresSignature: boolean("requiresSignature").default(false),
  signatureStatus: mysqlEnum("signatureStatus", ["not_required", "pending", "partial", "completed"]).default("not_required"),
  signatureProvider: varchar("signatureProvider", { length: 64 }),
  externalSignatureId: varchar("externalSignatureId", { length: 255 }),
  
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// DOCUMENT SIGNATURES
// ============================================================================

export const documentSignatures = mysqlTable("document_signatures", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  
  status: mysqlEnum("status", ["pending", "signed", "declined"]).default("pending"),
  signedAt: timestamp("signedAt"),
  signatureData: text("signatureData"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

// ============================================================================
// COMPLIANCE CHECKS
// ============================================================================

export const complianceChecks = mysqlTable("compliance_checks", {
  id: int("id").autoincrement().primaryKey(),
  
  entityType: mysqlEnum("entityType", ["user", "deal", "relationship"]).notNull(),
  entityId: int("entityId").notNull(),
  
  checkType: mysqlEnum("checkType", [
    "sanctions", "pep", "adverse_media", "aml", "kyc", "kyb", "jurisdiction"
  ]).notNull(),
  
  status: mysqlEnum("status", ["pending", "passed", "flagged", "failed"]).default("pending"),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]),
  
  provider: varchar("provider", { length: 64 }),
  externalCheckId: varchar("externalCheckId", { length: 255 }),
  
  findings: json("findings").$type<Array<{
    type: string;
    severity: string;
    description: string;
    source?: string;
  }>>(),
  
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// PAYOUTS
// ============================================================================

export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId").notNull(),
  
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  payoutType: mysqlEnum("payoutType", [
    "originator_fee", "introducer_fee", "advisor_fee", "milestone_bonus", "success_fee"
  ]).notNull(),
  
  // Attribution
  attributionPercentage: decimal("attributionPercentage", { precision: 5, scale: 2 }),
  relationshipId: int("relationshipId"),
  isFollowOn: boolean("isFollowOn").default(false),
  originalDealId: int("originalDealId"),
  
  // Status
  status: mysqlEnum("status", ["pending", "approved", "processing", "completed", "failed"]).default("pending"),
  
  // Milestone Trigger
  milestoneId: varchar("milestoneId", { length: 64 }),
  milestoneName: varchar("milestoneName", { length: 128 }),
  
  // Payment Details
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  paymentReference: varchar("paymentReference", { length: 255 }),
  paidAt: timestamp("paidAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// AUDIT LOG
// ============================================================================

export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId"),
  
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId"),
  
  previousState: json("previousState"),
  newState: json("newState"),
  
  metadata: json("metadata").$type<Record<string, unknown>>(),
  
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type TrustScoreHistoryEntry = typeof trustScoreHistory.$inferSelect;
export type PeerReview = typeof peerReviews.$inferSelect;
export type Relationship = typeof relationships.$inferSelect;
export type ContactHandle = typeof contactHandles.$inferSelect;
export type Intent = typeof intents.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type DealParticipant = typeof dealParticipants.$inferSelect;
export type DealRoom = typeof dealRooms.$inferSelect;
export type DealRoomAccess = typeof dealRoomAccess.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentSignature = typeof documentSignatures.$inferSelect;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type Notification = typeof notifications.$inferSelect;


// ============================================================================
// FAMILY OFFICES
// ============================================================================

export const familyOffices = mysqlTable("family_offices", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic Info
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  type: mysqlEnum("type", ["single_family", "multi_family", "embedded", "virtual"]).default("single_family"),
  
  // Founding Family
  foundingFamily: varchar("foundingFamily", { length: 255 }),
  wealthSource: varchar("wealthSource", { length: 255 }), // e.g., "Walmart", "Microsoft", "Real Estate"
  generationWealth: int("generationWealth").default(1), // 1st gen, 2nd gen, etc.
  
  // AUM & Financials
  aum: bigint("aum", { mode: "number" }), // Assets Under Management in USD
  aumRange: mysqlEnum("aumRange", [
    "under_100m", "100m_500m", "500m_1b", "1b_5b", "5b_10b", "10b_50b", "50b_plus"
  ]),
  minimumInvestment: bigint("minimumInvestment", { mode: "number" }),
  typicalCheckSize: varchar("typicalCheckSize", { length: 64 }), // e.g., "$1M - $10M"
  
  // Location
  headquarters: varchar("headquarters", { length: 255 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  country: varchar("country", { length: 64 }).default("USA"),
  region: mysqlEnum("region", [
    "north_america", "europe", "asia", "middle_east", "latin_america", "africa", "oceania"
  ]).default("north_america"),
  
  // Investment Focus
  investmentFocus: json("investmentFocus").$type<string[]>(), // ["real_estate", "private_equity", "venture"]
  sectorPreferences: json("sectorPreferences").$type<string[]>(), // ["technology", "healthcare", "energy"]
  geographicFocus: json("geographicFocus").$type<string[]>(), // ["USA", "Europe", "Asia"]
  stagePreferences: json("stagePreferences").$type<string[]>(), // ["seed", "series_a", "growth", "buyout"]
  
  // Investment Style
  investmentStyle: mysqlEnum("investmentStyle", [
    "passive", "active", "control", "co_invest", "direct_only", "fund_only", "hybrid"
  ]).default("hybrid"),
  holdingPeriod: varchar("holdingPeriod", { length: 64 }), // e.g., "5-10 years"
  returnTarget: varchar("returnTarget", { length: 64 }), // e.g., "15-20% IRR"
  
  // Team & Structure
  teamSize: int("teamSize"),
  hasInHouseCIO: boolean("hasInHouseCIO").default(false),
  hasInHouseLegal: boolean("hasInHouseLegal").default(false),
  usesExternalAdvisors: boolean("usesExternalAdvisors").default(true),
  
  // Contact Info
  website: varchar("website", { length: 512 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  
  // Key Contacts (JSON array of contacts)
  keyContacts: json("keyContacts").$type<{
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
    phone?: string;
  }[]>(),
  
  // Deal Activity
  dealsPerYear: int("dealsPerYear"),
  lastKnownDeal: timestamp("lastKnownDeal"),
  totalInvestments: int("totalInvestments"),
  
  // Verification & Data Quality
  dataSource: varchar("dataSource", { length: 128 }), // Where we got this data
  dataConfidence: mysqlEnum("dataConfidence", ["low", "medium", "high", "verified"]).default("medium"),
  lastVerified: timestamp("lastVerified"),
  isActive: boolean("isActive").default(true),
  
  // ANAVI Integration
  claimedByUserId: int("claimedByUserId"), // If a user has claimed this FO
  relationshipCount: int("relationshipCount").default(0),
  
  // Ranking
  globalRank: int("globalRank"),
  regionRank: int("regionRank"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyOffice = typeof familyOffices.$inferSelect;
export type InsertFamilyOffice = typeof familyOffices.$inferInsert;

// ============================================================================
// INSTITUTIONAL INVESTORS (Broader Category)
// ============================================================================

export const institutionalInvestors = mysqlTable("institutional_investors", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "pension_fund", "endowment", "sovereign_wealth", "insurance", 
    "bank", "asset_manager", "hedge_fund", "private_equity", "venture_capital"
  ]).notNull(),
  
  aum: bigint("aum", { mode: "number" }),
  headquarters: varchar("headquarters", { length: 255 }),
  country: varchar("country", { length: 64 }),
  website: varchar("website", { length: 512 }),
  
  investmentFocus: json("investmentFocus").$type<string[]>(),
  minimumInvestment: bigint("minimumInvestment", { mode: "number" }),
  
  keyContacts: json("keyContacts").$type<{
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
  }[]>(),
  
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// BROKER CONTACTS (Enhanced Contact Management)
// ============================================================================

export const brokerContacts = mysqlTable("broker_contacts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // The broker who owns this contact
  
  // Basic Info
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 64 }),
  
  // Professional Info
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 128 }),
  department: varchar("department", { length: 128 }),
  seniority: mysqlEnum("seniority", [
    "c_level", "vp", "director", "manager", "associate", "analyst", "other"
  ]),
  
  // Contact Type
  contactType: mysqlEnum("contactType", [
    "investor", "family_office", "fund_manager", "broker", "advisor",
    "principal", "operator", "service_provider", "other"
  ]).default("investor"),
  
  // Linked Entities
  familyOfficeId: int("familyOfficeId"),
  institutionalInvestorId: int("institutionalInvestorId"),
  
  // Contact Details
  email: varchar("email", { length: 320 }),
  emailSecondary: varchar("emailSecondary", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  phoneSecondary: varchar("phoneSecondary", { length: 32 }),
  
  // Social & Messaging
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  twitterHandle: varchar("twitterHandle", { length: 64 }),
  telegramHandle: varchar("telegramHandle", { length: 64 }),
  discordHandle: varchar("discordHandle", { length: 64 }),
  whatsappNumber: varchar("whatsappNumber", { length: 32 }),
  signalNumber: varchar("signalNumber", { length: 32 }),
  
  // Group Chats
  groupChats: json("groupChats").$type<{
    platform: string;
    name: string;
    link?: string;
    memberCount?: number;
  }[]>(),
  
  // Location
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  country: varchar("country", { length: 64 }),
  timezone: varchar("timezone", { length: 64 }),
  
  // Investment Profile
  investmentFocus: json("investmentFocus").$type<string[]>(),
  sectorExpertise: json("sectorExpertise").$type<string[]>(),
  geographicFocus: json("geographicFocus").$type<string[]>(),
  typicalDealSize: varchar("typicalDealSize", { length: 64 }),
  
  // Relationship Data
  relationshipStrength: mysqlEnum("relationshipStrength", [
    "cold", "warm", "hot", "close", "inner_circle"
  ]).default("cold"),
  lastContactDate: timestamp("lastContactDate"),
  nextFollowUp: timestamp("nextFollowUp"),
  contactFrequency: mysqlEnum("contactFrequency", [
    "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "as_needed"
  ]),
  
  // Deal History
  totalDealsDiscussed: int("totalDealsDiscussed").default(0),
  totalDealsClosed: int("totalDealsClosed").default(0),
  totalDealValue: decimal("totalDealValue", { precision: 18, scale: 2 }).default("0.00"),
  
  // Notes & Tags
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  customFields: json("customFields").$type<Record<string, unknown>>(),
  
  // Data Quality
  dataSource: varchar("dataSource", { length: 128 }),
  isVerified: boolean("isVerified").default(false),
  lastVerified: timestamp("lastVerified"),
  
  // Privacy
  doNotContact: boolean("doNotContact").default(false),
  preferredContactMethod: mysqlEnum("preferredContactMethod", [
    "email", "phone", "linkedin", "telegram", "whatsapp", "in_person"
  ]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrokerContact = typeof brokerContacts.$inferSelect;
export type InsertBrokerContact = typeof brokerContacts.$inferInsert;

// ============================================================================
// CONTACT INTERACTIONS (Activity Tracking)
// ============================================================================

export const contactInteractions = mysqlTable("contact_interactions", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  userId: int("userId").notNull(),
  
  interactionType: mysqlEnum("interactionType", [
    "email_sent", "email_received", "call", "meeting", "video_call",
    "message", "linkedin_message", "introduction", "deal_discussion", "other"
  ]).notNull(),
  
  subject: varchar("subject", { length: 255 }),
  summary: text("summary"),
  outcome: varchar("outcome", { length: 255 }),
  
  // Related Entities
  dealId: int("dealId"),
  intentId: int("intentId"),
  
  // Scheduling
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  duration: int("duration"), // in minutes
  
  // Follow-up
  requiresFollowUp: boolean("requiresFollowUp").default(false),
  followUpDate: timestamp("followUpDate"),
  followUpNotes: text("followUpNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// DEAL FLOW SOURCES
// ============================================================================

export const dealFlowSources = mysqlTable("deal_flow_sources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "direct_relationship", "referral", "platform", "conference", 
    "cold_outreach", "inbound", "broker_network", "other"
  ]).notNull(),
  
  description: text("description"),
  contactInfo: varchar("contactInfo", { length: 255 }),
  
  // Performance Metrics
  totalDealsSourced: int("totalDealsSourced").default(0),
  totalDealsClosed: int("totalDealsClosed").default(0),
  totalDealValue: decimal("totalDealValue", { precision: 18, scale: 2 }).default("0.00"),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }),
  
  // Quality Score
  qualityScore: decimal("qualityScore", { precision: 5, scale: 2 }),
  
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


// ============================================================================
// FAMILY OFFICE TARGETS (Prospecting Workflow)
// ============================================================================

export const familyOfficeTargets = mysqlTable("family_office_targets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // The broker targeting this FO
  familyOfficeId: int("familyOfficeId").notNull(),
  
  // Targeting Status
  status: mysqlEnum("status", [
    "identified", "researching", "outreach_planned", "contacted", 
    "in_conversation", "meeting_scheduled", "proposal_sent",
    "negotiating", "converted", "declined", "on_hold"
  ]).default("identified"),
  
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  
  // Outreach Tracking
  firstContactDate: timestamp("firstContactDate"),
  lastContactDate: timestamp("lastContactDate"),
  nextFollowUpDate: timestamp("nextFollowUpDate"),
  totalTouchpoints: int("totalTouchpoints").default(0),
  
  // Contact Person
  primaryContactName: varchar("primaryContactName", { length: 255 }),
  primaryContactTitle: varchar("primaryContactTitle", { length: 128 }),
  primaryContactEmail: varchar("primaryContactEmail", { length: 320 }),
  primaryContactLinkedIn: varchar("primaryContactLinkedIn", { length: 512 }),
  primaryContactPhone: varchar("primaryContactPhone", { length: 32 }),
  
  // Opportunity Details
  estimatedDealSize: decimal("estimatedDealSize", { precision: 18, scale: 2 }),
  dealType: mysqlEnum("dealType", [
    "co_investment", "fund_commitment", "direct_deal", "advisory", "other"
  ]),
  interestedSectors: json("interestedSectors").$type<string[]>(),
  
  // Notes & Activity
  notes: text("notes"),
  lastActivitySummary: text("lastActivitySummary"),
  
  // Conversion Tracking
  convertedToRelationshipId: int("convertedToRelationshipId"),
  convertedToDealId: int("convertedToDealId"),
  conversionDate: timestamp("conversionDate"),
  
  // Scoring
  fitScore: decimal("fitScore", { precision: 5, scale: 2 }), // How well they match your criteria
  engagementScore: decimal("engagementScore", { precision: 5, scale: 2 }), // How engaged they are
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyOfficeTarget = typeof familyOfficeTargets.$inferSelect;
export type InsertFamilyOfficeTarget = typeof familyOfficeTargets.$inferInsert;

// ============================================================================
// TARGET ACTIVITIES (Outreach History)
// ============================================================================

export const targetActivities = mysqlTable("target_activities", {
  id: int("id").autoincrement().primaryKey(),
  targetId: int("targetId").notNull(),
  userId: int("userId").notNull(),
  
  activityType: mysqlEnum("activityType", [
    "email_sent", "email_received", "call_made", "call_received",
    "linkedin_connection", "linkedin_message", "meeting", "video_call",
    "introduction_made", "introduction_received", "document_shared",
    "proposal_sent", "follow_up", "note_added", "status_change"
  ]).notNull(),
  
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  outcome: varchar("outcome", { length: 255 }),
  
  // Contact Info
  contactPerson: varchar("contactPerson", { length: 255 }),
  contactMethod: varchar("contactMethod", { length: 64 }),
  
  // Scheduling
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  duration: int("duration"), // in minutes
  
  // Follow-up
  requiresFollowUp: boolean("requiresFollowUp").default(false),
  followUpDate: timestamp("followUpDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TargetActivity = typeof targetActivities.$inferSelect;

// ============================================================================
// DATA ENRICHMENT LOGS
// ============================================================================

export const dataEnrichmentLogs = mysqlTable("data_enrichment_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  entityType: mysqlEnum("entityType", ["family_office", "contact", "company"]).notNull(),
  entityId: int("entityId").notNull(),
  
  provider: varchar("provider", { length: 64 }).notNull(), // e.g., "pitchbook", "crunchbase", "linkedin"
  enrichmentType: mysqlEnum("enrichmentType", [
    "aum_update", "contact_info", "investment_activity", "news", 
    "team_changes", "social_profiles", "company_info", "full_refresh"
  ]).notNull(),
  
  status: mysqlEnum("status", ["pending", "success", "partial", "failed"]).default("pending"),
  
  // Data Changes
  previousData: json("previousData").$type<Record<string, unknown>>(),
  newData: json("newData").$type<Record<string, unknown>>(),
  fieldsUpdated: json("fieldsUpdated").$type<string[]>(),
  
  // API Response
  apiResponseCode: int("apiResponseCode"),
  apiResponseMessage: text("apiResponseMessage"),
  
  // Cost Tracking
  apiCreditsUsed: decimal("apiCreditsUsed", { precision: 10, scale: 4 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// SOCIAL PROFILES (LinkedIn, Instagram, etc.)
// ============================================================================

export const socialProfiles = mysqlTable("social_profiles", {
  id: int("id").autoincrement().primaryKey(),
  
  // Link to entity
  entityType: mysqlEnum("entityType", ["user", "contact", "family_office"]).notNull(),
  entityId: int("entityId").notNull(),
  
  platform: mysqlEnum("platform", [
    "linkedin", "instagram", "twitter", "facebook", "youtube", 
    "tiktok", "crunchbase", "pitchbook", "angellist", "other"
  ]).notNull(),
  
  // Profile Info
  profileUrl: varchar("profileUrl", { length: 512 }).notNull(),
  username: varchar("username", { length: 128 }),
  displayName: varchar("displayName", { length: 255 }),
  profileImageUrl: text("profileImageUrl"),
  bio: text("bio"),
  
  // Metrics (where available)
  followerCount: int("followerCount"),
  followingCount: int("followingCount"),
  connectionCount: int("connectionCount"),
  postCount: int("postCount"),
  
  // LinkedIn Specific
  linkedinHeadline: varchar("linkedinHeadline", { length: 255 }),
  linkedinLocation: varchar("linkedinLocation", { length: 128 }),
  linkedinIndustry: varchar("linkedinIndustry", { length: 128 }),
  linkedinCompany: varchar("linkedinCompany", { length: 255 }),
  linkedinTitle: varchar("linkedinTitle", { length: 255 }),
  
  // Instagram Specific
  instagramIsVerified: boolean("instagramIsVerified").default(false),
  instagramIsPrivate: boolean("instagramIsPrivate").default(false),
  instagramCategory: varchar("instagramCategory", { length: 128 }),
  
  // Verification
  isVerified: boolean("isVerified").default(false),
  verifiedAt: timestamp("verifiedAt"),
  
  // Last Sync
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: mysqlEnum("syncStatus", ["pending", "synced", "failed"]).default("pending"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialProfile = typeof socialProfiles.$inferSelect;
export type InsertSocialProfile = typeof socialProfiles.$inferInsert;

// ============================================================================
// NEWS & ACTIVITY FEED
// ============================================================================

export const newsItems = mysqlTable("news_items", {
  id: int("id").autoincrement().primaryKey(),
  
  // Link to entity
  entityType: mysqlEnum("entityType", ["family_office", "contact", "company"]).notNull(),
  entityId: int("entityId").notNull(),
  
  // News Content
  title: varchar("title", { length: 512 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  sourceName: varchar("sourceName", { length: 128 }),
  
  // Categorization
  newsType: mysqlEnum("newsType", [
    "investment", "exit", "fund_raise", "team_change", "acquisition",
    "partnership", "regulatory", "market_news", "press_release", "other"
  ]).default("other"),
  
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  relevanceScore: decimal("relevanceScore", { precision: 5, scale: 2 }),
  
  // Media
  imageUrl: text("imageUrl"),
  
  // Dates
  publishedAt: timestamp("publishedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  
  // User Interaction
  isRead: boolean("isRead").default(false),
  isSaved: boolean("isSaved").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsItem = typeof newsItems.$inferSelect;

// ============================================================================
// ENRICHMENT JOBS
// ============================================================================

export const enrichmentJobs = mysqlTable("enrichment_jobs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Entity being enriched
  entityType: mysqlEnum("entityType", ["family_office", "broker_contact", "relationship"]).notNull(),
  entityId: int("entityId").notNull(),
  
  // Job details
  source: varchar("source", { length: 64 }).notNull(), // e.g., "pitchbook", "crunchbase", "linkedin", "manual"
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  
  // User who requested
  userId: int("userId").notNull(),
  
  // Results
  enrichedData: json("enrichedData"),
  fieldsUpdated: json("fieldsUpdated").$type<string[]>(),
  errorMessage: text("errorMessage"),
  
  // Timestamps
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EnrichmentJob = typeof enrichmentJobs.$inferSelect;
export type InsertEnrichmentJob = typeof enrichmentJobs.$inferInsert;


// ============================================================================
// CALENDAR INTEGRATION
// ============================================================================

export const calendarConnections = mysqlTable("calendar_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Provider
  provider: mysqlEnum("provider", ["google", "outlook", "apple"]).notNull(),
  
  // OAuth tokens (encrypted in production)
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiry: timestamp("tokenExpiry"),
  
  // Calendar details
  calendarId: varchar("calendarId", { length: 255 }),
  calendarName: varchar("calendarName", { length: 255 }),
  
  // Sync settings
  syncEnabled: boolean("syncEnabled").default(true),
  lastSyncAt: timestamp("lastSyncAt"),
  syncStatus: mysqlEnum("syncStatus", ["active", "paused", "error"]).default("active"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type InsertCalendarConnection = typeof calendarConnections.$inferInsert;

export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // External reference
  externalId: varchar("externalId", { length: 255 }),
  provider: mysqlEnum("provider", ["google", "outlook", "apple", "internal"]).default("internal"),
  
  // Event details
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 512 }),
  meetingLink: varchar("meetingLink", { length: 1024 }),
  
  // Timing
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  allDay: boolean("allDay").default(false),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  
  // Recurrence
  isRecurring: boolean("isRecurring").default(false),
  recurrenceRule: varchar("recurrenceRule", { length: 255 }),
  
  // Event type
  eventType: mysqlEnum("eventType", [
    "meeting", "call", "follow_up", "due_diligence", "deal_room",
    "pitch", "closing", "reminder", "other"
  ]).default("meeting"),
  
  // Related entities
  relatedDealId: int("relatedDealId"),
  relatedTargetId: int("relatedTargetId"),
  relatedContactId: int("relatedContactId"),
  
  // Attendees (JSON array of { name, email, status })
  attendees: json("attendees").$type<Array<{name: string, email: string, status: string}>>(),
  
  // Status
  status: mysqlEnum("status", ["confirmed", "tentative", "cancelled"]).default("confirmed"),
  
  // Reminders (JSON array of minutes before)
  reminders: json("reminders").$type<number[]>(),
  
  // Notes
  notes: text("notes"),
  outcome: text("outcome"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

export const followUpReminders = mysqlTable("follow_up_reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // What to follow up on
  targetType: mysqlEnum("targetType", ["family_office", "contact", "deal", "relationship"]).notNull(),
  targetId: int("targetId").notNull(),
  targetName: varchar("targetName", { length: 255 }),
  
  // Reminder details
  title: varchar("title", { length: 512 }).notNull(),
  notes: text("notes"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  
  // Timing
  dueDate: timestamp("dueDate").notNull(),
  reminderTime: timestamp("reminderTime"),
  
  // Status
  status: mysqlEnum("status", ["pending", "completed", "snoozed", "cancelled"]).default("pending"),
  completedAt: timestamp("completedAt"),
  
  // Snooze
  snoozedUntil: timestamp("snoozedUntil"),
  snoozeCount: int("snoozeCount").default(0),
  
  // Link to calendar event if created
  calendarEventId: int("calendarEventId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUpReminder = typeof followUpReminders.$inferSelect;
export type InsertFollowUpReminder = typeof followUpReminders.$inferInsert;

// ============================================================================
// DEAL FLOW ANALYTICS
// ============================================================================

export const dealAnalytics = mysqlTable("deal_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Time period
  periodType: mysqlEnum("periodType", ["daily", "weekly", "monthly", "quarterly", "yearly"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  
  // Deal metrics
  totalDeals: int("totalDeals").default(0),
  newDeals: int("newDeals").default(0),
  closedDeals: int("closedDeals").default(0),
  lostDeals: int("lostDeals").default(0),
  
  // Value metrics
  totalPipelineValue: decimal("totalPipelineValue", { precision: 18, scale: 2 }).default("0.00"),
  closedValue: decimal("closedValue", { precision: 18, scale: 2 }).default("0.00"),
  lostValue: decimal("lostValue", { precision: 18, scale: 2 }).default("0.00"),
  
  // Conversion metrics
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }),
  avgDealCycleTime: int("avgDealCycleTime"), // in days
  avgDealSize: decimal("avgDealSize", { precision: 18, scale: 2 }),
  
  // Source breakdown (JSON)
  dealsBySource: json("dealsBySource").$type<Record<string, number>>(),
  valueBySource: json("valueBySource").$type<Record<string, number>>(),
  
  // Stage breakdown (JSON)
  dealsByStage: json("dealsByStage").$type<Record<string, number>>(),
  valueByStage: json("valueByStage").$type<Record<string, number>>(),
  
  // Family office type breakdown
  dealsByFOType: json("dealsByFOType").$type<Record<string, number>>(),
  conversionByFOType: json("conversionByFOType").$type<Record<string, number>>(),
  
  // Relationship metrics
  topRelationshipSources: json("topRelationshipSources").$type<Array<{id: number, name: string, deals: number, value: number}>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DealAnalytics = typeof dealAnalytics.$inferSelect;
export type InsertDealAnalytics = typeof dealAnalytics.$inferInsert;

export const conversionFunnels = mysqlTable("conversion_funnels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Funnel stage
  stage: varchar("stage", { length: 64 }).notNull(),
  stageOrder: int("stageOrder").notNull(),
  
  // Metrics
  totalEntered: int("totalEntered").default(0),
  totalExited: int("totalExited").default(0),
  totalConverted: int("totalConverted").default(0),
  
  // Value
  valueEntered: decimal("valueEntered", { precision: 18, scale: 2 }).default("0.00"),
  valueConverted: decimal("valueConverted", { precision: 18, scale: 2 }).default("0.00"),
  
  // Time metrics
  avgTimeInStage: int("avgTimeInStage"), // in hours
  
  // Period
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionFunnel = typeof conversionFunnels.$inferSelect;

export type InsertConversionFunnel = typeof conversionFunnels.$inferInsert;

// ============================================================================
// SPV (SPECIAL PURPOSE VEHICLES)
// ============================================================================

export const spvs = mysqlTable("spvs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic Info
  name: varchar("name", { length: 255 }).notNull(),
  legalName: varchar("legalName", { length: 512 }),
  description: text("description"),
  
  // Legal Structure
  entityType: mysqlEnum("entityType", [
    "llc", "lp", "gp", "corp", "series_llc", "trust", "offshore"
  ]).default("llc").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 128 }).notNull(),
  stateOfFormation: varchar("stateOfFormation", { length: 64 }),
  einNumber: varchar("einNumber", { length: 32 }),
  formationDate: timestamp("formationDate"),
  
  // Purpose
  investmentPurpose: text("investmentPurpose"),
  targetAssetClass: mysqlEnum("targetAssetClass", [
    "real_estate", "private_equity", "venture_capital", "hedge_fund",
    "commodities", "infrastructure", "debt", "mixed", "other"
  ]),
  targetIndustry: varchar("targetIndustry", { length: 128 }),
  
  // Capital Structure
  targetRaise: decimal("targetRaise", { precision: 18, scale: 2 }),
  minimumInvestment: decimal("minimumInvestment", { precision: 18, scale: 2 }),
  maximumInvestment: decimal("maximumInvestment", { precision: 18, scale: 2 }),
  totalCommitted: decimal("totalCommitted", { precision: 18, scale: 2 }).default("0.00"),
  totalCalled: decimal("totalCalled", { precision: 18, scale: 2 }).default("0.00"),
  totalDistributed: decimal("totalDistributed", { precision: 18, scale: 2 }).default("0.00"),
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  // Fee Structure
  managementFee: decimal("managementFee", { precision: 5, scale: 2 }), // percentage
  carriedInterest: decimal("carriedInterest", { precision: 5, scale: 2 }), // percentage
  preferredReturn: decimal("preferredReturn", { precision: 5, scale: 2 }), // hurdle rate
  
  // Status
  status: mysqlEnum("status", [
    "draft", "formation", "fundraising", "closed", "active", "liquidating", "dissolved"
  ]).default("draft"),
  
  // Parties
  sponsorId: int("sponsorId").notNull(), // GP/Sponsor
  managerId: int("managerId"), // Fund Manager
  adminId: int("adminId"), // Fund Admin
  
  // Deal Room
  dealRoomId: int("dealRoomId"),
  
  // Compliance
  complianceStatus: mysqlEnum("complianceStatus", ["pending", "approved", "flagged", "blocked"]).default("pending"),
  regulatoryFilings: json("regulatoryFilings").$type<Array<{
    type: string;
    filedAt: string;
    status: string;
    documentId?: number;
  }>>(),
  
  // Documents
  operatingAgreementId: int("operatingAgreementId"),
  ppmDocumentId: int("ppmDocumentId"), // Private Placement Memorandum
  subscriptionAgreementId: int("subscriptionAgreementId"),
  
  // Dates
  fundingDeadline: timestamp("fundingDeadline"),
  investmentPeriodEnd: timestamp("investmentPeriodEnd"),
  termEndDate: timestamp("termEndDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SPV = typeof spvs.$inferSelect;
export type InsertSPV = typeof spvs.$inferInsert;

// ============================================================================
// LP (LIMITED PARTNERS)
// ============================================================================

export const lpProfiles = mysqlTable("lp_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // LP Type
  lpType: mysqlEnum("lpType", [
    "individual", "family_office", "institutional", "ria", "endowment",
    "pension", "sovereign_wealth", "corporate", "other"
  ]).notNull(),
  
  // Accreditation
  accreditationStatus: mysqlEnum("accreditationStatus", [
    "pending", "accredited", "qualified_purchaser", "qualified_client", "not_accredited"
  ]).default("pending"),
  accreditationMethod: mysqlEnum("accreditationMethod", [
    "income", "net_worth", "professional", "entity", "other"
  ]),
  accreditationVerifiedAt: timestamp("accreditationVerifiedAt"),
  accreditationExpiresAt: timestamp("accreditationExpiresAt"),
  accreditationDocumentId: int("accreditationDocumentId"),
  
  // Investment Profile
  investableAssets: decimal("investableAssets", { precision: 18, scale: 2 }),
  annualIncome: decimal("annualIncome", { precision: 18, scale: 2 }),
  investmentExperience: mysqlEnum("investmentExperience", [
    "none", "limited", "moderate", "extensive", "professional"
  ]).default("limited"),
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]).default("moderate"),
  
  // Preferences
  preferredAssetClasses: json("preferredAssetClasses").$type<string[]>(),
  preferredIndustries: json("preferredIndustries").$type<string[]>(),
  preferredGeographies: json("preferredGeographies").$type<string[]>(),
  minimumCheckSize: decimal("minimumCheckSize", { precision: 18, scale: 2 }),
  maximumCheckSize: decimal("maximumCheckSize", { precision: 18, scale: 2 }),
  
  // KYC/AML
  kycStatus: mysqlEnum("kycStatus", ["pending", "in_review", "approved", "rejected"]).default("pending"),
  kycVerifiedAt: timestamp("kycVerifiedAt"),
  amlCleared: boolean("amlCleared").default(false),
  amlClearedAt: timestamp("amlClearedAt"),
  pepStatus: boolean("pepStatus").default(false),
  
  // Banking
  bankName: varchar("bankName", { length: 255 }),
  bankAccountLast4: varchar("bankAccountLast4", { length: 4 }),
  wireInstructionsId: int("wireInstructionsId"),
  
  // Stats
  totalInvested: decimal("totalInvested", { precision: 18, scale: 2 }).default("0.00"),
  totalDistributions: decimal("totalDistributions", { precision: 18, scale: 2 }).default("0.00"),
  activeInvestments: int("activeInvestments").default(0),
  reinvestmentRate: decimal("reinvestmentRate", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LPProfile = typeof lpProfiles.$inferSelect;
export type InsertLPProfile = typeof lpProfiles.$inferInsert;

// ============================================================================
// CAPITAL COMMITMENTS
// ============================================================================

export const capitalCommitments = mysqlTable("capital_commitments", {
  id: int("id").autoincrement().primaryKey(),
  
  spvId: int("spvId").notNull(),
  lpProfileId: int("lpProfileId").notNull(),
  userId: int("userId").notNull(),
  
  // Commitment Details
  commitmentAmount: decimal("commitmentAmount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  ownershipPercentage: decimal("ownershipPercentage", { precision: 8, scale: 5 }),
  
  // Status
  status: mysqlEnum("status", [
    "pending", "signed", "funded", "partially_funded", "cancelled", "transferred"
  ]).default("pending"),
  
  // Subscription
  subscriptionDate: timestamp("subscriptionDate"),
  subscriptionDocumentId: int("subscriptionDocumentId"),
  signedAt: timestamp("signedAt"),
  
  // Funding
  amountCalled: decimal("amountCalled", { precision: 18, scale: 2 }).default("0.00"),
  amountFunded: decimal("amountFunded", { precision: 18, scale: 2 }).default("0.00"),
  unfundedCommitment: decimal("unfundedCommitment", { precision: 18, scale: 2 }),
  
  // Distributions
  totalDistributions: decimal("totalDistributions", { precision: 18, scale: 2 }).default("0.00"),
  returnOfCapital: decimal("returnOfCapital", { precision: 18, scale: 2 }).default("0.00"),
  profits: decimal("profits", { precision: 18, scale: 2 }).default("0.00"),
  
  // Side Letter
  hasSideLetter: boolean("hasSideLetter").default(false),
  sideLetterTerms: json("sideLetterTerms").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapitalCommitment = typeof capitalCommitments.$inferSelect;
export type InsertCapitalCommitment = typeof capitalCommitments.$inferInsert;

// ============================================================================
// CAPITAL CALLS
// ============================================================================

export const capitalCalls = mysqlTable("capital_calls", {
  id: int("id").autoincrement().primaryKey(),
  
  spvId: int("spvId").notNull(),
  
  // Call Details
  callNumber: int("callNumber").notNull(),
  callAmount: decimal("callAmount", { precision: 18, scale: 2 }).notNull(),
  callPercentage: decimal("callPercentage", { precision: 5, scale: 2 }), // % of commitment
  purpose: text("purpose"),
  
  // Status
  status: mysqlEnum("status", ["draft", "sent", "partial", "complete", "cancelled"]).default("draft"),
  
  // Dates
  noticeDate: timestamp("noticeDate"),
  dueDate: timestamp("dueDate").notNull(),
  
  // Amounts
  totalCalled: decimal("totalCalled", { precision: 18, scale: 2 }).default("0.00"),
  totalReceived: decimal("totalReceived", { precision: 18, scale: 2 }).default("0.00"),
  
  // Documents
  noticeDocumentId: int("noticeDocumentId"),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapitalCall = typeof capitalCalls.$inferSelect;
export type InsertCapitalCall = typeof capitalCalls.$inferInsert;

// ============================================================================
// CAPITAL CALL RESPONSES
// ============================================================================

export const capitalCallResponses = mysqlTable("capital_call_responses", {
  id: int("id").autoincrement().primaryKey(),
  
  capitalCallId: int("capitalCallId").notNull(),
  commitmentId: int("commitmentId").notNull(),
  lpProfileId: int("lpProfileId").notNull(),
  
  // Call Details
  amountDue: decimal("amountDue", { precision: 18, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 18, scale: 2 }).default("0.00"),
  
  // Status
  status: mysqlEnum("status", ["pending", "partial", "paid", "overdue", "defaulted"]).default("pending"),
  
  // Payment
  paidAt: timestamp("paidAt"),
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  paymentReference: varchar("paymentReference", { length: 255 }),
  
  // Confirmation
  confirmedBy: int("confirmedBy"),
  confirmedAt: timestamp("confirmedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapitalCallResponse = typeof capitalCallResponses.$inferSelect;
export type InsertCapitalCallResponse = typeof capitalCallResponses.$inferInsert;

// ============================================================================
// IMMUTABLE AUDIT LOG
// ============================================================================

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  
  // Actor
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 320 }),
  userRole: varchar("userRole", { length: 64 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Action
  action: varchar("action", { length: 128 }).notNull(),
  actionCategory: mysqlEnum("actionCategory", [
    "auth", "user", "spv", "lp", "commitment", "capital_call", "deal",
    "deal_room", "document", "compliance", "payout", "admin", "system"
  ]).notNull(),
  
  // Target
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 255 }),
  
  // Details
  previousState: json("previousState").$type<Record<string, unknown>>(),
  newState: json("newState").$type<Record<string, unknown>>(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  
  // Risk/Compliance
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("low"),
  complianceRelevant: boolean("complianceRelevant").default(false),
  requiresReview: boolean("requiresReview").default(false),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  
  // Integrity
  checksum: varchar("checksum", { length: 64 }), // SHA-256 hash for integrity
  previousLogId: bigint("previousLogId", { mode: "number" }), // Chain reference
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// COMPLIANCE CHECKLISTS
// ============================================================================

export const complianceChecklists = mysqlTable("compliance_checklists", {
  id: int("id").autoincrement().primaryKey(),
  
  // Target
  entityType: mysqlEnum("entityType", ["spv", "lp", "deal", "user"]).notNull(),
  entityId: int("entityId").notNull(),
  
  // Checklist Type
  checklistType: mysqlEnum("checklistType", [
    "kyc", "aml", "accreditation", "sanctions", "pep", "adverse_media",
    "deal_compliance", "regulatory_filing", "annual_review"
  ]).notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "in_progress", "passed", "failed", "expired"]).default("pending"),
  
  // Items
  items: json("items").$type<Array<{
    id: string;
    name: string;
    description?: string;
    status: "pending" | "passed" | "failed" | "na";
    checkedBy?: number;
    checkedAt?: string;
    notes?: string;
    documentId?: number;
  }>>(),
  
  // Results
  passedItems: int("passedItems").default(0),
  failedItems: int("failedItems").default(0),
  totalItems: int("totalItems").default(0),
  
  // Review
  assignedTo: int("assignedTo"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // Dates
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceChecklist = typeof complianceChecklists.$inferSelect;
export type InsertComplianceChecklist = typeof complianceChecklists.$inferInsert;

// ============================================================================
// WIRE INSTRUCTIONS
// ============================================================================

export const wireInstructions = mysqlTable("wire_instructions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Owner
  ownerId: int("ownerId").notNull(),
  ownerType: mysqlEnum("ownerType", ["user", "spv", "lp"]).notNull(),
  
  // Bank Details
  bankName: varchar("bankName", { length: 255 }).notNull(),
  bankAddress: text("bankAddress"),
  routingNumber: varchar("routingNumber", { length: 32 }),
  accountNumber: varchar("accountNumber", { length: 64 }),
  accountName: varchar("accountName", { length: 255 }),
  swiftCode: varchar("swiftCode", { length: 16 }),
  iban: varchar("iban", { length: 64 }),
  
  // Intermediary Bank (if needed)
  intermediaryBankName: varchar("intermediaryBankName", { length: 255 }),
  intermediarySwiftCode: varchar("intermediarySwiftCode", { length: 16 }),
  
  // Reference
  reference: varchar("reference", { length: 255 }),
  specialInstructions: text("specialInstructions"),
  
  // Status
  isVerified: boolean("isVerified").default(false),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"),
  
  isPrimary: boolean("isPrimary").default(false),
  isActive: boolean("isActive").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WireInstruction = typeof wireInstructions.$inferSelect;
export type InsertWireInstruction = typeof wireInstructions.$inferInsert;

// ============================================================================
// CAP TABLE ENTRIES
// ============================================================================

export const capTableEntries = mysqlTable("cap_table_entries", {
  id: int("id").autoincrement().primaryKey(),
  
  spvId: int("spvId").notNull(),
  holderId: int("holderId").notNull(),
  holderType: mysqlEnum("holderType", ["lp", "gp", "carry_holder", "other"]).notNull(),
  
  // Ownership
  units: decimal("units", { precision: 18, scale: 6 }),
  ownershipPercentage: decimal("ownershipPercentage", { precision: 8, scale: 5 }).notNull(),
  
  // Class
  shareClass: varchar("shareClass", { length: 64 }).default("Common"),
  votingRights: boolean("votingRights").default(true),
  
  // Value
  capitalContributed: decimal("capitalContributed", { precision: 18, scale: 2 }).default("0.00"),
  currentValue: decimal("currentValue", { precision: 18, scale: 2 }),
  
  // Dates
  issuedAt: timestamp("issuedAt").notNull(),
  vestedAt: timestamp("vestedAt"),
  
  // Status
  status: mysqlEnum("status", ["active", "transferred", "redeemed", "cancelled"]).default("active"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapTableEntry = typeof capTableEntries.$inferSelect;
export type InsertCapTableEntry = typeof capTableEntries.$inferInsert;


// ============================================================================
// COMMODITIES MARKETPLACE
// ============================================================================

export const commodityListings = mysqlTable("commodity_listings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Seller/Owner
  sellerId: int("sellerId").notNull(),
  
  // Commodity Type
  commodityType: mysqlEnum("commodityType", [
    "gold", "silver", "platinum", "palladium", "copper", "iron_ore",
    "crude_oil", "natural_gas", "lng", "refined_products",
    "wheat", "corn", "soybeans", "coffee", "sugar",
    "other_mineral", "other_commodity"
  ]).notNull(),
  
  // Gold-specific fields
  goldForm: mysqlEnum("goldForm", ["bullion", "dory", "nuggets", "sanctuary", "dust", "bar", "coin"]),
  goldPurity: decimal("goldPurity", { precision: 6, scale: 3 }), // e.g., 99.999
  goldStampAge: int("goldStampAge"), // years
  
  // Oil & Gas specific fields
  oilGrade: mysqlEnum("oilGrade", ["wti", "brent", "bonny_light", "arabian_light", "dubai", "urals", "e953", "a1", "v6"]),
  refinerySource: varchar("refinerySource", { length: 255 }),
  apiGravity: decimal("apiGravity", { precision: 5, scale: 2 }),
  sulfurContent: decimal("sulfurContent", { precision: 5, scale: 3 }),
  
  // Quantity
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  unit: mysqlEnum("unit", [
    "metric_tonnes", "troy_ounces", "kilograms", "grams",
    "barrels", "gallons", "cubic_meters", "mmbtu",
    "bushels", "pounds", "bags"
  ]).notNull(),
  quantityAvailableMonthly: decimal("quantityAvailableMonthly", { precision: 18, scale: 4 }),
  
  // Pricing
  pricePerUnit: decimal("pricePerUnit", { precision: 18, scale: 4 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }),
  pricingBasis: varchar("pricingBasis", { length: 128 }), // e.g., "LBMA Gold Price AM", "WTI Cushing"
  
  // Location & Logistics
  originCountry: varchar("originCountry", { length: 128 }),
  originRegion: varchar("originRegion", { length: 255 }),
  mineOrSource: varchar("mineOrSource", { length: 255 }),
  currentLocation: varchar("currentLocation", { length: 255 }),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }),
  incoterms: mysqlEnum("incoterms", ["exw", "fob", "cif", "cfr", "dap", "ddp", "fas", "fca"]),
  
  // Vessel/Transport (for oil & gas)
  vesselType: varchar("vesselType", { length: 128 }),
  vesselCapacity: decimal("vesselCapacity", { precision: 18, scale: 2 }),
  tankFarm: varchar("tankFarm", { length: 255 }),
  portDepth: varchar("portDepth", { length: 64 }), // deep water, shallow, etc.
  
  // Documentation
  skrNumber: varchar("skrNumber", { length: 128 }), // Safe Keeping Receipt
  skrBank: varchar("skrBank", { length: 255 }),
  skrVerified: boolean("skrVerified").default(false),
  assayReportUrl: text("assayReportUrl"),
  certificateOfOrigin: text("certificateOfOrigin"),
  
  // Compliance
  sanctionsCleared: boolean("sanctionsCleared").default(false),
  sanctionsCheckDate: timestamp("sanctionsCheckDate"),
  exportLicenseRequired: boolean("exportLicenseRequired").default(false),
  exportLicenseNumber: varchar("exportLicenseNumber", { length: 128 }),
  isConflictFree: boolean("isConflictFree").default(true),
  
  // Status
  status: mysqlEnum("status", ["draft", "active", "pending_verification", "reserved", "sold", "expired", "cancelled"]).default("draft"),
  
  // Verification
  isVerified: boolean("isVerified").default(false),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  
  // Description
  title: varchar("title", { length: 512 }),
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommodityListing = typeof commodityListings.$inferSelect;
export type InsertCommodityListing = typeof commodityListings.$inferInsert;

// ============================================================================
// REAL ESTATE PROPERTIES
// ============================================================================

export const realEstateProperties = mysqlTable("real_estate_properties", {
  id: int("id").autoincrement().primaryKey(),
  
  // Owner/Seller
  ownerId: int("ownerId").notNull(),
  
  // Basic Info
  title: varchar("title", { length: 512 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 64 }).default("USA"),
  
  // Property Type
  propertyType: mysqlEnum("propertyType", [
    "office", "retail", "industrial", "multifamily", "hotel",
    "mixed_use", "land", "single_family", "condo", "warehouse",
    "data_center", "self_storage", "medical", "senior_living"
  ]).notNull(),
  
  // Size & Specs
  totalSqFt: decimal("totalSqFt", { precision: 18, scale: 2 }),
  rentableSqFt: decimal("rentableSqFt", { precision: 18, scale: 2 }),
  lotSize: decimal("lotSize", { precision: 18, scale: 2 }),
  lotSizeUnit: mysqlEnum("lotSizeUnit", ["sqft", "acres", "sqm", "hectares"]).default("sqft"),
  floors: int("floors"),
  units: int("units"),
  parkingSpaces: int("parkingSpaces"),
  yearBuilt: int("yearBuilt"),
  yearRenovated: int("yearRenovated"),
  
  // Air Rights & Development
  hasAirRights: boolean("hasAirRights").default(false),
  airRightsSqFt: decimal("airRightsSqFt", { precision: 18, scale: 2 }),
  zoning: varchar("zoning", { length: 64 }),
  far: decimal("far", { precision: 8, scale: 4 }), // Floor Area Ratio
  developmentPotential: text("developmentPotential"),
  
  // Pricing
  askingPrice: decimal("askingPrice", { precision: 18, scale: 2 }),
  pricePerSqFt: decimal("pricePerSqFt", { precision: 12, scale: 2 }),
  purchasePrice: decimal("purchasePrice", { precision: 18, scale: 2 }), // What current owner paid
  purchaseDate: timestamp("purchaseDate"),
  
  // Income
  grossIncome: decimal("grossIncome", { precision: 18, scale: 2 }),
  netOperatingIncome: decimal("netOperatingIncome", { precision: 18, scale: 2 }),
  capRate: decimal("capRate", { precision: 6, scale: 3 }),
  occupancyRate: decimal("occupancyRate", { precision: 5, scale: 2 }),
  
  // Tenants
  totalTenants: int("totalTenants").default(0),
  occupiedUnits: int("occupiedUnits").default(0),
  vacantUnits: int("vacantUnits").default(0),
  averageRentPerSqFt: decimal("averageRentPerSqFt", { precision: 12, scale: 2 }),
  weightedAverageLeaseTerm: decimal("weightedAverageLeaseTerm", { precision: 5, scale: 2 }), // years
  
  // Tenant Details (JSON for flexibility)
  tenantRoll: json("tenantRoll").$type<Array<{
    name: string;
    unit?: string;
    sqft: number;
    rentPerSqFt: number;
    leaseStart: string;
    leaseEnd: string;
    isMonthToMonth?: boolean;
    evictionCostEstimate?: number;
  }>>(),
  
  // Comparables
  comparables: json("comparables").$type<Array<{
    address: string;
    salePrice: number;
    pricePerSqFt: number;
    saleDate: string;
    sqft: number;
  }>>(),
  
  // AI Underwriting
  aiUnderwritingScore: decimal("aiUnderwritingScore", { precision: 5, scale: 2 }),
  aiUnderwritingNotes: text("aiUnderwritingNotes"),
  aiUnderwritingCriteria: json("aiUnderwritingCriteria").$type<Record<string, unknown>>(),
  lastUnderwritingDate: timestamp("lastUnderwritingDate"),
  
  // Status
  status: mysqlEnum("status", [
    "draft", "off_market", "coming_soon", "active", "under_contract",
    "due_diligence", "pending", "sold", "withdrawn"
  ]).default("draft"),
  
  // Listing Type
  listingType: mysqlEnum("listingType", ["sale", "lease", "sale_leaseback", "joint_venture"]).default("sale"),
  isOffMarket: boolean("isOffMarket").default(true),
  
  // Media
  photos: json("photos").$type<string[]>(),
  floorPlans: json("floorPlans").$type<string[]>(),
  virtualTourUrl: text("virtualTourUrl"),
  
  // Documents
  offeringMemorandumId: int("offeringMemorandumId"),
  rentRollDocumentId: int("rentRollDocumentId"),
  financialStatementsId: int("financialStatementsId"),
  
  // Verification
  isVerified: boolean("isVerified").default(false),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RealEstateProperty = typeof realEstateProperties.$inferSelect;
export type InsertRealEstateProperty = typeof realEstateProperties.$inferInsert;

// ============================================================================
// TRANSACTION MATCHING - BUYER/SELLER CRITERIA
// ============================================================================

export const transactionCriteria = mysqlTable("transaction_criteria", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull(),
  
  // Type
  criteriaType: mysqlEnum("criteriaType", ["buy", "sell", "invest", "lend"]).notNull(),
  assetClass: mysqlEnum("assetClass", [
    "gold", "oil_gas", "minerals", "commodities",
    "real_estate", "private_equity", "venture_capital",
    "debt", "infrastructure", "other"
  ]).notNull(),
  
  // For Commodities
  commodityTypes: json("commodityTypes").$type<string[]>(),
  minPurity: decimal("minPurity", { precision: 6, scale: 3 }),
  preferredOrigins: json("preferredOrigins").$type<string[]>(),
  preferredDeliveryLocations: json("preferredDeliveryLocations").$type<string[]>(),
  preferredBanks: json("preferredBanks").$type<string[]>(),
  requiresSKR: boolean("requiresSKR").default(false),
  
  // For Real Estate
  propertyTypes: json("propertyTypes").$type<string[]>(),
  preferredMarkets: json("preferredMarkets").$type<string[]>(),
  minCapRate: decimal("minCapRate", { precision: 6, scale: 3 }),
  maxCapRate: decimal("maxCapRate", { precision: 6, scale: 3 }),
  minOccupancy: decimal("minOccupancy", { precision: 5, scale: 2 }),
  
  // Quantity/Size
  minQuantity: decimal("minQuantity", { precision: 18, scale: 4 }),
  maxQuantity: decimal("maxQuantity", { precision: 18, scale: 4 }),
  quantityUnit: varchar("quantityUnit", { length: 32 }),
  frequencyPerMonth: int("frequencyPerMonth"),
  
  // Pricing
  minPrice: decimal("minPrice", { precision: 18, scale: 4 }),
  maxPrice: decimal("maxPrice", { precision: 18, scale: 4 }),
  maxDiscountFromSpot: decimal("maxDiscountFromSpot", { precision: 5, scale: 2 }),
  
  // Verification Requirements
  requiresVerifiedSeller: boolean("requiresVerifiedSeller").default(true),
  requiresComplianceCleared: boolean("requiresComplianceCleared").default(true),
  requiresProofOfFunds: boolean("requiresProofOfFunds").default(false),
  requiresProofOfProduct: boolean("requiresProofOfProduct").default(false),
  
  // Status
  isActive: boolean("isActive").default(true),
  
  // Notes
  additionalRequirements: text("additionalRequirements"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransactionCriteria = typeof transactionCriteria.$inferSelect;
export type InsertTransactionCriteria = typeof transactionCriteria.$inferInsert;

// ============================================================================
// TRANSACTION MATCHES
// ============================================================================

export const transactionMatches = mysqlTable("transaction_matches", {
  id: int("id").autoincrement().primaryKey(),
  
  // Parties
  buyerCriteriaId: int("buyerCriteriaId").notNull(),
  sellerListingId: int("sellerListingId").notNull(),
  listingType: mysqlEnum("listingType", ["commodity", "real_estate"]).notNull(),
  
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  
  // Match Quality
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }).notNull(), // 0-100
  matchFactors: json("matchFactors").$type<Array<{
    factor: string;
    weight: number;
    score: number;
  }>>(),
  
  // Status
  status: mysqlEnum("status", [
    "pending", "buyer_interested", "seller_interested", "mutual_interest",
    "negotiating", "due_diligence", "under_contract", "completed", "declined"
  ]).default("pending"),
  
  // Negotiation
  proposedPrice: decimal("proposedPrice", { precision: 18, scale: 4 }),
  proposedQuantity: decimal("proposedQuantity", { precision: 18, scale: 4 }),
  counterOffers: json("counterOffers").$type<Array<{
    party: "buyer" | "seller";
    price: number;
    quantity: number;
    terms: string;
    timestamp: string;
  }>>(),
  
  // Deal Room
  dealRoomId: int("dealRoomId"),
  
  // Verification Status
  buyerVerified: boolean("buyerVerified").default(false),
  sellerVerified: boolean("sellerVerified").default(false),
  proofOfFundsVerified: boolean("proofOfFundsVerified").default(false),
  proofOfProductVerified: boolean("proofOfProductVerified").default(false),
  
  // Compliance
  complianceCleared: boolean("complianceCleared").default(false),
  complianceCheckId: int("complianceCheckId"),
  
  // Outcome
  finalPrice: decimal("finalPrice", { precision: 18, scale: 4 }),
  finalQuantity: decimal("finalQuantity", { precision: 18, scale: 4 }),
  closedAt: timestamp("closedAt"),
  
  // Attribution
  introducedBy: int("introducedBy"), // Broker who made the match
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransactionMatch = typeof transactionMatches.$inferSelect;
export type InsertTransactionMatch = typeof transactionMatches.$inferInsert;

// ============================================================================
// PROOF OF FUNDS / PROOF OF PRODUCT
// ============================================================================

export const verificationProofs = mysqlTable("verification_proofs", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").notNull(),
  
  // Type
  proofType: mysqlEnum("proofType", ["proof_of_funds", "proof_of_product", "skr", "bank_statement", "assay_report"]).notNull(),
  
  // For Proof of Funds
  bankName: varchar("bankName", { length: 255 }),
  accountType: varchar("accountType", { length: 64 }),
  availableFunds: decimal("availableFunds", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  // For Proof of Product
  productType: varchar("productType", { length: 128 }),
  quantity: decimal("quantity", { precision: 18, scale: 4 }),
  unit: varchar("unit", { length: 32 }),
  location: varchar("location", { length: 255 }),
  
  // Document
  documentUrl: text("documentUrl"),
  documentKey: varchar("documentKey", { length: 512 }),
  
  // Verification
  status: mysqlEnum("status", ["pending", "verified", "rejected", "expired"]).default("pending"),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  expiresAt: timestamp("expiresAt"),
  
  // Visibility
  isPublic: boolean("isPublic").default(false), // Can be shown to counterparties
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VerificationProof = typeof verificationProofs.$inferSelect;
export type InsertVerificationProof = typeof verificationProofs.$inferInsert;
