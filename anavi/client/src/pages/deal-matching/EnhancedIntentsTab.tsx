import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  DollarSign,
  Pause,
  Play,
  Edit,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  Plus,
} from "lucide-react";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COLORS,
  INTENT_TYPE_CONFIG,
  formatCurrency,
  ASSET_TYPES,
} from "./constants";
import { StatusPill, LoadingSkeleton } from "./CompatibilityRing";

interface EnhancedIntentsTabProps {
  intents: any[];
  loading: boolean;
  onToggleStatus: (id: number, status: string) => void;
  onCreateIntent: () => void;
  onViewMatches: () => void;
}

type IntentType =
  | "all"
  | "buy"
  | "sell"
  | "invest"
  | "seek_investment"
  | "partner";
type StatusFilter = "all" | "active" | "paused";

export function EnhancedIntentsTab({
  intents,
  loading,
  onToggleStatus,
  onCreateIntent,
  onViewMatches,
}: EnhancedIntentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [intentTypeFilter, setIntentTypeFilter] = useState<IntentType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredIntents = useMemo(() => {
    return intents.filter(intent => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = intent.title?.toLowerCase().includes(query);
        const matchesDescription = intent.description
          ?.toLowerCase()
          .includes(query);
        const matchesAssetType = intent.assetType
          ?.toLowerCase()
          .includes(query);
        if (!matchesTitle && !matchesDescription && !matchesAssetType) {
          return false;
        }
      }

      // Intent type filter
      if (
        intentTypeFilter !== "all" &&
        intent.intentType !== intentTypeFilter
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && intent.status !== statusFilter) {
        return false;
      }

      // Asset type filter
      if (assetTypeFilter !== "all" && intent.assetType !== assetTypeFilter) {
        return false;
      }

      return true;
    });
  }, [intents, searchQuery, intentTypeFilter, statusFilter, assetTypeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setIntentTypeFilter("all");
    setStatusFilter("all");
    setAssetTypeFilter("all");
  };

  const activeFilterCount = [
    searchQuery,
    intentTypeFilter !== "all",
    statusFilter !== "all",
    assetTypeFilter !== "all",
  ].filter(Boolean).length;

  if (loading) return <LoadingSkeleton />;

  if (intents.length === 0) {
    return (
      <div className="py-12">
        <EmptyState {...EMPTY_STATES.intents} onCta={onCreateIntent} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search intents by title, description, or asset type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 w-full md:w-80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button onClick={onCreateIntent} className="gap-2">
            <Plus className="h-4 w-4" />
            New Intent
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                Intent Type
              </label>
              <Select
                value={intentTypeFilter}
                onValueChange={value =>
                  setIntentTypeFilter(value as IntentType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(INTENT_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                Asset Type
              </label>
              <Select
                value={assetTypeFilter}
                onValueChange={setAssetTypeFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assets</SelectItem>
                  {ASSET_TYPES.map(type => (
                    <SelectItem
                      key={type}
                      value={type.toLowerCase().replace(/\s+/g, "_")}
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing{" "}
          <span className="font-semibold">{filteredIntents.length}</span> of{" "}
          <span className="font-semibold">{intents.length}</span> intents
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Intents grid */}
      {filteredIntents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-gray-500">No intents match your filters.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredIntents.map((intent: any) => {
            const cfg =
              INTENT_TYPE_CONFIG[intent.intentType] ?? INTENT_TYPE_CONFIG.buy;
            return (
              <div
                key={intent.id}
                className="card-elevated p-6 flex flex-col gap-4 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                {/* header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <StatusPill status={intent.status} />
                </div>

                <h3
                  className="font-semibold text-base leading-tight line-clamp-2"
                  style={{ color: COLORS.navy }}
                >
                  {intent.title}
                </h3>

                {/* body */}
                <p className="text-sm text-gray-600 line-clamp-3 min-h-[3.5rem]">
                  {intent.description || "No description provided."}
                </p>

                <div className="flex flex-wrap gap-2">
                  {intent.assetType && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {intent.assetType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {(intent.minValue || intent.maxValue) && (
                    <Badge variant="outline" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(intent.minValue)} –{" "}
                      {formatCurrency(intent.maxValue)}
                    </Badge>
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
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100">
                    ID: {intent.id}
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
                    <Search className="w-3.5 h-3.5" /> Matches
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
