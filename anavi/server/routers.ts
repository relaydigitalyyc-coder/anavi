import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { generateDealFlowResponse, analyzeDeal as claudeAnalyzeDeal, generateIntroductionRecommendations, type ChatMessage, type ChatContext } from "./claude";

// ============================================================================
// AUTH ROUTER
// ============================================================================

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ============================================================================
// USER ROUTER
// ============================================================================

const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserById(ctx.user.id);
  }),
  
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      bio: z.string().optional(),
      website: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'profile_updated',
        entityType: 'user',
        entityId: ctx.user.id,
        newState: input,
      });
      return { success: true };
    }),
  
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    return db.getDashboardStats(ctx.user.id);
  }),
  
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return db.getDashboardStats(ctx.user.id);
  }),
  
  getVerificationDocuments: protectedProcedure.query(async ({ ctx }) => {
    return db.getVerificationDocuments(ctx.user.id);
  }),
  
  getPeerReviews: protectedProcedure.query(async ({ ctx }) => {
    return db.getPeerReviews(ctx.user.id);
  }),
});

// ============================================================================
// RELATIONSHIP ROUTER
// ============================================================================

const relationshipRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getRelationshipsByOwner(ctx.user.id);
  }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return rel;
    }),
  
  create: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      relationshipType: z.enum(['direct', 'introduction', 'referral', 'network', 'professional', 'personal']).optional(),
      introducedBy: z.number().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createRelationship({
        ownerId: ctx.user.id,
        ...input,
      });
      
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'relationship_created',
        entityType: 'relationship',
        entityId: result.id,
        newState: { ...input, timestampHash: result.timestampHash },
      });
      
      return result;
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      strength: z.enum(['weak', 'moderate', 'strong', 'very_strong']).optional(),
      exposureLevel: z.enum(['hidden', 'partial', 'full']).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const { id, ...data } = input;
      await db.updateRelationship(id, data);
      
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'relationship_updated',
        entityType: 'relationship',
        entityId: id,
        previousState: rel,
        newState: data,
      });
      
      return { success: true };
    }),
  
  getNetwork: protectedProcedure.query(async ({ ctx }) => {
    return db.getRelationshipNetwork(ctx.user.id);
  }),
  
  grantConsent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      await db.updateRelationship(input.id, {
        consentGiven: true,
        consentGivenAt: new Date(),
        exposureLevel: 'full',
        isBlind: false,
      });
      
      return { success: true };
    }),
});

// ============================================================================
// CONTACT HANDLES ROUTER
// ============================================================================

const contactRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getContactHandles(ctx.user.id);
  }),
  
  add: protectedProcedure
    .input(z.object({
      platform: z.enum(['email', 'phone', 'telegram', 'discord', 'whatsapp', 'slack', 'linkedin', 'twitter', 'signal', 'wechat', 'other']),
      handle: z.string(),
      displayName: z.string().optional(),
      isPrimary: z.boolean().optional(),
      groupChatLink: z.string().optional(),
      groupChatName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.addContactHandle({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),
  
  getByRelationship: protectedProcedure
    .input(z.object({ relationshipId: z.number() }))
    .query(async ({ input }) => {
      return db.getContactHandles(undefined, input.relationshipId);
    }),
});

// ============================================================================
// INTENT ROUTER
// ============================================================================

const intentRouter = router({
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
      // Generate keywords using AI
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
  
  findMatches: protectedProcedure
    .input(z.object({ intentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const intents = await db.getIntentsByUser(ctx.user.id);
      const myIntent = intents.find(i => i.id === input.intentId);
      if (!myIntent) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const otherIntents = await db.getActiveIntents(ctx.user.id);
      
      // Use AI to find compatible matches
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
      
      // Create match records for high-scoring matches
      for (const match of matchResults.filter(m => m.score > 70)) {
        const other = otherIntents.find(i => i.id === match.intentId);
        if (other) {
          await db.createMatch({
            intent1Id: myIntent.id,
            intent2Id: other.id,
            user1Id: ctx.user.id,
            user2Id: other.userId,
            compatibilityScore: match.score.toString(),
            matchReason: match.reason,
          });
        }
      }
      
      return { matches: matchResults };
    }),
});

// ============================================================================
// MATCH ROUTER
// ============================================================================

const matchRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getMatchesByUser(ctx.user.id);
  }),
  
  expressInterest: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const isUser1 = match.user1Id === ctx.user.id;
      const updateData = isUser1 
        ? { user1Consent: true, user1ConsentAt: new Date() }
        : { user2Consent: true, user2ConsentAt: new Date() };
      
      // Check if mutual interest
      const otherConsent = isUser1 ? match.user2Consent : match.user1Consent;
      if (otherConsent) {
        Object.assign(updateData, { status: 'mutual_interest' as const });
      } else {
        Object.assign(updateData, { status: isUser1 ? 'user1_interested' as const : 'user2_interested' as const });
      }
      
      await db.updateMatch(input.matchId, updateData);
      
      // Notify other user
      const otherUserId = isUser1 ? match.user2Id : match.user1Id;
      await db.createNotification({
        userId: otherUserId,
        type: 'match_found',
        title: 'New Match Interest',
        message: 'Someone has expressed interest in your intent match.',
        relatedEntityType: 'match',
        relatedEntityId: input.matchId,
      });
      
      return { success: true, mutualInterest: otherConsent };
    }),
  
  decline: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await db.updateMatch(input.matchId, { status: 'declined' as const });
      return { success: true };
    }),

  createDealRoom: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match || match.status !== 'mutual_interest') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Mutual interest required' });
      }
      
      const dealRoomId = await db.createDealRoom({
        matchId: input.matchId,
        name: `Deal Room - Match #${input.matchId}`,
        createdBy: ctx.user.id,
        settings: {
          allowDownloads: false,
          watermarkDocuments: true,
          requireNda: true,
          autoExpireAccess: true,
          expiryDays: 30,
        },
      });
      
      // Grant access to both users
      await db.grantDealRoomAccess({ dealRoomId, userId: match.user1Id, accessLevel: 'edit' });
      await db.grantDealRoomAccess({ dealRoomId, userId: match.user2Id, accessLevel: 'edit' });
      
      await db.updateMatch(input.matchId, { dealRoomId, status: 'deal_room_created' });
      
      return { dealRoomId };
    }),
});

// ============================================================================
// DEAL ROUTER
// ============================================================================

const dealRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getDealsByUser(ctx.user.id);
  }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.id);
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const participants = await db.getDealParticipants(input.id);
      const isParticipant = participants.some(p => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: 'FORBIDDEN' });
      
      return { deal, participants };
    }),
  
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      dealType: z.enum(['commodity_trade', 'real_estate', 'equity_investment', 'debt_financing', 'joint_venture', 'acquisition', 'partnership', 'other']),
      dealValue: z.string().optional(),
      currency: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dealId = await db.createDeal({
        ...input,
        originatorId: ctx.user.id,
        milestones: [
          { id: '1', name: 'Initial Contact', status: 'completed', completedAt: new Date().toISOString() },
          { id: '2', name: 'NDA Signed', status: 'pending', payoutTrigger: false },
          { id: '3', name: 'Due Diligence', status: 'pending', payoutTrigger: false },
          { id: '4', name: 'Term Sheet', status: 'pending', payoutTrigger: true },
          { id: '5', name: 'Documentation', status: 'pending', payoutTrigger: false },
          { id: '6', name: 'Closing', status: 'pending', payoutTrigger: true },
        ],
      });
      
      // Add creator as originator
      await db.addDealParticipant({
        dealId,
        userId: ctx.user.id,
        role: 'originator',
        attributionPercentage: '50.00',
      });
      
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'deal_created',
        entityType: 'deal',
        entityId: dealId,
        newState: input,
      });
      
      return { id: dealId };
    }),
  
  updateStage: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: z.enum(['lead', 'qualification', 'due_diligence', 'negotiation', 'documentation', 'closing', 'completed', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.id);
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });
      
      await db.updateDeal(input.id, { stage: input.stage });
      
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'deal_stage_updated',
        entityType: 'deal',
        entityId: input.id,
        previousState: { stage: deal.stage },
        newState: { stage: input.stage },
      });
      
      // Notify participants
      const participants = await db.getDealParticipants(input.id);
      for (const p of participants) {
        if (p.userId !== ctx.user.id) {
          await db.createNotification({
            userId: p.userId,
            type: 'deal_update',
            title: 'Deal Stage Updated',
            message: `Deal "${deal.title}" moved to ${input.stage}`,
            relatedEntityType: 'deal',
            relatedEntityId: input.id,
          });
        }
      }
      
      return { success: true };
    }),
  
  addParticipant: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      userId: z.number(),
      role: z.enum(['originator', 'buyer', 'seller', 'introducer', 'advisor', 'legal', 'escrow', 'observer']),
      attributionPercentage: z.string().optional(),
      introducedBy: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.addDealParticipant(input);
      return { id };
    }),
  
  getParticipants: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getDealParticipants(input.dealId);
    }),
});

// ============================================================================
// DEAL ROOM ROUTER
// ============================================================================

const dealRoomRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getDealRoomsByUser(ctx.user.id);
  }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const room = await db.getDealRoomById(input.id);
      if (!room) throw new TRPCError({ code: 'NOT_FOUND' });
      return room;
    }),
  
  getDocuments: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ input }) => {
      return db.getDocumentsByDealRoom(input.dealRoomId);
    }),
});

// ============================================================================
// COMPLIANCE ROUTER
// ============================================================================

const complianceRouter = router({
  getChecks: protectedProcedure
    .input(z.object({
      entityType: z.enum(['user', 'deal', 'relationship']),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getComplianceChecks(input.entityType, input.entityId);
    }),
  
  runCheck: protectedProcedure
    .input(z.object({
      entityType: z.enum(['user', 'deal', 'relationship']),
      entityId: z.number(),
      checkType: z.enum(['sanctions', 'pep', 'adverse_media', 'aml', 'kyc', 'kyb', 'jurisdiction']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Simulate compliance check (in production, integrate with real providers)
      const id = await db.createComplianceCheck({
        ...input,
        status: 'pending',
        provider: 'internal',
      });
      
      // Simulate async check completion
      setTimeout(async () => {
        await db.updateComplianceCheck(id, {
          status: 'passed',
          riskLevel: 'low',
          findings: [],
        });
      }, 2000);
      
      return { id, status: 'pending' };
    }),
});

// ============================================================================
// PAYOUT ROUTER
// ============================================================================

const payoutRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPayoutsByUser(ctx.user.id);
  }),
  
  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getPayoutsByDeal(input.dealId);
    }),
});

// ============================================================================
// NOTIFICATION ROUTER
// ============================================================================

const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({ 
      unreadOnly: z.boolean().optional(),
      limit: z.number().optional()
    }).optional())
    .query(async ({ ctx, input }) => {
      const notifications = await db.getNotificationsByUser(ctx.user.id, input?.unreadOnly);
      if (input?.limit) {
        return notifications.slice(0, input.limit);
      }
      return notifications;
    }),
  
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),
  
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUser(ctx.user.id, true);
    for (const n of notifications) {
      await db.markNotificationRead(n.id);
    }
    return { success: true };
  }),
});

// ============================================================================
// AUDIT ROUTER
// ============================================================================

const auditRouter = router({
  list: protectedProcedure
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getAuditLog(input?.entityType, input?.entityId, input?.limit);
    }),
});

// ============================================================================
// AI ASSISTANT ROUTER
// ============================================================================

const aiRouter = router({
  analyzeDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a senior deal analyst at a top-tier investment bank. Analyze this deal comprehensively and provide: 1) Key risks and red flags, 2) Strategic opportunities, 3) Recommended next steps, 4) Comparable transactions, 5) Valuation considerations. Be specific and actionable.' },
          { role: 'user', content: `Deal: ${deal.title}\nType: ${deal.dealType}\nValue: ${deal.dealValue} ${deal.currency}\nStage: ${deal.stage}\nDescription: ${deal.description || 'N/A'}` },
        ],
      });
      
      return { analysis: response.choices[0].message.content as string };
    }),
  
  suggestConnections: protectedProcedure.mutation(async ({ ctx }) => {
    const relationships = await db.getRelationshipsByOwner(ctx.user.id);
    const intents = await db.getIntentsByUser(ctx.user.id);
    
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a relationship intelligence expert. Based on the user\'s network and active intents, suggest specific high-value introductions that could lead to deals. Consider industry alignment, deal stage compatibility, and relationship strength.' },
        { role: 'user', content: `Relationships: ${relationships.length}\nActive Intents: ${intents.filter(i => i.status === 'active').map(i => `${i.intentType}: ${i.title}`).join(', ')}` },
      ],
    });
    
    return { suggestions: response.choices[0].message.content as string };
  }),
  
  dueDiligence: protectedProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a due diligence expert with deep knowledge of private markets. Provide comprehensive due diligence insights including: 1) Background check considerations, 2) Financial red flags to investigate, 3) Reputation and media analysis points, 4) Regulatory and compliance concerns, 5) Recommended verification steps.' },
          { role: 'user', content: input.query },
        ],
      });
      
      return { result: response.choices[0].message.content as string };
    }),

  // Advanced semantic matching for intents
  semanticMatch: protectedProcedure
    .input(z.object({
      intentId: z.number(),
      maxResults: z.number().optional().default(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const intents = await db.getIntentsByUser(ctx.user.id);
      const myIntent = intents.find(i => i.id === input.intentId);
      if (!myIntent) throw new TRPCError({ code: 'NOT_FOUND' });

      const otherIntents = await db.getActiveIntents(ctx.user.id);
      
      // Use LLM for semantic matching with detailed analysis
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an expert deal matcher for private markets. Analyze the compatibility between the user's intent and potential matches. Consider: deal type alignment, value range compatibility, industry fit, timing, and strategic synergies. Return a JSON array of matches sorted by compatibility.` },
          { role: 'user', content: JSON.stringify({
            myIntent: { type: myIntent.intentType, title: myIntent.title, description: myIntent.description, minValue: myIntent.minValue, maxValue: myIntent.maxValue },
            candidates: otherIntents.slice(0, 20).map(i => ({ id: i.id, type: i.intentType, title: i.title, description: i.description }))
          }) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'semantic_matches',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                matches: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      intentId: { type: 'number' },
                      score: { type: 'number' },
                      reason: { type: 'string' },
                      synergies: { type: 'string' },
                      risks: { type: 'string' },
                    },
                    required: ['intentId', 'score', 'reason', 'synergies', 'risks'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['matches'],
              additionalProperties: false,
            },
          },
        },
      });

      const parsed = JSON.parse((response.choices[0].message.content as string) || '{"matches":[]}');
      return { matches: parsed.matches.slice(0, input.maxResults) };
    }),

  // Analyze family office fit
  analyzeFamilyOfficeFit: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      intentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const familyOffice = await db.getFamilyOfficeById(input.familyOfficeId);
      const intents = await db.getIntentsByUser(ctx.user.id);
      const intent = intents.find(i => i.id === input.intentId);
      
      if (!familyOffice || !intent) throw new TRPCError({ code: 'NOT_FOUND' });

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a family office relationship expert. Analyze the fit between this family office and the user\'s intent. Consider investment focus alignment, AUM appropriateness, geographic fit, and historical investment patterns. Provide specific talking points for outreach.' },
          { role: 'user', content: JSON.stringify({
            familyOffice: { name: familyOffice.name, aum: familyOffice.aum, investmentFocus: familyOffice.investmentFocus, headquarters: familyOffice.headquarters },
            intent: { type: intent.intentType, title: intent.title, description: intent.description, minValue: intent.minValue, maxValue: intent.maxValue }
          }) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'family_office_fit',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                fitScore: { type: 'number' },
                alignment: { type: 'string' },
                talkingPoints: { type: 'array', items: { type: 'string' } },
                concerns: { type: 'array', items: { type: 'string' } },
                recommendedApproach: { type: 'string' },
              },
              required: ['fitScore', 'alignment', 'talkingPoints', 'concerns', 'recommendedApproach'],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse((response.choices[0].message.content as string) || '{}');
    }),

  // Generate outreach message
  generateOutreach: protectedProcedure
    .input(z.object({
      targetName: z.string(),
      targetCompany: z.string().optional(),
      context: z.string(),
      tone: z.enum(['formal', 'casual', 'warm']).optional().default('formal'),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an expert at crafting high-converting outreach messages for private market professionals. Write a ${input.tone} message that is concise, personalized, and creates genuine interest without being salesy. Focus on mutual value creation.` },
          { role: 'user', content: `Target: ${input.targetName}${input.targetCompany ? ` at ${input.targetCompany}` : ''}
Context: ${input.context}` },
        ],
      });

      return { message: response.choices[0].message.content as string };
    }),

  // Claude AI Deal Flow Partner Chat
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Gather context from user's data
      const [deals, relationships, familyOffices] = await Promise.all([
        db.getDealsByUser(ctx.user.id),
        db.getRelationshipsByOwner(ctx.user.id),
        db.getFamilyOffices({ limit: 10 }),
      ]);

      const context: ChatContext = {
        userName: ctx.user.name || 'User',
        activeDeals: deals.slice(0, 10).map(d => ({
          name: d.title,
          status: d.stage || 'unknown',
          value: d.dealValue ? `${d.currency || '$'}${d.dealValue}` : undefined,
        })),
        relationships: relationships.slice(0, 15).map(r => ({
          name: `Contact ${r.contactId}`,
          company: undefined,
          strength: r.strength || undefined,
        })),
        familyOffices: familyOffices.data.slice(0, 5).map((fo) => ({
          name: fo.name,
          aum: fo.aum ? `$${fo.aum.toLocaleString()}` : undefined,
          focus: fo.investmentFocus ? fo.investmentFocus.join(', ') : undefined,
        })),
      };

      const response = await generateDealFlowResponse(
        input.messages as ChatMessage[],
        context
      );

      return { response };
    }),

  // Claude AI Deal Analysis
  claudeAnalyzeDeal: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      value: z.string().optional(),
      stage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return claudeAnalyzeDeal(input);
    }),

  // Claude AI Introduction Recommendations
  recommendIntroduction: protectedProcedure
    .input(z.object({
      sourceName: z.string(),
      sourceCompany: z.string().optional(),
      sourceExpertise: z.string().optional(),
      targetName: z.string(),
      targetCompany: z.string().optional(),
      targetNeeds: z.string().optional(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return generateIntroductionRecommendations(
        { name: input.sourceName, company: input.sourceCompany, expertise: input.sourceExpertise },
        { name: input.targetName, company: input.targetCompany, needs: input.targetNeeds },
        input.context
      );
    }),

  // Claude AI Market Intelligence - Natural Language Query (Legacy)
  marketQuery: publicProcedure
    .input(z.object({
      query: z.string(),
      context: z.object({
        deals: z.array(z.any()).optional(),
        relationships: z.array(z.any()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are NAVI - the Deal Flow Partner AI for a private market operating system.

Your role is to:
1. Analyze deals, relationships, and market opportunities
2. Provide risk assessments and due diligence insights
3. Identify patterns in deal flow and network connections
4. Generate actionable recommendations for capital deployment
5. Track market sentiment across commodities, real estate, crypto, and private equity

Always be precise, data-driven, and focused on actionable insights.` },
          { role: 'user', content: input.query },
        ],
      });

      return { response: response.choices[0].message.content as string };
    }),

  // Market Sector Intelligence
  sectorIntelligence: publicProcedure
    .input(z.object({
      sector: z.enum(['healthcare', 'fintech', 'real_estate', 'commodities', 'crypto', 'infrastructure', 'ai_saas']),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a market intelligence expert. Provide comprehensive sector analysis.' },
          { role: 'user', content: `Provide current market intelligence for the ${input.sector} sector including: 1) Overall sentiment (bullish/bearish/neutral), 2) Key trends and insights, 3) Trending deal types, 4) Risk factors, 5) Investment thesis. Format as JSON.` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sector_intelligence',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                sector: { type: 'string' },
                sentiment: { type: 'string' },
                keyInsights: { type: 'array', items: { type: 'string' } },
                trendingDeals: { type: 'array', items: { type: 'string' } },
                riskFactors: { type: 'array', items: { type: 'string' } },
                investmentThesis: { type: 'string' },
              },
              required: ['sector', 'sentiment', 'keyInsights', 'trendingDeals', 'riskFactors', 'investmentThesis'],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse((response.choices[0].message.content as string) || '{}');
    }),

  // Risk Assessment
  assessRisk: publicProcedure
    .input(z.object({
      type: z.string(),
      description: z.string(),
      amount: z.string().optional(),
      parties: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a risk assessment expert for private markets. Provide comprehensive risk analysis.' },
          { role: 'user', content: `Assess risk for: Type: ${input.type}, Description: ${input.description}, Amount: ${input.amount || 'N/A'}, Parties: ${input.parties?.join(', ') || 'N/A'}. Return JSON with riskScore (0-100), riskLevel (low/medium/high/critical), factors array, and recommendation.` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'risk_assessment',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                riskScore: { type: 'number' },
                riskLevel: { type: 'string' },
                factors: { type: 'array', items: { type: 'object', properties: { factor: { type: 'string' }, impact: { type: 'string' }, mitigation: { type: 'string' } }, required: ['factor', 'impact', 'mitigation'], additionalProperties: false } },
                recommendation: { type: 'string' },
              },
              required: ['riskScore', 'riskLevel', 'factors', 'recommendation'],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse((response.choices[0].message.content as string) || '{}');
    }),

  // Portfolio Recommendations
  portfolioRecommendations: publicProcedure
    .input(z.object({
      currentDeals: z.array(z.string()),
      sectors: z.array(z.string()),
      riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
      capitalAvailable: z.string(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a portfolio strategist for private markets. Generate investment recommendations.' },
          { role: 'user', content: `Generate recommendations for: Current Deals: ${input.currentDeals.join(', ')}, Sectors: ${input.sectors.join(', ')}, Risk Tolerance: ${input.riskTolerance}, Capital: ${input.capitalAvailable}. Return JSON with recommendations array, portfolioInsights, and diversificationSuggestions.` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'portfolio_recommendations',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                recommendations: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, rationale: { type: 'string' }, expectedReturn: { type: 'string' }, risk: { type: 'string' } }, required: ['type', 'rationale', 'expectedReturn', 'risk'], additionalProperties: false } },
                portfolioInsights: { type: 'array', items: { type: 'string' } },
                diversificationSuggestions: { type: 'array', items: { type: 'string' } },
              },
              required: ['recommendations', 'portfolioInsights', 'diversificationSuggestions'],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse((response.choices[0].message.content as string) || '{}');
    }),
});;

// ============================================================================
// FAMILY OFFICE ROUTER
// ============================================================================

const familyOfficeRouter = router({
  list: publicProcedure
    .input(z.object({
      type: z.string().optional(),
      aumRange: z.string().optional(),
      region: z.string().optional(),
      state: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getFamilyOffices(input || {});
    }),
  
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const fo = await db.getFamilyOfficeById(input.id);
      if (!fo) throw new TRPCError({ code: 'NOT_FOUND' });
      return fo;
    }),
  
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const fo = await db.getFamilyOfficeBySlug(input.slug);
      if (!fo) throw new TRPCError({ code: 'NOT_FOUND' });
      return fo;
    }),
  
  stats: publicProcedure.query(async () => {
    return db.getFamilyOfficeStats();
  }),
  
  search: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.searchFamilyOffices(input.query, input.limit);
    }),
  
  // Import contact from family office to broker contacts
  importContact: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      name: z.string(),
      title: z.string().optional(),
      email: z.string().optional(),
      linkedin: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contactId = await db.importFamilyOfficeContact(
        ctx.user.id,
        input.familyOfficeId,
        {
          name: input.name,
          title: input.title,
          email: input.email,
          linkedin: input.linkedin,
          phone: input.phone,
        }
      );
      
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'contact_imported',
        entityType: 'broker_contact',
        entityId: contactId,
        newState: input,
      });
      
      return { id: contactId };
    }),
  
  // Add to targets
  addToTargets: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const targetId = await db.createTarget({
        userId: ctx.user.id,
        familyOfficeId: input.familyOfficeId,
        priority: input.priority || 'medium',
        notes: input.notes,
      });
      
      return { id: targetId };
    }),
  
  // Get social profiles
  getSocialProfiles: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getSocialProfiles('family_office', input.id);
    }),
  
  // Add social profile
  addSocialProfile: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      platform: z.enum(['linkedin', 'instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'crunchbase', 'pitchbook', 'angellist', 'other']),
      profileUrl: z.string(),
      username: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createSocialProfile({
        entityType: 'family_office',
        entityId: input.familyOfficeId,
        platform: input.platform,
        profileUrl: input.profileUrl,
        username: input.username,
      });
      return { id };
    }),
  
  // Get news for family office
  getNews: publicProcedure
    .input(z.object({ id: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.getNewsItems('family_office', input.id, input.limit);
    }),
});

// ============================================================================
// TARGETING ROUTER
// ============================================================================

const targetingRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.getTargetsByUser(ctx.user.id, input || {});
    }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.id);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return target;
    }),
  
  create: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional(),
      primaryContactName: z.string().optional(),
      primaryContactTitle: z.string().optional(),
      primaryContactEmail: z.string().optional(),
      primaryContactLinkedIn: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createTarget({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum([
        'identified', 'researching', 'outreach_planned', 'contacted',
        'in_conversation', 'meeting_scheduled', 'proposal_sent',
        'negotiating', 'converted', 'declined', 'on_hold'
      ]).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional(),
      nextFollowUpDate: z.date().optional(),
      primaryContactName: z.string().optional(),
      primaryContactTitle: z.string().optional(),
      primaryContactEmail: z.string().optional(),
      primaryContactLinkedIn: z.string().optional(),
      primaryContactPhone: z.string().optional(),
      estimatedDealSize: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.id);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const { id, ...data } = input;
      await db.updateTarget(id, data as any);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.id);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await db.deleteTarget(input.id);
      return { success: true };
    }),
  
  stats: protectedProcedure.query(async ({ ctx }) => {
    return db.getTargetStats(ctx.user.id);
  }),
  
  // Activity tracking
  addActivity: protectedProcedure
    .input(z.object({
      targetId: z.number(),
      activityType: z.enum([
        'email_sent', 'email_received', 'call_made', 'call_received',
        'linkedin_connection', 'linkedin_message', 'meeting', 'video_call',
        'introduction_made', 'introduction_received', 'document_shared',
        'proposal_sent', 'follow_up', 'note_added', 'status_change'
      ]),
      subject: z.string().optional(),
      description: z.string().optional(),
      outcome: z.string().optional(),
      contactPerson: z.string().optional(),
      requiresFollowUp: z.boolean().optional(),
      followUpDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.targetId);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const id = await db.createTargetActivity({
        ...input,
        userId: ctx.user.id,
      });
      return { id };
    }),
  
  getActivities: protectedProcedure
    .input(z.object({ targetId: z.number(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.targetId);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return db.getTargetActivities(input.targetId, input.limit);
    }),
});

// ============================================================================
// BROKER CONTACTS ROUTER
// ============================================================================

const brokerContactRouter = router({
  list: protectedProcedure
    .input(z.object({
      contactType: z.string().optional(),
      relationshipStrength: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.getBrokerContacts(ctx.user.id, input || {});
    }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return contact;
    }),
  
  create: protectedProcedure
    .input(z.object({
      fullName: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      contactType: z.enum(['investor', 'family_office', 'fund_manager', 'broker', 'advisor', 'principal', 'operator', 'service_provider', 'other']).optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
      instagramHandle: z.string().optional(),
      twitterHandle: z.string().optional(),
      telegramHandle: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createBrokerContact({
        ownerId: ctx.user.id,
        ...input,
      });
      
      // Create social profiles if provided
      if (input.linkedinUrl) {
        await db.createSocialProfile({
          entityType: 'contact',
          entityId: id,
          platform: 'linkedin',
          profileUrl: input.linkedinUrl,
        });
      }
      if (input.instagramHandle) {
        await db.createSocialProfile({
          entityType: 'contact',
          entityId: id,
          platform: 'instagram',
          profileUrl: `https://instagram.com/${input.instagramHandle}`,
          username: input.instagramHandle,
        });
      }
      
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      fullName: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
      relationshipStrength: z.enum(['cold', 'warm', 'hot', 'close', 'inner_circle']).optional(),
      notes: z.string().optional(),
      nextFollowUp: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const { id, ...data } = input;
      await db.updateBrokerContact(id, data as any);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await db.deleteBrokerContact(input.id);
      return { success: true };
    }),
  
  // Get social profiles for contact
  getSocialProfiles: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return db.getSocialProfiles('contact', input.id);
    }),
  
  // Add social profile to contact
  addSocialProfile: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      platform: z.enum(['linkedin', 'instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'crunchbase', 'pitchbook', 'angellist', 'other']),
      profileUrl: z.string(),
      username: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.contactId);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const id = await db.createSocialProfile({
        entityType: 'contact',
        entityId: input.contactId,
        platform: input.platform,
        profileUrl: input.profileUrl,
        username: input.username,
      });
      return { id };
    }),
});

// ============================================================================
// ENRICHMENT ROUTER
// ============================================================================

const enrichmentRouter = router({
  // Request enrichment for an entity
  request: protectedProcedure
    .input(z.object({
      entityType: z.enum(['family_office', 'broker_contact', 'relationship']),
      entityId: z.number(),
      source: z.string().default('auto'),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createEnrichmentJob({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true, jobId: result };
    }),

  // Get enrichment jobs
  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(['family_office', 'broker_contact', 'relationship']).optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return db.getEnrichmentJobs({
        ...input,
        userId: ctx.user.id,
      });
    }),
});

// ============================================================================
// CALENDAR ROUTER
// ============================================================================

const calendarRouter = router({
  // Get calendar connections
  connections: protectedProcedure.query(async ({ ctx }) => {
    return db.getCalendarConnections(ctx.user.id);
  }),

  // Connect calendar
  connect: protectedProcedure
    .input(z.object({
      provider: z.enum(['google', 'outlook', 'apple']),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      calendarId: z.string().optional(),
      calendarName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createCalendarConnection({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true, connectionId: result };
    }),

  // Disconnect calendar
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCalendarConnection(input.connectionId);
      return { success: true };
    }),

  // Get events
  events: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      eventType: z.string().optional(),
      relatedDealId: z.number().optional(),
      relatedTargetId: z.number().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      return db.getCalendarEvents(ctx.user.id, {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  // Create event
  createEvent: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      location: z.string().optional(),
      meetingLink: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      allDay: z.boolean().default(false),
      timezone: z.string().default('UTC'),
      eventType: z.enum(['meeting', 'call', 'follow_up', 'due_diligence', 'deal_room', 'pitch', 'closing', 'reminder', 'other']).default('meeting'),
      relatedDealId: z.number().optional(),
      relatedTargetId: z.number().optional(),
      relatedContactId: z.number().optional(),
      attendees: z.array(z.object({
        name: z.string(),
        email: z.string(),
        status: z.string(),
      })).optional(),
      reminders: z.array(z.number()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createCalendarEvent({
        ...input,
        userId: ctx.user.id,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
      });
      return { success: true, eventId: result };
    }),

  // Update event
  updateEvent: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
      notes: z.string().optional(),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { eventId, startTime, endTime, ...rest } = input;
      await db.updateCalendarEvent(eventId, {
        ...rest,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      });
      return { success: true };
    }),

  // Delete event
  deleteEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCalendarEvent(input.eventId);
      return { success: true };
    }),

  // Get reminders
  reminders: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'completed', 'snoozed', 'cancelled']).optional(),
      targetType: z.string().optional(),
      priority: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return db.getFollowUpReminders(ctx.user.id, input);
    }),

  // Create reminder
  createReminder: protectedProcedure
    .input(z.object({
      targetType: z.enum(['family_office', 'contact', 'deal', 'relationship']),
      targetId: z.number(),
      targetName: z.string().optional(),
      title: z.string(),
      notes: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      dueDate: z.string(),
      reminderTime: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createFollowUpReminder({
        ...input,
        userId: ctx.user.id,
        dueDate: new Date(input.dueDate),
        reminderTime: input.reminderTime ? new Date(input.reminderTime) : undefined,
      });
      return { success: true, reminderId: result };
    }),

  // Update reminder
  updateReminder: protectedProcedure
    .input(z.object({
      reminderId: z.number(),
      title: z.string().optional(),
      notes: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      dueDate: z.string().optional(),
      status: z.enum(['pending', 'completed', 'snoozed', 'cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { reminderId, dueDate, ...rest } = input;
      await db.updateFollowUpReminder(reminderId, {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedAt: input.status === 'completed' ? new Date() : undefined,
      });
      return { success: true };
    }),

  // Get meeting history with target
  meetingHistory: protectedProcedure
    .input(z.object({
      targetId: z.number(),
      targetType: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getMeetingHistory(ctx.user.id, input.targetId, input.targetType);
    }),
});

// ============================================================================
// ANALYTICS ROUTER
// ============================================================================

const analyticsRouter = router({
  // Get deal analytics
  dealAnalytics: protectedProcedure
    .input(z.object({
      periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(12),
    }))
    .query(async ({ ctx, input }) => {
      return db.getDealAnalytics(ctx.user.id, {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  // Calculate real-time analytics
  calculate: protectedProcedure.query(async ({ ctx }) => {
    return db.calculateDealAnalytics(ctx.user.id);
  }),

  // Get conversion funnels
  funnels: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getConversionFunnels(
        ctx.user.id,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  // Get dashboard summary
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const analytics = await db.calculateDealAnalytics(ctx.user.id);
    const reminders = await db.getFollowUpReminders(ctx.user.id, { status: 'pending', limit: 5 });
    const upcomingEvents = await db.getCalendarEvents(ctx.user.id, {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      limit: 5,
    });
    
    return {
      analytics,
      pendingReminders: reminders,
      upcomingEvents,
    };
  }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  user: userRouter,
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
  familyOffice: familyOfficeRouter,
  targeting: targetingRouter,
  brokerContact: brokerContactRouter,
  enrichment: enrichmentRouter,
  calendar: calendarRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
