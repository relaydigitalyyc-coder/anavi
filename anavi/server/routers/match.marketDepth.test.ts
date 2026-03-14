import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthContext } from "../test/setup";

const mocks = vi.hoisted(() => ({
  getUserFlags: vi.fn(),
  getMatchesWithCounterpartyByUser: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserFlags: mocks.getUserFlags,
  getMatchesWithCounterpartyByUser: mocks.getMatchesWithCounterpartyByUser,
  getDb: mocks.getDb,
}));

const { matchRouter } = await import("./match");

function createIntentConn(
  intentRows: Array<{ id: number; assetType: string | null; title: string | null }>
) {
  const where = vi.fn().mockResolvedValue(intentRows);
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  return { select };
}

describe("match.marketDepth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserFlags.mockResolvedValue([]);
  });

  it("returns market depth buckets with buyer/seller split by sector", async () => {
    const now = new Date("2026-03-14T12:00:00.000Z");
    const rows = [
      {
        intent1Id: 10,
        intent2Id: 20,
        status: "mutual_interest",
        updatedAt: now,
      },
      {
        intent1Id: 10,
        intent2Id: 30,
        status: "pending",
        updatedAt: new Date("2026-03-14T11:00:00.000Z"),
      },
      {
        intent1Id: 40,
        intent2Id: 50,
        status: "nda_pending",
        updatedAt: new Date("2026-03-14T10:00:00.000Z"),
      },
    ];

    mocks.getMatchesWithCounterpartyByUser.mockResolvedValue(rows as any);
    mocks.getDb.mockResolvedValue(
      createIntentConn([
        { id: 10, assetType: "real_estate", title: null },
        { id: 40, assetType: "private_credit", title: null },
      ]) as any
    );

    const { ctx } = createAuthContext({ id: 7 });
    const caller = matchRouter.createCaller(ctx);
    const result = await caller.marketDepth();

    expect(result).toEqual([
      {
        sector: "Real Estate",
        buyers: 1,
        sellers: 1,
        total: 2,
        lastUpdatedAt: "2026-03-14T12:00:00.000Z",
      },
      {
        sector: "Private Credit",
        buyers: 1,
        sellers: 0,
        total: 1,
        lastUpdatedAt: "2026-03-14T10:00:00.000Z",
      },
    ]);
  });

  it("applies status/time/sector filters before bucketing", async () => {
    const rows = [
      {
        intent1Id: 10,
        intent2Id: 20,
        status: "pending",
        updatedAt: new Date("2026-03-14T09:00:00.000Z"),
      },
      {
        intent1Id: 10,
        intent2Id: 30,
        status: "user1_interested",
        updatedAt: new Date("2026-03-14T09:30:00.000Z"),
      },
      {
        intent1Id: 40,
        intent2Id: 50,
        status: "pending",
        updatedAt: new Date("2026-03-14T09:45:00.000Z"),
      },
    ];

    mocks.getMatchesWithCounterpartyByUser.mockResolvedValue(rows as any);
    mocks.getDb.mockResolvedValue(
      createIntentConn([
        { id: 10, assetType: "real_estate", title: null },
        { id: 40, assetType: "private_credit", title: null },
      ]) as any
    );

    const { ctx } = createAuthContext({ id: 7 });
    const caller = matchRouter.createCaller(ctx);
    const result = await caller.marketDepth({
      periodStart: "2026-03-14T09:15:00.000Z",
      periodEnd: "2026-03-14T10:00:00.000Z",
      includeStatuses: ["pending"],
      sector: "Private Credit",
    });

    expect(result).toEqual([
      {
        sector: "Private Credit",
        buyers: 0,
        sellers: 1,
        total: 1,
        lastUpdatedAt: "2026-03-14T09:45:00.000Z",
      },
    ]);
  });
});
