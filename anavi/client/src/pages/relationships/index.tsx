import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { COLORS } from "./constants";
import { RelationshipStats } from "./RelationshipStats";
import { RelationshipFilterBar } from "./RelationshipFilterBar";
import { RelationshipContent } from "./RelationshipContent";
import { RelationshipDetailPanel } from "./RelationshipDetailPanel";
import { ProofModal, AddRelationshipFlow } from "./AddRelationshipModal";

export default function Relationships() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [matchFilter, setMatchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRelId, setSelectedRelId] = useState<number | null>(null);

  const {
    data: relationships,
    isLoading,
    refetch,
  } = trpc.relationship.list.useQuery();
  const [proofModal, setProofModal] = useState<number | null>(null);
  const { data: stats } = trpc.user.getStats.useQuery();
  const activeMatches = (stats as any)?.activeMatches ?? 12;

  const filteredRelationships = (relationships || []).filter(rel => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      `REL-${rel.id}`.toLowerCase().includes(q) ||
      rel.relationshipType?.toLowerCase().includes(q) ||
      rel.tags?.some((t: string) => t.toLowerCase().includes(q));
    const matchesSector = !sectorFilter || rel.tags?.includes(sectorFilter);
    const matchesVerification =
      !verificationFilter ||
      (verificationFilter === "custodied" && rel.isBlind) ||
      (verificationFilter === "open" && !rel.isBlind);
    const matchesMatch =
      !matchFilter ||
      (matchFilter === "active" && (rel.dealCount || 0) > 0) ||
      (matchFilter === "dormant" && (rel.dealCount || 0) === 0);
    return (
      matchesSearch && matchesSector && matchesVerification && matchesMatch
    );
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Custody hash copied");
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  useEffect(() => {
    document.title = "Relationships | ANAVI";
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.surface }}>
      {/* Page Heading */}
      <div style={{ padding: "32px 32px 12px" }}>
        <h1 className="dash-heading text-3xl">Relationship Custody</h1>
        <p className="text-lg text-[#6B7A90] mt-2">
          Timestamped introductions with cryptographic proof of custody.
        </p>
      </div>

      {/* Header Stats Bar */}
      <RelationshipStats
        relationships={relationships || []}
        activeMatches={activeMatches}
      />

      {/* Filter Bar */}
      <RelationshipFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sectorFilter={sectorFilter}
        setSectorFilter={setSectorFilter}
        verificationFilter={verificationFilter}
        setVerificationFilter={setVerificationFilter}
        matchFilter={matchFilter}
        setMatchFilter={setMatchFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        openModal={openModal}
      />

      {/* Content */}
      <div style={{ padding: "0 32px 48px" }}>
        <RelationshipContent
          isLoading={isLoading}
          filteredRelationships={filteredRelationships}
          viewMode={viewMode}
          copyHash={copyHash}
          setProofModal={setProofModal}
          setSelectedRelId={setSelectedRelId}
          openModal={openModal}
        />
      </div>

      {/* F6: Export Proof Modal */}
      {proofModal !== null && (
        <ProofModal
          relationshipId={proofModal}
          onClose={() => setProofModal(null)}
        />
      )}

      {/* Detail Sheet */}
      <Sheet
        open={selectedRelId !== null}
        onOpenChange={open => {
          if (!open) setSelectedRelId(null);
        }}
      >
        <SheetContent className="w-full sm:w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selectedRelId !== null && (
            <RelationshipDetailPanel
              relationshipId={selectedRelId}
              onClose={() => setSelectedRelId(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Upload Modal */}
      <AddRelationshipFlow open={modalOpen} onClose={closeModal} refetch={refetch} />
    </div>
  );
}