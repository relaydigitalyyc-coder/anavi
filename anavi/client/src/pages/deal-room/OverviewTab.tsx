import { useState } from "react";
import {
  User, Check, ChevronRight, Search,
  Users, Sparkles, Loader2, AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function RecommendIntroductionSection({ room }: { room: any }) {
  const [result, setResult] = useState<{
    recommendationScore: number;
    rationale: string;
    suggestedApproach: string;
    draftIntroduction: string;
  } | null>(null);

  const recommend = trpc.ai.recommendIntroduction.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Recommendation generated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: "#059669" }} />
          <h3 className="text-subheading" style={{ color: "#0A1628" }}>Recommended Introductions</h3>
        </div>
        <button
          onClick={() =>
            recommend.mutate({
              sourceName: "Party A",
              sourceCompany: "Originator",
              targetName: "Party B",
              targetCompany: "Counterparty",
              context: `Deal room: ${room.name}. ${room.description || ""}`,
            })
          }
          disabled={recommend.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#059669" }}
        >
          {recommend.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Recommend Introduction</>
          )}
        </button>
      </div>
      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "#0A1628" }}>Score</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${result.recommendationScore}%`, background: "#059669" }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: "#0A1628" }}>{result.recommendationScore}%</span>
          </div>
          <div className="p-3 rounded-lg bg-[#F3F7FC]">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#059669" }}>Rationale</p>
            <p className="text-sm" style={{ color: "#0A1628" }}>{result.rationale}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F3F7FC]">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#2563EB" }}>Suggested Approach</p>
            <p className="text-sm" style={{ color: "#0A1628" }}>{result.suggestedApproach}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F3F7FC]">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#C4972A" }}>Draft Introduction</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#0A1628" }}>{result.draftIntroduction}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Get AI-powered introduction recommendations for deal participants.
        </p>
      )}
    </section>
  );
}

function FindSimilarDealsSection() {
  const [results, setResults] = useState<any[] | null>(null);
  const semanticMatch = trpc.ai.semanticMatch.useMutation({
    onSuccess: (data) => {
      setResults(data.matches);
      toast.success(`Found ${data.matches.length} similar deals`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" style={{ color: "#C4972A" }} />
          <h3 className="text-subheading" style={{ color: "#0A1628" }}>Similar Deals</h3>
        </div>
        <button
          onClick={() => semanticMatch.mutate({ intentId: 1, maxResults: 5 })}
          disabled={semanticMatch.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#C4972A" }}
        >
          {semanticMatch.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Find Similar Deals</>
          )}
        </button>
      </div>
      {results && results.length > 0 ? (
        <div className="space-y-2">
          {results.map((match: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border bg-[#F3F7FC]" style={{ borderColor: "#D1DCF0" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: "#0A1628" }}>
                  Match #{match.intentId || i + 1}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: match.score >= 0.8 ? "#ECFDF5" : match.score >= 0.5 ? "#FFFBEB" : "#FEF2F2",
                    color: match.score >= 0.8 ? "#059669" : match.score >= 0.5 ? "#C4972A" : "#DC2626",
                  }}
                >
                  {Math.round((match.score || 0) * 100)}% match
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{match.reason}</p>
              {match.synergies && (
                <p className="text-xs mt-1" style={{ color: "#059669" }}>Synergies: {match.synergies}</p>
              )}
            </div>
          ))}
        </div>
      ) : results ? (
        <p className="text-sm text-muted-foreground">No similar deals found.</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Use AI to find deals with similar characteristics and synergy potential.
        </p>
      )}
    </section>
  );
}

export function OverviewTab({ room, payouts, auditEntries }: { room: any; payouts: any[]; auditEntries: any[] }) {
  return (
    <div className="space-y-6">
      {/* Deal Summary */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Deal Summary</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-label text-muted-foreground">Type</span>
            <p className="font-medium mt-0.5">Private Transaction</p>
          </div>
          <div>
            <span className="text-label text-muted-foreground">Description</span>
            <p className="font-medium mt-0.5">{room.description || "—"}</p>
          </div>
          <div>
            <span className="text-label text-muted-foreground">Created</span>
            <p className="font-medium mt-0.5">{new Date(room.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-label text-muted-foreground">Current Stage</span>
            <p className="font-medium mt-0.5">{room.status === "active" ? "Active" : room.status === "closed" ? "Completed" : room.status === "archived" ? "Declined" : "NDA Pending"}</p>
          </div>
        </div>
      </section>

      {/* Parties */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Parties</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { role: "Originator", name: "Party A" },
            { role: "Buyer", name: "Party B" },
            { role: "Seller", name: "Party C" },
          ].map((p) => (
            <div key={p.role} className="flex items-center gap-3 p-3 rounded-lg bg-[#F3F7FC]">
              <div className="w-9 h-9 rounded-full bg-[#D1DCF0] flex items-center justify-center">
                <User className="w-4 h-4" style={{ color: "#1E3A5F" }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{p.role}</div>
                <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{p.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <RecommendIntroductionSection room={room} />
      <FindSimilarDealsSection />

      {/* Payout Structure Preview */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Payout Structure Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#D1DCF0" }}>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">Role</th>
                <th className="text-right py-2 text-label text-muted-foreground font-medium">Attribution %</th>
                <th className="text-right py-2 text-label text-muted-foreground font-medium">Expected Payout</th>
              </tr>
            </thead>
            <tbody>
              {payouts && payouts.length > 0 ? (
                payouts.map((p: any, i: number) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "#D1DCF0" }}>
                    <td className="py-2.5 font-medium">{p.role || "Participant"}</td>
                    <td className="py-2.5 text-right">{p.attributionPercentage ?? "—"}%</td>
                    <td className="py-2.5 text-right font-data-mono">${Number(p.amount || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                    No payout data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity Timeline */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Activity Timeline</h3>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "#D1DCF0" }} />
          {auditEntries && auditEntries.length > 0 ? (
            auditEntries.slice(0, 5).map((entry: any, i: number) => (
              <div key={i} className="relative pb-5 last:pb-0">
                <div
                  className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full border-2 bg-white"
                  style={{ borderColor: "#2563EB" }}
                />
                <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{entry.action}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.performedBy ? ` · User #${entry.performedBy}` : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-4">No activity recorded yet</div>
          )}
        </div>
      </section>
    </div>
  );
}
