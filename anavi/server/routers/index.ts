import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { verificationRouter } from "./verification";
import { relationshipRouter } from "./relationship";
import { contactRouter } from "./contact";
import { intentRouter } from "./intent";
import { matchRouter } from "./match";
import { dealRouter } from "./deal";
import { dealRoomRouter } from "./dealRoom";
import { complianceRouter } from "./compliance";
import { payoutRouter } from "./payout";
import { notificationRouter } from "./notification";
import { auditRouter } from "./audit";
import { lpPortalRouter } from "./lpPortal";
import { searchRouter } from "./search";
import { intelligenceRouter } from "./intelligence";
import { realEstateRouter } from "./realEstate";
import { aiRouter, familyOfficeRouter, targetingRouter, brokerContactRouter, enrichmentRouter, calendarRouter, analyticsRouter } from "./_legacy";

export const appRouter = router({
  system: systemRouter,
  search: searchRouter,
  intelligence: intelligenceRouter,
  realEstate: realEstateRouter,
  auth: authRouter,
  user: userRouter,
  verification: verificationRouter,
  relationship: relationshipRouter,
  contact: contactRouter,
  intent: intentRouter,
  match: matchRouter,
  deal: dealRouter,
  dealRoom: dealRoomRouter,
  compliance: complianceRouter,
  payout: payoutRouter,
  notification: notificationRouter,
  audit: auditRouter,
  ai: aiRouter,
  lpPortal: lpPortalRouter,
  familyOffice: familyOfficeRouter,
  targeting: targetingRouter,
  brokerContact: brokerContactRouter,
  enrichment: enrichmentRouter,
  calendar: calendarRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
