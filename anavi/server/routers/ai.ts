import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { generateDealFlowResponse, analyzeDeal as claudeAnalyzeDeal, generateIntroductionRecommendations, type ChatMessage, type ChatContext } from "../claude";

export const aiRouter = router({
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
});
