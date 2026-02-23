import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { SmoothCounter } from "@/components/PremiumAnimations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Clock,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Link2,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const NAVY = "#0A1628";
const GOLD = "#C4972A";
const BLUE = "#2563EB";
const GREEN = "#059669";
const RED = "#DC2626";
const SURFACE = "#F3F7FC";
const BORDER = "#D1DCF0";

const fmtCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

type PayoutStatus = "all" | "pending" | "processing" | "completed" | "failed";
type PayoutTypeFilter =
  | "all"
  | "originator_fee"
  | "introducer_fee"
  | "advisor_fee"
  | "milestone_bonus"
  | "success_fee";

const STATUS_OPTIONS: { value: PayoutStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const TYPE_OPTIONS: { value: PayoutTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "originator_fee", label: "Originator Fee" },
  { value: "introducer_fee", label: "Introducer Fee" },
  { value: "advisor_fee", label: "Advisor Fee" },
  { value: "milestone_bonus", label: "Milestone Bonus" },
  { value: "success_fee", label: "Success Fee" },
];

function getTypeLabel(type: string) {
  return (
    TYPE_OPTIONS.find((t) => t.value === type)?.label ??
    type.replace(/_/g, " ")
  );
}

function getTypeBadgeStyle(type: string): React.CSSProperties {
  switch (type) {
    case "originator_fee":
      return { backgroundColor: NAVY, color: "#fff" };
    case "introducer_fee":
      return { backgroundColor: BLUE, color: "#fff" };
    case "advisor_fee":
      return { backgroundColor: GOLD, color: "#fff" };
    case "milestone_bonus":
      return { backgroundColor: GREEN, color: "#fff" };
    case "success_fee":
      return { backgroundColor: "#7C3AED", color: "#fff" };
    default:
      return {};
  }
}

function getStatusPillClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function buildMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [
    { value: "all", label: "All Time" },
  ];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: format(d, "MMMM yyyy"),
    });
  }
  return opts;
}

export default function Payouts() {
  const { data: payouts, isLoading } = trpc.payout.list.useQuery();

  const [statusFilter, setStatusFilter] = useState<PayoutStatus>("all");
  const [typeFilter, setTypeFilter] = useState<PayoutTypeFilter>("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null);

  const monthOptions = useMemo(buildMonthOptions, []);

  const completedPayouts = useMemo(
    () => payouts?.filter((p) => p.status === "completed") ?? [],
    [payouts],
  );

  const totalEarnings = useMemo(
    () => completedPayouts.reduce((s, p) => s + parseFloat(p.amount), 0),
    [completedPayouts],
  );

  const pendingAmount = useMemo(
    () =>
      (payouts ?? [])
        .filter((p) => p.status === "pending" || p.status === "processing")
        .reduce((s, p) => s + parseFloat(p.amount), 0),
    [payouts],
  );

  const thisMonthEarnings = useMemo(() => {
    const now = new Date();
    return (payouts ?? [])
      .filter((p) => {
        if (p.status !== "completed") return false;
        const d = new Date(p.paidAt ?? p.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((s, p) => s + parseFloat(p.amount), 0);
  }, [payouts]);

  const completedDealCount = useMemo(
    () => new Set(completedPayouts.map((p) => p.dealId)).size,
    [completedPayouts],
  );

  const filteredPayouts = useMemo(() => {
    if (!payouts) return [];
    return payouts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.payoutType !== typeFilter) return false;
      if (monthFilter !== "all") {
        const d = new Date(p.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== monthFilter) return false;
      }
      return true;
    });
  }, [payouts, statusFilter, typeFilter, monthFilter]);

  const dealGroups = useMemo(() => {
    if (!payouts) return [];
    const map = new Map<
      number,
      { dealId: number; payouts: typeof payouts; total: number }
    >();
    for (const p of payouts) {
      if (!map.has(p.dealId))
        map.set(p.dealId, { dealId: p.dealId, payouts: [], total: 0 });
      const g = map.get(p.dealId)!;
      g.payouts.push(p);
      g.total += parseFloat(p.amount);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [payouts]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-56 rounded-lg animate-pulse" style={{ backgroundColor: SURFACE }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: SURFACE }} />
          ))}
        </div>
        <div className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: SURFACE }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: SURFACE }} />
      </div>
    );
  }

  const empty = !payouts || payouts.length === 0;

  useEffect(() => { document.title = "Payouts | ANAVI"; }, []);

  return (
    <div className="p-8 space-y-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <FadeInView>
      <div>
        <h1 className="text-display tracking-tight flex items-center gap-3" style={{ color: NAVY }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: SURFACE }}
          >
            <Wallet className="w-5 h-5" style={{ color: BLUE }} />
          </div>
          Payouts &amp; Earnings
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your earnings from deal origination and introductions
        </p>
      </div>
      </FadeInView>

      {/* ── Header Stats (4 cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Earnings */}
        <Card className="border" style={{ borderColor: BORDER, backgroundColor: SURFACE }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold mt-1" style={{ color: GREEN }}>
                  {fmtCurrency(totalEarnings)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#ecfdf5" }}>
                <TrendingUp className="w-6 h-6" style={{ color: GREEN }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Lifetime completed payouts</p>
          </CardContent>
        </Card>

        {/* Pending Payouts */}
        <Card className="border" style={{ borderColor: BORDER }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                <p className="text-3xl font-bold mt-1" style={{ color: GOLD }}>
                  {fmtCurrency(pendingAmount)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fef9ee" }}>
                <Clock className="w-6 h-6" style={{ color: GOLD }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {(payouts ?? []).filter((p) => p.status === "pending" || p.status === "processing").length} payouts awaiting
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border" style={{ borderColor: BORDER }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold mt-1" style={{ color: BLUE }}>
                  {fmtCurrency(thisMonthEarnings)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
                <Calendar className="w-6 h-6" style={{ color: BLUE }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {format(new Date(), "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>

        {/* Completed Deals */}
        <Card className="border" style={{ borderColor: BORDER }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Deals</p>
                <p className="text-3xl font-bold mt-1" style={{ color: NAVY }}>
                  {completedDealCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: SURFACE }}>
                <Check className="w-6 h-6" style={{ color: NAVY }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Unique deals paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Economics Overview ──────────────────────────────────────── */}
      <Card className="border" style={{ borderColor: BORDER }}>
        <CardContent className="p-6 space-y-5">
          <h3 className="text-lg font-semibold" style={{ color: NAVY }}>
            ANAVI Economics Model
          </h3>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: NAVY, flex: "50 0 0%" }}
            >
              Originator 40–60%
            </div>
            <div
              className="flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: BLUE, flex: "25 0 0%" }}
            >
              Contributors 20–30%
            </div>
            <div
              className="flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: GOLD, flex: "15 0 0%" }}
            >
              Platform 10–20%
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When deals close through ANAVI, payouts are automated. Originators receive the largest share — guaranteed at close.
          </p>
        </CardContent>
      </Card>

      {/* ── Attribution History ─────────────────────────────────────── */}
      <Card className="border" style={{ borderColor: BORDER }}>
        <CardHeader>
          <CardTitle className="text-lg" style={{ color: NAVY }}>
            Attribution History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as PayoutStatus)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as PayoutTypeFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payout Table */}
          {empty ? (
            <div className="py-12">
              <EmptyState {...EMPTY_STATES.payouts} />
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No payouts match the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="pb-3 font-medium">Deal</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Attribution</th>
                    <th className="pb-3 font-medium">Relationship</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((p) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-[#F3F7FC] transition-colors"
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                      <td className="py-4 font-medium" style={{ color: BLUE }}>
                        Deal&nbsp;#{p.dealId}
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-2">
                          <Badge
                            className="border-0 text-[11px]"
                            style={getTypeBadgeStyle(p.payoutType)}
                          >
                            {getTypeLabel(p.payoutType)}
                          </Badge>
                          {p.isFollowOn && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "#eff6ff", color: BLUE }}
                            >
                              Follow-on
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold" style={{ color: NAVY }}>
                        {fmtCurrency(parseFloat(p.amount))}
                      </td>
                      <td className="py-4 text-right text-muted-foreground">
                        {p.attributionPercentage
                          ? `${parseFloat(p.attributionPercentage)}%`
                          : "—"}
                      </td>
                      <td className="py-4">
                        {p.relationshipId ? (
                          <span className="inline-flex items-center gap-1 text-xs" style={{ color: BLUE }}>
                            <Link2 className="w-3 h-3" />
                            REL-{p.relationshipId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4">
                        <Badge className={`${getStatusPillClasses(p.status ?? "pending")} border-0 text-[11px]`}>
                          {p.status ?? "pending"}
                        </Badge>
                        {p.status === "completed" && p.paidAt && (
                          <p className="text-[11px] mt-0.5" style={{ color: GREEN }}>
                            Paid on {format(new Date(p.paidAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-muted-foreground text-xs">
                        {format(new Date(p.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Deal Payout Timeline ───────────────────────────────────── */}
      {!empty && dealGroups.length > 0 && (
        <Card className="border" style={{ borderColor: BORDER }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: NAVY }}>
              Deal Payout Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dealGroups.map((group) => {
              const isExpanded = expandedDeal === group.dealId;
              return (
                <div key={group.dealId} className="rounded-xl border p-4" style={{ borderColor: BORDER }}>
                  {/* Deal header */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 text-left"
                    onClick={() => setExpandedDeal(isExpanded ? null : group.dealId)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 shrink-0" style={{ color: NAVY }} />
                      ) : (
                        <ChevronRight className="w-5 h-5 shrink-0" style={{ color: NAVY }} />
                      )}
                      <span className="font-semibold truncate" style={{ color: NAVY }}>
                        Deal #{group.dealId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.payouts.length} payout{group.payouts.length !== 1 && "s"}
                      </span>
                    </div>
                    <span className="font-bold shrink-0" style={{ color: GREEN }}>
                      {fmtCurrency(group.total)}
                    </span>
                  </button>

                  {/* Milestone Timeline */}
                  {isExpanded && (
                    <div className="mt-5 ml-6 border-l-2 pl-6 space-y-5" style={{ borderColor: BORDER }}>
                      {group.payouts
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime(),
                        )
                        .map((p) => {
                          const dotColor =
                            p.status === "completed"
                              ? NAVY
                              : p.status === "pending"
                                ? GOLD
                                : "#D1D5DB";
                          return (
                            <div key={p.id} className="relative">
                              {/* Dot */}
                              <div
                                className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white"
                                style={{ backgroundColor: dotColor }}
                              />
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="font-medium text-sm" style={{ color: NAVY }}>
                                    {p.milestoneName ?? getTypeLabel(p.payoutType)}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      className="border-0 text-[11px]"
                                      style={getTypeBadgeStyle(p.payoutType)}
                                    >
                                      {getTypeLabel(p.payoutType)}
                                    </Badge>
                                    <Badge
                                      className={`${getStatusPillClasses(p.status ?? "pending")} border-0 text-[11px]`}
                                    >
                                      {p.status ?? "pending"}
                                    </Badge>
                                    {p.isFollowOn && (
                                      <span
                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: "#eff6ff", color: BLUE }}
                                      >
                                        Follow-on
                                      </span>
                                    )}
                                  </div>
                                  {p.attributionPercentage && (
                                    <p className="text-xs text-muted-foreground">
                                      Attribution: {parseFloat(p.attributionPercentage)}%
                                      {p.relationshipId && (
                                        <span className="ml-2" style={{ color: BLUE }}>
                                          <Link2 className="inline w-3 h-3 mr-0.5" />
                                          REL-{p.relationshipId}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {p.status === "completed" && p.paidAt && (
                                    <p className="text-xs" style={{ color: GREEN }}>
                                      Paid on {format(new Date(p.paidAt), "MMM d, yyyy")} ({formatDistanceToNow(new Date(p.paidAt), { addSuffix: true })})
                                    </p>
                                  )}
                                </div>
                                <span className="font-bold text-sm" style={{ color: NAVY }}>
                                  {fmtCurrency(parseFloat(p.amount))}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
