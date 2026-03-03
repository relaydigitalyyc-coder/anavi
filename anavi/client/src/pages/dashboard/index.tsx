import { useActivePersona } from "@/contexts/DemoContext";
import { OriginatorDashboardContent } from "./OriginatorDashboard";
import { InvestorDashboardContent } from "./InvestorDashboard";
import { PrincipalDashboardContent } from "./PrincipalDashboard";

export default function Dashboard() {
  const persona = useActivePersona() ?? "originator";

  if (persona === "investor") return <InvestorDashboardContent />;
  if (persona === "principal") return <PrincipalDashboardContent />;
  return <OriginatorDashboardContent />;
}
