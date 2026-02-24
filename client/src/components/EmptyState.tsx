import {
  Bell,
  FolderOpen,
  Shield,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import React from "react";
import { Link } from "wouter";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
}: EmptyStateProps) {
  const ctaButton = ctaLabel ? (
    <button
      onClick={onCta}
      className="mt-4 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
      style={{ backgroundColor: "#C4972A" }}
    >
      {ctaLabel}
    </button>
  ) : null;

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0A1628]/8 text-[#1E3A5F]/60">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#0A1628]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[#1E3A5F]/60">{description}</p>
      {ctaButton && (onCta ? (
        ctaButton
      ) : ctaHref ? (
        <Link href={ctaHref}>{ctaButton}</Link>
      ) : (
        ctaButton
      ))}
    </div>
  );
}

export const EMPTY_STATES = {
  relationships: {
    icon: <Shield className="h-6 w-6" />,
    title: "Protect Your First Relationship",
    description:
      "Upload a contact to create your first custody-protected relationship. Your introductions become lifetime assets.",
    ctaLabel: "Protect a Relationship",
    ctaHref: "/relationships",
  },
  intents: {
    icon: <Target className="h-6 w-6" />,
    title: "Post Your First Intent",
    description:
      "Tell us what you are looking for or offering. Our matching engine finds compatible counterparties automatically.",
    ctaLabel: "Create Intent",
    ctaHref: "/deal-matching",
  },
  matches: {
    icon: <Zap className="h-6 w-6" />,
    title: "No Matches Yet",
    description:
      "Create an intent to start receiving qualified matches. The more specific your intent, the better your matches.",
    ctaLabel: "Create Intent",
    ctaHref: "/deal-matching",
  },
  dealRooms: {
    icon: <FolderOpen className="h-6 w-6" />,
    title: "No Active Deal Rooms",
    description:
      "Deal rooms open automatically when you and a counterparty accept a match. Create an intent to get started.",
    ctaLabel: "View Matches",
    ctaHref: "/deal-matching",
  },
  payouts: {
    icon: <Wallet className="h-6 w-6" />,
    title: "No Payouts Yet",
    description:
      "Your first attribution will appear here when a deal involving your custodied relationships closes.",
  },
  notifications: {
    icon: <Bell className="h-6 w-6" />,
    title: "No Activity Yet",
    description:
      "Create your first intent to start receiving match notifications, deal updates, and attribution events.",
    ctaLabel: "Create Intent",
    ctaHref: "/deal-matching",
  },
} as const;

export default EmptyState;
