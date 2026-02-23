import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { EmptyState, EMPTY_STATES } from "@/components/EmptyState";
import {
  FolderOpen, Clock, ChevronRight,
  Lock, Download, Eye
} from "lucide-react";
import { useLocation } from "wouter";
import { FadeInView, ScaleHover, StaggerContainer, StaggerItem } from "@/components/PageTransition";

type StatusFilter = "all" | "nda_pending" | "active" | "diligence" | "closing" | "completed" | "declined";

const STATUS_FILTERS: { key: StatusFilter; label: string; className: string }[] = [
  { key: "all", label: "All", className: "" },
  { key: "nda_pending", label: "NDA Pending", className: "status-nda-pending" },
  { key: "active", label: "Active", className: "status-active" },
  { key: "diligence", label: "Diligence", className: "status-diligence" },
  { key: "closing", label: "Closing", className: "status-closing" },
  { key: "completed", label: "Completed", className: "status-completed" },
  { key: "declined", label: "Declined", className: "status-declined" },
];

function getStatusClass(status: string | null): string {
  switch (status) {
    case "active": return "status-active";
    case "closed": return "status-completed";
    case "archived": return "status-declined";
    default: return "status-nda-pending";
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case "active": return "Active";
    case "closed": return "Completed";
    case "archived": return "Declined";
    default: return "NDA Pending";
  }
}

function daysSince(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export default function DealRooms() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { data: dealRooms, isLoading } = trpc.dealRoom.list.useQuery();

  const stats = useMemo(() => {
    if (!dealRooms) return { active: 0, pendingNda: 0, completed: 0, total: 0 };
    return {
      active: dealRooms.filter(r => r.status === "active").length,
      pendingNda: dealRooms.filter(r => !r.status || r.status === null).length,
      completed: dealRooms.filter(r => r.status === "closed").length,
      total: dealRooms.length,
    };
  }, [dealRooms]);

  const filtered = useMemo(() => {
    if (!dealRooms) return [];
    if (filter === "all") return dealRooms;
    const mapping: Record<StatusFilter, (r: any) => boolean> = {
      all: () => true,
      nda_pending: r => !r.status || r.status === null,
      active: r => r.status === "active",
      diligence: r => false,
      closing: r => false,
      completed: r => r.status === "closed",
      declined: r => r.status === "archived",
    };
    return dealRooms.filter(mapping[filter]);
  }, [dealRooms, filter]);

  useEffect(() => { document.title = "Deal Rooms | ANAVI"; }, []);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <FadeInView>
        <h1 className="text-display" style={{ color: "#0A1628" }}>Deal Rooms</h1>
      </FadeInView>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Rooms", value: stats.active, color: "#2563EB" },
          { label: "Pending NDA", value: stats.pendingNda, color: "#C4972A" },
          { label: "Completed", value: stats.completed, color: "#059669" },
          { label: "Total Value", value: `$${(stats.total * 2.5).toFixed(1)}M`, color: "#0A1628" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border p-5"
            style={{ borderColor: "#D1DCF0" }}
          >
            <div className="text-label text-muted-foreground mb-1">{s.label}</div>
            <div className="text-2xl font-bold number-display" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((sf) => {
          const isActive = filter === sf.key;
          return (
            <button
              key={sf.key}
              onClick={() => setFilter(sf.key)}
              className={`status-pill cursor-pointer transition-all ${
                isActive
                  ? sf.className || "bg-[#0A1628] text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
              style={isActive && sf.key === "all" ? { background: "#0A1628", color: "#fff" } : undefined}
            >
              {sf.label}
            </button>
          );
        })}
      </div>

      {/* Deal Room Cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
              <div className="h-40 animate-shimmer rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
          <EmptyState {...EMPTY_STATES.dealRooms} />
        </div>
      ) : (
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((room) => {
            const settings = (room.settings as any) || {};
            const days = daysSince(room.createdAt);
            const lastActivity = formatRelativeTime(room.updatedAt || room.createdAt);

            return (
              <StaggerItem key={room.id}>
              <ScaleHover>
              <div
                className="bg-white rounded-lg border flex flex-col hover-lift"
                style={{ borderColor: "#D1DCF0" }}
              >
                <div className="p-5 flex-1 space-y-3">
                  {/* Status pill */}
                  <div className="flex justify-end">
                    <span className={`status-pill ${getStatusClass(room.status)}`}>
                      {getStatusLabel(room.status)}
                    </span>
                  </div>

                  {/* Room name */}
                  <h3 className="font-semibold text-base" style={{ color: "#0A1628" }}>
                    {room.name}
                  </h3>

                  {/* Parties (anonymized) */}
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Party A</span>
                    {" ↔ "}
                    <span className="font-medium">Party B</span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {days}d in room
                    </span>
                    <span>Last: {lastActivity}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {room.ndaRequired && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-700">
                        <Lock className="w-3 h-3" />
                        NDA Required
                      </span>
                    )}
                    {settings.watermarkDocuments && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700">
                        <Eye className="w-3 h-3" />
                        Watermarking
                      </span>
                    )}
                    {settings.allowDownloads === false && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700">
                        <Download className="w-3 h-3" />
                        Download Controls
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5 pt-2">
                  <button
                    onClick={() => setLocation(`/deal-rooms/${room.id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
                    style={{ background: "#2563EB" }}
                  >
                    Enter Room
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </ScaleHover>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
