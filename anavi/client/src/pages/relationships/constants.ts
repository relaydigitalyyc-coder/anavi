import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Globe,
  Users,
} from "lucide-react";

export const COLORS = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  surface: "#F3F7FC",
  border: "#D1DCF0",
};

export const SECTORS = [
  "Oil & Gas",
  "Solar",
  "Real Estate",
  "Mining",
  "Infrastructure",
  "M&A",
  "Other",
];
export const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "Middle East",
  "Africa",
  "Latin America",
];
export const REL_TYPES = [
  { value: "buyer", label: "Buyer", icon: Briefcase },
  { value: "seller", label: "Seller", icon: TrendingUp },
  { value: "investor", label: "Investor", icon: DollarSign },
  { value: "developer", label: "Developer", icon: Globe },
  { value: "other", label: "Other", icon: Users },
] as const;

export const VERIFICATION_LEVELS = [
  "Basic contact info",
  "Business verified",
  "Financial verified",
  "Fully documented",
];

export function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function generateFakeHash() {
  const chars = "abcdef0123456789";
  return Array.from(
    { length: 64 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}