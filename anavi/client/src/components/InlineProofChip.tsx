import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface InlineProofChipProps {
  variant: "verified" | "sealed" | "attribution-locked" | "audit-trail";
  label?: string;
}

const variantConfig = {
  verified: {
    label: "Verified",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  sealed: {
    label: "Sealed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  "attribution-locked": {
    label: "Attribution Locked",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  "audit-trail": {
    label: "Audit Trail",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
};

export function InlineProofChip({ variant, label }: InlineProofChipProps) {
  const config = variantConfig[variant];
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ease-out motion-reduce:transition-none",
        config.className
      )}
    >
      {config.icon}
      {label || config.label}
    </Badge>
  );
}