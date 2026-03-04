import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "../server/_core/oauth";
import { registerVerificationRoutes } from "../server/_core/verify";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { ENV } from "../server/_core/env";

const app = express();

// Stripe webhook — raw body required before express.json parser
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const { stripe } = await import("../server/_core/stripe");
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret)
        return res.status(400).json({ error: "Webhook secret not configured" });
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Payment succeeded:", event.data.object.id);
          break;
        case "transfer.created":
          console.log("Transfer created:", event.data.object.id);
          break;
      }
      res.json({ received: true });
    } catch (err: any) {
      console.error("Webhook error:", err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }
);

// DocuSign Connect webhook
app.post(
  "/api/webhooks/docusign",
  express.raw({ type: "*/*" }),
  async (req: Request, res: Response) => {
    try {
      const { verifyDocusignConnectSignature, mapEnvelopeEventToStatus } =
        await import("../server/services/docusign");
      const {
        findWebhookEventByProviderEventId,
        getDocusignEnvelopeByProviderId,
        getDealRoomAccessByRoom,
        getUserByEmail,
        insertWebhookEvent,
        logAuditEvent,
        markWebhookEventFailed,
        markWebhookEventProcessed,
        updateDealRoomAccess,
        updateDocusignEnvelopeStatusMonotonic,
      } = await import("../server/db");

      const signature = req.headers["x-docusign-signature-1"] as
        | string
        | undefined;
      if (!verifyDocusignConnectSignature(req.body, signature)) {
        return res.status(401).json({ error: "Invalid DocuSign signature" });
      }

      const payload = JSON.parse(req.body.toString("utf8")) as Record<
        string,
        unknown
      >;
      const eventType = String(payload.event ?? payload.eventType ?? "unknown");
      const envelopeId = String(
        (payload.data as Record<string, unknown> | undefined)?.envelopeId ??
          payload.envelopeId ??
          ""
      );
      if (!envelopeId)
        return res.status(400).json({ error: "Missing envelopeId" });

      const providerEventId = String(
        payload.eventId ??
          payload.configurationId ??
          `${envelopeId}:${eventType}:${Date.now()}`
      );
      const existing = await findWebhookEventByProviderEventId(providerEventId);
      if (existing)
        return res.status(200).json({ received: true, duplicate: true });

      const inserted = await insertWebhookEvent({
        providerEventId,
        providerEnvelopeId: envelopeId,
        eventType,
        payloadJson: payload,
      });

      try {
        const envelope = await getDocusignEnvelopeByProviderId(envelopeId);
        if (envelope) {
          const status = mapEnvelopeEventToStatus(eventType);
          await updateDocusignEnvelopeStatusMonotonic({
            envelopeId: envelope.id,
            status,
          });
          if (status === "completed") {
            const accessRows = await getDealRoomAccessByRoom(
              envelope.dealRoomId
            );
            const recipientsContainer = (
              payload.data as Record<string, unknown> | undefined
            )?.recipients as Record<string, unknown> | undefined;
            const recipientsRaw = Array.isArray(recipientsContainer?.signers)
              ? (recipientsContainer?.signers as Array<Record<string, unknown>>)
              : [];
            if (recipientsRaw.length > 0) {
              for (const signer of recipientsRaw) {
                const signed =
                  String(signer.status ?? "")
                    .toLowerCase()
                    .includes("signed") ||
                  String(signer.status ?? "")
                    .toLowerCase()
                    .includes("completed");
                const email = String(signer.email ?? "");
                if (!signed || !email) continue;
                const user = await getUserByEmail(email);
                if (!user) continue;
                const hasAccess = accessRows.some(
                  row => row.userId === user.id
                );
                if (!hasAccess) continue;
                await updateDealRoomAccess(envelope.dealRoomId, user.id, {
                  ndaSigned: true,
                  ndaSignedAt: new Date(),
                });
              }
            } else {
              await Promise.all(
                accessRows.map(row =>
                  updateDealRoomAccess(envelope.dealRoomId, row.userId, {
                    ndaSigned: true,
                    ndaSignedAt: new Date(),
                  })
                )
              );
            }
          }
          await logAuditEvent({
            userId: envelope.createdByUserId,
            action: `docusign_${eventType.toLowerCase().replace(/\s+/g, "_")}`,
            entityType: "deal_room",
            entityId: envelope.dealRoomId,
            newState: {
              providerEnvelopeId: envelope.providerEnvelopeId,
              status,
            },
          });
        }
        await markWebhookEventProcessed(inserted);
        return res.status(200).json({ received: true });
      } catch (error) {
        await markWebhookEventFailed(inserted, String(error));
        throw error;
      }
    } catch (error: any) {
      console.error("DocuSign webhook error:", error?.message ?? error);
      return res
        .status(400)
        .json({ error: "DocuSign webhook processing failed" });
    }
  }
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

registerAuthRoutes(app);
registerVerificationRoutes(app);

// DocuSign OAuth
app.get(
  "/api/integrations/docusign/oauth/start",
  async (req: Request, res: Response) => {
    try {
      const ctx = await createContext({ req, res, info: {} as any });
      if (!ctx.user) return res.status(401).json({ error: "Unauthorized" });
      const { createDocusignOauthAuthorizeUrl } = await import(
        "../server/services/docusign"
      );
      const redirectUri =
        typeof req.query.redirectUri === "string"
          ? req.query.redirectUri
          : ENV.docusignOauthRedirectUri;
      const authorizeUrl = await createDocusignOauthAuthorizeUrl({
        userId: ctx.user.id,
        redirectUri: redirectUri || undefined,
      });
      return res.redirect(authorizeUrl);
    } catch (error: any) {
      console.error("DocuSign OAuth start failed:", error?.message ?? error);
      return res
        .status(400)
        .json({ error: error?.message ?? "OAuth start failed" });
    }
  }
);

app.get(
  "/api/integrations/docusign/oauth/callback",
  async (req: Request, res: Response) => {
    try {
      const ctx = await createContext({ req, res, info: {} as any });
      if (!ctx.user) return res.status(401).json({ error: "Unauthorized" });
      const { exchangeDocusignOauthCode } = await import(
        "../server/services/docusign"
      );
      const state = String(req.query.state ?? "");
      const code = String(req.query.code ?? "");
      const error = String(req.query.error ?? "");
      const returnUrl =
        typeof req.query.returnUrl === "string"
          ? req.query.returnUrl
          : "/settings?docusign=connected";
      const redirectUri =
        typeof req.query.redirectUri === "string"
          ? req.query.redirectUri
          : ENV.docusignOauthRedirectUri;
      if (error) {
        return res.redirect(
          `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}docusign_error=${encodeURIComponent(error)}`
        );
      }
      if (!state || !code)
        return res.status(400).json({ error: "Missing OAuth state/code" });
      await exchangeDocusignOauthCode({
        userId: ctx.user.id,
        state,
        code,
        redirectUri: redirectUri || undefined,
      });
      return res.redirect(
        `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}docusign=connected`
      );
    } catch (error: any) {
      console.error("DocuSign OAuth callback failed:", error?.message ?? error);
      return res
        .status(400)
        .json({ error: error?.message ?? "OAuth callback failed" });
    }
  }
);

// tRPC
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
