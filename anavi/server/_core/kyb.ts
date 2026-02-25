import axios from "axios";

const OPENCORPORATES_BASE = "https://api.opencorporates.com/v0.4";

export interface KybResult {
  found: boolean;
  status: string;
  name?: string;
  jurisdictionCode?: string;
}

/**
 * Queries the OpenCorporates free API to verify a company exists.
 */
export async function checkOpenCorporates(
  companyName: string,
  jurisdiction: string
): Promise<KybResult> {
  try {
    const response = await axios.get(`${OPENCORPORATES_BASE}/companies/search`, {
      params: {
        q: companyName,
        jurisdiction_code: jurisdiction,
      },
      timeout: 15_000,
    });

    const companies: any[] = response.data?.results?.companies ?? [];

    if (companies.length === 0) {
      return { found: false, status: "unknown" };
    }

    const first = companies[0]?.company;
    return {
      found: true,
      status: first?.current_status ?? "Active",
      name: first?.name,
      jurisdictionCode: first?.jurisdiction_code,
    };
  } catch (err) {
    console.error("[KYB] OpenCorporates lookup failed:", err);
    return { found: false, status: "error" };
  }
}
