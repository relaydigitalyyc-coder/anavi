import { Router } from "express";
import { getDb } from "../db";
import { escrowAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const stripeWebhookRouter = Router();

// Stripe Connect Webhook
stripeWebhookRouter.post("/stripe", async (req, res) => {
    const { type, data } = req.body;

    if (type === "payment_intent.succeeded") {
        // In production, map PI ID to Escrow Account Record
        const mockEscrowId = 1;

        const db = await getDb();
        if (!db) {
            res.status(500).send("DB not initialized");
            return;
        }
        await db.update(escrowAccounts)
            .set({
                status: "funded"
            })
            .where(eq(escrowAccounts.id, mockEscrowId));

        console.log(`[Stripe Webhook] Escrow account ${mockEscrowId} funded successfully.`);
    }

    res.status(200).send({ received: true });
});
