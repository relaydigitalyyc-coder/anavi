import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface DecisionCardProps {
  title: string;
  primaryAction: string;
  onPrimaryAction: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  confidence: string;
  freshness: string;
  children?: React.ReactNode;
  className?: string;
}

export function DecisionCard({
  title,
  primaryAction,
  onPrimaryAction,
  secondaryAction,
  onSecondaryAction,
  confidence,
  freshness,
  children,
  className,
}: DecisionCardProps) {
  return (
    <Card className={cn("transition-all duration-200 ease-out hover:shadow-md motion-reduce:transition-none", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-[#0A1628]">{title}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Confidence:</span> {confidence}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-medium">Freshness:</span> {freshness}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        {children}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Button
            onClick={onPrimaryAction}
            className="bg-[#0A1628] hover:bg-[#1E3A5F] text-white transition-colors duration-200 ease-out motion-reduce:transition-none"
          >
            {primaryAction}
          </Button>
          
          {secondaryAction && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 ease-out motion-reduce:transition-none"
            >
              {secondaryAction}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Confidence: {confidence}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Freshness: {freshness}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}