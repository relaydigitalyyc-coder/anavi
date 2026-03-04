import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { registerVerificationRoutes } from "./verify";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sql } from "drizzle-orm";
import {
  findWebhookEventByProviderEventId,
  getDb,
  getDealRoomAccessByRoom,
  getDocusignEnvelopeByProviderId,
  getUserByEmail,
  insertWebhookEvent,
  logAuditEvent,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  seedDefaultNdaTemplate,
  updateDealRoomAccess,
  updateDocusignEnvelopeStatusMonotonic,
} from "../db";
import {
  createDocusignOauthAuthorizeUrl,
  exchangeDocusignOauthCode,
  mapEnvelopeEventToStatus,
  verifyDocusignConnectSignature,
} from "../services/docusign";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook - raw body required before express.json parser
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const { stripe } = await import("./stripe");
        const sig = req.headers["stripe-signature"] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          return res
            .status(400)
            .json({ error: "Webhook secret not configured" });
        }
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          webhookSecret
        );

        switch (event.type) {
          case "payment_intent.succeeded": {
            console.log("Payment succeeded:", event.data.object.id);
            break;
          }
          case "transfer.created": {
            console.log("Transfer created:", event.data.object.id);
            break;
          }
        }

        res.json({ received: true });
      } catch (err: any) {
        console.error("Webhook error:", err.message);
        res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }
    }
  );
  // DocuSign Connect webhook - raw body for signature verification
  app.post(
    "/api/webhooks/docusign",
    express.raw({ type: "*/*" }),
    async (req, res) => {
      try {
        const signature = req.headers["x-docusign-signature-1"] as
          | string
          | undefined;
        const isValid = verifyDocusignConnectSignature(req.body, signature);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid DocuSign signature" });
        }

        const payload = JSON.parse(req.body.toString("utf8")) as Record<
          string,
          unknown
        >;
        const eventType = String(
          payload.event ?? payload.eventType ?? "unknown"
        );
        const envelopeId = String(
          (payload.data as Record<string, unknown> | undefined)?.envelopeId ??
            payload.envelopeId ??
            ""
        );
        if (!envelopeId) {
          return res.status(400).json({ error: "Missing envelopeId" });
        }

        const providerEventId = String(
          payload.eventId ??
            payload.configurationId ??
            `${envelopeId}:${eventType}:${Date.now()}`
        );

        const existing =
          await findWebhookEventByProviderEventId(providerEventId);
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
                ? (recipientsContainer?.signers as Array<
                    Record<string, unknown>
                  >)
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
                // Fallback path when recipient details are unavailable in webhook payload.
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

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // F21: Health check
  app.get("/health", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(503).json({ status: "degraded", db: "unavailable" });
      }
      await db.execute(sql`SELECT 1`);
      return res.status(200).json({ status: "ok", db: "ok" });
    } catch {
      return res.status(503).json({ status: "error", db: "error" });
    }
  });

  // Email/password auth routes
  registerAuthRoutes(app);
  registerVerificationRoutes(app);
  app.get("/api/integrations/docusign/oauth/start", async (req, res) => {
    try {
      const ctx = await createContext({ req, res, info: {} as any });
      if (!ctx.user) return res.status(401).json({ error: "Unauthorized" });
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
  });
  app.get("/api/integrations/docusign/oauth/callback", async (req, res) => {
    try {
      const ctx = await createContext({ req, res, info: {} as any });
      if (!ctx.user) return res.status(401).json({ error: "Unauthorized" });

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
      if (!state || !code) {
        return res.status(400).json({ error: "Missing OAuth state/code" });
      }
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
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  seedDefaultNdaTemplate().catch(err =>
    console.warn("NDA template seed skipped:", err?.message ?? err)
  );

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
