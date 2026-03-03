import * as React from "react";
import { cn } from "@/lib/utils";

interface FlowRibbonProps {
  now: string;
  next: string;
  risk: string;
  valueAtStake: string;
  className?: string;
}

export function FlowRibbon({
  now,
  next,
  risk,
  valueAtStake,
  className,
}: FlowRibbonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-gradient-to-r from-[#0A1628] to-[#1E3A5F] rounded-lg border border-[#1E3A5F] shadow-sm transition-all duration-200 ease-out",
        "motion-reduce:transition-none",
        className
      )}
    >
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          Now
        </div>
        <div className="text-sm font-semibold text-white">{now}</div>
      </div>
      
      <div className="h-8 w-px bg-[#1E3A5F]" />
      
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          Next
        </div>
        <div className="text-sm font-semibold text-white">{next}</div>
      </div>
      
      <div className="h-8 w-px bg-[#1E3A5F]" />
      
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          Risk
        </div>
        <div className="text-sm font-semibold text-white">{risk}</div>
      </div>
      
      <div className="h-8 w-px bg-[#1E3A5F]" />
      
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          Value at Stake
        </div>
        <div className="text-sm font-semibold text-[#C4972A]">{valueAtStake}</div>
      </div>
    </div>
  );
}