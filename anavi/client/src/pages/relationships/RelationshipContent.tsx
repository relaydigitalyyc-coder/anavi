import { Users } from "lucide-react";
import { ScaleHover } from "@/components/PageTransition";
import { RelationshipCard } from "./RelationshipCard";
import { RelationshipTable } from "./RelationshipTable";
import { COLORS } from "./constants";

export function RelationshipContent({
  isLoading,
  filteredRelationships,
  viewMode,
  copyHash,
  setProofModal,
  setSelectedRelId,
  openModal,
}: {
  isLoading: boolean;
  filteredRelationships: any[];
  viewMode: "grid" | "list";
  copyHash: (h: string) => void;
  setProofModal: (id: number) => void;
  setSelectedRelId: (id: number) => void;
  openModal: () => void;
}) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="card-elevated"
            style={{
              padding: 24,
              height: 220,
            }}
          >
            <div
              style={{
                background: "#E2E8F0",
                borderRadius: 8,
                height: "100%",
                animation: "pulse 2s infinite",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (filteredRelationships.length === 0) {
    return (
      <div
        className="card-elevated"
        style={{
          padding: "64px 32px",
          textAlign: "center",
        }}
      >
        <Users
          size={48}
          style={{ color: "#94A3B8", margin: "0 auto 16px" }}
        />
        <h3
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: COLORS.navy,
            marginBottom: 8,
          }}
        >
          No Relationships Yet
        </h3>
        <p style={{ color: "#6B7A90", marginBottom: 24 }}>
          Start protecting your network with custody timestamps
        </p>
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
    );
  }

  if (viewMode === "grid") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {filteredRelationships.map((rel, idx) => (
          <ScaleHover key={rel.id}>
            <RelationshipCard
              rel={rel}
              onCopyHash={copyHash}
              onExportProof={() => setProofModal(rel.id)}
              onSelect={() => setSelectedRelId(rel.id)}
              isFirst={idx === 0}
            />
          </ScaleHover>
        ))}
      </div>
    );
  }

  return (
    <RelationshipTable
      relationships={filteredRelationships}
      onCopyHash={copyHash}
      onExportProof={setProofModal}
      onSelect={setSelectedRelId}
    />
  );
}