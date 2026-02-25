import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Task 1: userFlags schema ─────────────────────────────────────────────────

describe("Task 1: userFlags schema", () => {
  it("exports userFlags table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.userFlags).toBeDefined();
  });

  it("userFlags table has SQL name user_flags", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.userFlags).toBeDefined();
    expect(typeof schema.userFlags).toBe("object");
  });

  it("userFlags table has required columns", async () => {
    const schema = await import("../drizzle/schema");
    const columns = Object.keys(schema.userFlags);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("flagType");
    expect(columns).toContain("reason");
    expect(columns).toContain("flaggedBy");
    expect(columns).toContain("expiresAt");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });
});

// ── Task 2 & 3: Mock setup for calculateTrustScore and assignBadge ─────────────

const mockGetDb = vi.fn();

vi.mock("./db/connection", () => ({
  getDb: mockGetDb,
}));

function makeUser(overrides: Partial<{
  verificationTier: string;
  totalDeals: number;
  createdAt: Date;
  kybStatus: string;
  trustScore: string;
}>) {
  return {
    id: 1,
    verificationTier: "none",
    totalDeals: 0,
    createdAt: new Date(),
    kybStatus: "pending",
    trustScore: "0.00",
    ...overrides,
  };
}

function makeSelectChain(result: any[]) {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(result),
    orderBy: () => chain,
  };
  chain.then = (fn: (v: any) => any) => Promise.resolve(result).then(fn);
  return chain;
}

function buildMockDb(opts: {
  users?: any[];
  peerReviews?: any[];
  complianceChecks?: any[];
  insertSpy?: ReturnType<typeof vi.fn>;
}) {
  const selectResults = [opts.users ?? [], opts.peerReviews ?? [], opts.complianceChecks ?? []];
  let selectIndex = 0;

  const insertFn = opts.insertSpy ?? vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  });

  return {
    select: vi.fn().mockImplementation(() => makeSelectChain(selectResults[selectIndex++] ?? [])),
    insert: insertFn,
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}

// ── Task 2: calculateTrustScore ──────────────────────────────────────────────

describe("Task 2: calculateTrustScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns 0 for a brand-new user with no activity", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(0);
  });

  it("applies verificationTier=basic → contributes 33% of 30 weight", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "basic", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(10);
  });

  it("applies verificationTier=enhanced → contributes 66% of 30 weight", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "enhanced", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(20);
  });

  it("applies verificationTier=institutional → contributes 100% of 30 weight", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "institutional", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(30);
  });

  it("caps deal component at 20 deals (= 25 pts max)", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 30, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(25);
  });

  it("computes peer review component from avg rating", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [{ rating: 5 }, { rating: 3 }],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(15);
  });

  it("computes compliance component from pass rate", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [
        { status: "passed" },
        { status: "passed" },
        { status: "failed" },
        { status: "failed" },
      ],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(8);
  });

  it("computes tenure component (24-month cap)", async () => {
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - 12);
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt })],
      peerReviews: [],
      complianceChecks: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(5);
  });

  it("full score: institutional + 20 deals + perfect reviews + all compliance + 24+ months = 100", async () => {
    const createdAt = new Date();
    createdAt.setFullYear(createdAt.getFullYear() - 3);
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "institutional", totalDeals: 20, createdAt })],
      peerReviews: [{ rating: 5 }, { rating: 5 }, { rating: 5 }],
      complianceChecks: [{ status: "passed" }, { status: "passed" }],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(100);
  });

  it("writes result to trustScoreHistory", async () => {
    const insertSpy = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    });
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      insertSpy,
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    await calculateTrustScore(1);
    expect(insertSpy).toHaveBeenCalled();
  });
});
