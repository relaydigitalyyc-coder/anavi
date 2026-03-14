import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const investorPresetIds = ["teaser_30s", "walkthrough_90s", "ic_5min"] as const;
const investorPresetIdSchema = z.enum(investorPresetIds);

const animationStudioSettingsSchema = z.object({
  emotionDepth: z.number().min(0).max(100),
  scenePacing: z.number().min(0).max(100),
  renderFidelity: z.number().min(0).max(100),
  rerenderThreshold: z.number().min(0).max(100),
  trustScoreFloor: z.number().min(0).max(100),
  previewMode: z.boolean(),
  overrideGate: z.boolean(),
  intentTag: z.string().min(1).max(120),
});
const renderJobIdSchema = z.object({
  jobId: z.string().min(1).max(120),
});

export const animationStudioRouter = router({
  getPlanSummary: protectedProcedure.query(async () => {
    try {
      return db.getAnimationStudioSummary();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load animation studio summary",
        cause: error,
      });
    }
  }),

  validatePlan: protectedProcedure
    .input(animationStudioSettingsSchema)
    .mutation(async ({ input }) => {
      try {
        return db.validateAnimationStudioPlan(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate animation studio plan",
          cause: error,
        });
      }
    }),

  runRender: protectedProcedure
    .input(animationStudioSettingsSchema)
    .mutation(async ({ input }) => {
      try {
        return await db.runAnimationStudioRender(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to run animation studio render",
          cause: error,
        });
      }
    }),

  queueRenderJob: protectedProcedure
    .input(
      z.object({
        settings: animationStudioSettingsSchema,
        simulateFailure: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return db.queueAnimationStudioRenderJob({
          ...input,
          userId: ctx.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue animation studio render job",
          cause: error,
        });
      }
    }),

  startRenderJob: protectedProcedure
    .input(renderJobIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await db.startAnimationStudioRenderJob(input.jobId, ctx.user.id);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Unknown render job:")
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start animation studio render job",
          cause: error,
        });
      }
    }),

  cancelRenderJob: protectedProcedure
    .input(renderJobIdSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return db.cancelAnimationStudioRenderJob(input.jobId, ctx.user.id);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Unknown render job:")
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel animation studio render job",
          cause: error,
        });
      }
    }),

  getRenderJob: protectedProcedure
    .input(renderJobIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        return db.getAnimationStudioRenderJob(input.jobId, ctx.user.id);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load animation studio render job",
          cause: error,
        });
      }
    }),

  listRenderJobs: protectedProcedure
    .input(
      z.object({ limit: z.number().min(1).max(100).optional() }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        return db.listAnimationStudioRenderJobs(ctx.user.id, input?.limit ?? 10);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list animation studio render jobs",
          cause: error,
        });
      }
    }),

  getInvestorPresets: protectedProcedure.query(async () => {
    try {
      return db.getAnimationStudioInvestorPresets();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to load investor presets",
        cause: error,
      });
    }
  }),

  applyInvestorPreset: protectedProcedure
    .input(
      z.object({
        presetId: investorPresetIdSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await db.applyAnimationStudioInvestorPreset(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to apply investor preset",
          cause: error,
        });
      }
    }),

  exportAssetPack: protectedProcedure
    .input(
      z.object({
        presetId: investorPresetIdSchema.optional(),
        settings: animationStudioSettingsSchema,
        includeNarrative: z.boolean().optional(),
        useClaude: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await db.exportAnimationStudioAssetPack(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export animation studio asset pack",
          cause: error,
        });
      }
    }),

  requestGeminiAsset: protectedProcedure
    .input(
      z.object({
        intentTag: z.string().min(1).max(120),
        trustScoreFloor: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return db.requestAnimationStudioGeminiAsset(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to request Gemini asset",
          cause: error,
        });
      }
    }),

  getPackHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ input }) => {
      try {
        const limit = input?.limit ?? 5;
        return db.getAnimationStudioPackHistory(limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load animation studio pack history",
          cause: error,
        });
      }
    }),

  publishAssetPack: protectedProcedure
    .input(
      z.object({
        packId: z.string().min(1),
        channels: z.array(z.enum(["youtube", "linkedin", "x"])).min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await db.publishAnimationStudioAssetPack(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish animation studio asset pack",
          cause: error,
        });
      }
    }),

  getArtifactDownloadPath: protectedProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const job = await db.getAnimationStudioRenderJob(input.jobId, ctx.user.id);
        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Unknown render job: ${input.jobId}`,
          });
        }
        if (job.state !== "succeeded" || !job.renderPath) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Job not ready for download (state: ${job.state})`,
          });
        }
        return {
          downloadUrl: `/api/renders/${input.jobId}/download`,
          jobId: input.jobId,
          state: job.state,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get artifact download path",
          cause: error,
        });
      }
    }),
});
