import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthContext } from "../test/setup";

const mocks = vi.hoisted(() => ({
  getUserFlags: vi.fn(),
  getAuditLog: vi.fn(),
  getPayoutsByUser: vi.fn(),
  logAuditEvent: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserFlags: mocks.getUserFlags,
  getAuditLog: mocks.getAuditLog,
  getPayoutsByUser: mocks.getPayoutsByUser,
  logAuditEvent: mocks.logAuditEvent,
}));

const { payoutRouter } = await import("./payout");

describe("payout router idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserFlags.mockResolvedValue([]);
  });

  it("returns existing publish snapshot artifact when idempotency key matches", async () => {
    mocks.getAuditLog.mockResolvedValue([
      {
        id: 701,
        action: "portfolio_snapshot_published",
        metadata: {
          idempotencyKey: "snapshot-key-1234",
          snapshotId: 9901,
          publishedAt: "2026-03-14T09:00:00.000Z",
          url: "/portfolio/snapshots/9901",
        },
        createdAt: new Date("2026-03-14T09:00:00.000Z"),
      },
    ]);

    const { ctx } = createAuthContext({ id: 8 });
    const caller = payoutRouter.createCaller(ctx);
    const result = await caller.publishSnapshot({
      idempotencyKey: "snapshot-key-1234",
      periodStart: "2026-03-01T00:00:00.000Z",
      periodEnd: "2026-03-14T00:00:00.000Z",
      filters: { status: "completed" },
    });

    expect(result).toEqual({
      snapshotId: 9901,
      publishedAt: "2026-03-14T09:00:00.000Z",
      url: "/portfolio/snapshots/9901",
      idempotent: true,
    });
    expect(mocks.getPayoutsByUser).not.toHaveBeenCalled();
    expect(mocks.logAuditEvent).not.toHaveBeenCalled();
  });

  it("returns existing export statement artifact when idempotency key matches", async () => {
    mocks.getAuditLog.mockResolvedValue([
      {
        id: 802,
        action: "portfolio_statement_exported",
        metadata: {
          idempotencyKey: "export-key-5678",
          statementId: 1202,
          exportedAt: "2026-03-14T10:00:00.000Z",
          url: "/portfolio/statements/1202.json",
          total: 4210.5,
          itemCount: 3,
        },
        createdAt: new Date("2026-03-14T10:00:00.000Z"),
      },
    ]);

    const { ctx } = createAuthContext({ id: 8 });
    const caller = payoutRouter.createCaller(ctx);
    const result = await caller.exportStatement({
      idempotencyKey: "export-key-5678",
      periodStart: "2026-03-01T00:00:00.000Z",
      periodEnd: "2026-03-14T00:00:00.000Z",
      filters: { status: "completed" },
    });

    expect(result).toEqual({
      statementId: 1202,
      exportedAt: "2026-03-14T10:00:00.000Z",
      url: "/portfolio/statements/1202.json",
      total: 4210.5,
      itemCount: 3,
      idempotent: true,
    });
    expect(mocks.getPayoutsByUser).not.toHaveBeenCalled();
    expect(mocks.logAuditEvent).not.toHaveBeenCalled();
  });
});
