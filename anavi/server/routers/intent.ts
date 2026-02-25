import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

export const intentRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getIntentsByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      intentType: z.enum(['buy', 'sell', 'invest', 'seek_investment', 'partner']),
      title: z.string(),
      description: z.string().optional(),
      assetType: z.enum(['commodity', 'real_estate', 'equity', 'debt', 'infrastructure', 'renewable_energy', 'mining', 'oil_gas', 'business', 'other']).optional(),
      assetSubtype: z.string().optional(),
      minValue: z.string().optional(),
      maxValue: z.string().optional(),
      currency: z.string().optional(),
      targetLocations: z.array(z.string()).optional(),
      targetTimeline: z.string().optional(),
      isAnonymous: z.boolean().optional(),
      visibilityLevel: z.enum(['private', 'network', 'verified', 'public']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let keywords: string[] = [];
      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'Extract 5-10 relevant keywords from this intent for matching purposes. Return only a JSON array of strings.' },
            { role: 'user', content: `Title: ${input.title}\nDescription: ${input.description || ''}\nType: ${input.intentType}\nAsset: ${input.assetType || ''}` },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'keywords',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  keywords: { type: 'array', items: { type: 'string' } },
                },
                required: ['keywords'],
                additionalProperties: false,
              },
            },
          },
        });
        const parsed = JSON.parse((response.choices[0].message.content as string) || '{}');
        keywords = parsed.keywords || [];
      } catch (e) {
        console.error('Failed to generate keywords:', e);
      }

      const id = await db.createIntent({
        userId: ctx.user.id,
        ...input,
        keywords,
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'intent_created',
        entityType: 'intent',
        entityId: id,
        newState: input,
      });

      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['active', 'paused', 'matched', 'expired', 'cancelled']).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateIntent(id, data);
      return { success: true };
    }),

  recomputeEmbeddings: protectedProcedure
    .input(z.object({ intentIds: z.array(z.number()).optional() }))
    .mutation(async () => {
      return { success: true, embedded: 0 };
    }),

  findMatches: protectedProcedure
    .input(z.object({ intentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const intents = await db.getIntentsByUser(ctx.user.id);
      const myIntent = intents.find(i => i.id === input.intentId);
      if (!myIntent) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const otherIntents = await db.getActiveIntents(ctx.user.id);
      const matchResults: Array<{ intentId: number; score: number; reason: string }> = [];

      for (const other of otherIntents.slice(0, 10)) {
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: 'Analyze if these two intents are compatible for a deal. Return a compatibility score (0-100) and brief reason.' },
              { role: 'user', content: `Intent 1 (${myIntent.intentType}): ${myIntent.title} - ${myIntent.description || ''}\nIntent 2 (${other.intentType}): ${other.title} - ${other.description || ''}` },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'match_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    reason: { type: 'string' },
                    compatible: { type: 'boolean' },
                  },
                  required: ['score', 'reason', 'compatible'],
                  additionalProperties: false,
                },
              },
            },
          });
          const parsed = JSON.parse((response.choices[0].message.content as string) || '{}');
          if (parsed.compatible && parsed.score > 50) {
            matchResults.push({
              intentId: other.id,
              score: parsed.score,
              reason: parsed.reason,
            });
          }
        } catch (e) {
          console.error('Match analysis failed:', e);
        }
      }

      for (const match of matchResults.filter(m => m.score > 70)) {
        const other = otherIntents.find(i => i.id === match.intentId);
        if (other) {
          const matchId = await db.createMatch({
            intent1Id: myIntent.id,
            intent2Id: other.id,
            user1Id: ctx.user.id,
            user2Id: other.userId,
            compatibilityScore: match.score.toString(),
            matchReason: match.reason,
          });
          await db.notifyNewMatch(matchId, ctx.user.id, other.userId, match.reason);
        }
      }

      return { matches: matchResults };
    }),
});
