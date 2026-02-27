import { Router } from "express";
import { getDb } from "../db";
import { complianceChecks, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const complianceWebhookRouter = Router();

// Onfido Webhook
complianceWebhookRouter.post("/onfido", async (req, res) => {
    const { resource_type, action, object } = req.body.payload;

    if (resource_type === "check" && action === "check.completed") {
        const isClear = object.result === "clear";

        // In production, map Onfido Check ID to Internal User
        const mockUserId = 1; // Assuming demo user

        const db = await getDb();
        if (!db) {
            res.status(500).send("DB not initialized");
            return;
        }
        await db.update(users)
            .set({
                kycStatus: isClear ? "approved" : "rejected",
                verificationTier: isClear ? "basic" : "none"
            })
            .where(eq(users.id, mockUserId));
    }

    res.status(200).send("OK");
});

// ComplyAdvantage Webhook
complianceWebhookRouter.post("/complyadvantage", async (req, res) => {
    const { match_status, risk_level } = req.body;

    if (match_status === "no_match" && risk_level === "low") {
        // Demo User compliance clearance
        const mockUserId = 1;
        const db = await getDb();
        if (!db) {
            res.status(500).send("DB not initialized");
            return;
        }
        await db.update(users)
            .set({
                sanctionsCleared: true,
                pepStatus: false,
                adverseMediaCleared: true
            })
            .where(eq(users.id, mockUserId));
    }

    res.status(200).send("OK");
});
