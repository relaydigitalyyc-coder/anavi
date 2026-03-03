import { Search, LayoutGrid, List, Shield } from "lucide-react";
import { COLORS, SECTORS } from "./constants";
import { FilterDropdown } from "./AddRelationshipModal";

export function RelationshipFilterBar({
  searchQuery,
  setSearchQuery,
  sectorFilter,
  setSectorFilter,
  verificationFilter,
  setVerificationFilter,
  matchFilter,
  setMatchFilter,
  viewMode,
  setViewMode,
  openModal,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sectorFilter: string;
  setSectorFilter: (v: string) => void;
  verificationFilter: string;
  setVerificationFilter: (v: string) => void;
  matchFilter: string;
  setMatchFilter: (v: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  openModal: () => void;
}) {
  return (
    <div style={{ padding: "0 32px 24px" }}>
      <div
        className="card-elevated"
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", width: 300 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
            }}
          />
          <input
            type="text"
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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

        <FilterDropdown
          label="Sector"
          value={sectorFilter}
          onChange={setSectorFilter}
          options={SECTORS}
        />
        <FilterDropdown
          label="Custody Status"
          value={verificationFilter}
          onChange={setVerificationFilter}
          options={[
            { value: "custodied", label: "Custodied" },
            { value: "open", label: "Open" },
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
    </div>
  );
}