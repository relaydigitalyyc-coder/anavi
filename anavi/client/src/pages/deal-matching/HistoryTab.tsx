import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { Link } from "wouter";
import { EmptyState } from "@/components/EmptyState";
import { COLORS } from "./constants";
import { LoadingSkeleton } from "./CompatibilityRing";

export function HistoryTab({
  matches,
  loading,
}: {
  matches: any[];
  loading: boolean;
}) {
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

  const historyStatusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    declined: { label: "Declined", color: COLORS.red, bg: "#FEF2F2" },
    mutual_interest: { label: "Accepted", color: COLORS.green, bg: "#ECFDF5" },
    deal_room_created: {
      label: "Deal Room Created",
      color: COLORS.blue,
      bg: "#EFF6FF",
    },
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
            const cfg =
              historyStatusConfig[m.status] ?? historyStatusConfig.expired;
            return (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4 font-mono text-xs text-gray-600">
                  #{m.id.slice(-8)}
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {m.createdAt
                    ? formatDistanceToNow(new Date(m.createdAt), {
                        addSuffix: true,
                      })
                    : "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="font-semibold"
                    style={{ color: COLORS.navy }}
                  >
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