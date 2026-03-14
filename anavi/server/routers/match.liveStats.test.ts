import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthContext } from "../test/setup";

vi.mock("../db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db")>();
  return {
    ...actual,
    getUserFlags: vi.fn(async () => []),
    getMatchesWithCounterpartyByUser: vi.fn(),
    getDealsByUser: vi.fn(),
    getPayoutsByUser: vi.fn(),
  };
});

const db = await import("../db");
const { matchRouter } = await import("./match");

type MockMatch = {
  status: string;
  createdAt: Date;
  updatedAt: Date;
  compatibilityScore: number | string;
  counterpartyVerificationTier: string;
  intent1Id: number;
  intent2Id: number;
};

type MockDeal = {
  stage: string;
  createdAt?: Date;
  updatedAt?: Date;
  actualCloseDate?: Date | null;
  dealValue?: number | string | null;
};

type MockPayout = {
  status: string;
  amount: number | string;
};

describe("match.liveStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aggregates pipeline/live proof/summary/capital with runtime data", async () => {
    const now = Date.now();
    const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
    const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);

    const rows: MockMatch[] = [
      {
        status: "pending",
        createdAt: hoursAgo(2),
        updatedAt: hoursAgo(1),
        compatibilityScore: 80,
        counterpartyVerificationTier: "basic",
        intent1Id: 1,
        intent2Id: 2,
      },
      {
        status: "user1_interested",
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(20),
        compatibilityScore: 70,
        counterpartyVerificationTier: "institutional",
        intent1Id: 3,
        intent2Id: 4,
      },
      {
        status: "nda_pending",
        createdAt: hoursAgo(3),
        updatedAt: hoursAgo(2),
        compatibilityScore: 60,
        counterpartyVerificationTier: "none",
        intent1Id: 5,
        intent2Id: 6,
      },
      {
        status: "mutual_interest",
        createdAt: hoursAgo(10),
        updatedAt: hoursAgo(6),
        compatibilityScore: 90,
        counterpartyVerificationTier: "enhanced",
        intent1Id: 7,
        intent2Id: 8,
      },
      {
        status: "deal_room_created",
        createdAt: hoursAgo(40),
        updatedAt: hoursAgo(4),
        compatibilityScore: 85,
        counterpartyVerificationTier: "institutional",
        intent1Id: 9,
        intent2Id: 10,
      },
      {
        status: "declined",
        createdAt: hoursAgo(1),
        updatedAt: hoursAgo(1),
        compatibilityScore: 99,
        counterpartyVerificationTier: "institutional",
        intent1Id: 11,
        intent2Id: 12,
      },
    ];
    const deals: MockDeal[] = [
      { stage: "lead", createdAt: daysAgo(5), updatedAt: hoursAgo(5), dealValue: 1_000 },
      { stage: "due_diligence", createdAt: daysAgo(2), updatedAt: hoursAgo(2), dealValue: 2_000 },
      { stage: "due_diligence", createdAt: daysAgo(4), updatedAt: hoursAgo(3), dealValue: 3_000 },
      { stage: "completed", createdAt: daysAgo(10), actualCloseDate: daysAgo(4), updatedAt: hoursAgo(1) },
      { stage: "completed", createdAt: daysAgo(20), updatedAt: daysAgo(5), actualCloseDate: null },
      { stage: "cancelled", createdAt: daysAgo(1), updatedAt: hoursAgo(1), dealValue: 10_000 },
    ];
    const payouts: MockPayout[] = [
      { status: "processing", amount: 400 },
      { status: "completed", amount: 600 },
      { status: "pending", amount: 200 },
    ];

    vi.mocked(db.getMatchesWithCounterpartyByUser).mockResolvedValue(rows as any);
    vi.mocked(db.getDealsByUser).mockResolvedValue(deals as any);
    vi.mocked(db.getPayoutsByUser).mockResolvedValue(payouts as any);

    const { ctx } = createAuthContext({ id: 42 });
    const caller = matchRouter.createCaller(ctx);
    const result = await caller.liveStats();

    expect(result.pipeline).toEqual({
      sourcing: 1,
      dueDiligence: 2,
      termSheet: 1,
      closing: 1,
      total: 5,
    });
    expect(result.liveProof.newVerifiedMatches24h).toBe(2);
    expect(result.liveProof.diligenceMedianDays).toBe(3);
    expect(result.liveProof.capitalAllocationReady).toBe(5000);
    expect(result.summary.activePipeline).toBe(5);
    expect(result.summary.committedCapital).toBe(6000);
    expect(result.summary.weightedTrustScore).toBe(77);
    expect(result.summary.avgTimeToCloseDays).toBe(11);
    expect(result.capital).toEqual({
      available: 5000,
      committed: 6000,
      deployed: 1000,
      pendingPayouts: 200,
      total: 6000,
    });
    expect(result.lastUpdatedAt).toBe(new Date(hoursAgo(1)).toISOString());
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
  });

  it("returns sane defaults for empty datasets", async () => {
    vi.mocked(db.getMatchesWithCounterpartyByUser).mockResolvedValue([] as any);
    vi.mocked(db.getDealsByUser).mockResolvedValue([] as any);
    vi.mocked(db.getPayoutsByUser).mockResolvedValue([] as any);

    const { ctx } = createAuthContext({ id: 11 });
    const caller = matchRouter.createCaller(ctx);
    const result = await caller.liveStats();

    expect(result.pipeline.total).toBe(0);
    expect(result.liveProof.newVerifiedMatches24h).toBe(0);
    expect(result.liveProof.diligenceMedianDays).toBeNull();
    expect(result.liveProof.capitalAllocationReady).toBe(0);
    expect(result.summary.avgTimeToCloseDays).toBeNull();
    expect(result.summary.weightedTrustScore).toBe(0);
    expect(result.capital).toEqual({
      available: 0,
      committed: 0,
      deployed: 0,
      pendingPayouts: 0,
      total: 0,
    });
    expect(result.lastUpdatedAt).toBeNull();
  });

  it("ignores terminal statuses for pipeline and trust weighting", async () => {
    const now = Date.now();
    const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);
    const rows: MockMatch[] = [
      {
        status: "declined",
        createdAt: hoursAgo(1),
        updatedAt: hoursAgo(1),
        compatibilityScore: 99,
        counterpartyVerificationTier: "institutional",
        intent1Id: 1,
        intent2Id: 2,
      },
      {
        status: "expired",
        createdAt: hoursAgo(2),
        updatedAt: hoursAgo(2),
        compatibilityScore: 95,
        counterpartyVerificationTier: "institutional",
        intent1Id: 3,
        intent2Id: 4,
      },
      {
        status: "pending",
        createdAt: hoursAgo(3),
        updatedAt: hoursAgo(3),
        compatibilityScore: 40,
        counterpartyVerificationTier: "basic",
        intent1Id: 5,
        intent2Id: 6,
      },
    ];

    vi.mocked(db.getMatchesWithCounterpartyByUser).mockResolvedValue(rows as any);
    vi.mocked(db.getDealsByUser).mockResolvedValue([] as any);
    vi.mocked(db.getPayoutsByUser).mockResolvedValue([] as any);

    const { ctx } = createAuthContext({ id: 99 });
    const caller = matchRouter.createCaller(ctx);
    const result = await caller.liveStats();

    expect(result.pipeline).toEqual({
      sourcing: 1,
      dueDiligence: 0,
      termSheet: 0,
      closing: 0,
      total: 1,
    });
    expect(result.summary.weightedTrustScore).toBe(40);
    expect(result.liveProof.newVerifiedMatches24h).toBe(1);
    expect(result.liveProof.capitalAllocationReady).toBe(0);
  });
});
