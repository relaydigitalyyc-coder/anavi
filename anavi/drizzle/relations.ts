import { relations } from "drizzle-orm";
import {
  users,
  verificationDocuments,
  trustScoreHistory,
  peerReviews,
  relationships,
  contactHandles,
  intents,
  matches,
  deals,
  dealParticipants,
  dealRooms,
  dealRoomAccess,
  documents,
  documentSignatures,
  complianceChecks,
  payouts,
  auditLog,
  notifications,
  familyOfficeTargets,
  targetActivities,
  socialProfiles,
  brokerContacts,
  contactInteractions,
  calendarConnections,
  calendarEvents,
  followUpReminders,
  dealAnalytics,
  realEstateProperties,
  spvs,
  capitalCommitments,
  verificationProofs,
  operatorIntakes,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  verificationDocuments: many(verificationDocuments),
  trustScoreHistory: many(trustScoreHistory),
  peerReviews: many(peerReviews),
  relationships: many(relationships),
  intents: many(intents),
  matches: many(matches),
  dealParticipants: many(dealParticipants),
  payouts: many(payouts),
  notifications: many(notifications),
  complianceChecks: many(complianceChecks),
  calendarConnections: many(calendarConnections),
  calendarEvents: many(calendarEvents),
  followUpReminders: many(followUpReminders),
}));

export const verificationDocumentsRelations = relations(verificationDocuments, ({ one }) => ({
  user: one(users, { fields: [verificationDocuments.userId], references: [users.id] }),
}));

export const trustScoreHistoryRelations = relations(trustScoreHistory, ({ one }) => ({
  user: one(users, { fields: [trustScoreHistory.userId], references: [users.id] }),
}));

export const peerReviewsRelations = relations(peerReviews, ({ one }) => ({
  reviewer: one(users, { fields: [peerReviews.userId], references: [users.id] }),
}));

export const relationshipsRelations = relations(relationships, ({ one, many }) => ({
  owner: one(users, { fields: [relationships.ownerId], references: [users.id] }),
  contactHandles: many(contactHandles),
}));

export const contactHandlesRelations = relations(contactHandles, ({ one }) => ({
  user: one(users, { fields: [contactHandles.userId], references: [users.id] }),
}));

export const intentsRelations = relations(intents, ({ one, many }) => ({
  user: one(users, { fields: [intents.userId], references: [users.id] }),
  matches: many(matches),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, { fields: [matches.userId], references: [users.id] }),
}));

export const dealsRelations = relations(deals, ({ many }) => ({
  participants: many(dealParticipants),
  dealRooms: many(dealRooms),
  payouts: many(payouts),
}));

export const dealParticipantsRelations = relations(dealParticipants, ({ one }) => ({
  deal: one(deals, { fields: [dealParticipants.dealId], references: [deals.id] }),
  user: one(users, { fields: [dealParticipants.userId], references: [users.id] }),
}));

export const dealRoomsRelations = relations(dealRooms, ({ one, many }) => ({
  deal: one(deals, { fields: [dealRooms.dealId], references: [deals.id] }),
  access: many(dealRoomAccess),
  documents: many(documents),
}));

export const dealRoomAccessRelations = relations(dealRoomAccess, ({ one }) => ({
  user: one(users, { fields: [dealRoomAccess.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ many }) => ({
  signatures: many(documentSignatures),
}));

export const documentSignaturesRelations = relations(documentSignatures, ({ one }) => ({
  user: one(users, { fields: [documentSignatures.userId], references: [users.id] }),
}));

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  user: one(users, { fields: [complianceChecks.userId], references: [users.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  deal: one(deals, { fields: [payouts.dealId], references: [deals.id] }),
  user: one(users, { fields: [payouts.userId], references: [users.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, { fields: [auditLog.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const familyOfficeTargetsRelations = relations(familyOfficeTargets, ({ one, many }) => ({
  user: one(users, { fields: [familyOfficeTargets.userId], references: [users.id] }),
  activities: many(targetActivities),
}));

export const targetActivitiesRelations = relations(targetActivities, ({ one }) => ({
  target: one(familyOfficeTargets, { fields: [targetActivities.targetId], references: [familyOfficeTargets.id] }),
  user: one(users, { fields: [targetActivities.userId], references: [users.id] }),
}));

export const brokerContactsRelations = relations(brokerContacts, ({ one, many }) => ({
  owner: one(users, { fields: [brokerContacts.ownerId], references: [users.id] }),
  interactions: many(contactInteractions),
  socialProfiles: many(socialProfiles),
}));

export const contactInteractionsRelations = relations(contactInteractions, ({ one }) => ({
  user: one(users, { fields: [contactInteractions.userId], references: [users.id] }),
}));

export const calendarConnectionsRelations = relations(calendarConnections, ({ one }) => ({
  user: one(users, { fields: [calendarConnections.userId], references: [users.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
}));

export const followUpRemindersRelations = relations(followUpReminders, ({ one }) => ({
  user: one(users, { fields: [followUpReminders.userId], references: [users.id] }),
}));

export const dealAnalyticsRelations = relations(dealAnalytics, ({ one }) => ({
  user: one(users, { fields: [dealAnalytics.userId], references: [users.id] }),
}));

export const realEstatePropertiesRelations = relations(realEstateProperties, ({ one }) => ({
  owner: one(users, { fields: [realEstateProperties.ownerId], references: [users.id] }),
}));

export const spvsRelations = relations(spvs, ({ one, many }) => ({
  owner: one(users, { fields: [spvs.ownerId], references: [users.id] }),
  commitments: many(capitalCommitments),
}));

export const capitalCommitmentsRelations = relations(capitalCommitments, ({ one }) => ({
  user: one(users, { fields: [capitalCommitments.userId], references: [users.id] }),
}));

export const verificationProofsRelations = relations(verificationProofs, ({ one }) => ({
  user: one(users, { fields: [verificationProofs.userId], references: [users.id] }),
}));

export const operatorIntakesRelations = relations(operatorIntakes, ({ one }) => ({
  user: one(users, { fields: [operatorIntakes.userId], references: [users.id] }),
}));
