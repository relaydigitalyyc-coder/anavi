import { describe, expect, it } from "vitest";
import { generateRelationshipHash } from "./_core/hashchain";

describe("db", () => {
  describe("generateRelationshipHash (hash chain)", () => {
    const base = {
      ownerId: 1,
      contactId: 2,
      establishedAt: "2024-01-15T12:00:00.000Z",
      prevHash: "0".repeat(64),
    };

    it("returns deterministic sha256 hex string", () => {
      const { hash } = generateRelationshipHash(base);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toBe(generateRelationshipHash(base).hash);
    });

    it("differs for different ownerId", () => {
      const h1 = generateRelationshipHash({ ...base, ownerId: 1 }).hash;
      const h2 = generateRelationshipHash({ ...base, ownerId: 2 }).hash;
      expect(h1).not.toBe(h2);
    });

    it("differs for different contactId", () => {
      const h1 = generateRelationshipHash({ ...base, contactId: 2 }).hash;
      const h2 = generateRelationshipHash({ ...base, contactId: 3 }).hash;
      expect(h1).not.toBe(h2);
    });

    it("differs for different timestamp", () => {
      const h1 = generateRelationshipHash({ ...base, establishedAt: "2024-01-15T12:00:00.000Z" }).hash;
      const h2 = generateRelationshipHash({ ...base, establishedAt: "2024-01-15T12:00:01.000Z" }).hash;
      expect(h1).not.toBe(h2);
    });
  });
});
