import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthContext } from "../test/setup";

const mocks = vi.hoisted(() => ({
  getUserFlags: vi.fn(),
  getPayoutsByUser: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserFlags: mocks.getUserFlags,
  getPayoutsByUser: mocks.getPayoutsByUser,
  getDb: mocks.getDb,
}));

const { analyticsRouter } = await import("./analytics");

function createCapitalCallConn(rows: Array<any>) {
  const where = vi.fn().mockResolvedValue(rows);
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  const select = vi.fn().mockReturnValue({ from });
  return { select };
}

describe("analytics.liveProof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserFlags.mockResolvedValue([]);
  });

  it("computes payout uplift, capital call settlement delta, and attribution coverage", async () => {
    mocks.getPayoutsByUser.mockResolvedValue([
      {
        status: "completed",
        amount: 1000,
        relationshipId: 1,
        createdAt: new Date("2026-03-14T10:00:00.000Z"),
        updatedAt: new Date("2026-03-14T10:00:00.000Z"),
        paidAt: new Date("2026-03-14T11:00:00.000Z"),
      },
      {
        status: "processing",
        amount: 500,
        relationshipId: 2,
        createdAt: new Date("2026-03-14T09:30:00.000Z"),
        updatedAt: new Date("2026-03-14T10:30:00.000Z"),
        paidAt: null,
      },
      {
        status: "completed",
        amount: 200,
        relationshipId: null,
        createdAt: new Date("2026-03-13T10:00:00.000Z"),
        updatedAt: new Date("2026-03-13T10:00:00.000Z"),
        paidAt: new Date("2026-03-13T10:00:00.000Z"),
      },
      {
        status: "pending",
        amount: 150,
        relationshipId: null,
        createdAt: new Date("2026-03-14T07:00:00.000Z"),
        updatedAt: new Date("2026-03-14T07:00:00.000Z"),
        paidAt: null,
      },
    ]);

    mocks.getDb.mockResolvedValue(
      createCapitalCallConn([
        {
          responseId: 1,
          status: "paid",
          amountPaid: 700,
          paidAt: new Date("2026-03-14T08:00:00.000Z"),
          updatedAt: new Date("2026-03-14T08:00:00.000Z"),
        },
        {
          responseId: 2,
          status: "paid",
          amountPaid: 400,
          paidAt: new Date("2026-03-13T06:00:00.000Z"),
          updatedAt: new Date("2026-03-13T06:00:00.000Z"),
        },
        {
          responseId: 3,
          status: "submitted",
          amountPaid: null,
          paidAt: null,
          updatedAt: new Date("2026-03-14T06:00:00.000Z"),
        },
      ]) as any
    );

    const { ctx } = createAuthContext({ id: 55 });
    const caller = analyticsRouter.createCaller(ctx);
    const result = await caller.liveProof({
      asOf: "2026-03-14T12:00:00.000Z",
      lookbackHours: 24,
    });

    expect(result.performanceUplift24h).toEqual({
      value: "+0.1 bps blended",
      deltaLabel: "+650.0% vs prior window",
    });
    expect(result.capitalCallsSettled).toEqual({
      count: 1,
      deltaLabel: "+0.0% vs prior window",
    });
    expect(result.attributionCoverage).toEqual({
      percent: 50,
      traceability: "2/4 payouts linked",
    });
    expect(result.freshness).toBe("2026-03-14T11:00:00.000Z");
    expect(result.generatedAt).toBe("2026-03-14T12:00:00.000Z");
  });

  it("returns stable empty-state metrics when no data is available", async () => {
    mocks.getPayoutsByUser.mockResolvedValue([]);
    mocks.getDb.mockResolvedValue(createCapitalCallConn([]) as any);

    const { ctx } = createAuthContext({ id: 55 });
    const caller = analyticsRouter.createCaller(ctx);
    const result = await caller.liveProof({
      asOf: "2026-03-14T12:00:00.000Z",
      lookbackHours: 24,
    });

    expect(result.performanceUplift24h).toEqual({
      value: "+0.0 bps blended",
      deltaLabel: "Flat",
    });
    expect(result.capitalCallsSettled).toEqual({
      count: 0,
      deltaLabel: "Flat",
    });
    expect(result.attributionCoverage).toEqual({
      percent: 0,
      traceability: "0/0 payouts linked",
    });
    expect(result.freshness).toBeNull();
  });
});
