import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: "This is a test response from Claude about deal flow analysis.",
            },
          ],
        }),
        stream: vi.fn().mockImplementation(() => ({
          [Symbol.asyncIterator]: async function* () {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "Streaming " },
            };
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "response " },
            };
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "test." },
            };
          },
        })),
      },
    })),
  };
});

// Import after mocking
import {
  generateDealFlowResponse,
  streamDealFlowResponse,
  analyzeDeal,
  generateIntroductionRecommendations,
  DEAL_FLOW_PARTNER_SYSTEM_PROMPT,
} from "./claude";

describe("Claude API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DEAL_FLOW_PARTNER_SYSTEM_PROMPT", () => {
    it("should contain key persona elements", () => {
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("NAVI");
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("Deal Flow Partner");
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("private markets");
    });

    it("should include expertise areas", () => {
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("Private Markets Mastery");
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("Relationship Intelligence");
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("Market Intelligence");
    });

    it("should include communication guidelines", () => {
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("Tone:");
      expect(DEAL_FLOW_PARTNER_SYSTEM_PROMPT).toContain("Format:");
    });
  });

  describe("generateDealFlowResponse", () => {
    it("should generate a response for simple messages", async () => {
      const messages = [{ role: "user" as const, content: "What are my best deal opportunities?" }];
      const response = await generateDealFlowResponse(messages);

      expect(response).toBeDefined();
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
    });

    it("should handle context injection", async () => {
      const messages = [{ role: "user" as const, content: "Analyze my pipeline" }];
      const context = {
        userName: "Test User",
        activeDeals: [
          { name: "Test Deal", status: "active", value: "$1M" },
        ],
        relationships: [
          { name: "John Doe", company: "Acme Corp", strength: "strong" },
        ],
        familyOffices: [
          { name: "Smith Family Office", aum: "$500M", focus: "Real Estate" },
        ],
      };

      const response = await generateDealFlowResponse(messages, context);
      expect(response).toBeDefined();
    });

    it("should handle conversation history", async () => {
      const messages = [
        { role: "user" as const, content: "Tell me about gold investments" },
        { role: "assistant" as const, content: "Gold is a safe haven asset..." },
        { role: "user" as const, content: "What about tokenization?" },
      ];

      const response = await generateDealFlowResponse(messages);
      expect(response).toBeDefined();
    });
  });

  describe("streamDealFlowResponse", () => {
    it("should stream response chunks", async () => {
      const messages = [{ role: "user" as const, content: "Stream a response" }];
      const chunks: string[] = [];

      for await (const chunk of streamDealFlowResponse(messages)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join("")).toBe("Streaming response test.");
    });
  });

  describe("analyzeDeal", () => {
    it("should analyze a deal and return structured data", async () => {
      // Mock the response for this specific test
      const mockAnalysis = {
        confidenceScore: 85,
        riskFactors: ["Market volatility", "Regulatory risk"],
        opportunities: ["High growth potential", "Strategic location"],
        recommendedActions: ["Conduct due diligence", "Meet with sponsor"],
        marketContext: "Strong market conditions",
      };

      vi.mocked(
        (await import("@anthropic-ai/sdk")).default
      ).mockImplementationOnce(
        () =>
          ({
            messages: {
              create: vi.fn().mockResolvedValue({
                content: [{ type: "text", text: JSON.stringify(mockAnalysis) }],
              }),
            },
          }) as any
      );

      const result = await analyzeDeal({
        name: "Test Industrial Portfolio",
        type: "Real Estate",
        description: "10-building logistics portfolio in Northeast",
        value: "$45M",
        stage: "Due Diligence",
      });

      expect(result).toBeDefined();
      expect(typeof result.confidenceScore).toBe("number");
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(Array.isArray(result.opportunities)).toBe(true);
      expect(Array.isArray(result.recommendedActions)).toBe(true);
      expect(typeof result.marketContext).toBe("string");
    });
  });

  describe("generateIntroductionRecommendations", () => {
    it("should generate introduction recommendations", async () => {
      const mockRecommendation = {
        recommendationScore: 90,
        rationale: "Strong alignment between expertise and needs",
        suggestedApproach: "Warm email introduction",
        draftIntroduction: "Dear John, I'd like to introduce you to...",
      };

      vi.mocked(
        (await import("@anthropic-ai/sdk")).default
      ).mockImplementationOnce(
        () =>
          ({
            messages: {
              create: vi.fn().mockResolvedValue({
                content: [{ type: "text", text: JSON.stringify(mockRecommendation) }],
              }),
            },
          }) as any
      );

      const result = await generateIntroductionRecommendations(
        { name: "Alice Smith", company: "Tech Corp", expertise: "AI/ML" },
        { name: "Bob Johnson", company: "Invest Co", needs: "AI investment opportunities" },
        "Both are in the same industry"
      );

      expect(result).toBeDefined();
      expect(typeof result.recommendationScore).toBe("number");
      expect(typeof result.rationale).toBe("string");
      expect(typeof result.suggestedApproach).toBe("string");
      expect(typeof result.draftIntroduction).toBe("string");
    });
  });
});

describe("ChatMessage type", () => {
  it("should accept valid message roles", () => {
    const userMessage = { role: "user" as const, content: "Hello" };
    const assistantMessage = { role: "assistant" as const, content: "Hi there" };

    expect(userMessage.role).toBe("user");
    expect(assistantMessage.role).toBe("assistant");
  });
});

describe("ChatContext type", () => {
  it("should accept valid context structure", () => {
    const context = {
      userName: "Test User",
      activeDeals: [{ name: "Deal 1", status: "active" }],
      relationships: [{ name: "Contact 1" }],
      familyOffices: [{ name: "FO 1" }],
      recentMeetings: [{ title: "Meeting 1", date: "2026-01-18" }],
    };

    expect(context.userName).toBe("Test User");
    expect(context.activeDeals).toHaveLength(1);
    expect(context.relationships).toHaveLength(1);
    expect(context.familyOffices).toHaveLength(1);
    expect(context.recentMeetings).toHaveLength(1);
  });
});
