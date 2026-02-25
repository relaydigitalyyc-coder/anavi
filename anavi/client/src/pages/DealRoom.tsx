import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  FileText, Shield, Scale, Wallet, Clock,
  Eye, Check, AlertTriangle,
  ChevronRight, ChevronLeft,
  Lock,
} from "lucide-react";
import { SlideIn, FadeInView } from "@/components/PageTransition";

import { OverviewTab } from "./deal-room/OverviewTab";
import { DocumentsTab } from "./deal-room/DocumentsTab";
import { DiligenceTab } from "./deal-room/DiligenceTab";
import { ComplianceTab } from "./deal-room/ComplianceTab";
import { EscrowTab } from "./deal-room/EscrowTab";
import { PayoutsTab } from "./deal-room/PayoutsTab";
import { AuditTab } from "./deal-room/AuditTab";

type TabKey = "overview" | "documents" | "diligence" | "compliance" | "escrow" | "payouts" | "audit";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "diligence", label: "Diligence", icon: Shield },
  { key: "compliance", label: "Compliance", icon: Scale },
  { key: "escrow", label: "Escrow", icon: Lock },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "audit", label: "Audit Trail", icon: Clock },
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

export default function DealRoom() {
  const params = useParams<{ id: string }>();
  const roomId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: room, isLoading } = trpc.dealRoom.get.useQuery(
    { id: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: myAccess, refetch: refetchMyAccess } = trpc.dealRoom.getMyAccess.useQuery(
    { dealRoomId: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: documents, refetch: refetchDocuments } = trpc.dealRoom.getDocuments.useQuery(
    { dealRoomId: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: auditEntries } = trpc.audit.list.useQuery(
    { entityType: "deal_room", entityId: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: payouts } = trpc.payout.getByDeal.useQuery(
    { dealId: room?.dealId ?? 0 },
    { enabled: !!room?.dealId }
  );

  if (isLoading) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="h-8 w-64 animate-shimmer rounded mb-6" />
        <div className="h-12 animate-shimmer rounded mb-4" />
        <div className="h-96 animate-shimmer rounded" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F3F7FC] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" style={{ color: "#DC2626" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2">Deal Room Not Found</h2>
        <p className="text-muted-foreground mb-4 text-sm">This deal room may have been removed or you don't have access.</p>
        <Link href="/deal-rooms" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "#2563EB" }}>
          <ChevronLeft className="w-4 h-4" /> Back to Deal Rooms
        </Link>
      </div>
    );
  }

  const days = daysSince(room.createdAt);
  const dealValue = "$2.5M";
  const stages = ["NDA", "Diligence", "Negotiation", "Closing"];
  const currentStageIdx = room.status === "active" ? 1 : room.status === "closed" ? 3 : 0;

  useEffect(() => { document.title = `Deal Room: ${room.name} | ANAVI`; }, [room.name]);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/deal-rooms" className="hover:underline" style={{ color: "#2563EB" }}>
          Deal Rooms
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-medium" style={{ color: "#0A1628" }}>{room.name}</span>
      </div>

      {/* Room Header */}
      <FadeInView>
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-display" style={{ color: "#0A1628" }}>{room.name}</h1>
                <span className={`status-pill ${getStatusClass(room.status)}`}>
                  {getStatusLabel(room.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {days} days active
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {["A", "B", "C"].map((letter, i) => (
                      <div
                        key={letter}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: i === 0 ? "#2563EB" : i === 1 ? "#C4972A" : "#059669", zIndex: 3 - i }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  3 participants
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Deal Value</div>
              <div className="text-2xl font-bold number-display" style={{ color: "#0A1628" }}>{dealValue}</div>
            </div>
          </div>

          {/* Stage progress bar */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "#D1DCF0" }}>
            <div className="flex items-center gap-2">
              {stages.map((stage, i) => (
                <div key={stage} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    i <= currentStageIdx ? "text-[#2563EB]" : "text-gray-400"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < currentStageIdx ? "bg-[#059669] text-white" :
                      i === currentStageIdx ? "bg-[#2563EB] text-white" :
                      "bg-gray-200 text-gray-400"
                    }`}>
                      {i < currentStageIdx ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {stage}
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: i < currentStageIdx ? "#059669" : "#D1DCF0" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInView>

      {/* Tab Bar */}
      <div className="border-b overflow-x-auto scrollbar-premium" style={{ borderColor: "#D1DCF0" }}>
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2"
                style={{
                  borderColor: isActive ? "#2563EB" : "transparent",
                  color: isActive ? "#2563EB" : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <SlideIn key={activeTab} direction="up">
        {activeTab === "overview" && (
          <OverviewTab room={room} payouts={payouts ?? []} auditEntries={auditEntries ?? []} />
        )}
        {activeTab === "documents" && (
          <DocumentsTab
            documents={documents ?? []}
            dealRoomId={roomId}
            ndaRequired={room?.ndaRequired ?? false}
            ndaSigned={myAccess?.access?.ndaSigned ?? false}
            bothSigned={myAccess?.bothSigned ?? false}
            onNdaSigned={() => { refetchDocuments(); refetchMyAccess(); }}
          />
        )}
        {activeTab === "diligence" && <DiligenceTab roomId={roomId} room={room} />}
        {activeTab === "compliance" && <ComplianceTab />}
        {activeTab === "escrow" && <EscrowTab dealId={room?.dealId ?? undefined} />}
        {activeTab === "payouts" && <PayoutsTab payouts={payouts ?? []} />}
        {activeTab === "audit" && <AuditTab entries={auditEntries ?? []} />}
      </SlideIn>
    </div>
  );
}
