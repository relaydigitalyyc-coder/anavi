import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { FadeInView } from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";
import FVMCelebration from "@/components/FVMCelebration";
import { Plus } from "lucide-react";
import { COLORS } from "./constants";
import { IntentsTab } from "./IntentsTab";
import { IncomingTab } from "./IncomingTab";
import { HistoryTab } from "./HistoryTab";
import { CreateIntentModal } from "./CreateIntentModal";
import { MatchReviewPanel } from "./MatchReviewPanel";
import { useDemoFixtures } from "@/contexts/DemoContext";

type TabKey = "intents" | "incoming" | "history";

export default function DealMatching() {
  const [, setLocation] = useLocation();
  const demo = useDemoFixtures();
  const isDemo = !!demo;
  const [activeTab, setActiveTab] = useState<TabKey>("intents");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewMatchId, setReviewMatchId] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    data: liveIntents,
    isLoading: liveIntentsLoading,
    refetch: refetchIntents,
  } = trpc.intent.list.useQuery(undefined, { enabled: !isDemo });
  const {
    data: liveMatches,
    isLoading: liveMatchesLoading,
    refetch: refetchMatches,
  } = trpc.match.list.useQuery(undefined, { enabled: !isDemo });

  const demoIntents = useMemo(() => {
    if (!demo) return [];
    return (demo.intents as unknown as Record<string, unknown>[]).map(
      (r, i) => ({
        id: Number(r.id),
        intentType: String(r.type ?? "buy"),
        title: `${r.type === "sell" ? "Offering" : "Seeking"}: ${r.assetClass ?? "Private Markets"} — ${r.size ?? "TBD"}`,
        description: `Blind intent for ${r.assetClass} opportunities`,
        assetType: r.assetClass
          ? String(r.assetClass).toLowerCase().replace(/\s+/g, "_")
          : null,
        status: "active",
        isAnonymous: true,
        createdAt: new Date(Date.now() - (i + 1) * 86400000 * 7).toISOString(),
      })
    );
  }, [demo]);

  const demoMatches = useMemo(() => {
    if (!demo) return [];
    const statuses = ["pending", "user1_interested", "mutual_interest"];
    return (demo.matches as unknown as Record<string, unknown>[]).map(
      (r, i) => ({
        id: Number(r.id),
        status: statuses[i % statuses.length],
        compatibilityScore: String(r.compatibilityScore ?? "0"),
        matchReason: r.tag ? String(r.tag) : null,
        intent1Id: i * 2 + 1,
        intent2Id: i * 2 + 2,
        createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString(),
        dealRoomId: null,
      })
    );
  }, [demo]);

  const intents = isDemo ? demoIntents : (liveIntents ?? []);
  const matches = isDemo ? demoMatches : (liveMatches ?? []);
  const intentsLoading = isDemo ? false : liveIntentsLoading;
  const matchesLoading = isDemo ? false : liveMatchesLoading;

  const updateIntentMutation = trpc.intent.update.useMutation({
    onSuccess: () => {
      toast.success("Intent updated");
      refetchIntents();
    },
    onError: e => toast.error(e.message),
  });

  const declineMatchMutation = trpc.match.decline.useMutation({
    onSuccess: () => {
      toast.success("Match declined");
      refetchMatches();
    },
    onError: e => toast.error(e.message),
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
    onError: e => toast.error(e.message),
  });

  const createDealRoomMutation = trpc.match.createDealRoom.useMutation({
    onSuccess: () => {
      toast.success("Deal room created!");
      refetchMatches();
      setLocation("/deal-rooms");
    },
    onError: e => toast.error(e.message),
  });

  const incomingMatches = useMemo(
    () =>
      (matches ?? [])
        .filter(
          (m: any) =>
            m.status === "pending" ||
            m.status === "user1_interested" ||
            m.status === "user2_interested"
        )
        .sort(
          (a: any, b: any) =>
            (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0)
        ),
    [matches]
  );

  const historyMatches = useMemo(
    () =>
      (matches ?? []).filter(
        (m: any) =>
          m.status === "declined" ||
          m.status === "deal_room_created" ||
          m.status === "expired" ||
          m.status === "mutual_interest"
      ),
    [matches]
  );

  const reviewMatch = useMemo(
    () => (matches ?? []).find((m: any) => m.id === reviewMatchId),
    [matches, reviewMatchId]
  );

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "intents", label: "My Intents", count: intents?.length },
    {
      key: "incoming" as const,
      label: "Incoming Matches",
      count: incomingMatches.length,
    },
    { key: "history", label: "Match History" },
  ];

  useEffect(() => {
    document.title = "Blind Matching | ANAVI";
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.surface }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ─────────────────────────────── */}
        <FadeInView>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="dash-heading text-3xl">Blind Matching</h1>
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
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={
                activeTab === t.key
                  ? "rounded-md px-3 py-2 text-sm font-semibold bg-[#0A1628] text-white"
                  : "rounded-md px-3 py-2 text-sm font-medium text-[#1E3A5F]/60 hover:text-[#0A1628] hover:bg-[#0A1628]/5 transition-colors"
              }
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      activeTab === t.key
                        ? "rgba(255,255,255,0.15)"
                        : "#F3F4F6",
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
            onToggleStatus={(id: number, status: string) => {
              if (isDemo) {
                toast.info(
                  status === "active" ? "Intent paused" : "Intent activated"
                );
                return;
              }
              updateIntentMutation.mutate({
                id,
                status: status === "active" ? "paused" : "active",
              });
            }}
            onCreateIntent={() => setShowCreateModal(true)}
            onViewMatches={() => setActiveTab("incoming")}
          />
        )}
        {activeTab === "incoming" && (
          <IncomingTab
            matches={incomingMatches}
            loading={matchesLoading}
            onReview={(id: number) => setReviewMatchId(id)}
            onDecline={(id: number) => {
              if (isDemo) {
                toast.info("Match declined");
                return;
              }
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
            if (isDemo) {
              toast.success("Deal room created!");
              setLocation("/deal-rooms");
            } else {
              createDealRoomMutation.mutate({ matchId: reviewMatch.id });
            }
            setReviewMatchId(null);
          }}
          onDecline={() => {
            if (isDemo) {
              toast.info("Match declined");
            } else {
              declineMatchMutation.mutate({ matchId: reviewMatch.id });
            }
            setReviewMatchId(null);
          }}
        />
      )}
    </div>
  );
}
