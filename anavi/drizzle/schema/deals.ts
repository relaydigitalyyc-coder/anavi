import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";
import { Relationship } from "./users";

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
  
  isFollowOn: boolean("isFollowOn").default(false),
  originalDealId: int("originalDealId"),
  
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
// PAYOUTS
// ============================================================================

export const payouts = mysqlTable("payouts", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId").notNull(),
  
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  payoutType: mysqlEnum("payoutType", [
    "originator_fee", "introducer_fee", "advisor_fee", "lifetime_attribution", "milestone_bonus", "success_fee"
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
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  paidAt: timestamp("paidAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================



















// ============================================================================
// ESCROW ACCOUNTS
// ============================================================================

export const escrowAccounts = mysqlTable("escrow_accounts", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  fundedAmount: decimal("fundedAmount", { precision: 15, scale: 2 }).default("0.00"),
  releasedAmount: decimal("releasedAmount", { precision: 15, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["unfunded", "funded", "partially_released", "released", "refunded"]).default("unfunded").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// NDA TEMPLATES
// ============================================================================

export const ndaTemplates = mysqlTable("nda_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 128 }).default("US"),
  isDefault: boolean("isDefault").default(false),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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

export type Deal = typeof deals.$inferSelect;

export type DealParticipant = typeof dealParticipants.$inferSelect;

export type DealRoom = typeof dealRooms.$inferSelect;

export type DealRoomAccess = typeof dealRoomAccess.$inferSelect;

export type Document = typeof documents.$inferSelect;

export type DocumentSignature = typeof documentSignatures.$inferSelect;

export type Payout = typeof payouts.$inferSelect;

export type EscrowAccount = typeof escrowAccounts.$inferSelect;

export type InsertEscrowAccount = typeof escrowAccounts.$inferInsert;

export type NdaTemplate = typeof ndaTemplates.$inferSelect;

export type InsertNdaTemplate = typeof ndaTemplates.$inferInsert;

export type SPV = typeof spvs.$inferSelect;

export type InsertSPV = typeof spvs.$inferInsert;

export type LPProfile = typeof lpProfiles.$inferSelect;

export type InsertLPProfile = typeof lpProfiles.$inferInsert;

export type CapitalCommitment = typeof capitalCommitments.$inferSelect;

export type InsertCapitalCommitment = typeof capitalCommitments.$inferInsert;

export type CapitalCall = typeof capitalCalls.$inferSelect;

export type InsertCapitalCall = typeof capitalCalls.$inferInsert;

export type CapitalCallResponse = typeof capitalCallResponses.$inferSelect;

export type InsertCapitalCallResponse = typeof capitalCallResponses.$inferInsert;

export type WireInstruction = typeof wireInstructions.$inferSelect;

export type InsertWireInstruction = typeof wireInstructions.$inferInsert;

export type CapTableEntry = typeof capTableEntries.$inferSelect;

export type InsertCapTableEntry = typeof capTableEntries.$inferInsert;
