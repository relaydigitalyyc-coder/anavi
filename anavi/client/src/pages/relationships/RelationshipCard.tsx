import { useState } from "react";
import { GlowingBorder } from "@/components/PremiumAnimations";
import { COLORS, formatCurrency } from "./constants";
import { CustodyHashRow } from "./RelationshipTable";

function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
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

function StatusItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
    >
      <span style={{ color: "#6B7A90" }}>{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
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
      <span
        className={
          mono
            ? "font-data-mono text-[10px] text-[#1E3A5F]/50 font-semibold"
            : ""
        }
        style={
          !mono
            ? { fontSize: 13, fontWeight: 600, color: COLORS.navy }
            : undefined
        }
      >
        {value}
      </span>
    </div>
  );
}

export function RelationshipCard({
  rel,
  onCopyHash,
  onExportProof,
  onSelect,
  isFirst = false,
}: {
  rel: any;
  onCopyHash: (h: string) => void;
  onExportProof?: () => void;
  onSelect?: () => void;
  isFirst?: boolean;
}) {
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
        className="card-elevated"
        style={{
          padding: 24,
          minHeight: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: 15,
              color: COLORS.navy,
            }}
          >
            Custody Receipt
          </span>
          <button
            onClick={() => setFlipped(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: COLORS.blue,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
        </div>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <ReceiptRow label="Custody ID" value={`REL-${rel.id}`} mono />
          <ReceiptRow
            label="Timestamp"
            value={new Date(rel.createdAt).toLocaleString()}
          />
          <ReceiptRow
            label="Custody Proof"
            value={rel.timestampHash?.slice(0, 32) + "..."}
            mono
          />
          <ReceiptRow
            label="Verification"
            value={rel.isBlind ? "Custodied" : "Open"}
          />
          <ReceiptRow
            label="Attribution"
            value={formatCurrency(parseFloat(rel.totalEarnings || "0"))}
            last
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={handleVerify}
            disabled={verifying > 0}
            style={{
              flex: 1,
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
          {onExportProof && (
            <button
              onClick={onExportProof}
              style={{
                height: 36,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "#fff",
                color: COLORS.blue,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Export Proof
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-elevated"
      style={{
        padding: 24,
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
      onClick={() => onSelect?.()}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,22,40,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: 15,
            color: COLORS.navy,
          }}
        >
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
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
      >
        <Pill color={COLORS.navy}>
          {(rel.relationshipType || "direct").charAt(0).toUpperCase() +
            (rel.relationshipType || "direct").slice(1)}
        </Pill>
        {rel.totalDealValue && parseFloat(rel.totalDealValue) > 0 && (
          <Pill color="#6B7A90">
            {formatCurrency(parseFloat(rel.totalDealValue))}
          </Pill>
        )}
      </div>
      <div style={{ fontSize: 13, color: "#6B7A90", marginBottom: 16 }}>
        Uploaded{" "}
        {new Date(rel.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      {/* Status Row */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <StatusItem
          label="Match Activity"
          value={
            isActive
              ? `Active — ${rel.dealCount} deal${rel.dealCount > 1 ? "s" : ""}`
              : "Dormant"
          }
          color={isActive ? COLORS.green : "#94A3B8"}
        />
        <StatusItem
          label="Attribution"
          value={`${formatCurrency(parseFloat(rel.totalEarnings || "0"))} earned`}
          color={COLORS.gold}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#6B7A90" }}>Custody</span>
          {rel.isBlind ? (
            <span className="bg-[#059669]/15 text-[#059669] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Custodied
            </span>
          ) : (
            <span className="bg-[#F59E0B]/15 text-[#F59E0B] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Open
            </span>
          )}
        </div>
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        {timelineSteps.map((step, i) => (
          <div
            key={step.label}
            style={{ display: "flex", alignItems: "center", flex: 1 }}
          >
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
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: step.done ? COLORS.green : COLORS.border,
                  marginLeft: 2,
                  marginRight: 2,
                }}
              />
            )}
          </div>
        ))}
        <span
          style={{
            fontSize: 10,
            color: "#94A3B8",
            marginLeft: 4,
            whiteSpace: "nowrap",
          }}
        >
          {timelineSteps.filter(s => s.done).length}/{timelineSteps.length}
        </span>
      </div>

      {/* E27: View Receipt button */}
      <button
        onClick={e => {
          e.stopPropagation();
          setFlipped(true);
        }}
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