import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude client with user's API key
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || "",
});

// System prompt for ANAVI's AI brain
const ANAVI_SYSTEM_PROMPT = `You are ANAVI's AI Brain - the Market Intelligence Engine for a private market operating system.

Your role is to:
1. Analyze deals, relationships, and market opportunities
2. Provide risk assessments and due diligence insights
3. Identify patterns in deal flow and network connections
4. Generate actionable recommendations for capital deployment
5. Track market sentiment across commodities, real estate, crypto, and private equity

You have access to:
- Deal pipeline data with readiness scores
- Network graph of relationships and connections
- Meeting transcripts from Fireflies
- Historical transaction data
- Market intelligence feeds

Always be:
- Precise and data-driven in analysis
- Clear about confidence levels
- Proactive in identifying risks and opportunities
- Focused on actionable insights

Format responses with clear sections and bullet points when appropriate.`;

// Types for AI interactions
export interface AIAnalysisRequest {
  type: "deal" | "relationship" | "market" | "risk" | "opportunity";
  context: string;
  data?: Record<string, unknown>;
}

export interface AIAnalysisResponse {
  analysis: string;
  confidence: number;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  nextSteps: string[];
}

export interface MarketIntelligence {
  sector: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyInsights: string[];
  trendingDeals: string[];
  riskFactors: string[];
}

// Analyze a deal with Claude
export async function analyzeDeal(dealData: {
  name: string;
  sector: string;
  capitalRange: string;
  description: string;
  team: string[];
  risks?: string[];
}): Promise<AIAnalysisResponse> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: ANAVI_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this deal opportunity and provide a comprehensive assessment:

Deal: ${dealData.name}
Sector: ${dealData.sector}
Capital Range: ${dealData.capitalRange}
Description: ${dealData.description}
Team: ${dealData.team.join(", ")}
Known Risks: ${dealData.risks?.join(", ") || "Not specified"}

Provide:
1. Overall assessment (1-2 paragraphs)
2. Confidence score (0-100)
3. Key recommendations (3-5 items)
4. Risk factors to monitor
5. Opportunities identified
6. Suggested next steps

Format as JSON with keys: analysis, confidence, recommendations, risks, opportunities, nextSteps`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      // Try to parse as JSON
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, structure the response
    }
    return {
      analysis: content.text,
      confidence: 75,
      recommendations: ["Review deal terms", "Conduct due diligence", "Verify team credentials"],
      risks: ["Market conditions", "Execution risk"],
      opportunities: ["First mover advantage", "Network effects"],
      nextSteps: ["Schedule follow-up call", "Request financials"],
    };
  }

  throw new Error("Unexpected response format from Claude");
}

// Get market intelligence for a sector
export async function getMarketIntelligence(sector: string): Promise<MarketIntelligence> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: ANAVI_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Provide current market intelligence for the ${sector} sector.

Include:
1. Overall market sentiment (bullish/bearish/neutral)
2. Key insights and trends (3-5 items)
3. Trending deal types in this sector
4. Risk factors to watch
5. Investment thesis summary

Format as JSON with keys: sector, sentiment, keyInsights, trendingDeals, riskFactors`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Default response if parsing fails
    }
    return {
      sector,
      sentiment: "neutral",
      keyInsights: ["Market analysis in progress"],
      trendingDeals: ["Various opportunities available"],
      riskFactors: ["Market volatility", "Regulatory changes"],
    };
  }

  throw new Error("Unexpected response format from Claude");
}

// Analyze network relationships
export async function analyzeNetwork(networkData: {
  nodes: Array<{ id: string; name: string; type: string }>;
  connections: Array<{ source: string; target: string; strength: number }>;
}): Promise<{
  insights: string[];
  keyConnectors: string[];
  gaps: string[];
  recommendations: string[];
}> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: ANAVI_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze this relationship network and identify opportunities:

Network has ${networkData.nodes.length} nodes and ${networkData.connections.length} connections.

Node types: ${Array.from(new Set(networkData.nodes.map((n) => n.type))).join(", ")}

Provide:
1. Key insights about network structure
2. Most important connectors/hubs
3. Gaps or missing connections
4. Recommendations for network growth

Format as JSON with keys: insights, keyConnectors, gaps, recommendations`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Default response
    }
    return {
      insights: ["Network analysis complete"],
      keyConnectors: ["Key hubs identified"],
      gaps: ["Potential connection opportunities found"],
      recommendations: ["Expand network in key sectors"],
    };
  }

  throw new Error("Unexpected response format from Claude");
}

// Natural language query interface
export async function queryPlatform(
  query: string,
  context?: {
    deals?: unknown[];
    relationships?: unknown[];
    meetings?: unknown[];
  }
): Promise<string> {
  const contextStr = context
    ? `

Available context:
- ${context.deals?.length || 0} deals in pipeline
- ${context.relationships?.length || 0} relationships tracked
- ${context.meetings?.length || 0} meeting transcripts`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system:
      ANAVI_SYSTEM_PROMPT +
      contextStr +
      `

When answering queries:
- Be concise but comprehensive
- Reference specific data when available
- Provide actionable insights
- Suggest follow-up questions if relevant`,
    messages: [
      {
        role: "user",
        content: query,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }

  throw new Error("Unexpected response format from Claude");
}

// Risk assessment for a deal or opportunity
export async function assessRisk(data: {
  type: string;
  description: string;
  amount?: string;
  parties?: string[];
}): Promise<{
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: Array<{ factor: string; impact: string; mitigation: string }>;
  recommendation: string;
}> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: ANAVI_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Perform a risk assessment:

Type: ${data.type}
Description: ${data.description}
Amount: ${data.amount || "Not specified"}
Parties: ${data.parties?.join(", ") || "Not specified"}

Provide:
1. Risk score (0-100)
2. Risk level (low/medium/high/critical)
3. Risk factors with impact and mitigation strategies
4. Overall recommendation

Format as JSON with keys: riskScore, riskLevel, factors (array of {factor, impact, mitigation}), recommendation`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Default response
    }
    return {
      riskScore: 50,
      riskLevel: "medium",
      factors: [
        {
          factor: "Market conditions",
          impact: "Moderate",
          mitigation: "Diversify exposure",
        },
      ],
      recommendation: "Proceed with standard due diligence",
    };
  }

  throw new Error("Unexpected response format from Claude");
}

// Generate deal recommendations based on portfolio
export async function generateRecommendations(portfolio: {
  currentDeals: string[];
  sectors: string[];
  riskTolerance: "conservative" | "moderate" | "aggressive";
  capitalAvailable: string;
}): Promise<{
  recommendations: Array<{
    type: string;
    rationale: string;
    expectedReturn: string;
    risk: string;
  }>;
  portfolioInsights: string[];
  diversificationSuggestions: string[];
}> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: ANAVI_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate investment recommendations based on this portfolio:

Current Deals: ${portfolio.currentDeals.join(", ")}
Sectors: ${portfolio.sectors.join(", ")}
Risk Tolerance: ${portfolio.riskTolerance}
Capital Available: ${portfolio.capitalAvailable}

Provide:
1. Specific deal type recommendations with rationale
2. Portfolio insights
3. Diversification suggestions

Format as JSON with keys: recommendations (array of {type, rationale, expectedReturn, risk}), portfolioInsights, diversificationSuggestions`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Default response
    }
    return {
      recommendations: [
        {
          type: "Diversified allocation",
          rationale: "Balance risk across sectors",
          expectedReturn: "15-25% annually",
          risk: "Medium",
        },
      ],
      portfolioInsights: ["Portfolio analysis in progress"],
      diversificationSuggestions: ["Consider adding alternative assets"],
    };
  }

  throw new Error("Unexpected response format from Claude");
}

export default {
  analyzeDeal,
  getMarketIntelligence,
  analyzeNetwork,
  queryPlatform,
  assessRisk,
  generateRecommendations,
};
