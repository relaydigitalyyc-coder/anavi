import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth";
import { adminRouter } from "./admin";
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
import { aiRouter } from "./ai";
import { familyOfficeRouter } from "./familyOffice";
import { targetingRouter } from "./targeting";
import { brokerContactRouter } from "./brokerContact";
import { enrichmentRouter } from "./enrichment";
import { calendarRouter } from "./calendar";
import { analyticsRouter } from "./analytics";
import { ndaTemplatesRouter } from "./ndaTemplates";
import { escrowRouter } from "./escrow";
import { operatorIntakeRouter } from "./operatorIntake";
import { commodityRouter } from "./commodity";
import { transactionMatchRouter } from "./transactionMatch";
import { knowledgeGraphRouter } from "./knowledgeGraph";
import { stubsRouter } from "./stubs";
import { spvRouter } from "./spv";
import { capitalRouter } from "./capital";
import { tradingRouter } from "./trading";
import { feesRouter } from "./fees";
import { membersRouter } from "./members";
import { cryptoRouter } from "./crypto";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
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
  ndaTemplates: ndaTemplatesRouter,
  escrow: escrowRouter,
  operatorIntake: operatorIntakeRouter,
  commodity: commodityRouter,
  transactionMatch: transactionMatchRouter,
  knowledgeGraph: knowledgeGraphRouter,
  stubs: stubsRouter,
  spv: spvRouter,
  capital: capitalRouter,
  trading: tradingRouter,
  fees: feesRouter,
  members: membersRouter,
  crypto: cryptoRouter,
});

export type AppRouter = typeof appRouter;
