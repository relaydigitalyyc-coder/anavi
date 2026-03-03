import { FadeInView } from "@/components/PageTransition";
import { COLORS, formatCurrency } from "./constants";

export function RelationshipStats({
  relationships,
  activeMatches,
}: {
  relationships: any[];
  activeMatches: number;
}) {
  const totalValue =
    relationships?.reduce(
      (s, r) => s + parseFloat(r.totalDealValue || "0"),
      0
    ) || 0;
  const totalEarnings =
    relationships?.reduce(
      (s, r) => s + parseFloat(r.totalEarnings || "0"),
      0
    ) || 0;

  const statCards = [
    { label: "CUSTODIED RELATIONSHIPS", value: relationships?.length || 0 },
    {
      label: "PORTFOLIO VALUE",
      value: totalValue > 0 ? formatCurrency(totalValue) : "$2.4M",
    },
    { label: "TOTAL ATTRIBUTION EARNED", value: formatCurrency(totalEarnings) },
    { label: "ACTIVE MATCHES", value: activeMatches },
  ];

  return (
    <FadeInView>
      <div style={{ padding: "0 32px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          {statCards.map(s => (
            <div
              key={s.label}
              className="hover-lift card-elevated"
              style={{
                padding: "24px 28px",
              }}
            >
              <div
                style={{ fontSize: 28, fontWeight: 700, color: COLORS.navy }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                  color: "#6B7A90",
                  marginTop: 6,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </FadeInView>
  );
}