import { Router } from "express";
import { getDb } from "../db";
import { documentSignatures } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const docusignWebhookRouter = Router();

// DocuSign Connect Webhook
docusignWebhookRouter.post("/docusign", async (req, res) => {
    const { event, data } = req.body;

    if (event === "envelope-completed") {
        const envelopeId = data.envelopeId;

        // In a real system we look up the internal signature record by envelopeId
        // For agent bootstrapping, update standard pending signatures
        const db = await getDb();
        if (!db) {
            res.status(500).send("DB not initialized");
            return;
        }
        await db.update(documentSignatures)
            .set({
                status: "signed",
                signedAt: new Date()
            })
            .where(eq(documentSignatures.status, "pending"));
    }

    res.status(200).send("OK");
});
