import * as React from "react";
import { Check, Lock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InlineProofChipProps {
  variant: "verified" | "sealed" | "attribution-locked" | "audit-trail";
  label?: string;
}

const variantConfig = {
  verified: {
    label: "Verified",
    badgeVariant: "success" as const,
    icon: <Check className="h-3 w-3" />,
  },
  sealed: {
    label: "Sealed",
    badgeVariant: "info" as const,
    icon: <Lock className="h-3 w-3" />,
  },
  "attribution-locked": {
    label: "Attribution Locked",
    badgeVariant: "warning" as const,
    icon: <Lock className="h-3 w-3" />,
  },
  "audit-trail": {
    label: "Audit Trail",
    badgeVariant: "warning" as const,
    icon: <Clock className="h-3 w-3" />,
  },
};

export function InlineProofChip({ variant, label }: InlineProofChipProps) {
  const config = variantConfig[variant];

  return (
    <Badge
      variant={config.badgeVariant}
      pill
      size="sm"
      icon={config.icon}
      iconPosition="left"
      className="px-2.5 py-1"
    >
      {label || config.label}
    </Badge>
  );
}
