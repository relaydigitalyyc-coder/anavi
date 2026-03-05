import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from "node:url";

export type NanoBananaAsset = {
  assetId: string;
  prompt: string;
  intentTag: string;
  geminiVersion: string;
  attribution: string;
  createdAt: string;
  trustScore: number;
};

export type NanoBananaOptions = {
  prompt?: string;
  geminiVersion?: string;
  attribution?: string;
  trustScore?: number;
  timestamp?: number;
  metadataPath?: string;
};

type AssetLedger = Record<string, NanoBananaAsset>;

const MODULE_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_LEDGER_PATH = process.env.ANAVI_GEMINI_LEDGER_PATH
  ? path.resolve(process.env.ANAVI_GEMINI_LEDGER_PATH)
  : path.resolve(MODULE_DIR, "..", "data", "ai-assets.json");
const DEFAULT_PROMPT_TEMPLATE = 'Nano Banana 2 Gemini render for {intent}';
const DEFAULT_GEMINI_VERSION = 'Gemini Nano Banana 2';
const DEFAULT_ATTRIBUTION = 'Nano Banana 2';

function ensureLedgerPath(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadLedger(filePath: string): AssetLedger {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as AssetLedger;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

function persistLedger(filePath: string, ledger: AssetLedger) {
  ensureLedgerPath(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
}

function buildAssetId(intentTag: string, timestamp: number) {
  return crypto.createHash('sha256').update(`${intentTag}-${timestamp}`).digest('hex');
}

export function generateGeminiAsset(intentTag: string, options: NanoBananaOptions = {}): NanoBananaAsset {
  const timestamp = options.timestamp ?? Date.now();
  const metadataPath = path.resolve(options.metadataPath ?? DEFAULT_LEDGER_PATH);
  const ledger = loadLedger(metadataPath);
  const assetId = buildAssetId(intentTag, timestamp);

  if (ledger[assetId]) {
    return ledger[assetId];
  }

  const prompt = options.prompt ?? DEFAULT_PROMPT_TEMPLATE.replace('{intent}', intentTag);
  const geminiVersion = options.geminiVersion ?? DEFAULT_GEMINI_VERSION;
  const attribution = options.attribution ?? DEFAULT_ATTRIBUTION;
  const trustScore = options.trustScore ?? 0.75;
  const createdAt = new Date(timestamp).toISOString();

  const asset: NanoBananaAsset = {
    assetId,
    prompt,
    intentTag,
    geminiVersion,
    attribution,
    createdAt,
    trustScore,
  };

  ledger[assetId] = asset;
  persistLedger(metadataPath, ledger);
  return asset;
}

if (import.meta.main) {
  const intent = process.argv[2] ?? 'demo-intent';
  const asset = generateGeminiAsset(intent);
  console.log(JSON.stringify(asset, null, 2));
}
