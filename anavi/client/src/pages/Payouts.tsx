import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import { FadeInView } from "@/components/PageTransition";
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
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Link2,
  Download,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";


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

function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case "originator_fee":
      return "bg-slate-900 text-white";
    case "introducer_fee":
      return "bg-blue-600 text-white";
    case "advisor_fee":
      return "bg-[#C4972A] text-white";
    case "milestone_bonus":
      return "bg-emerald-600 text-white";
    case "success_fee":
      return "bg-violet-600 text-white";
    default:
      return "";
  }
}

function PayoutStatementSection() {
  const [periodStart, setPeriodStart] = useState(() =>
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [periodEnd, setPeriodEnd] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [showModal, setShowModal] = useState(false);

  const { data: statement, isLoading } = trpc.payout.getStatement.useQuery(
    {
      periodStart: `${periodStart}T00:00:00.000Z`,
      periodEnd: `${periodEnd}T23:59:59.999Z`,
    },
    { enabled: showModal && !!periodStart && !!periodEnd }
  );

  const downloadCSV = () => {
    if (!statement) return;
    const header = "Deal ID,Amount,Currency,Type,Status,Date\n";
    const rows = statement.items.map(
      (p: any) =>
        `${p.dealId ?? ""},${p.amount ?? 0},${p.currency ?? "USD"},${p.payoutType ?? ""},${p.status ?? ""},"${new Date(p.createdAt).toLocaleDateString()}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ANAVI-Payout-Statement-${periodStart}-${periodEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statement downloaded");
  };

  return (
    <div className="card-elevated p-6">
      <h3 className="data-label mb-2 text-slate-900">
        Payout Statement
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Official ANAVI payout statement. Select a period and view or download.
      </p>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Start</label>
          <Input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground">End</label>
          <Input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <Button
          className="btn-gold gap-2"
          onClick={() => setShowModal(true)}
        >
          <FileText className="w-4 h-4" />
          View Statement
        </Button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative z-10 bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900">
                Official ANAVI Payout Statement
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {periodStart} — {periodEnd} · Generated {format(new Date(), "PP")}
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : !statement || statement.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payouts in this period. Select a different range.
                </p>
              ) : (
                <div className="space-y-3">
                  {statement.items.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-sm">Deal #{p.dealId}</span>
                      <span className="font-data-hud font-semibold">
                        {fmtCurrency(Number(p.amount ?? 0))}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 font-bold text-base text-slate-900">
                    <span>Total</span>
                    <span>{fmtCurrency(statement.total ?? 0)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-between">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button className="btn-gold gap-2" onClick={downloadCSV} disabled={!statement || statement.items.length === 0}>
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
  useEffect(() => { document.title = "Payouts | ANAVI"; }, []);

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
        <div className="h-8 w-56 rounded-lg animate-pulse bg-slate-50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse bg-slate-50" />
          ))}
        </div>
        <div className="h-48 rounded-xl animate-pulse bg-slate-50" />
        <div className="h-64 rounded-xl animate-pulse bg-slate-50" />
      </div>
    );
  }

  const empty = !payouts || payouts.length === 0;

  return (
    <div className="p-8 space-y-8">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <FadeInView>
      <div>
        <h1 className="text-display tracking-tight flex items-center gap-3 text-slate-900">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          Payouts &amp; Earnings
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your earnings from deal origination and introductions
        </p>
      </div>
      </FadeInView>

      {/* ── Attribution Summary Hero ────────────────────────────────── */}
      <div className="card-elevated p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Earnings (Lifetime Attribution) */}
          <div>
            <p className="data-label mb-1">Lifetime Attribution</p>
            <p className="font-data-hud text-3xl font-bold text-emerald-600">
              $<SmoothCounter value={totalEarnings} duration={1.2} />
            </p>
          </div>
          {/* Next Payout (Pending Amount) */}
          <div>
            <p className="data-label mb-1">Next Payout</p>
            <p className="font-data-hud text-3xl font-bold text-slate-900">
              $<SmoothCounter value={pendingAmount} duration={1} />
            </p>
          </div>
          {/* Pending Count */}
          <div>
            <p className="data-label mb-1">Pending</p>
            <p className="font-data-hud text-3xl font-bold text-[#C4972A]">
              <SmoothCounter value={(payouts ?? []).filter((p) => p.status === "pending" || p.status === "processing").length} duration={1} />
            </p>
          </div>
          {/* This Month */}
          <div>
            <p className="data-label mb-1">This Month</p>
            <p className="font-data-hud text-3xl font-bold text-blue-600">
              $<SmoothCounter value={thisMonthEarnings} duration={1} />
            </p>
          </div>
        </div>
      </div>

      {/* F7: Payout Statement */}
      <PayoutStatementSection />

      {/* ── Economics Overview ──────────────────────────────────────── */}
      <div className="card-elevated p-6 space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">
            ANAVI Economics Model
          </h3>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-center text-xs font-semibold text-white bg-slate-900"
              style={{ flex: "50 0 0%" }}
            >
              Originator 40–60%
            </div>
            <div
              className="flex items-center justify-center text-xs font-semibold text-white bg-blue-600"
              style={{ flex: "25 0 0%" }}
            >
              Contributors 20–30%
            </div>
            <div
              className="flex items-center justify-center text-xs font-semibold text-white bg-[#C4972A]"
              style={{ flex: "15 0 0%" }}
            >
              Platform 10–20%
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When deals close through ANAVI, payouts are automated. Originators receive the largest share — guaranteed at close.
          </p>
      </div>

      {/* ── Attribution History ─────────────────────────────────────── */}
      <div className="card-elevated p-6 space-y-6">
        <h3 className="data-label text-slate-900">
          Attribution History
        </h3>
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
            <div className="flex flex-col gap-3">
              {filteredPayouts.map((p) => (
                <div
                  key={p.id}
                  className="card-elevated px-4 py-3 flex items-center justify-between hover:translate-y-[-1px] transition-transform"
                >
                  <div>
                    <p className="font-data-hud text-base font-semibold text-slate-900">
                      {fmtCurrency(parseFloat(p.amount))}
                    </p>
                    <p className="data-label mt-0.5">{getTypeLabel(p.payoutType)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm text-blue-600">
                      Deal&nbsp;#{p.dealId}
                    </span>
                    <span className="data-label">{format(new Date(p.createdAt), "MMM d")}</span>
                    <Badge className={`${getStatusPillClasses(p.status ?? "pending")} border-0 text-[11px]`}>
                      {p.status ?? "pending"}
                    </Badge>
                    {p.relationshipId && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        <Link2 className="w-3 h-3" />
                        REL-{p.relationshipId}
                      </span>
                    )}
                    {p.isFollowOn && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        Follow-on
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ── Deal Payout Timeline ───────────────────────────────────── */}
      {!empty && dealGroups.length > 0 && (
        <div className="card-elevated p-6 space-y-6">
          <h3 className="data-label text-slate-900">
            Deal Payout Timeline
          </h3>
            {dealGroups.map((group) => {
              const isExpanded = expandedDeal === group.dealId;
              return (
                <div key={group.dealId} className="card-elevated p-4">
                  {/* Deal header */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 text-left"
                    onClick={() => setExpandedDeal(isExpanded ? null : group.dealId)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 shrink-0 text-slate-900" />
                      ) : (
                        <ChevronRight className="w-5 h-5 shrink-0 text-slate-900" />
                      )}
                      <span className="font-semibold truncate text-slate-900">
                        Deal #{group.dealId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.payouts.length} payout{group.payouts.length !== 1 && "s"}
                      </span>
                    </div>
                                <span className="font-data-hud font-bold shrink-0 text-emerald-600">
                                    {fmtCurrency(group.total)}
                                  </span>
                  </button>

                  {/* Milestone Timeline */}
                  {isExpanded && (
                    <div className="mt-5 ml-6 border-l-2 border-slate-200 pl-6 space-y-5">
                      {group.payouts
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime(),
                        )
                        .map((p) => {
                          const dotColorClass =
                            p.status === "completed"
                              ? "bg-slate-900"
                              : p.status === "pending"
                                ? "bg-[#C4972A]"
                                : "bg-gray-300";
                          return (
                            <div key={p.id} className="relative">
                              {/* Dot */}
                              <div
                                className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white ${dotColorClass}`}
                              />
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="font-medium text-sm text-slate-900">
                                    {p.milestoneName ?? getTypeLabel(p.payoutType)}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      className={`border-0 text-[11px] ${getTypeBadgeClasses(p.payoutType)}`}
                                    >
                                      {getTypeLabel(p.payoutType)}
                                    </Badge>
                                    <Badge
                                      className={`${getStatusPillClasses(p.status ?? "pending")} border-0 text-[11px]`}
                                    >
                                      {p.status ?? "pending"}
                                    </Badge>
                                    {p.isFollowOn && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                                        Follow-on
                                      </span>
                                    )}
                                  </div>
                                  {p.attributionPercentage && (
                                    <p className="text-xs text-muted-foreground">
                                      Attribution: {parseFloat(p.attributionPercentage)}%
                                      {p.relationshipId && (
                                        <span className="ml-2 text-blue-600">
                                          <Link2 className="inline w-3 h-3 mr-0.5" />
                                          REL-{p.relationshipId}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                  {p.status === "completed" && p.paidAt && (
                                    <p className="text-xs text-emerald-600">
                                      Paid on {format(new Date(p.paidAt), "MMM d, yyyy")} ({formatDistanceToNow(new Date(p.paidAt), { addSuffix: true })})
                                    </p>
                                  )}
                                </div>
                                <span className="font-data-hud font-bold text-sm text-slate-900">
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
        </div>
      )}
    </div>
  );
}
