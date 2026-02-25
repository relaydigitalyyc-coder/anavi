export function ComplianceTab() {
  const parties = [
    {
      name: "Party A", tier: "Tier 2 — Enhanced", lastCheck: "Feb 18, 2026",
      checks: [
        { label: "KYC Status", value: "Verified", status: "good" },
        { label: "AML Status", value: "Clear", status: "good" },
        { label: "Sanctions Check", value: "Clear", status: "good" },
        { label: "PEP Status", value: "Not PEP", status: "good" },
      ],
    },
    {
      name: "Party B", tier: "Tier 1 — Basic", lastCheck: "Feb 10, 2026",
      checks: [
        { label: "KYC Status", value: "Pending", status: "warning" },
        { label: "AML Status", value: "In Review", status: "warning" },
        { label: "Sanctions Check", value: "Clear", status: "good" },
        { label: "PEP Status", value: "Not PEP", status: "good" },
      ],
    },
  ];

  function badgeClass(status: string) {
    if (status === "good") return "status-completed";
    if (status === "warning") return "status-nda-pending";
    return "status-declined";
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {parties.map((party) => {
          const allGood = party.checks.every(c => c.status === "good");
          return (
            <section key={party.name} className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-subheading" style={{ color: "#0A1628" }}>{party.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{party.tier}</p>
                </div>
                <span className={`status-pill text-[10px] ${allGood ? "status-completed" : "status-diligence"}`}>
                  {allGood ? "Verified" : "Action Required"}
                </span>
              </div>
              <div className="space-y-3">
                {party.checks.map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{c.label}</span>
                    <span className={`status-pill text-[10px] ${badgeClass(c.status)}`}>{c.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t text-xs text-muted-foreground" style={{ borderColor: "#D1DCF0" }}>
                Last verified: {party.lastCheck}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
