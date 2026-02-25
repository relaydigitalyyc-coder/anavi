import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const verificationRouter = router({
  requestUpload: protectedProcedure
    .input(z.object({
      documentType: z.enum([
        "government_id",
        "passport",
        "business_license",
        "incorporation_docs",
        "proof_of_address",
        "bank_statement",
        "tax_document",
        "accreditation_letter",
      ]),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const key = `verification/${ctx.user.id}/${Date.now()}-${input.documentType}`;
      return { uploadUrl: `/api/upload/${key}`, key };
    }),
  confirmUpload: protectedProcedure
    .input(z.object({
      fileKey: z.string(),
      documentType: z.enum([
        "government_id",
        "passport",
        "business_license",
        "incorporation_docs",
        "proof_of_address",
        "bank_statement",
        "tax_document",
        "accreditation_letter",
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createVerificationDocument({
        userId: ctx.user.id,
        documentType: input.documentType,
        fileUrl: `/api/files/${input.fileKey}`,
        fileKey: input.fileKey,
        status: "pending",
      });
      return { id };
    }),
});
