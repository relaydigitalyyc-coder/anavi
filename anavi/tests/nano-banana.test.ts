import { beforeEach, afterEach, test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { generateGeminiAsset } from "../scripts/nano-banana";

const metadataPath = path.resolve("tmp-nano-assets.json");

beforeEach(() => {
  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath);
  }
});

afterEach(() => {
  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath);
  }
});

test("generateGeminiAsset writes metadata ledger", () => {
  const asset = generateGeminiAsset("demo", { metadataPath, timestamp: 0 });
  expect(asset.assetId).toBeDefined();
  expect(asset.intentTag).toBe("demo");
  expect(asset.geminiVersion).toContain("Nano Banana");

  const stored = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  expect(stored[asset.assetId]).toEqual(asset);
});

test("generateGeminiAsset returns cached asset on rerun", () => {
  const first = generateGeminiAsset("demo", { metadataPath, timestamp: 0 });
  const second = generateGeminiAsset("demo", { metadataPath, timestamp: 0 });
  expect(second).toEqual(first);
});
