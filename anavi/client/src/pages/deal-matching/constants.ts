// Constants used across deal-matching components

export const COLORS = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  red: "#DC2626",
  surface: "#F3F7FC",
  border: "#D1DCF0",
};

export const INTENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  buy: { label: "Buy", color: "#2563EB", bg: "#EFF6FF" },
  sell: { label: "Sell", color: "#059669", bg: "#ECFDF5" },
  invest: { label: "Invest", color: "#C4972A", bg: "#FFFBEB" },
  seek_investment: { label: "Raise", color: "#7C3AED", bg: "#F5F3FF" },
  partner: { label: "Partner", color: "#0A1628", bg: "#F1F5F9" },
};

export const ASSET_TYPES = [
  "Commodity",
  "Real Estate",
  "Equity",
  "Debt",
  "Infrastructure",
  "Renewable Energy",
  "Mining",
  "Oil & Gas",
  "Business",
  "Other",
] as const;

export const TIMELINES = [
  "Immediate",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
] as const;

export const VERIFICATION_TIERS = [
  "Any",
  "Basic",
  "Enhanced",
  "Institutional",
] as const;

export const MATCH_FREQUENCIES = [
  "Immediate",
  "Daily digest",
  "Weekly digest",
] as const;

export const LOCATION_OPTIONS = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "Asia Pacific",
  "Global",
];

export function formatCurrency(value: number | string | null | undefined): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}