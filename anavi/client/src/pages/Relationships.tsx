import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Shield, Lock, Copy, LayoutGrid, List, Plus, Search,
  Filter, Check, Upload, Users, Briefcase, TrendingUp,
  DollarSign, Globe, ChevronDown, X,
} from "lucide-react";
import { toast } from "sonner";
import { FadeInView, ScaleHover, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { GlowingBorder } from "@/components/PremiumAnimations";

const COLORS = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  surface: "#F3F7FC",
  border: "#D1DCF0",
};

const SECTORS = ["Oil & Gas", "Solar", "Real Estate", "Mining", "Infrastructure", "M&A", "Other"];
const REGIONS = ["North America", "Europe", "Asia", "Middle East", "Africa", "Latin America"];
const REL_TYPES = [
  { value: "buyer", label: "Buyer", icon: Briefcase },
  { value: "seller", label: "Seller", icon: TrendingUp },
  { value: "investor", label: "Investor", icon: DollarSign },
  { value: "developer", label: "Developer", icon: Globe },
  { value: "other", label: "Other", icon: Users },
] as const;

const VERIFICATION_LEVELS = [
  "Basic contact info",
  "Business verified",
  "Financial verified",
  "Fully documented",
];

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function generateFakeHash() {
  const chars = "abcdef0123456789";
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function Relationships() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [matchFilter, setMatchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  const [formType, setFormType] = useState("");
  const [formSectors, setFormSectors] = useState<string[]>([]);
  const [formDealMin, setFormDealMin] = useState("");
  const [formDealMax, setFormDealMax] = useState("");
  const [formRegions, setFormRegions] = useState<string[]>([]);
  const [formRequirements, setFormRequirements] = useState("");
  const [formVerification, setFormVerification] = useState("");
  const [formExposure, setFormExposure] = useState("full");
  const [formAutoMatch, setFormAutoMatch] = useState(true);

  const { data: relationships, isLoading, refetch } = trpc.relationship.list.useQuery();
  const { data: stats } = trpc.user.getStats.useQuery();
  const createMutation = trpc.relationship.create.useMutation({
    onSuccess: () => {
      refetch();
      setModalStep(5);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredRelationships = (relationships || []).filter((rel) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      `REL-${rel.id}`.toLowerCase().includes(q) ||
      rel.relationshipType?.toLowerCase().includes(q) ||
      rel.tags?.some((t: string) => t.toLowerCase().includes(q));
    const matchesSector = !sectorFilter || rel.tags?.includes(sectorFilter);
    const matchesVerification =
      !verificationFilter ||
      (verificationFilter === "protected" && rel.isBlind) ||
      (verificationFilter === "visible" && !rel.isBlind);
    const matchesMatch =
      !matchFilter ||
      (matchFilter === "active" && (rel.dealCount || 0) > 0) ||
      (matchFilter === "dormant" && (rel.dealCount || 0) === 0);
    return matchesSearch && matchesSector && matchesVerification && matchesMatch;
  });

  const totalValue = relationships?.reduce((s, r) => s + parseFloat(r.totalDealValue || "0"), 0) || 0;
  const totalEarnings = relationships?.reduce((s, r) => s + parseFloat(r.totalEarnings || "0"), 0) || 0;
  const activeMatches = (stats as any)?.activeMatches ?? 12;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Custody hash copied");
  };

  const resetModal = () => {
    setModalStep(1);
    setFormType("");
    setFormSectors([]);
    setFormDealMin("");
    setFormDealMax("");
    setFormRegions([]);
    setFormRequirements("");
    setFormVerification("");
    setFormExposure("full");
    setFormAutoMatch(true);
  };

  const openModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetModal();
  };

  const submitRelationship = () => {
    createMutation.mutate({
      contactId: Math.floor(Math.random() * 100000),
      relationshipType: (formType || "direct") as any,
      notes: formRequirements,
      tags: [...formSectors, ...formRegions],
    });
  };

  const statCards = [
    { label: "TOTAL RELATIONSHIPS", value: relationships?.length || 0 },
    { label: "PORTFOLIO VALUE", value: totalValue > 0 ? formatCurrency(totalValue) : "$2.4M" },
    { label: "TOTAL ATTRIBUTION EARNED", value: formatCurrency(totalEarnings) },
    { label: "ACTIVE MATCHES", value: activeMatches },
  ];

  const confirmationId = `REL-${Math.floor(Math.random() * 90000) + 10000}`;
  const confirmationHash = generateFakeHash();

  useEffect(() => { document.title = "Relationships | ANAVI"; }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.surface }}>
      {/* Header Stats Bar */}
      <FadeInView>
        <div style={{ padding: "32px 32px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {statCards.map((s) => (
              <div
                key={s.label}
                className="hover-lift"
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "24px 28px",
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.navy }}>{s.value}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  color: "#6B7A90",
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
          </div>
        </div>
      </FadeInView>

      {/* Filter Bar */}
      <div
        style={{
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", width: 300 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
          />
          <input
            type="text"
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              height: 42,
              paddingLeft: 38,
              paddingRight: 12,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <FilterDropdown label="Sector" value={sectorFilter} onChange={setSectorFilter} options={SECTORS} />
        <FilterDropdown
          label="Verification Status"
          value={verificationFilter}
          onChange={setVerificationFilter}
          options={[
            { value: "protected", label: "Protected" },
            { value: "visible", label: "Visible" },
          ]}
        />
        <FilterDropdown
          label="Match Activity"
          value={matchFilter}
          onChange={setMatchFilter}
          options={[
            { value: "active", label: "Active" },
            { value: "dormant", label: "Dormant" },
          ]}
        />

        <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: viewMode === "grid" ? COLORS.blue : "#fff",
              color: viewMode === "grid" ? "#fff" : "#6B7A90",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: viewMode === "list" ? COLORS.blue : "#fff",
              color: viewMode === "list" ? "#fff" : "#6B7A90",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <List size={16} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={openModal}
          style={{
            height: 42,
            padding: "0 24px",
            borderRadius: 8,
            background: COLORS.gold,
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Shield size={16} />
          Protect a Relationship
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "0 32px 48px" }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  border: `1px solid ${COLORS.border}`,
                  height: 220,
                }}
              >
                <div style={{ background: "#E2E8F0", borderRadius: 8, height: "100%", animation: "pulse 2s infinite" }} />
              </div>
            ))}
          </div>
        ) : filteredRelationships.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "64px 32px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center",
            }}
          >
            <Users size={48} style={{ color: "#94A3B8", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 22, fontWeight: 600, color: COLORS.navy, marginBottom: 8 }}>No Relationships Yet</h3>
            <p style={{ color: "#6B7A90", marginBottom: 24 }}>Start protecting your network with custody timestamps</p>
            <button
              onClick={openModal}
              style={{
                height: 42,
                padding: "0 24px",
                borderRadius: 8,
                background: COLORS.gold,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
              }}
            >
              Protect a Relationship
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {filteredRelationships.map((rel, idx) => (
              <ScaleHover key={rel.id}>
                <RelationshipCard rel={rel} onCopyHash={copyHash} isFirst={idx === 0} />
              </ScaleHover>
            ))}
          </div>
        ) : (
          <RelationshipTable relationships={filteredRelationships} onCopyHash={copyHash} />
        )}
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10, 22, 40, 0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: 560,
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
            }}
          >
            <div
              style={{
                padding: "24px 28px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy }}>Protect a Relationship</h2>
                <p style={{ fontSize: 13, color: "#6B7A90", marginTop: 4 }}>Step {modalStep} of 5</p>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ margin: "16px 28px", height: 4, background: "#E2E8F0", borderRadius: 2 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(modalStep / 5) * 100}%`,
                  background: COLORS.gold,
                  borderRadius: 2,
                  transition: "width 0.3s",
                }}
              />
            </div>

            <div style={{ padding: "8px 28px 28px" }}>
              {modalStep === 1 && (
                <ModalStepType selected={formType} onSelect={setFormType} />
              )}
              {modalStep === 2 && (
                <ModalStepProfile
                  sectors={formSectors}
                  onSectorsChange={setFormSectors}
                  dealMin={formDealMin}
                  dealMax={formDealMax}
                  onDealMinChange={setFormDealMin}
                  onDealMaxChange={setFormDealMax}
                  regions={formRegions}
                  onRegionsChange={setFormRegions}
                  requirements={formRequirements}
                  onRequirementsChange={setFormRequirements}
                />
              )}
              {modalStep === 3 && (
                <ModalStepVerification level={formVerification} onLevelChange={setFormVerification} />
              )}
              {modalStep === 4 && (
                <ModalStepCustody
                  exposure={formExposure}
                  onExposureChange={setFormExposure}
                  autoMatch={formAutoMatch}
                  onAutoMatchChange={setFormAutoMatch}
                />
              )}
              {modalStep === 5 && (
                <ModalStepConfirmation id={confirmationId} hash={confirmationHash} onDone={closeModal} />
              )}

              {modalStep < 5 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                  <button
                    onClick={() => setModalStep(Math.max(1, modalStep - 1))}
                    disabled={modalStep === 1}
                    style={{
                      height: 40,
                      padding: "0 20px",
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      background: "#fff",
                      color: modalStep === 1 ? "#CBD5E1" : COLORS.navy,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: modalStep === 1 ? "default" : "pointer",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (modalStep === 4) {
                        submitRelationship();
                      } else {
                        setModalStep(modalStep + 1);
                      }
                    }}
                    disabled={createMutation.isPending}
                    style={{
                      height: 40,
                      padding: "0 24px",
                      borderRadius: 8,
                      background: COLORS.gold,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {modalStep === 4 ? (createMutation.isPending ? "Protecting..." : "Protect Relationship") : "Continue"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Sub-Components
   ------------------------------------------------------------------------- */

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 42,
          padding: "0 32px 0 14px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: "#fff",
          fontSize: 14,
          color: value ? COLORS.navy : "#94A3B8",
          appearance: "none",
          cursor: "pointer",
          minWidth: 140,
        }}
      >
        <option value="">{label}</option>
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <ChevronDown
        size={14}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8" }}
      />
    </div>
  );
}

function RelationshipCard({ rel, onCopyHash, isFirst = false }: { rel: any; onCopyHash: (h: string) => void; isFirst?: boolean }) {
  const sectorTag = rel.tags?.[0];
  const isActive = (rel.dealCount || 0) > 0;
  const [flipped, setFlipped] = useState(false);
  const [verifying, setVerifying] = useState<number>(0);

  const timelineSteps = [
    { label: "Created", done: true },
    { label: "Verified", done: !!rel.isBlind },
    { label: "Matched", done: isActive },
    { label: "Attributed", done: parseFloat(rel.totalEarnings || "0") > 0 },
  ];

  const handleVerify = () => {
    setVerifying(1);
    setTimeout(() => setVerifying(2), 600);
    setTimeout(() => setVerifying(3), 1200);
    setTimeout(() => setVerifying(0), 3000);
  };

  if (flipped) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${COLORS.border}`,
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: COLORS.navy }}>
            Custody Receipt
          </span>
          <button onClick={() => setFlipped(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.blue, fontSize: 13, fontWeight: 600 }}>
            ← Back
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <ReceiptRow label="Custody ID" value={`REL-${rel.id}`} mono />
          <ReceiptRow label="Timestamp" value={new Date(rel.createdAt).toLocaleString()} />
          <ReceiptRow label="Hash" value={rel.timestampHash?.slice(0, 32) + "..."} mono />
          <ReceiptRow label="Verification" value={rel.isBlind ? "Protected" : "Visible"} />
          <ReceiptRow label="Attribution" value={formatCurrency(parseFloat(rel.totalEarnings || "0"))} last />
        </div>
        {/* E29: Verify button with animation */}
        <button
          onClick={handleVerify}
          disabled={verifying > 0}
          style={{
            marginTop: 12,
            height: 36,
            borderRadius: 8,
            border: `1px solid ${verifying === 3 ? COLORS.green : COLORS.border}`,
            background: verifying === 3 ? `${COLORS.green}10` : "#fff",
            color: verifying === 3 ? COLORS.green : COLORS.blue,
            fontWeight: 600,
            fontSize: 13,
            cursor: verifying > 0 ? "default" : "pointer",
            transition: "all 0.3s",
          }}
        >
          {verifying === 0 && "Verify Hash"}
          {verifying === 1 && "Checking ledger..."}
          {verifying === 2 && "Timestamp confirmed ✓"}
          {verifying === 3 && "✓ Verified"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        border: `1px solid ${COLORS.border}`,
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,22,40,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: COLORS.navy }}>
          REL-{rel.id}
        </span>
        {sectorTag && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: COLORS.surface,
              color: COLORS.blue,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {sectorTag}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Pill color={COLORS.navy}>{(rel.relationshipType || "direct").charAt(0).toUpperCase() + (rel.relationshipType || "direct").slice(1)}</Pill>
        {rel.totalDealValue && parseFloat(rel.totalDealValue) > 0 && (
          <Pill color="#6B7A90">{formatCurrency(parseFloat(rel.totalDealValue))}</Pill>
        )}
      </div>
      <div style={{ fontSize: 13, color: "#6B7A90", marginBottom: 16 }}>
        Uploaded {new Date(rel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>

      {/* Status Row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <StatusItem
          label="Match Activity"
          value={isActive ? `Active — ${rel.dealCount} deal${rel.dealCount > 1 ? "s" : ""}` : "Dormant"}
          color={isActive ? COLORS.green : "#94A3B8"}
        />
        <StatusItem
          label="Attribution"
          value={`${formatCurrency(parseFloat(rel.totalEarnings || "0"))} earned`}
          color={COLORS.gold}
        />
        <StatusItem
          label="Custody"
          value={rel.isBlind ? "Protected ✓" : "Visible"}
          color={rel.isBlind ? COLORS.green : "#94A3B8"}
        />
      </div>

      {/* Custody Hash */}
      {isFirst ? (
        <GlowingBorder color="#C4972A">
          <CustodyHashRow hash={rel.timestampHash} onCopy={onCopyHash} />
        </GlowingBorder>
      ) : (
        <CustodyHashRow hash={rel.timestampHash} onCopy={onCopyHash} />
      )}

      {/* E30: Mini timeline */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
        {timelineSteps.map((step, i) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div
              title={step.label}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: step.done ? COLORS.green : COLORS.border,
                border: `2px solid ${step.done ? COLORS.green : COLORS.border}`,
                flexShrink: 0,
              }}
            />
            {i < timelineSteps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: step.done ? COLORS.green : COLORS.border, marginLeft: 2, marginRight: 2 }} />
            )}
          </div>
        ))}
        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4, whiteSpace: "nowrap" }}>
          {timelineSteps.filter(s => s.done).length}/{timelineSteps.length}
        </span>
      </div>

      {/* E27: View Receipt button */}
      <button
        onClick={(e) => { e.stopPropagation(); setFlipped(true); }}
        style={{
          marginTop: 8,
          width: "100%",
          height: 32,
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: "#fff",
          color: COLORS.blue,
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        View Receipt →
      </button>
    </div>
  );
}

function CustodyHashRow({ hash, onCopy }: { hash: string; onCopy: (h: string) => void }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#6B7A90", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Custody: {hash?.slice(0, 24)}...
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy(hash);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: COLORS.blue,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Copy size={14} />
      </button>
    </div>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 12px",
        borderRadius: 6,
        background: `${color}10`,
        color,
      }}
    >
      {children}
    </span>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "#6B7A90" }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

function RelationshipTable({ relationships, onCopyHash }: { relationships: any[]; onCopyHash: (h: string) => void }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: COLORS.surface }}>
            {["ID", "Type", "Sector", "Custody Date", "Match Status", "Attribution", "Actions"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  color: "#6B7A90",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {relationships.map((rel) => {
            const isActive = (rel.dealCount || 0) > 0;
            return (
              <tr key={rel.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 600, color: COLORS.navy }}>
                  REL-{rel.id}
                </td>
                <td style={{ padding: "14px 16px", color: COLORS.navy }}>
                  {(rel.relationshipType || "direct").charAt(0).toUpperCase() + (rel.relationshipType || "direct").slice(1)}
                </td>
                <td style={{ padding: "14px 16px", color: "#6B7A90" }}>{rel.tags?.[0] || "—"}</td>
                <td style={{ padding: "14px 16px", color: "#6B7A90" }}>
                  {new Date(rel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: isActive ? COLORS.green : "#94A3B8", fontWeight: 600 }}>
                    {isActive ? "Active" : "Dormant"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 600, color: COLORS.gold }}>
                  {formatCurrency(parseFloat(rel.totalEarnings || "0"))}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button
                    onClick={() => onCopyHash(rel.timestampHash)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: COLORS.blue,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <Copy size={14} /> Copy Hash
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Modal Steps
   ------------------------------------------------------------------------- */

function ModalStepType({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>Relationship Type</h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>Select the type of relationship you want to protect.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {REL_TYPES.map((t) => {
          const Icon = t.icon;
          const isSelected = selected === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onSelect(t.value)}
              style={{
                padding: 16,
                borderRadius: 10,
                border: `2px solid ${isSelected ? COLORS.gold : COLORS.border}`,
                background: isSelected ? `${COLORS.gold}08` : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isSelected ? COLORS.gold : COLORS.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} style={{ color: isSelected ? "#fff" : "#6B7A90" }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>{t.label}</span>
              {isSelected && <Check size={16} style={{ marginLeft: "auto", color: COLORS.gold }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModalStepProfile({
  sectors, onSectorsChange,
  dealMin, dealMax, onDealMinChange, onDealMaxChange,
  regions, onRegionsChange,
  requirements, onRequirementsChange,
}: {
  sectors: string[]; onSectorsChange: (v: string[]) => void;
  dealMin: string; dealMax: string; onDealMinChange: (v: string) => void; onDealMaxChange: (v: string) => void;
  regions: string[]; onRegionsChange: (v: string[]) => void;
  requirements: string; onRequirementsChange: (v: string) => void;
}) {
  const toggleChip = (list: string[], setter: (v: string[]) => void, val: string) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>Deal Profile</h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>Define the deal profile for this relationship.</p>

      <FieldLabel>Sector</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {SECTORS.map((s) => (
          <ChipButton key={s} active={sectors.includes(s)} onClick={() => toggleChip(sectors, onSectorsChange, s)}>
            {s}
          </ChipButton>
        ))}
      </div>

      <FieldLabel>Deal Size Range</FieldLabel>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Min ($)"
          value={dealMin}
          onChange={(e) => onDealMinChange(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Max ($)"
          value={dealMax}
          onChange={(e) => onDealMaxChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      <FieldLabel>Geographic Focus</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {REGIONS.map((r) => (
          <ChipButton key={r} active={regions.includes(r)} onClick={() => toggleChip(regions, onRegionsChange, r)}>
            {r}
          </ChipButton>
        ))}
      </div>

      <FieldLabel>Specific Requirements</FieldLabel>
      <textarea
        rows={3}
        placeholder="Add any specific requirements..."
        value={requirements}
        onChange={(e) => onRequirementsChange(e.target.value)}
        style={{ ...inputStyle, height: "auto", resize: "vertical" as const, padding: 12 }}
      />
    </div>
  );
}

function ModalStepVerification({ level, onLevelChange }: { level: string; onLevelChange: (v: string) => void }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>Verification Level</h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>What level of verification can you provide?</p>

      <FieldLabel>What can you confirm?</FieldLabel>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          style={{
            ...inputStyle,
            appearance: "none",
            paddingRight: 36,
            cursor: "pointer",
            color: level ? COLORS.navy : "#94A3B8",
          }}
        >
          <option value="">Select verification level</option>
          {VERIFICATION_LEVELS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94A3B8" }}
        />
      </div>

      <FieldLabel>Document Upload (Optional)</FieldLabel>
      <div
        style={{
          border: `2px dashed ${COLORS.border}`,
          borderRadius: 10,
          padding: "32px 16px",
          textAlign: "center",
          color: "#94A3B8",
          cursor: "pointer",
        }}
      >
        <Upload size={28} style={{ margin: "0 auto 8px", display: "block" }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Drop files here or click to upload</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>PDF, DOC, or images up to 10MB</div>
      </div>
    </div>
  );
}

function ModalStepCustody({
  exposure, onExposureChange,
  autoMatch, onAutoMatchChange,
}: {
  exposure: string; onExposureChange: (v: string) => void;
  autoMatch: boolean; onAutoMatchChange: (v: boolean) => void;
}) {
  const exposureOptions = [
    { value: "full", label: "Full", desc: "Complete profile visible to matches" },
    { value: "sector-only", label: "Sector-only", desc: "Only sector and deal size visible" },
    { value: "hidden", label: "Hidden", desc: "No details shared until you approve" },
  ];

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>Custody Settings</h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>Control how your relationship data is shared.</p>

      <FieldLabel>Match Exposure</FieldLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {exposureOptions.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 10,
              border: `2px solid ${exposure === opt.value ? COLORS.gold : COLORS.border}`,
              background: exposure === opt.value ? `${COLORS.gold}08` : "#fff",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="exposure"
              value={opt.value}
              checked={exposure === opt.value}
              onChange={(e) => onExposureChange(e.target.value)}
              style={{ accentColor: COLORS.gold }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: "#6B7A90" }}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>Auto-match consent</div>
          <div style={{ fontSize: 12, color: "#6B7A90" }}>Allow automatic matching with compatible deals</div>
        </div>
        <button
          onClick={() => onAutoMatchChange(!autoMatch)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            background: autoMatch ? COLORS.green : "#CBD5E1",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 3,
              left: autoMatch ? 23 : 3,
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy, marginBottom: 4 }}>Attribution Split</div>
        <div style={{ fontSize: 13, color: "#6B7A90" }}>
          Team attribution splitting will be available for team accounts. Contact support to upgrade.
        </div>
      </div>
    </div>
  );
}

function ModalStepConfirmation({ id, hash, onDone }: { id: string; hash: string; onDone: () => void }) {
  const now = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `${COLORS.green}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <Shield size={32} style={{ color: COLORS.green }} />
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>
        Your relationship is now protected
      </h3>
      <p style={{ fontSize: 14, color: "#6B7A90", marginBottom: 28 }}>Custody receipt generated successfully.</p>

      <div
        style={{
          background: COLORS.surface,
          borderRadius: 12,
          padding: 20,
          textAlign: "left",
          border: `1px solid ${COLORS.border}`,
          marginBottom: 28,
        }}
      >
        <ReceiptRow label="Timestamp" value={now} />
        <ReceiptRow label="Custody ID" value={id} mono />
        <ReceiptRow label="Timestamp Hash" value={hash.slice(0, 32) + "..."} mono last />
      </div>

      <button
        onClick={onDone}
        style={{
          height: 44,
          padding: "0 40px",
          borderRadius: 8,
          background: COLORS.gold,
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
        }}
      >
        Done
      </button>
    </div>
  );
}

function ReceiptRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${COLORS.border}`,
      }}
    >
      <span style={{ fontSize: 13, color: "#6B7A90" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, fontFamily: mono ? "monospace" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Shared UI Helpers
   ------------------------------------------------------------------------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 8 }}>{children}</div>
  );
}

function ChipButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 20,
        border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
        background: active ? `${COLORS.gold}15` : "#fff",
        color: active ? COLORS.gold : "#6B7A90",
        fontWeight: 500,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 14px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
  fontSize: 14,
  outline: "none",
  color: COLORS.navy,
};
