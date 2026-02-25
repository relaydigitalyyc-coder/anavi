import { describe, expect, it, vi } from "vitest";
import {
  generateRelationshipHash,
  verifyRelationshipHash,
  getLastRelationshipHash,
} from "./_core/hashchain";

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("generateRelationshipHash", () => {
  it("produces a 64-character lowercase hex SHA-256 hash", () => {
    const { hash, proof } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(proof).toBeTruthy();
    expect(proof.length).toBeGreaterThan(0);
  });

  it("produces different hashes for different prevHash values", () => {
    const base = {
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
    };
    const { hash: hash1 } = generateRelationshipHash({ ...base, prevHash: "0".repeat(64) });
    const { hash: hash2 } = generateRelationshipHash({ ...base, prevHash: "a".repeat(64) });

    expect(hash1).not.toBe(hash2);
  });

  it("produces deterministic output for the same input", () => {
    const input = {
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    };
    const { hash: hash1 } = generateRelationshipHash(input);
    const { hash: hash2 } = generateRelationshipHash(input);

    expect(hash1).toBe(hash2);
  });
});

describe("verifyRelationshipHash", () => {
  it("returns true for a valid hash/proof pair", () => {
    const { hash, proof } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    expect(verifyRelationshipHash(hash, proof)).toBe(true);
  });

  it("returns false when hash is tampered", () => {
    const { proof } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    const tamperedHash = "deadbeef" + "0".repeat(56);
    expect(verifyRelationshipHash(tamperedHash, proof)).toBe(false);
  });

  it("returns false when proof is tampered", () => {
    const { hash } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    const tamperedProof = Buffer.from(
      JSON.stringify({ ownerId: 99, contactId: 99, establishedAt: "tampered", prevHash: "0".repeat(64) })
    ).toString("base64");

    expect(verifyRelationshipHash(hash, tamperedProof)).toBe(false);
  });
});

describe("getLastRelationshipHash", () => {
  it("returns genesis hash (64 zeros) when DB is unavailable", async () => {
    const result = await getLastRelationshipHash(1);
    expect(result).toBe("0".repeat(64));
    expect(result).toHaveLength(64);
  });
});
