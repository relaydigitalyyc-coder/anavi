import { NOTIFICATIONS } from "@/lib/copy";
import { Shield, Target, FileText } from "lucide-react";

const NOTIFICATION_STYLES: Record<
  string,
  { border: string; badge: string; label: string }
> = {
  match_found: {
    border: "border-l-[#C4972A]",
    badge: "bg-[#C4972A]/15 text-[#C4972A]",
    label: NOTIFICATIONS.matchFound.label,
  },
  deal_update: {
    border: "border-l-[#2563EB]",
    badge: "bg-[#2563EB]/15 text-[#2563EB]",
    label: NOTIFICATIONS.dealUpdate.label,
  },
  payout_received: {
    border: "border-l-[#059669]",
    badge: "bg-[#059669]/15 text-[#059669]",
    label: NOTIFICATIONS.payoutReceived.label,
  },
  compliance_alert: {
    border: "border-l-[#1E3A5F]",
    badge: "bg-[#1E3A5F]/15 text-[#1E3A5F]",
    label: NOTIFICATIONS.complianceAlert.label,
  },
};

const DEFAULT_STYLE = {
  border: "border-l-[#0A1628]",
  badge: "bg-[#0A1628]/15 text-[#0A1628]",
  label: NOTIFICATIONS.system.label,
};

const MARKET_DEPTH = [
  { sector: "Solar", buyers: 47, sellers: 12 },
  { sector: "Oil & Gas", buyers: 23, sellers: 8 },
  { sector: "Real Estate", buyers: 34, sellers: 19 },
  { sector: "Infrastructure", buyers: 15, sellers: 6 },
];

// Updated PENDING_ACTIONS to reflect Compliance Status
const PENDING_ACTIONS = [
  {
    text: "Complete Enhanced Verification",
    Icon: Shield,
    type: "verification",
  },
  { text: "Review 3 new blind matches", Icon: Target, type: "match" },
  { text: "Sign NDA for Riyadh Solar JV", Icon: FileText, type: "deal" },
];

export { NOTIFICATION_STYLES, DEFAULT_STYLE, MARKET_DEPTH, PENDING_ACTIONS };