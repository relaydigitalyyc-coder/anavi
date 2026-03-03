import * as React from "react";
import { cn } from "@/lib/utils";

interface MicroKpiRailProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  threshold?: string;
  status?: "green" | "amber" | "red";
  className?: string;
}

const trendConfig = {
  up: {
    icon: (
      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ),
    className: "text-green-600",
  },
  down: {
    icon: (
      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    className: "text-red-600",
  },
  flat: {
    icon: (
      <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
    className: "text-gray-600",
  },
};

const statusConfig = {
  green: {
    className: "bg-green-100 text-green-800",
    dot: "bg-green-500",
  },
  amber: {
    className: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  red: {
    className: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
};

export function MicroKpiRail({
  label,
  value,
  trend,
  threshold,
  status,
  className,
}: MicroKpiRailProps) {
  const trendInfo = trend ? trendConfig[trend] : null;
  const statusInfo = status ? statusConfig[status] : null;
  
  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 ease-out hover:shadow-sm motion-reduce:transition-none",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-500 truncate">{label}</div>
        {statusInfo && (
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            statusInfo.className
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dot)} />
            {status?.toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-[#0A1628]">{value}</div>
        
        <div className="flex items-center gap-2">
          {trendInfo && (
            <div className={cn("flex items-center gap-1", trendInfo.className)}>
              {trendInfo.icon}
              <span className="text-xs font-medium">{trend}</span>
            </div>
          )}
          
          {threshold && (
            <div className="text-xs text-gray-500 font-medium">
              Threshold: {threshold}
            </div>
          )}
        </div>
      </div>
      
      {threshold && !trend && (
        <div className="text-xs text-gray-500 font-medium mt-1">
          Threshold: {threshold}
        </div>
      )}
    </div>
  );
}