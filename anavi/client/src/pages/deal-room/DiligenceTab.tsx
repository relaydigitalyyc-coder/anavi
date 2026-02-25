import { useState, useEffect } from "react";
import {
  Check, ChevronRight, AlertTriangle,
  Brain, Sparkles, Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const DILIGENCE_ITEMS = [
  "Financial Statements",
  "Legal Review",
  "Asset Verification",
  "Management Assessment",
  "Market Analysis",
  "Compliance Check",
];

function AIDiligenceSection({ room }: { room: any }) {
  const [result, setResult] = useState<{
    confidenceScore: number;
    riskFactors: string[];
    opportunities: string[];
    recommendedActions: string[];
    marketContext: string;
  } | null>(null);

  const analyzeDeal = trpc.ai.claudeAnalyzeDeal.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("AI analysis complete");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: "#2563EB" }} />
          <h3 className="text-subheading" style={{ color: "#0A1628" }}>AI Diligence Summary</h3>
        </div>
        <button
          onClick={() =>
            analyzeDeal.mutate({
              name: room.name || "Untitled Deal",
              type: "private_transaction",
              description: room.description || "No description",
              stage: room.status || undefined,
            })
          }
          disabled={analyzeDeal.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#2563EB" }}
        >
          {analyzeDeal.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Run AI Analysis</>
          )}
        </button>
      </div>
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "#0A1628" }}>Confidence</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${result.confidenceScore}%`,
                  background: result.confidenceScore >= 70 ? "#059669" : result.confidenceScore >= 40 ? "#C4972A" : "#DC2626",
                }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: "#0A1628" }}>{result.confidenceScore}%</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#DC2626" }}>Risk Factors</p>
            <ul className="space-y-1">
              {result.riskFactors.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#DC2626" }} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#059669" }}>Opportunities</p>
            <ul className="space-y-1">
              {result.opportunities.map((o, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#059669" }} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#2563EB" }}>Recommended Actions</p>
            <ul className="space-y-1">
              {result.recommendedActions.map((a, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#2563EB" }} />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-sm text-muted-foreground italic">{result.marketContext}</div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Click "Run AI Analysis" to generate a comprehensive due diligence summary powered by AI.
        </p>
      )}
    </section>
  );
}

export function DiligenceTab({ roomId, room }: { roomId: number; room: any }) {
  const storageKey = `dealroom_diligence_${roomId}`;
  const notesKey = `dealroom_diligence_notes_${roomId}`;

  const [checked, setChecked] = useState<Record<string, "pending" | "in_progress" | "completed">>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(DILIGENCE_ITEMS.map(item => [item, "pending" as const]));
  });
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(notesKey) || ""; } catch { return ""; }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  useEffect(() => {
    localStorage.setItem(notesKey, notes);
  }, [notes, notesKey]);

  const completedCount = Object.values(checked).filter(v => v === "completed").length;
  const completionPct = Math.round((completedCount / DILIGENCE_ITEMS.length) * 100);

  function cycleStatus(item: string) {
    setChecked(prev => {
      const order: Array<"pending" | "in_progress" | "completed"> = ["pending", "in_progress", "completed"];
      const current = prev[item];
      const next = order[(order.indexOf(current) + 1) % order.length];
      return { ...prev, [item]: next };
    });
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-subheading" style={{ color: "#0A1628" }}>Due Diligence Checklist</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
            backgroundColor: completionPct === 100 ? "#ECFDF5" : "#FFFBEB",
            color: completionPct === 100 ? "#059669" : "#C4972A",
          }}>
            {completionPct}% complete
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 mb-4">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, background: completionPct === 100 ? "#059669" : "#2563EB" }} />
        </div>
        <div className="space-y-2">
          {DILIGENCE_ITEMS.map((item) => {
            const status = checked[item];
            return (
              <button
                key={item}
                onClick={() => cycleStatus(item)}
                className="flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-[#F3F7FC] transition-colors"
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: status === "completed" ? "#059669" : status === "in_progress" ? "#2563EB" : "#D1DCF0",
                    background: status === "completed" ? "#059669" : "transparent",
                  }}
                >
                  {status === "completed" && <Check className="w-3 h-3 text-white" />}
                  {status === "in_progress" && <div className="w-2 h-2 rounded-sm" style={{ background: "#2563EB" }} />}
                </div>
                <span className="text-sm font-medium flex-1" style={{ color: "#0A1628" }}>{item}</span>
                <span className={`status-pill text-[10px] ${
                  status === "completed" ? "status-completed" :
                  status === "in_progress" ? "status-active" :
                  "status-nda-pending"
                }`}>
                  {status === "completed" ? "Completed" : status === "in_progress" ? "In Progress" : "Pending"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-3" style={{ color: "#0A1628" }}>Notes</h3>
        <textarea
          className="w-full rounded-lg border p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1DCF0", minHeight: 100 }}
          placeholder="Add notes about the diligence process..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <AIDiligenceSection room={room} />
    </div>
  );
}
