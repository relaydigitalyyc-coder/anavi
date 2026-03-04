export const COLORS = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  red: "#DC2626",
  surface: "#F3F7FC",
  border: "#D1DCF0",
} as const;

export const SECTORS = [
  "Oil & Gas",
  "Solar",
  "Real Estate",
  "Mining",
  "Infrastructure",
  "M&A",
  "Other",
] as const;

export const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "Middle East",
  "Africa",
  "Latin America",
] as const;

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}
