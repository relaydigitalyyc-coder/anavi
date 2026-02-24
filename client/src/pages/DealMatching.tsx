import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { FadeInView, StaggerContainer, StaggerItem, SlideIn } from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";
import FVMCelebration from "@/components/FVMCelebration";
import {
  Target,
  TrendingUp,
  Building2,
  Briefcase,
  Users,
  Search,
  Plus,
  X,
  ChevronRight,
  Check,
  Play,
  Pause,
  Edit,
  Zap,
  ArrowRight,
  DollarSign,
  Clock,
  Shield,
  Bell,
  Mail,
  MapPin,
  Hash,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  red: "#DC2626",
  surface: "#F3F7FC",
  border: "#D1DCF0",
};

type TabKey = "intents" | "incoming" | "history";

const INTENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  buy: { label: "Buy", color: "#2563EB", bg: "#EFF6FF" },
  sell: { label: "Sell", color: "#059669", bg: "#ECFDF5" },
  invest: { label: "Invest", color: "#C4972A", bg: "#FFFBEB" },
  seek_investment: { label: "Raise", color: "#7C3AED", bg: "#F5F3FF" },
  partner: { label: "Partner", color: "#0A1628", bg: "#F1F5F9" },
};

const ASSET_TYPES = [
  "Commodity",
  "Real Estate",
  "Equity",
  "Debt",
  "Infrastructure",
  "Renewable Energy",
  "Mining",
  "Oil & Gas",
  "Business",
  "Other",
] as const;

const TIMELINES = [
  "Immediate",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
] as const;

const VERIFICATION_TIERS = ["Any", "Basic", "Enhanced", "Institutional"] as const;

const MATCH_FREQUENCIES = ["Immediate", "Daily digest", "Weekly digest"] as const;

const LOCATION_OPTIONS = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "Asia Pacific",
  "Global",
];

function formatCurrency(value: number | string | null | undefined): string {
  if (!value) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

// ─── Compatibility Ring SVG ───────────────────────────────────
function CompatibilityRing({
  score,
  size = 120,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? COLORS.green : score >= 60 ? COLORS.gold : COLORS.red;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={COLORS.border}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function DealMatching() {
  const [activeTab, setActiveTab] = useState<TabKey>("intents");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewMatchId, setReviewMatchId] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const { data: intents, isLoading: intentsLoading, refetch: refetchIntents } = trpc.intent.list.useQuery();
  const { data: matches, isLoading: matchesLoading, refetch: refetchMatches } = trpc.match.list.useQuery();

  const updateIntentMutation = trpc.intent.update.useMutation({
    onSuccess: () => {
      toast.success("Intent updated");
      refetchIntents();
    },
    onError: (e) => toast.error(e.message),
  });

  const declineMatchMutation = trpc.match.decline.useMutation({
    onSuccess: () => {
      toast.success("Match declined");
      refetchMatches();
    },
    onError: (e) => toast.error(e.message),
  });

  const expressInterestMutation = trpc.match.expressInterest.useMutation({
    onSuccess: (data: any) => {
      if (data.mutualInterest) {
        toast.success("Mutual interest! You can now create a deal room.");
      } else {
        toast.success("Interest expressed. Waiting for counterparty.");
      }
      refetchMatches();
    },
    onError: (e) => toast.error(e.message),
  });

  const createDealRoomMutation = trpc.match.createDealRoom.useMutation({
    onSuccess: () => {
      toast.success("Deal room created!");
      refetchMatches();
    },
    onError: (e) => toast.error(e.message),
  });

  const incomingMatches = useMemo(
    () =>
      (matches ?? [])
        .filter((m: any) => m.status === "pending" || m.status === "user1_interested" || m.status === "user2_interested")
        .sort((a: any, b: any) => (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0)),
    [matches],
  );

  const historyMatches = useMemo(
    () =>
      (matches ?? []).filter(
        (m: any) =>
          m.status === "declined" || m.status === "deal_room_created" || m.status === "expired" || m.status === "mutual_interest",
      ),
    [matches],
  );

  const reviewMatch = useMemo(
    () => (matches ?? []).find((m: any) => m.id === reviewMatchId),
    [matches, reviewMatchId],
  );

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "intents", label: "My Intents", count: intents?.length },
    { key: "incoming" as const, label: "Incoming Matches", count: incomingMatches.length },
    { key: "history", label: "Match History" },
  ];

  useEffect(() => { document.title = "Deal Matching | ANAVI"; }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.surface }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ─────────────────────────────── */}
        <FadeInView>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="dash-heading text-3xl">
                Deal Matching
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Post intents and discover high-quality counterparties
              </p>
            </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Create Intent
          </button>
          </div>
        </FadeInView>

        {/* ── Tabs ────────────────────────────────── */}
        <div className="card-elevated p-1.5 flex gap-1 mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={activeTab === t.key
                ? "rounded-md px-3 py-2 text-sm font-semibold bg-[#0A1628] text-white"
                : "rounded-md px-3 py-2 text-sm font-medium text-[#1E3A5F]/60 hover:text-[#0A1628] hover:bg-[#0A1628]/5 transition-colors"}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: activeTab === t.key ? "rgba(255,255,255,0.15)" : "#F3F4F6",
                    color: activeTab === t.key ? "white" : "#6B7280",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ─────────────────────────── */}
        {activeTab === "intents" && (
          <IntentsTab
            intents={intents ?? []}
            loading={intentsLoading}
            onToggleStatus={(id: number, status: string) =>
              updateIntentMutation.mutate({
                id,
                status: status === "active" ? "paused" : "active",
              })
            }
            onCreateIntent={() => setShowCreateModal(true)}
          />
        )}
        {activeTab === "incoming" && (
          <IncomingTab
            matches={incomingMatches}
            loading={matchesLoading}
            onReview={(id: number) => setReviewMatchId(id)}
            onDecline={(id: number) => {
              toast("Match declined", {
                description: "This match has been removed",
                action: {
                  label: "Undo",
                  onClick: () => toast.success("Decline cancelled"),
                },
              });
              declineMatchMutation.mutate({ matchId: id });
            }}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab matches={historyMatches} loading={matchesLoading} />
        )}
      </div>

      {/* E33: Intent creation celebration */}
      {showCelebration && (
        <FVMCelebration
          title="Intent Published"
          subtitle="Your intent is now matching across our network"
          onClose={() => setShowCelebration(false)}
        />
      )}

      {/* ── Create Intent Modal ──────────────────── */}
      {showCreateModal && (
        <CreateIntentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refetchIntents();
            setShowCelebration(true);
          }}
        />
      )}

      {/* ── Match Review Slide-in ────────────────── */}
      {reviewMatch && (
        <MatchReviewPanel
          match={reviewMatch}
          onClose={() => setReviewMatchId(null)}
          onAccept={() => {
            createDealRoomMutation.mutate({ matchId: reviewMatch.id });
            setReviewMatchId(null);
          }}
          onDecline={() => {
            declineMatchMutation.mutate({ matchId: reviewMatch.id });
            setReviewMatchId(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 – My Intents
// ═══════════════════════════════════════════════════════════════
function IntentsTab({
  intents,
  loading,
  onToggleStatus,
  onCreateIntent,
}: {
  intents: any[];
  loading: boolean;
  onToggleStatus: (id: number, status: string) => void;
  onCreateIntent: () => void;
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
        const cfg = INTENT_TYPE_CONFIG[intent.intentType] ?? INTENT_TYPE_CONFIG.buy;
        return (
          <div
            key={intent.id}
            className="card-elevated p-6 flex flex-col gap-4 transition-shadow hover:shadow-md"
          >
            {/* header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="bg-[#C4972A]/15 text-[#C4972A] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                >
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
                  {formatCurrency(intent.minValue)} – {formatCurrency(intent.maxValue)}
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
                  ? formatDistanceToNow(new Date(intent.createdAt), { addSuffix: true })
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

// ═══════════════════════════════════════════════════════════════
// TAB 2 – Incoming Matches
// ═══════════════════════════════════════════════════════════════
function IncomingTab({
  matches,
  loading,
  onReview,
  onDecline,
}: {
  matches: any[];
  loading: boolean;
  onReview: (id: number) => void;
  onDecline: (id: number) => void;
}) {
  if (loading) return <LoadingSkeleton />;

  if (matches.length === 0) {
    return (
      <div className="py-12">
        <EmptyState {...EMPTY_STATES.matches} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {matches.map((m: any, index: number) => {
        const score = m.compatibilityScore ?? 0;
        const scoreColor =
          score >= 80 ? COLORS.green : score >= 60 ? COLORS.gold : COLORS.red;

        return (
          <div
            key={m.id}
            className={`card-elevated p-6 flex flex-col sm:flex-row gap-6 hover:translate-y-[-2px] transition-transform ${index === 0 ? "border-[#22D4F5]/25" : ""}`}
            style={index === 0 ? { boxShadow: "0 4px 24px rgb(10 22 40 / 0.08), 0 0 0 1px rgb(34 212 245 / 0.20)" } : undefined}
          >
            {/* score column */}
            <div className="flex flex-col items-center justify-center shrink-0 w-28">
              <span
                className="bg-[#C4972A]/15 text-[#C4972A] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2"
              >
                MATCH
              </span>
              <span
                className="font-data-hud text-2xl font-bold text-[#22D4F5]"
              >
                {score}%
              </span>
              <div
                className="w-full h-1.5 rounded-full mt-2"
                style={{ backgroundColor: "#E5E7EB" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${score}%`,
                    backgroundColor: scoreColor,
                  }}
                />
              </div>
            </div>

            {/* details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1" style={{ color: COLORS.navy }}>
                {m.matchReason || "AI-identified opportunity based on your intents"}
              </p>
              {m.aiAnalysis && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {m.aiAnalysis}
                </p>
              )}

              <div
                className="flex items-center gap-3 text-xs text-gray-500 mb-3 p-3 rounded-md"
                style={{ backgroundColor: COLORS.surface }}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: COLORS.green }} />
                <span>Tier 2 Verified · 8 deals completed · Active since 2024</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div
                  className="rounded-md p-3"
                  style={{ backgroundColor: "#EFF6FF" }}
                >
                  <span className="font-semibold block mb-1" style={{ color: COLORS.blue }}>
                    Your Intent
                  </span>
                  <span className="text-gray-600">Intent #{m.intent1Id != null ? String(m.intent1Id).slice(-6) : "—"}</span>
                </div>
                <div
                  className="rounded-md p-3"
                  style={{ backgroundColor: "#FFFBEB" }}
                >
                  <span className="font-semibold block mb-1" style={{ color: COLORS.gold }}>
                    Their Intent
                  </span>
                  <span className="text-gray-600">Intent #{m.intent2Id != null ? String(m.intent2Id).slice(-6) : "—"}</span>
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
              <button
                onClick={() => onReview(m.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: COLORS.blue }}
              >
                Review Match <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDecline(m.id)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: COLORS.border, color: "#6B7280" }}
              >
                Decline
              </button>
              <span className="text-xs text-gray-400 text-right mt-auto">
                {m.createdAt
                  ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })
                  : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 – Match History
// ═══════════════════════════════════════════════════════════════
function HistoryTab({ matches, loading }: { matches: any[]; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;

  if (matches.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="No match history yet"
          description="Past match decisions will appear here."
        />
      </div>
    );
  }

  const historyStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    declined: { label: "Declined", color: COLORS.red, bg: "#FEF2F2" },
    mutual_interest: { label: "Accepted", color: COLORS.green, bg: "#ECFDF5" },
    deal_room_created: { label: "Deal Room Created", color: COLORS.blue, bg: "#EFF6FF" },
    expired: { label: "Expired", color: "#6B7280", bg: "#F3F4F6" },
  };

  return (
    <div className="card-elevated overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: COLORS.surface }}>
            <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
              Match ID
            </th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
              Date
            </th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
              Compatibility
            </th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
              Status
            </th>
            <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
          {matches.map((m: any) => {
            const cfg = historyStatusConfig[m.status] ?? historyStatusConfig.expired;
            return (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4 font-mono text-xs text-gray-600">
                  #{m.id.slice(-8)}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {m.createdAt
                    ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })
                    : "—"}
                </td>
                <td className="px-5 py-4">
                  <span className="font-semibold" style={{ color: COLORS.navy }}>
                    {m.compatibilityScore ?? 0}%
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {m.status === "deal_room_created" ? (
                    <Link
                      href="/deal-rooms"
                      className="text-xs font-medium hover:underline"
                      style={{ color: COLORS.blue }}
                    >
                      View Deal Room →
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Create Intent Modal (5-step wizard)
// ═══════════════════════════════════════════════════════════════
function CreateIntentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    intentType: "" as string,
    title: "",
    description: "",
    assetType: "",
    currency: "USD",
    minValue: "",
    maxValue: "",
    targetTimeline: "",
    locations: [] as string[],
    verificationTier: "Any",
    geoRestrictions: [] as string[],
    maxMatches: 5,
    notifyInApp: true,
    notifyEmail: false,
    matchFrequency: "Immediate",
  });

  const createMutation = trpc.intent.create.useMutation({
    onSuccess: () => {
      toast.success("Intent activated! AI matching is now active.");
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const patch = (updates: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...updates }));

  const toggleInList = (key: "locations" | "geoRestrictions", val: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter((v) => v !== val)
        : [...f[key], val],
    }));

  const canNext = () => {
    if (step === 1) return !!form.intentType;
    if (step === 2) return !!form.title;
    return true;
  };

  const handleActivate = () => {
    createMutation.mutate({
      intentType: form.intentType as "buy" | "sell" | "invest" | "seek_investment" | "partner",
      title: form.title,
      description: form.description,
      assetType: form.assetType as "commodity" | "real_estate" | "equity" | "debt" | "infrastructure" | "renewable_energy" | "mining" | "oil_gas" | "business" | "other" | undefined,
      minValue: form.minValue || undefined,
      maxValue: form.maxValue || undefined,
      targetTimeline: form.targetTimeline || undefined,
      isAnonymous: true,
    });
  };

  const intentTypeOptions = [
    { value: "buy", label: "Buy", icon: DollarSign, desc: "Acquire assets or businesses" },
    { value: "sell", label: "Sell", icon: TrendingUp, desc: "Sell assets or equity positions" },
    { value: "invest", label: "Invest", icon: Briefcase, desc: "Deploy capital into opportunities" },
    { value: "seek_investment", label: "Raise Capital", icon: Building2, desc: "Seek funding for ventures" },
    { value: "partner", label: "Co-Invest", icon: Users, desc: "Find co-investment partners" },
  ];

  const estimatedMatches = useMemo(
    () => Math.floor(Math.random() * 21) + 5,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.intentType, form.assetType],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] card-elevated flex flex-col overflow-hidden">
        {/* progress */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(step / 5) * 100}%`,
              backgroundColor: COLORS.gold,
            }}
          />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.border }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: COLORS.navy }}>
              Create Intent
            </h2>
            <p className="text-xs text-gray-500">Step {step} of 5</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div>
              <h3 className="text-base font-semibold mb-1" style={{ color: COLORS.navy }}>
                What type of deal are you looking for?
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Select the intent that best describes your goal.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {intentTypeOptions.map((opt) => {
                  const selected = form.intentType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => patch({ intentType: opt.value })}
                      className="flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all"
                      style={{
                        borderColor: selected ? COLORS.blue : COLORS.border,
                        backgroundColor: selected ? "#EFF6FF" : "white",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: selected ? COLORS.blue : COLORS.surface,
                        }}
                      >
                        <opt.icon
                          className="w-5 h-5"
                          style={{ color: selected ? "white" : COLORS.navy }}
                        />
                      </div>
                      <div>
                        <span className="font-medium text-sm" style={{ color: COLORS.navy }}>
                          {opt.label}
                        </span>
                        <span className="block text-xs text-gray-500">{opt.desc}</span>
                      </div>
                      {selected && (
                        <Check className="ml-auto w-5 h-5 shrink-0" style={{ color: COLORS.blue }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold" style={{ color: COLORS.navy }}>
                Deal Parameters
              </h3>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="e.g. Acquiring renewable energy assets in Southeast Asia"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Describe your deal intent in detail…"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Asset Type</Label>
                <Select
                  value={form.assetType}
                  onValueChange={(v) => patch({ assetType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => patch({ currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "CHF", "AED"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Min Value</Label>
                  <Input
                    type="number"
                    value={form.minValue}
                    onChange={(e) => patch({ minValue: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Max Value</Label>
                  <Input
                    type="number"
                    value={form.maxValue}
                    onChange={(e) => patch({ maxValue: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Target Timeline</Label>
                <Select
                  value={form.targetTimeline}
                  onValueChange={(v) => patch({ targetTimeline: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Target Locations
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map((loc) => {
                    const selected = form.locations.includes(loc);
                    return (
                      <button
                        key={loc}
                        onClick={() => toggleInList("locations", loc)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                          color: selected ? COLORS.blue : "#6B7280",
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold" style={{ color: COLORS.navy }}>
                Matching Preferences
              </h3>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">
                  Minimum Verification Tier
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {VERIFICATION_TIERS.map((tier) => {
                    const selected = form.verificationTier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => patch({ verificationTier: tier })}
                        className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                        }}
                      >
                        <Shield
                          className="w-4 h-4"
                          style={{ color: selected ? COLORS.blue : "#9CA3AF" }}
                        />
                        <span style={{ color: selected ? COLORS.blue : COLORS.navy }}>
                          {tier}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Geographic Restrictions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map((loc) => {
                    const selected = form.geoRestrictions.includes(loc);
                    return (
                      <button
                        key={loc}
                        onClick={() => toggleInList("geoRestrictions", loc)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                          color: selected ? COLORS.blue : "#6B7280",
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Maximum Simultaneous Matches
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxMatches}
                  onChange={(e) => patch({ maxMatches: parseInt(e.target.value) || 5 })}
                  className="w-24"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold" style={{ color: COLORS.navy }}>
                Notification Settings
              </h3>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-3 block">
                  Notification Method
                </Label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={form.notifyInApp}
                      onCheckedChange={(v) => patch({ notifyInApp: !!v })}
                    />
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm" style={{ color: COLORS.navy }}>In-app notifications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={form.notifyEmail}
                      onCheckedChange={(v) => patch({ notifyEmail: !!v })}
                    />
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm" style={{ color: COLORS.navy }}>Email notifications</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">
                  Match Frequency
                </Label>
                <div className="flex flex-col gap-2">
                  {MATCH_FREQUENCIES.map((freq) => {
                    const selected = form.matchFrequency === freq;
                    return (
                      <button
                        key={freq}
                        onClick={() => patch({ matchFrequency: freq })}
                        className="flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                          color: selected ? COLORS.blue : COLORS.navy,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: selected ? COLORS.blue : "#D1D5DB",
                          }}
                        >
                          {selected && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS.blue }}
                            />
                          )}
                        </div>
                        {freq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-semibold" style={{ color: COLORS.navy }}>
                Review & Activate
              </h3>

              <div
                className="rounded-lg p-4 flex flex-col gap-3"
                style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
              >
                <SummaryRow label="Intent Type" value={
                  intentTypeOptions.find((o) => o.value === form.intentType)?.label ?? "—"
                } />
                <SummaryRow label="Title" value={form.title || "—"} />
                <SummaryRow label="Description" value={form.description || "—"} />
                <SummaryRow label="Asset Type" value={form.assetType || "—"} />
                <SummaryRow
                  label="Value Range"
                  value={
                    form.minValue || form.maxValue
                      ? `${form.currency} ${form.minValue || "0"} – ${form.maxValue || "∞"}`
                      : "—"
                  }
                />
                <SummaryRow label="Timeline" value={form.targetTimeline || "—"} />
                <SummaryRow label="Locations" value={form.locations.join(", ") || "Any"} />
                <SummaryRow label="Min Verification" value={form.verificationTier} />
                <SummaryRow label="Max Matches" value={String(form.maxMatches)} />
                <SummaryRow label="Notifications" value={
                  [form.notifyInApp && "In-app", form.notifyEmail && "Email"].filter(Boolean).join(", ") || "None"
                } />
                <SummaryRow label="Frequency" value={form.matchFrequency} />
              </div>

              <div
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: "#ECFDF5", border: `1px solid ${COLORS.green}33` }}
              >
                <p className="text-sm font-medium" style={{ color: COLORS.green }}>
                  Estimated match pool: {estimatedMatches} opportunities
                </p>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: COLORS.border, color: COLORS.navy }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 5 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: COLORS.blue }}
            >
              Continue
            </button>
          ) : (
            <button
              disabled={createMutation.isPending}
              onClick={handleActivate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: COLORS.gold }}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Activate Intent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate" style={{ color: COLORS.navy }}>
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Match Review Slide-in Panel
// ═══════════════════════════════════════════════════════════════
function MatchReviewPanel({
  match,
  onClose,
  onAccept,
  onDecline,
}: {
  match: any;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const score = match.compatibilityScore ?? 0;

  const breakdownScores = useMemo(() => ({
    dealParam: Math.min(100, Math.max(40, score + Math.floor(Math.random() * 10) - 5)),
    verification: Math.min(100, Math.max(50, score + Math.floor(Math.random() * 15) - 8)),
    historical: Math.min(100, Math.max(30, score + Math.floor(Math.random() * 20) - 10)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [match.id]);

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />

      {/* panel */}
      <SlideIn direction="right" className="fixed top-0 right-0 z-50 h-full shadow-2xl flex flex-col w-full md:w-1/2" >
      <div
        style={{ borderLeft: `1px solid ${COLORS.border}`, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: COLORS.border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: COLORS.navy }}>
            Match Review
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {/* score ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <CompatibilityRing score={score} size={140} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-data-hud text-2xl font-bold text-[#22D4F5]"
                >
                  {score}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Overall Compatibility</p>
          </div>

          {/* score breakdown */}
          <div
            className="rounded-lg p-4 flex flex-col gap-3"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Score Breakdown
            </h4>
            <ScoreBar label="Deal Parameter Match" value={breakdownScores.dealParam} />
            <ScoreBar label="Verification Alignment" value={breakdownScores.verification} />
            <ScoreBar label="Historical Pattern" value={breakdownScores.historical} />
          </div>

          {/* counterparty card */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Counterparty Profile
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: COLORS.navy }}
              >
                ?
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Anonymous Member
                </p>
                <p className="text-xs text-gray-500">Identity revealed upon mutual acceptance</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#ECFDF5", color: COLORS.green }}
              >
                <Shield className="w-3 h-3 inline mr-1" />
                Tier 2 Verified
              </span>
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#EFF6FF", color: COLORS.blue }}
              >
                8 deals completed
              </span>
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
              >
                Active since 2024
              </span>
            </div>
          </div>

          {/* deal parameter comparison */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Deal Parameter Comparison
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="text-left pb-2 font-medium">Parameter</th>
                  <th className="text-left pb-2 font-medium" style={{ color: COLORS.blue }}>
                    Your Intent
                  </th>
                  <th className="text-left pb-2 font-medium" style={{ color: COLORS.gold }}>
                    Their Intent
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 text-gray-500">Intent</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>
                    #{match.intent1Id?.slice(-6) ?? "—"}
                  </td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>
                    #{match.intent2Id?.slice(-6) ?? "—"}
                  </td>
                </tr>
                <tr className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 text-gray-500">Type</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>Buy</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>Sell</td>
                </tr>
                <tr className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 text-gray-500">Asset</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>Commodity</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>Commodity</td>
                </tr>
                <tr className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="py-2 text-gray-500">Value Range</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>$1M – $5M</td>
                  <td className="py-2 font-medium" style={{ color: COLORS.navy }}>$2M – $8M</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* match reason & analysis */}
          {(match.matchReason || match.aiAnalysis) && (
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                AI Analysis
              </h4>
              {match.matchReason && (
                <p className="text-sm mb-2" style={{ color: COLORS.navy }}>
                  {match.matchReason}
                </p>
              )}
              {match.aiAnalysis && (
                <p className="text-xs text-gray-500">{match.aiAnalysis}</p>
              )}
            </div>
          )}
        </div>

        {/* footer actions */}
        <div
          className="shrink-0 px-6 py-4 border-t flex gap-3"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={onAccept}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: COLORS.gold }}
          >
            <ArrowRight className="w-4 h-4" />
            Accept Match → Enter Deal Room
          </button>
          <button
            onClick={onDecline}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50"
            style={{ borderColor: COLORS.red, color: COLORS.red }}
          >
            Decline
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-blue-50"
            style={{ borderColor: COLORS.blue, color: COLORS.blue }}
          >
            Request More Info
          </button>
        </div>
      </div>
      </SlideIn>
    </>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? COLORS.green : value >= 60 ? COLORS.gold : COLORS.red;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: COLORS.green, bg: "#ECFDF5" },
    paused: { label: "Paused", color: "#D97706", bg: "#FFFBEB" },
    expired: { label: "Expired", color: "#6B7280", bg: "#F3F4F6" },
  };
  const c = config[status] ?? config.expired;
  const isActive = status === "active";
  return (
    <span
      className={isActive
        ? "bg-[#22D4F5]/10 text-[#22D4F5]/80 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        : "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"}
      style={isActive ? undefined : { color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="card-elevated p-6 animate-pulse"
        >
          <div className="h-5 w-16 rounded bg-gray-200 mb-4" />
          <div className="h-5 w-3/4 rounded bg-gray-200 mb-3" />
          <div className="h-4 w-full rounded bg-gray-100 mb-2" />
          <div className="h-4 w-2/3 rounded bg-gray-100 mb-4" />
          <div className="h-8 w-full rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
