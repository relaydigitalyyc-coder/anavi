/**
 * Shared utilities for mapping raw payout data from the API/demo fixtures.
 * Eliminates duplication between AttributionLedger.tsx and Portfolio.tsx.
 */

export interface RawPayout extends Record<string, unknown> {
  id: number;
  amount: number | string;
}

export interface MappedPayout {
  id: number;
  deal: string;
  amount: number;
  status: string;
  payoutType?: string;
  originatorShare?: number | null;
  irr?: number | null;
  vintage?: string | null;
}

/**
 * Map a raw payout object to a standardized MappedPayout.
 * Handles type coercion, default values, and field extraction.
 */
export function mapRawPayout(p: RawPayout): MappedPayout {
  const amount =
    typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount));
  
  const deal =
    "deal" in p && p.deal
      ? p.deal
      : `Deal #${"dealId" in p ? p.dealId : p.id}`;
  
  const status =
    "status" in p && p.status ? String(p.status) : "pending";
  
  const payoutType =
    "payoutType" in p && p.payoutType ? String(p.payoutType) : undefined;
  
  const originatorShare =
    "originatorShare" in p && typeof p.originatorShare === "number"
      ? p.originatorShare
      : undefined;
  
  const irr =
    "irr" in p && typeof p.irr === "number"
      ? p.irr
      : undefined;
  
  const vintage =
    "vintage" in p && typeof p.vintage === "string"
      ? p.vintage
      : undefined;

  return {
    id: p.id,
    deal: String(deal),
    amount,
    status,
    ...(payoutType && { payoutType }),
    ...(originatorShare !== undefined && { originatorShare }),
    ...(irr !== undefined && { irr }),
    ...(vintage !== undefined && { vintage }),
  };
}

/**
 * Map an array of raw payouts to standardized MappedPayout objects.
 */
export function mapRawPayouts(payouts: RawPayout[]): MappedPayout[] {
  return payouts.map(mapRawPayout);
}