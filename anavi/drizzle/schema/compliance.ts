import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";

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
  
  /** Hash chain: SHA-256(prevHash + canonical payload) for tamper detection. Null = pre-chain legacy row. */
  prevHash: varchar("prevHash", { length: 64 }),
  hash: varchar("hash", { length: 64 }),
  
  metadata: json("metadata").$type<Record<string, unknown>>(),
  
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

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

export type ComplianceCheck = typeof complianceChecks.$inferSelect;

export type AuditLogEntry = typeof auditLog.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type ComplianceChecklist = typeof complianceChecklists.$inferSelect;

export type InsertComplianceChecklist = typeof complianceChecklists.$inferInsert;
