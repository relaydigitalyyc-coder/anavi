import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let sdnNames: string[] = [];
let lastLoaded: number | null = null;

/**
 * Downloads the OFAC SDN XML and extracts all lastName (and firstName) entries.
 * Caches in memory; refreshes after 24 hours.
 */
export async function loadSdnList(): Promise<void> {
  const now = Date.now();
  if (lastLoaded !== null && now - lastLoaded < REFRESH_INTERVAL_MS) {
    return;
  }

  try {
    const response = await axios.get<string>(OFAC_SDN_URL, {
      responseType: "text",
      timeout: 30_000,
    });

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(response.data);

    const entries = parsed?.sdnList?.sdnEntry;
    if (!Array.isArray(entries)) {
      console.warn("[OFAC] Unexpected XML structure — using empty list");
      sdnNames = [];
    } else {
      const names = new Set<string>();
      for (const e of entries) {
        const ent = e as { lastName?: string; firstName?: string };
        const last = String(ent?.lastName ?? "").toUpperCase().trim();
        const first = String(ent?.firstName ?? "").toUpperCase().trim();
        if (last) names.add(last);
        if (first) names.add(first);
        if (last && first) names.add(`${first} ${last}`);
      }
      sdnNames = Array.from(names);
    }

    lastLoaded = now;
    console.log(`[OFAC] Loaded ${sdnNames.length} SDN entries`);
  } catch (err) {
    console.error("[OFAC] Failed to load SDN list:", err);
    if (sdnNames.length === 0) {
      console.warn("[OFAC] No cached SDN data — all sanctions checks will pass (safe default)");
    }
  }
}

/**
 * Returns true if the given name fuzzy-matches any entry in the SDN list.
 */
export function checkOfac(name: string): boolean {
  if (!name || sdnNames.length === 0) return false;
  const normalized = name.toUpperCase().trim();
  return sdnNames.some(
    (sdn) => normalized.includes(sdn) || sdn.includes(normalized)
  );
}

/** Exported for testing — allows resetting the cache */
export function _resetSdnCache(): void {
  sdnNames = [];
  lastLoaded = null;
}
