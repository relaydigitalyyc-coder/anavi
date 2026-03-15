import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { createTestCaller } from "./test/setup";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    isUserComplianceBlocked: vi.fn().mockResolvedValue(true),
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
    getMatchesByUser: vi.fn().mockResolvedValue([
      { id: 9001, user1Id: 1, user2Id: 2, status: "mutual_interest", user1Consent: true, user2Consent: true, dealRoomId: null },
    ]),
  };
});

describe("Compliance gates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks deal room creation on compliance hold", async () => {
    const caller = createTestCaller(appRouter, 1);
    await expect(caller.match.createDealRoom({ matchId: 9001 })).rejects.toThrow();
  });
});

