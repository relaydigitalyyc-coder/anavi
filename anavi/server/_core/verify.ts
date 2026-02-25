import type { Express, Request, Response } from "express";
import { getRelationshipByHash } from "../db";
import { verifyRelationshipHash } from "./hashchain";

/**
 * Registers the public (no-auth) relationship hash verification endpoint.
 */
export function registerVerificationRoutes(app: Express): void {
  app.get("/api/verify/relationship/:hash", async (req: Request, res: Response) => {
    const { hash } = req.params;

    if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
      return res.status(200).json({ valid: false });
    }

    const rel = await getRelationshipByHash(hash);
    if (!rel) {
      return res.status(200).json({ valid: false });
    }

    const isValid = verifyRelationshipHash(
      rel.timestampHash,
      rel.timestampProof ?? ""
    );

    if (!isValid) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({
      valid: true,
      establishedAt:
        rel.establishedAt instanceof Date
          ? rel.establishedAt.toISOString()
          : String(rel.establishedAt),
    });
  });
}
