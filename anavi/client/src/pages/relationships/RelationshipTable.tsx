import { Copy } from "lucide-react";
import { COLORS, formatCurrency } from "./constants";

export function CustodyHashRow({
  hash,
  onCopy,
}: {
  hash: string;
  onCopy: (h: string) => void;
}) {
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
      <span
        className="font-data-mono text-[10px] text-[#1E3A5F]/50"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        Custody Proof: {hash?.slice(0, 8)}...{hash?.slice(-6)}
      </span>
      <button
        onClick={e => {
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

export function RelationshipTable({
  relationships,
  onCopyHash,
  onExportProof,
  onSelect,
}: {
  relationships: any[];
  onCopyHash: (h: string) => void;
  onExportProof?: (id: number) => void;
  onSelect?: (id: number) => void;
}) {
  return (
    <div className="card-elevated" style={{ overflow: "hidden" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
      >
        <thead>
          <tr style={{ background: COLORS.surface }}>
            {[
              "ID",
              "Type",
              "Sector",
              "Custody Date",
              "Match Status",
              "Attribution",
              "Actions",
            ].map(h => (
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
          {relationships.map(rel => {
            const isActive = (rel.dealCount || 0) > 0;
            return (
              <tr
                key={rel.id}
                onClick={() => onSelect?.(rel.id)}
                style={{
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: "pointer",
                }}
                className="hover:bg-[#F3F7FC] transition-colors"
              >
                <td
                  style={{
                    padding: "14px 16px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: COLORS.navy,
                  }}
                >
                  REL-{rel.id}
                </td>
                <td style={{ padding: "14px 16px", color: COLORS.navy }}>
                  {(rel.relationshipType || "direct").charAt(0).toUpperCase() +
                    (rel.relationshipType || "direct").slice(1)}
                </td>
                <td style={{ padding: "14px 16px", color: "#6B7A90" }}>
                  {rel.tags?.[0] || "—"}
                </td>
                <td style={{ padding: "14px 16px", color: "#6B7A90" }}>
                  {new Date(rel.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      color: isActive ? COLORS.green : "#94A3B8",
                      fontWeight: 600,
                    }}
                  >
                    {isActive ? "Active" : "Dormant"}
                  </span>
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontWeight: 600,
                    color: COLORS.gold,
                  }}
                >
                  {formatCurrency(parseFloat(rel.totalEarnings || "0"))}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 12 }}>
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
                    {onExportProof && (
                      <button
                        onClick={() => onExportProof(rel.id)}
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
                        Export Proof
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}