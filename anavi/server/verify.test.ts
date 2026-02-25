import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserFlags: vi.fn().mockResolvedValue([]),
  getRelationshipByHash: vi.fn(),
}));

vi.mock("./_core/hashchain", () => ({
  verifyRelationshipHash: vi.fn(),
}));

import { registerVerificationRoutes } from "./_core/verify";
import { getRelationshipByHash } from "./db";
import { verifyRelationshipHash } from "./_core/hashchain";

function buildTestApp() {
  const app = express();
  app.use(express.json());
  registerVerificationRoutes(app);
  return app;
}

describe("GET /api/verify/relationship/:hash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { valid: false } when hash is not found in DB", async () => {
    vi.mocked(getRelationshipByHash).mockResolvedValueOnce(undefined);

    const app = buildTestApp();
    const res = await request(app).get("/api/verify/relationship/" + "a".repeat(64));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: false });
  });

  it("returns valid:true with metadata when hash is found and verifies", async () => {
    const fakeRel = {
      id: 1,
      timestampHash: "a".repeat(64),
      timestampProof: "c29tZXByb29m",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      ownerId: 1,
    };
    vi.mocked(getRelationshipByHash).mockResolvedValueOnce(fakeRel as any);
    vi.mocked(verifyRelationshipHash).mockReturnValueOnce(true);

    const app = buildTestApp();
    const res = await request(app).get("/api/verify/relationship/" + "a".repeat(64));

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.establishedAt).toBeDefined();
    expect(res.body.name).toBeUndefined();
    expect(res.body.handle).toBeUndefined();
    expect(res.body.email).toBeUndefined();
  });

  it("returns valid:false when hash found but proof is tampered", async () => {
    const fakeRel = {
      id: 1,
      timestampHash: "a".repeat(64),
      timestampProof: "tampered_proof",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      ownerId: 1,
    };
    vi.mocked(getRelationshipByHash).mockResolvedValueOnce(fakeRel as any);
    vi.mocked(verifyRelationshipHash).mockReturnValueOnce(false);

    const app = buildTestApp();
    const res = await request(app).get("/api/verify/relationship/" + "a".repeat(64));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: false });
  });
});
