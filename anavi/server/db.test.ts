import { describe, expect, it } from "vitest";
import { generateTimestampHash } from "./db";

describe("db", () => {
  describe("generateTimestampHash", () => {
    it("returns deterministic sha256 hex string", () => {
      const d = new Date("2024-01-15T12:00:00.000Z");
      const h = generateTimestampHash(1, 2, d);
      expect(h).toMatch(/^[a-f0-9]{64}$/);
      expect(h).toBe(generateTimestampHash(1, 2, d));
    });

    it("differs for different ownerId", () => {
      const d = new Date("2024-01-15T12:00:00.000Z");
      const h1 = generateTimestampHash(1, 2, d);
      const h2 = generateTimestampHash(2, 2, d);
      expect(h1).not.toBe(h2);
    });

    it("differs for different contactId", () => {
      const d = new Date("2024-01-15T12:00:00.000Z");
      const h1 = generateTimestampHash(1, 2, d);
      const h2 = generateTimestampHash(1, 3, d);
      expect(h1).not.toBe(h2);
    });

    it("differs for different timestamp", () => {
      const d1 = new Date("2024-01-15T12:00:00.000Z");
      const d2 = new Date("2024-01-15T12:00:01.000Z");
      const h1 = generateTimestampHash(1, 2, d1);
      const h2 = generateTimestampHash(1, 2, d2);
      expect(h1).not.toBe(h2);
    });
  });
});
