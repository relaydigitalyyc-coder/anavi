import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthContext } from "../test/setup";

const mocks = vi.hoisted(() => ({
  getUserFlags: vi.fn(),
  getUserById: vi.fn(),
  getVerificationDocuments: vi.fn(),
  getNotificationsByUser: vi.fn(),
  getMatchesByUser: vi.fn(),
  getIntentsByUser: vi.fn(),
}));

vi.mock("../db", () => ({
  getUserFlags: mocks.getUserFlags,
  getUserById: mocks.getUserById,
  getVerificationDocuments: mocks.getVerificationDocuments,
  getNotificationsByUser: mocks.getNotificationsByUser,
  getMatchesByUser: mocks.getMatchesByUser,
  getIntentsByUser: mocks.getIntentsByUser,
  markNotificationRead: vi.fn(),
}));

const { notificationRouter } = await import("./notification");

describe("notification.pendingActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserFlags.mockResolvedValue([]);
  });

  it("prioritizes pending actions and enforces the limit", async () => {
    mocks.getUserById.mockResolvedValue({
      id: 12,
      verificationTier: "none",
    });
    mocks.getVerificationDocuments.mockResolvedValue([
      { status: "pending" },
      { status: "approved" },
      { status: "pending" },
    ]);
    mocks.getNotificationsByUser.mockResolvedValue([
      { id: 1, createdAt: new Date("2026-03-14T09:00:00.000Z") },
      { id: 2, createdAt: new Date("2026-03-14T08:00:00.000Z") },
    ]);
    mocks.getMatchesByUser.mockResolvedValue([
      { status: "pending" },
      { status: "user2_interested" },
      { status: "nda_pending" },
    ]);
    mocks.getIntentsByUser.mockResolvedValue([{ status: "paused" }]);

    const { ctx } = createAuthContext({ id: 12 });
    const caller = notificationRouter.createCaller(ctx);
    const result = await caller.pendingActions({ limit: 5 });

    expect(result.map((action) => action.id)).toEqual([
      "verification-tier-upgrade",
      "verification-doc-review",
      "review-consent-stage-matches",
      "advance-nda-pipeline",
      "clear-unread-notifications",
    ]);
    expect(result[0]?.badge).toBe("Required");
    expect(result[1]?.text).toContain("Resolve 2 verification document review items");
  });

  it("returns no actions when there is no pending work", async () => {
    mocks.getUserById.mockResolvedValue({
      id: 12,
      verificationTier: "enhanced",
    });
    mocks.getVerificationDocuments.mockResolvedValue([]);
    mocks.getNotificationsByUser.mockResolvedValue([]);
    mocks.getMatchesByUser.mockResolvedValue([]);
    mocks.getIntentsByUser.mockResolvedValue([{ status: "active" }]);

    const { ctx } = createAuthContext({ id: 12 });
    const caller = notificationRouter.createCaller(ctx);
    const result = await caller.pendingActions();

    expect(result).toEqual([]);
  });
});
