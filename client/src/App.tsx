import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Relationships from "./pages/Relationships";
import Intents from "./pages/Intents";
import Matches from "./pages/Matches";
import Deals from "./pages/Deals";
import DealRooms from "./pages/DealRooms";
import Compliance from "./pages/Compliance";
import Payouts from "./pages/Payouts";
import Network from "./pages/Network";
import Settings from "./pages/Settings";
import FamilyOffices from "./pages/FamilyOffices";
import Targeting from "./pages/Targeting";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import SPVGenerator from "./pages/SPVGenerator";
import LPPortal from "./pages/LPPortal";
import CapitalManagement from "./pages/CapitalManagement";
import AuditLogs from "./pages/AuditLogs";
import Commodities from "./pages/Commodities";
import RealEstate from "./pages/RealEstate";
import TransactionMatching from "./pages/TransactionMatching";
import TradingPlatform from "./pages/TradingPlatform";
import MemberOnboarding from "./pages/MemberOnboarding";
import FeeManagement from "./pages/FeeManagement";
import DealRoom from "./pages/DealRoom";
import Manifesto from "./pages/Manifesto";
import OperatorIntake from "./pages/OperatorIntake";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import DealIntelligence from "./pages/DealIntelligence";
import CryptoAssets from "./pages/CryptoAssets";
import AIBrain from "./pages/AIBrain";
import DealMatching from "./pages/DealMatching";
import Verification from "./pages/Verification";
import Onboarding from "./pages/Onboarding";
import OnboardingFlow from "./pages/OnboardingFlow";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Intelligence from "./pages/Intelligence";
import Demo from "./pages/Demo";
import DashboardLayout from "./components/DashboardLayout";
import { PageTransition } from "./components/PageTransition";
import { CursorGlow } from "./components/CursorGlow";

function ShellRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <PageTransition>
        <Component />
      </PageTransition>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/intelligence">
        <ShellRoute component={Intelligence} />
      </Route>
      <Route path="/demo" component={Demo} />
      <Route path="/welcome" component={Onboarding} />
      <Route path="/onboarding" component={OnboardingFlow} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/relationships">
        <ShellRoute component={Relationships} />
      </Route>
      <Route path="/intents">
        <ShellRoute component={Intents} />
      </Route>
      <Route path="/matches">
        <ShellRoute component={Matches} />
      </Route>
      <Route path="/deals">
        <ShellRoute component={Deals} />
      </Route>
      <Route path="/deal-rooms">
        <ShellRoute component={DealRooms} />
      </Route>
      <Route path="/compliance">
        <ShellRoute component={Compliance} />
      </Route>
      <Route path="/payouts">
        <ShellRoute component={Payouts} />
      </Route>
      <Route path="/network">
        <ShellRoute component={Network} />
      </Route>
      <Route path="/settings">
        <ShellRoute component={Settings} />
      </Route>
      <Route path="/family-offices">
        <ShellRoute component={FamilyOffices} />
      </Route>
      <Route path="/targeting">
        <ShellRoute component={Targeting} />
      </Route>
      <Route path="/calendar">
        <ShellRoute component={Calendar} />
      </Route>
      <Route path="/analytics">
        <ShellRoute component={Analytics} />
      </Route>
      <Route path="/spv-generator" component={SPVGenerator} />
      <Route path="/lp-portal" component={LPPortal} />
      <Route path="/capital-management" component={CapitalManagement} />
      <Route path="/audit-logs" component={AuditLogs} />
      <Route path="/commodities" component={Commodities} />
      <Route path="/real-estate" component={RealEstate} />
      <Route path="/transaction-matching" component={TransactionMatching} />
      <Route path="/trading" component={TradingPlatform} />
      <Route path="/member-onboarding" component={MemberOnboarding} />
      <Route path="/fee-management" component={FeeManagement} />
      <Route path="/deal-rooms/:id">
        <ShellRoute component={DealRoom} />
      </Route>
      <Route path="/manifesto" component={Manifesto} />
      <Route path="/operator-intake" component={OperatorIntake} />
      <Route path="/knowledge-graph">
        <ShellRoute component={KnowledgeGraphPage} />
      </Route>
      <Route path="/deal-intelligence">
        <ShellRoute component={DealIntelligence} />
      </Route>
      <Route path="/deal-matching">
        <ShellRoute component={DealMatching} />
      </Route>
      <Route path="/verification">
        <ShellRoute component={Verification} />
      </Route>
      <Route path="/crypto-assets" component={CryptoAssets} />
      <Route path="/ai-brain" component={AIBrain} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CursorGlow />
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
