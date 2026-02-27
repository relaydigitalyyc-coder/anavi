import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";
import { Document, Deal } from "./deals";

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

export type Intent = typeof intents.$inferSelect;

export type Match = typeof matches.$inferSelect;

export type TransactionCriteria = typeof transactionCriteria.$inferSelect;

export type InsertTransactionCriteria = typeof transactionCriteria.$inferInsert;

export type TransactionMatch = typeof transactionMatches.$inferSelect;

export type InsertTransactionMatch = typeof transactionMatches.$inferInsert;

export type VerificationProof = typeof verificationProofs.$inferSelect;

export type InsertVerificationProof = typeof verificationProofs.$inferInsert;
