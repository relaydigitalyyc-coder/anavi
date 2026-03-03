import { formatDistanceToNow } from "date-fns";
import { Building2, DollarSign, Pause, Play, Edit, Search } from "lucide-react";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { COLORS, INTENT_TYPE_CONFIG, formatCurrency } from "./constants";
import { StatusPill, LoadingSkeleton } from "./CompatibilityRing";

export function IntentsTab({
  intents,
  loading,
  onToggleStatus,
  onCreateIntent,
  onViewMatches,
}: {
  intents: any[];
  loading: boolean;
  onToggleStatus: (id: number, status: string) => void;
  onCreateIntent: () => void;
  onViewMatches: () => void;
}) {
  if (loading) return <LoadingSkeleton />;

  if (intents.length === 0) {
    return (
      <div className="py-12">
        <EmptyState {...EMPTY_STATES.intents} onCta={onCreateIntent} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {intents.map((intent: any) => {
        const cfg =
          INTENT_TYPE_CONFIG[intent.intentType] ?? INTENT_TYPE_CONFIG.buy;
        return (
          <div
            key={intent.id}
            className="card-elevated p-6 flex flex-col gap-4 transition-shadow hover:shadow-md"
          >
            {/* header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#C4972A]/15 text-[#C4972A] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {cfg.label}
                </span>
              </div>
              <StatusPill status={intent.status} />
            </div>

            <h3
              className="font-semibold text-base leading-tight line-clamp-1"
              style={{ color: COLORS.navy }}
            >
              {intent.title}
            </h3>

            {/* body */}
            <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
              {intent.description || "No description provided."}
            </p>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              {intent.assetType && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {intent.assetType}
                </span>
              )}
              {(intent.minValue || intent.maxValue) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatCurrency(intent.minValue)} –{" "}
                  {formatCurrency(intent.maxValue)}
                </span>
              )}
            </div>

            {/* footer */}
            <div
              className="flex items-center justify-between pt-3 mt-auto border-t text-xs text-gray-400"
              style={{ borderColor: COLORS.border }}
            >
              <span>
                {intent.createdAt
                  ? formatDistanceToNow(new Date(intent.createdAt), {
                      addSuffix: true,
                    })
                  : "—"}
              </span>
            </div>

            {/* actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onToggleStatus(intent.id, intent.status)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: COLORS.border, color: COLORS.navy }}
              >
                {intent.status === "active" ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Resume
                  </>
                )}
              </button>
              <button
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: COLORS.border, color: COLORS.navy }}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={onViewMatches}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: COLORS.blue }}
              >
                <Search className="w-3.5 h-3.5" /> Find Matches
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}