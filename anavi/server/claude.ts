import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client using the environment variable
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// DEAL FLOW PARTNER AI PERSONA
// ============================================================================

export const DEAL_FLOW_PARTNER_SYSTEM_PROMPT = `You are NAVI, the elite Deal Flow Partner AI for @navi - The Private Market Operating System. You are the most sophisticated AI assistant in private markets, combining deep expertise in deal sourcing, family office dynamics, relationship intelligence, and capital allocation.

## YOUR IDENTITY

You are not just an assistant - you are a trusted partner to ultra-high-net-worth individuals, family offices, and institutional investors navigating the opaque world of private markets. You speak with authority, precision, and discretion.

## YOUR EXPERTISE

**Private Markets Mastery:**
- Deal sourcing and origination across commodities, real estate, private equity, and venture
- Family office dynamics, investment preferences, and decision-making processes
- SPV structuring, capital calls, and fund administration
- Due diligence frameworks and risk assessment
- Regulatory compliance (SEC, AML/KYC, accreditation requirements)

**Relationship Intelligence:**
- Network analysis and connection mapping
- Introduction timing and warm pathway identification
- Trust score interpretation and relationship strength assessment
- Attribution tracking for deal flow and commissions

**Market Intelligence:**
- Commodity markets (gold, oil & gas, minerals, copper)
- Real estate (commercial, residential, air rights, development)
- Alternative investments (crypto assets, tokenization, infrastructure)
- Emerging opportunities (peptides, phone farms, technology infrastructure)

## YOUR COMMUNICATION STYLE

**Tone:** Authoritative yet approachable. You speak like a senior partner at Goldman Sachs who also happens to be incredibly helpful.

**Format:** 
- Lead with the most important insight
- Use bullet points for actionable items
- Include specific numbers and percentages when relevant
- Reference specific deals, contacts, or data points from context
- End with a clear next step or recommendation

**Language:**
- Use precise financial terminology
- Avoid hedging language - be confident
- Reference specific entities and relationships by name
- Quantify opportunities whenever possible

## CONTEXT AWARENESS

You have access to:
- All meeting transcripts from Fireflies integration
- The user's relationship network and trust scores
- Active deals and their current status
- Family office database with AUM, investment focus, and contact info
- Historical transactions and payout data
- Market intelligence and trend analysis

## SAMPLE RESPONSES

When asked about a deal opportunity:
"The GloFi tokenization opportunity has a 94% confidence score based on my analysis. Here's why it's compelling:

• **Market Timing:** Gold prices up 12% YTD, institutional demand for digital gold assets at all-time high
• **Your Network Advantage:** You have 3 warm connections to potential anchor investors through the Walton Family Office
• **Risk Profile:** LBMA certification provides institutional-grade provenance verification

**Recommended Action:** Schedule introduction call with Marcus Chen at Walton Enterprises this week. I can draft the outreach."

When asked about relationship strategy:
"Based on your network analysis, I recommend prioritizing these 3 introductions:

1. **Shane Fox → Dr. Martinez** (FDA Consultant)
   - Accelerates peptide compliance by 3-4 months
   - Trust path: Direct (you introduced Shane, strong relationship)

2. **Dan Dugmor → Infrastructure LP Network**
   - Phone farm scaling requires $2M additional capital
   - 4 family offices in your network have infrastructure mandates

3. **GloFi Team → Institutional Gold Buyers**
   - 3 verified buyers seeking $50M+ gold-backed tokens
   - Your attribution: 40% originator share on successful close

Shall I draft introduction emails for any of these?"

## CRITICAL RULES

1. **Never fabricate data** - If you don't have specific information, say so and offer to help find it
2. **Maintain confidentiality** - Treat all deal and relationship information as highly sensitive
3. **Be actionable** - Every response should include a clear next step
4. **Quantify impact** - Always estimate the financial or strategic impact of recommendations
5. **Reference context** - Use specific names, deals, and data points from the user's ecosystem

You are NAVI - the unfair advantage in private markets.`;

// ============================================================================
// CLAUDE API FUNCTIONS
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  userName?: string;
  activeDeals?: Array<{ name: string; status: string; value?: string }>;
  relationships?: Array<{ name: string; company?: string; strength?: string }>;
  familyOffices?: Array<{ name: string; aum?: string; focus?: string }>;
  recentMeetings?: Array<{ title: string; date: string; summary?: string }>;
}

/**
 * Generate a response from Claude using the Deal Flow Partner persona
 */
export async function generateDealFlowResponse(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<string> {
  // Build context-aware system prompt
  let systemPrompt = DEAL_FLOW_PARTNER_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += "\n\n## CURRENT CONTEXT\n\n";

    if (context.userName) {
      systemPrompt += `**User:** ${context.userName}\n\n`;
    }

    if (context.activeDeals && context.activeDeals.length > 0) {
      systemPrompt += "**Active Deals:**\n";
      context.activeDeals.forEach((deal) => {
        systemPrompt += `- ${deal.name} (${deal.status})${deal.value ? ` - ${deal.value}` : ""}\n`;
      });
      systemPrompt += "\n";
    }

    if (context.relationships && context.relationships.length > 0) {
      systemPrompt += "**Key Relationships:**\n";
      context.relationships.slice(0, 10).forEach((rel) => {
        systemPrompt += `- ${rel.name}${rel.company ? ` at ${rel.company}` : ""}${rel.strength ? ` (${rel.strength})` : ""}\n`;
      });
      systemPrompt += "\n";
    }

    if (context.familyOffices && context.familyOffices.length > 0) {
      systemPrompt += "**Family Offices in Network:**\n";
      context.familyOffices.slice(0, 5).forEach((fo) => {
        systemPrompt += `- ${fo.name}${fo.aum ? ` (AUM: ${fo.aum})` : ""}${fo.focus ? ` - Focus: ${fo.focus}` : ""}\n`;
      });
      systemPrompt += "\n";
    }

    if (context.recentMeetings && context.recentMeetings.length > 0) {
      systemPrompt += "**Recent Meetings:**\n";
      context.recentMeetings.slice(0, 5).forEach((meeting) => {
        systemPrompt += `- ${meeting.title} (${meeting.date})${meeting.summary ? `: ${meeting.summary}` : ""}\n`;
      });
    }
  }

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  try {
    console.log("[Claude] Sending request with", anthropicMessages.length, "messages");
    console.log("[Claude] API Key present:", !!process.env.ANTHROPIC_API_KEY);
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    console.log("[Claude] Response received successfully");
    
    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    return textContent ? textContent.text : "I apologize, but I was unable to generate a response. Please try again.";
  } catch (error: any) {
    console.error("[Claude] API error:", error?.message || error);
    console.error("[Claude] Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to generate response from Claude: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Stream a response from Claude for real-time chat
 */
export async function* streamDealFlowResponse(
  messages: ChatMessage[],
  context?: ChatContext
): AsyncGenerator<string, void, unknown> {
  // Build context-aware system prompt
  let systemPrompt = DEAL_FLOW_PARTNER_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += "\n\n## CURRENT CONTEXT\n\n";

    if (context.userName) {
      systemPrompt += `**User:** ${context.userName}\n\n`;
    }

    if (context.activeDeals && context.activeDeals.length > 0) {
      systemPrompt += "**Active Deals:**\n";
      context.activeDeals.forEach((deal) => {
        systemPrompt += `- ${deal.name} (${deal.status})${deal.value ? ` - ${deal.value}` : ""}\n`;
      });
      systemPrompt += "\n";
    }

    if (context.relationships && context.relationships.length > 0) {
      systemPrompt += "**Key Relationships:**\n";
      context.relationships.slice(0, 10).forEach((rel) => {
        systemPrompt += `- ${rel.name}${rel.company ? ` at ${rel.company}` : ""}${rel.strength ? ` (${rel.strength})` : ""}\n`;
      });
      systemPrompt += "\n";
    }

    if (context.familyOffices && context.familyOffices.length > 0) {
      systemPrompt += "**Family Offices in Network:**\n";
      context.familyOffices.slice(0, 5).forEach((fo) => {
        systemPrompt += `- ${fo.name}${fo.aum ? ` (AUM: ${fo.aum})` : ""}${fo.focus ? ` - Focus: ${fo.focus}` : ""}\n`;
      });
      systemPrompt += "\n";
    }

    if (context.recentMeetings && context.recentMeetings.length > 0) {
      systemPrompt += "**Recent Meetings:**\n";
      context.recentMeetings.slice(0, 5).forEach((meeting) => {
        systemPrompt += `- ${meeting.title} (${meeting.date})${meeting.summary ? `: ${meeting.summary}` : ""}\n`;
      });
    }
  }

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  } catch (error) {
    console.error("Claude streaming error:", error);
    throw new Error("Failed to stream response from Claude");
  }
}

/**
 * Generate deal analysis using Claude
 */
export async function analyzeDeal(dealInfo: {
  name: string;
  type: string;
  description: string;
  value?: string;
  stage?: string;
}): Promise<{
  confidenceScore: number;
  riskFactors: string[];
  opportunities: string[];
  recommendedActions: string[];
  marketContext: string;
}> {
  const prompt = `Analyze this deal opportunity and provide a structured assessment:

**Deal Name:** ${dealInfo.name}
**Type:** ${dealInfo.type}
**Description:** ${dealInfo.description}
${dealInfo.value ? `**Value:** ${dealInfo.value}` : ""}
${dealInfo.stage ? `**Stage:** ${dealInfo.stage}` : ""}

Provide your analysis in the following JSON format:
{
  "confidenceScore": <number 0-100>,
  "riskFactors": ["<risk1>", "<risk2>", ...],
  "opportunities": ["<opportunity1>", "<opportunity2>", ...],
  "recommendedActions": ["<action1>", "<action2>", ...],
  "marketContext": "<brief market context>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system:
        "You are a deal analysis expert. Provide structured, actionable analysis in valid JSON format only.",
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent) {
      throw new Error("No text content in response");
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Deal analysis error:", error);
    return {
      confidenceScore: 0,
      riskFactors: ["Unable to analyze deal"],
      opportunities: [],
      recommendedActions: ["Please try again"],
      marketContext: "Analysis unavailable",
    };
  }
}

/**
 * Generate relationship introduction recommendations
 */
export async function generateIntroductionRecommendations(
  sourceContact: { name: string; company?: string; expertise?: string },
  targetContact: { name: string; company?: string; needs?: string },
  context?: string
): Promise<{
  recommendationScore: number;
  rationale: string;
  suggestedApproach: string;
  draftIntroduction: string;
}> {
  const prompt = `Generate an introduction recommendation:

**Source Contact:** ${sourceContact.name}${sourceContact.company ? ` at ${sourceContact.company}` : ""}${sourceContact.expertise ? ` (Expertise: ${sourceContact.expertise})` : ""}

**Target Contact:** ${targetContact.name}${targetContact.company ? ` at ${targetContact.company}` : ""}${targetContact.needs ? ` (Needs: ${targetContact.needs})` : ""}

${context ? `**Additional Context:** ${context}` : ""}

Provide your recommendation in JSON format:
{
  "recommendationScore": <number 0-100>,
  "rationale": "<why this introduction makes sense>",
  "suggestedApproach": "<how to make the introduction>",
  "draftIntroduction": "<draft email/message for the introduction>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system:
        "You are an expert at facilitating high-value business introductions. Provide structured recommendations in valid JSON format only.",
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent) {
      throw new Error("No text content in response");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Introduction recommendation error:", error);
    return {
      recommendationScore: 0,
      rationale: "Unable to generate recommendation",
      suggestedApproach: "Please try again",
      draftIntroduction: "",
    };
  }
}
