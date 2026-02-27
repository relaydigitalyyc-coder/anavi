import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";
import { Deal, deals } from "./deals";
import { User, Relationship } from "./users";

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

// ============================================================================
// OPERATOR INTAKES
// ============================================================================

export const operatorIntakes = mysqlTable("operator_intakes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),

  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  linkedIn: varchar("linkedIn", { length: 512 }),

  dealTitle: varchar("dealTitle", { length: 512 }).notNull(),
  assetClass: varchar("assetClass", { length: 128 }),
  geography: varchar("geography", { length: 255 }),
  targetRaise: varchar("targetRaise", { length: 64 }),
  minimumInvestment: varchar("minimumInvestment", { length: 64 }),

  investmentThesis: text("investmentThesis"),
  trackRecord: text("trackRecord"),
  skinInGame: text("skinInGame"),
  timeline: varchar("timeline", { length: 255 }),

  accreditedOnly: boolean("accreditedOnly").default(false),
  manualReview: boolean("manualReview").default(false),
  noAutomation: boolean("noAutomation").default(false),

  status: mysqlEnum("status", ["pending", "in_review", "approved", "rejected"]).default("pending"),
  reviewNotes: text("reviewNotes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// TRADING POSITIONS (GoFi Trading Platform)
// ============================================================================

export const tradingPositions = mysqlTable("trading_positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: varchar("asset", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["long", "short"]).default("long"),
  entryPrice: decimal("entryPrice", { precision: 18, scale: 4 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 18, scale: 4 }).notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull(),
  pnl: decimal("pnl", { precision: 18, scale: 2 }),
  pnlPercent: decimal("pnlPercent", { precision: 8, scale: 2 }),
  status: mysqlEnum("status", ["active", "closed"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// FEE COLLECTIONS (Fee Management)
// ============================================================================

export const feeCollections = mysqlTable("fee_collections", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  source: varchar("source", { length: 255 }),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  date: varchar("date", { length: 16 }),
  status: mysqlEnum("status", ["pending", "collected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// NETWORK MEMBERS (Member Onboarding)
// ============================================================================

export const networkMembers = mysqlTable("network_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "active"]).default("pending"),
  tier: mysqlEnum("tier", ["basic", "premium", "partner"]).default("basic"),
  industry: varchar("industry", { length: 128 }),
  allocatedCapital: decimal("allocatedCapital", { precision: 18, scale: 2 }).default("0"),
  deployedCapital: decimal("deployedCapital", { precision: 18, scale: 2 }).default("0"),
  totalReturns: decimal("totalReturns", { precision: 18, scale: 2 }).default("0"),
  returnPercent: decimal("returnPercent", { precision: 8, scale: 2 }).default("0"),
  joinDate: varchar("joinDate", { length: 16 }),
  expertise: json("expertise").$type<string[]>(),
  connections: json("connections").$type<string[]>(),
  contributionScore: int("contributionScore").default(0),
  referrals: int("referrals").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// CRYPTO ASSETS (Crypto & Stablecoin Assets)
// ============================================================================

export const cryptoAssets = mysqlTable("crypto_assets", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  balance: decimal("balance", { precision: 24, scale: 8 }).default("0"),
  value: decimal("value", { precision: 18, scale: 2 }).default("0"),
  avgCost: decimal("avgCost", { precision: 18, scale: 4 }),
  currentPrice: varchar("currentPrice", { length: 32 }),
  pnl: varchar("pnl", { length: 32 }),
  pnlValue: varchar("pnlValue", { length: 32 }),
  allocation: int("allocation"),
  type: mysqlEnum("type", ["crypto", "stablecoin", "tokenization"]).default("crypto"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyOffice = typeof familyOffices.$inferSelect;

export type InsertFamilyOffice = typeof familyOffices.$inferInsert;

export type BrokerContact = typeof brokerContacts.$inferSelect;

export type InsertBrokerContact = typeof brokerContacts.$inferInsert;

export type FamilyOfficeTarget = typeof familyOfficeTargets.$inferSelect;

export type InsertFamilyOfficeTarget = typeof familyOfficeTargets.$inferInsert;

export type TargetActivity = typeof targetActivities.$inferSelect;

export type SocialProfile = typeof socialProfiles.$inferSelect;

export type InsertSocialProfile = typeof socialProfiles.$inferInsert;

export type NewsItem = typeof newsItems.$inferSelect;

export type EnrichmentJob = typeof enrichmentJobs.$inferSelect;

export type InsertEnrichmentJob = typeof enrichmentJobs.$inferInsert;

export type CalendarConnection = typeof calendarConnections.$inferSelect;

export type InsertCalendarConnection = typeof calendarConnections.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;

export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

export type FollowUpReminder = typeof followUpReminders.$inferSelect;

export type InsertFollowUpReminder = typeof followUpReminders.$inferInsert;

export type DealAnalytics = typeof dealAnalytics.$inferSelect;

export type InsertDealAnalytics = typeof dealAnalytics.$inferInsert;

export type ConversionFunnel = typeof conversionFunnels.$inferSelect;

export type InsertConversionFunnel = typeof conversionFunnels.$inferInsert;

export type CommodityListing = typeof commodityListings.$inferSelect;

export type InsertCommodityListing = typeof commodityListings.$inferInsert;

export type RealEstateProperty = typeof realEstateProperties.$inferSelect;

export type InsertRealEstateProperty = typeof realEstateProperties.$inferInsert;

export type OperatorIntake = typeof operatorIntakes.$inferSelect;

export type InsertOperatorIntake = typeof operatorIntakes.$inferInsert;

export type TradingPosition = typeof tradingPositions.$inferSelect;

export type InsertTradingPosition = typeof tradingPositions.$inferInsert;

export type FeeCollection = typeof feeCollections.$inferSelect;

export type InsertFeeCollection = typeof feeCollections.$inferInsert;

export type NetworkMember = typeof networkMembers.$inferSelect;

export type InsertNetworkMember = typeof networkMembers.$inferInsert;

export type CryptoAsset = typeof cryptoAssets.$inferSelect;

export type InsertCryptoAsset = typeof cryptoAssets.$inferInsert;
