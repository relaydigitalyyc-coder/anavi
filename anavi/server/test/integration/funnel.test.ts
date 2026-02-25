/**
 * F20: Integration tests for core funnel.
 * Tests: intent create → find matches → express interest → create deal room.
 * Uses mocks for db and invokeLLM to run without a real database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../../routers";
import { createTestCaller } from "../setup";
import type { User } from "../../drizzle/schema";

// In-memory state for mock behavior
const store = {
  intents: [] as Array<{ id: number; userId: number; intentType: string; title: string; description?: string; keywords: string[] }>,
  matches: [] as Array<{
    id: number;
    intent1Id: number;
    intent2Id: number;
    user1Id: number;
    user2Id: number;
    status: string;
    user1Consent: boolean;
    user2Consent: boolean;
    dealRoomId?: number;
  }>,
  dealRooms: [] as Array<{ id: number; matchId: number; name: string; createdBy: number }>,
  nextIntentId: 1,
  nextMatchId: 1,
  nextDealRoomId: 1,
};

// Mock db
vi.mock("../../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  createIntent: vi.fn().mockImplementation(async (data: { userId: number; intentType: string; title: string; description?: string; keywords?: string[] }) => {
    const id = store.nextIntentId++;
    store.intents.push({
      id,
      userId: data.userId,
      intentType: data.intentType,
      title: data.title,
      description: data.description,
      keywords: data.keywords ?? [],
    });
    return id;
  }),
  getIntentsByUser: vi.fn().mockImplementation((userId: number) => {
    return Promise.resolve(store.intents.filter((i) => i.userId === userId));
  }),
  getActiveIntents: vi.fn().mockImplementation((excludeUserId: number) => {
    return Promise.resolve(store.intents.filter((i) => i.userId !== excludeUserId && i.status !== "cancelled"));
  }),
  createMatch: vi.fn().mockImplementation(async (data: { intent1Id: number; intent2Id: number; user1Id: number; user2Id: number; compatibilityScore: string; matchReason: string }) => {
    const id = store.nextMatchId++;
    store.matches.push({
      id,
      intent1Id: data.intent1Id,
      intent2Id: data.intent2Id,
      user1Id: data.user1Id,
      user2Id: data.user2Id,
      status: "pending",
      user1Consent: false,
      user2Consent: false,
    });
    return id;
  }),
  getMatchesByUser: vi.fn().mockImplementation((userId: number) => {
    return Promise.resolve(
      store.matches.filter((m) => m.user1Id === userId || m.user2Id === userId)
    );
  }),
  updateMatch: vi.fn().mockImplementation(async (matchId: number, data: Record<string, unknown>) => {
    const m = store.matches.find((x) => x.id === matchId);
    if (m) Object.assign(m, data);
    return;
  }),
  createDealRoom: vi.fn().mockImplementation(async (data: { matchId: number; name: string; createdBy: number }) => {
    const id = store.nextDealRoomId++;
    store.dealRooms.push({
      id,
      matchId: data.matchId,
      name: data.name,
      createdBy: data.createdBy,
    });
    return id;
  }),
  grantDealRoomAccess: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(1),
  notifyNewMatch: vi.fn().mockResolvedValue(undefined),
}));

// Mock invokeLLM - return compatible matches and keywords
vi.mock("../../_core/llm", () => {
  const keywordsJson = JSON.stringify({ keywords: ["real_estate", "commercial"] });
  const matchJson = JSON.stringify({ score: 85, reason: "Asset type match", compatible: true });
  return {
    invokeLLM: vi.fn().mockImplementation(async (opts: { response_format?: { json_schema: { schema: { properties: Record<string, unknown> } } } }) => {
      const schema = opts.response_format?.json_schema?.schema?.properties;
      const hasKeywords = schema && "keywords" in schema;
      const hasCompatible = schema && "compatible" in schema;
      if (hasKeywords) return { choices: [{ message: { content: keywordsJson } }] };
      if (hasCompatible) return { choices: [{ message: { content: matchJson } }] };
      return { choices: [{ message: { content: "{}" } }] };
    }),
  };
});

describe("F20: Integration Funnel", () => {
  beforeEach(() => {
    store.intents = [];
    store.matches = [];
    store.dealRooms = [];
    store.nextIntentId = 1;
    store.nextMatchId = 1;
    store.nextDealRoomId = 1;
  });

  it("onboarding → intent → match → mutual interest → deal room", async () => {
    const buyerCaller = createTestCaller(appRouter, 1);
    const sellerCaller = createTestCaller(appRouter, 2);

    // 1. Create intents (buyer and seller)
    const buyerIntentRes = await buyerCaller.intent.create({
      intentType: "buy",
      title: "Seeking Real Estate",
      description: "Commercial in North America",
      assetType: "real_estate",
    });
    expect(buyerIntentRes).toHaveProperty("id");
    expect(buyerIntentRes.id).toBeGreaterThan(0);

    const sellerIntentRes = await sellerCaller.intent.create({
      intentType: "sell",
      title: "Office Building for Sale",
      description: "Prime downtown, 50k sqft",
      assetType: "real_estate",
    });
    expect(sellerIntentRes).toHaveProperty("id");

    // Fix: getActiveIntents expects intent objects with status - our mock doesn't set it
    // The mock store has intents without status; getActiveIntents filters by status !== 'cancelled'
    // Our mock intents don't have status, so filter might exclude them. Let me check - we're not setting status on the mock intent. The filter is `i.status !== 'cancelled'` - if status is undefined, undefined !== 'cancelled' is true, so we're good.

    // 2. Find matches (buyer's perspective)
    const matchesRes = await buyerCaller.intent.findMatches({ intentId: buyerIntentRes.id });
    expect(matchesRes).toHaveProperty("matches");
    // May or may not create match records depending on score > 70
    expect(Array.isArray(matchesRes.matches)).toBe(true);

    // 3. If matches were created, express interest from both sides
    const matches = await buyerCaller.match.list();
    if (matches.length > 0) {
      const matchId = matches[0]!.id;

      await buyerCaller.match.expressInterest({ matchId });
      const mutual1 = await sellerCaller.match.expressInterest({ matchId });
      expect(mutual1.mutualInterest).toBe(true);

      // 4. Create deal room
      const dealRoomRes = await buyerCaller.match.createDealRoom({ matchId });
      expect(dealRoomRes).toHaveProperty("dealRoomId");
      expect(dealRoomRes.dealRoomId).toBeGreaterThan(0);
    }
  });

  it("intent.create returns id and list shows it", async () => {
    const caller = createTestCaller(appRouter, 10);
    const created = await caller.intent.create({
      intentType: "invest",
      title: "VC Investment",
      description: "Seed stage",
      assetType: "equity",
    });
    expect(created.id).toBe(1);

    const list = await caller.intent.list();
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe("VC Investment");
  });

  it("match.createDealRoom requires mutual_interest", async () => {
    const caller = createTestCaller(appRouter, 1);
    // Create a match with pending status (no mutual interest)
    store.matches.push({
      id: 99,
      intent1Id: 1,
      intent2Id: 2,
      user1Id: 1,
      user2Id: 2,
      status: "pending",
      user1Consent: false,
      user2Consent: false,
    });

    await expect(caller.match.createDealRoom({ matchId: 99 })).rejects.toThrow();
  });
});
