export function PayoutsTab({ payouts }: { payouts: any[] }) {
  const totalAmount = payouts?.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Payout Structure</h3>
        {payouts && payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#D1DCF0" }}>
                  <th className="text-left py-2 text-label text-muted-foreground font-medium">Party</th>
                  <th className="text-left py-2 text-label text-muted-foreground font-medium">Role</th>
                  <th className="text-right py-2 text-label text-muted-foreground font-medium">Attribution %</th>
                  <th className="text-right py-2 text-label text-muted-foreground font-medium">Amount</th>
                  <th className="text-right py-2 text-label text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any, i: number) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "#D1DCF0" }}>
                    <td className="py-2.5 font-medium">User #{p.userId}</td>
                    <td className="py-2.5">{p.role || "Participant"}</td>
                    <td className="py-2.5 text-right">{p.attributionPercentage ?? "—"}%</td>
                    <td className="py-2.5 text-right font-data-mono">${Number(p.amount || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className={`status-pill text-[10px] ${
                        p.status === "completed" ? "status-completed" :
                        p.status === "processing" ? "status-active" :
                        "status-nda-pending"
                      }`}>
                        {p.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No payout data available</p>
        )}
      </section>

      {/* Milestone Release Schedule */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Release Schedule</h3>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "#D1DCF0" }} />
          {["DD Complete", "Agreement Signed", "Transfer Complete", "Final Settlement"].map((label, i) => (
            <div key={label} className="relative pb-5 last:pb-0">
              <div
                className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full border-2 bg-white"
                style={{ borderColor: i === 0 ? "#059669" : "#D1DCF0" }}
              />
              <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Milestone {i + 1}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Total Distribution */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-2" style={{ color: "#0A1628" }}>Total Distribution</h3>
        <div className="text-3xl font-bold number-display" style={{ color: "#0A1628" }}>
          ${totalAmount.toLocaleString()}
        </div>
      </section>
    </div>
  );
}
