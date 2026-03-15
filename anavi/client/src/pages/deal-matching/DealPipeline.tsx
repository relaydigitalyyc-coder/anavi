import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineStage {
  id: string;
  label: string;
  color: string;
  description?: string;
}

interface DealPipelineProps {
  currentStage: string;
  stages: PipelineStage[];
  onStageClick?: (stageId: string) => void;
  className?: string;
  showDescriptions?: boolean;
}

export function DealPipeline({
  currentStage,
  stages,
  onStageClick,
  className,
  showDescriptions = false,
}: DealPipelineProps) {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);
  const isCompleted = (stageId: string) => {
    const stageIndex = stages.findIndex(s => s.id === stageId);
    return stageIndex < currentIndex;
  };
  const isCurrent = (stageId: string) => stageId === currentStage;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop pipeline */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
          <div
            className="absolute left-0 top-1/2 h-0.5 bg-blue-500 -translate-y-1/2 z-10 transition-all duration-500"
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />

          {stages.map((stage, index) => {
            const completed = isCompleted(stage.id);
            const current = isCurrent(stage.id);
            const status = completed ? "completed" : current ? "current" : "pending";

            return (
              <div key={stage.id} className="flex flex-col items-center relative z-20">
                <button
                  type="button"
                  onClick={() => onStageClick?.(stage.id)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                    completed
                      ? "bg-blue-500 border-blue-500 text-white"
                      : current
                      ? "bg-white border-blue-500 text-blue-500"
                      : "bg-white border-gray-300 text-gray-400"
                  )}
                  aria-label={`Stage: ${stage.label}, ${status}`}
                  disabled={!onStageClick}
                >
                  {completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <div className={cn(
                    "text-sm font-medium transition-colors",
                    completed || current
                      ? "text-gray-900"
                      : "text-gray-500"
                  )}>
                    {stage.label}
                  </div>
                  {showDescriptions && stage.description && (
                    <div className="text-xs text-gray-500 mt-1 max-w-[120px]">
                      {stage.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile pipeline */}
      <div className="md:hidden space-y-4">
        {stages.map((stage, index) => {
          const completed = isCompleted(stage.id);
          const current = isCurrent(stage.id);
          const status = completed ? "completed" : current ? "current" : "pending";

          return (
            <div key={stage.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStageClick?.(stage.id)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 shrink-0",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                    completed
                      ? "bg-blue-500 border-blue-500 text-white"
                      : current
                      ? "bg-white border-blue-500 text-blue-500"
                      : "bg-white border-gray-300 text-gray-400"
                  )}
                  aria-label={`Stage: ${stage.label}, ${status}`}
                  disabled={!onStageClick}
                >
                  {completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {index < stages.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-8 mt-2 transition-colors",
                    completed ? "bg-blue-500" : "bg-gray-200"
                  )} />
                )}
              </div>

              <div className="pt-1">
                <div className={cn(
                  "text-sm font-medium transition-colors",
                  completed || current
                    ? "text-gray-900"
                    : "text-gray-500"
                )}>
                  {stage.label}
                </div>
                {showDescriptions && stage.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {stage.description}
                  </div>
                )}
                {current && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    Current stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}