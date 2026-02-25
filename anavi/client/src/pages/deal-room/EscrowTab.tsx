import { Check, Shield, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EscrowTab({ dealId }: { dealId?: number }) {
  const utils = trpc.useUtils();

  const { data: escrow, isLoading: escrowLoading } = trpc.deal.getEscrowStatus.useQuery(
    { dealId: dealId ?? 0 },
    { enabled: !!dealId }
  );

  const { data: dealData } = trpc.deal.get.useQuery(
    { id: dealId ?? 0 },
    { enabled: !!dealId }
  );

  const milestones: any[] = (dealData?.deal?.milestones as any[]) ?? [];
  const completedCount = milestones.filter((m) => m.status === "completed").length;

  const setupEscrow = trpc.escrow.create.useMutation({
    onSuccess: () => {
      toast.success("Escrow account created");
      utils.deal.getEscrowStatus.invalidate({ dealId: dealId ?? 0 });
    },
    onError: (err) => toast.error(err.message),
  });

  const completeMilestone = trpc.deal.completeMilestone.useMutation({
    onSuccess: (data) => {
      toast.success(data.allCompleted ? "All milestones completed — deal closed!" : "Milestone completed");
      utils.deal.get.invalidate({ id: dealId ?? 0 });
      utils.deal.getEscrowStatus.invalidate({ dealId: dealId ?? 0 });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Escrow Status</h3>
        {escrowLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : !escrow || escrow.status === "not_configured" ? (
          <>
            <div className="text-3xl font-bold number-display" style={{ color: "#059669" }}>$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">Escrow not configured</p>
            <Button
              size="sm"
              className="mt-3"
              disabled={setupEscrow.isPending}
              onClick={() => dealId && setupEscrow.mutate({ dealId })}
            >
              <Shield className="w-4 h-4 mr-1" />
              {setupEscrow.isPending ? "Setting up..." : "Setup Escrow"}
            </Button>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold number-display" style={{ color: "#059669" }}>
              ${(escrow.fundedAmount ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {escrow.provider ?? "—"} · Funded
              {escrow.releasedAmount > 0 && ` · $${escrow.releasedAmount.toLocaleString()} released`}
            </p>
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              {escrow.status.replace("_", " ")}
            </span>
          </>
        )}
      </section>

      {/* Visual Milestone Tracker */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-6" style={{ color: "#0A1628" }}>Escrow Milestones</h3>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones defined for this deal.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#D1DCF0]">
              <div
                className="w-full bg-[#059669] transition-all duration-700"
                style={{ height: `${(completedCount / milestones.length) * 100}%` }}
              />
            </div>
            <div className="space-y-6">
              {milestones.map((m, i) => {
                const isCompleted = m.status === "completed";
                const isNext = !isCompleted && milestones.slice(0, i).every((prev: any) => prev.status === "completed");
                return (
                  <div key={m.id ?? m.name} className="flex gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                      isCompleted ? "bg-[#059669] border-[#059669]" :
                      isNext ? "bg-white border-[#2563EB] animate-pulse" :
                      "bg-white border-[#D1DCF0]"
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-xs font-bold" style={{ color: isNext ? "#2563EB" : "#94A3B8" }}>{i + 1}</span>
                      )}
                    </div>
                    <div className={`flex-1 rounded-lg border p-4 ${isNext ? "border-[#2563EB]/30 bg-[#2563EB]/5" : ""}`} style={{ borderColor: isNext ? undefined : "#D1DCF0" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#0A1628" }}>{m.name}</p>
                          {m.payoutTrigger && (
                            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Payout trigger</p>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-2">
                          {isCompleted && m.completedAt && (
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(m.completedAt).toLocaleDateString()}
                            </p>
                          )}
                          {isNext && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              disabled={completeMilestone.isPending}
                              onClick={() => dealId && completeMilestone.mutate({ dealId, milestoneId: m.id })}
                            >
                              {completeMilestone.isPending ? "..." : "Complete"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`status-pill text-[10px] ${
                          isCompleted ? "status-completed" : isNext ? "status-active" : "status-nda-pending"
                        }`}>
                          {isCompleted ? "Completed" : isNext ? "In Progress" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
