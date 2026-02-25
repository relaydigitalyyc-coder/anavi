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
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CursorGlow } from "./components/CursorGlow";
import { TourProvider } from "./contexts/TourContext";

function ShellRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <Component />
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
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
      <Route path="/welcome">
        <ProtectedPage component={Onboarding} />
      </Route>
      <Route path="/onboarding">
        <ProtectedPage component={OnboardingFlow} />
      </Route>
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
      <Route path="/spv-generator">
        <ProtectedPage component={SPVGenerator} />
      </Route>
      <Route path="/lp-portal">
        <ProtectedPage component={LPPortal} />
      </Route>
      <Route path="/capital-management">
        <ProtectedPage component={CapitalManagement} />
      </Route>
      <Route path="/audit-logs">
        <ProtectedPage component={AuditLogs} />
      </Route>
      <Route path="/commodities">
        <ProtectedPage component={Commodities} />
      </Route>
      <Route path="/real-estate">
        <ProtectedPage component={RealEstate} />
      </Route>
      <Route path="/transaction-matching">
        <ProtectedPage component={TransactionMatching} />
      </Route>
      <Route path="/trading">
        <ProtectedPage component={TradingPlatform} />
      </Route>
      <Route path="/member-onboarding">
        <ProtectedPage component={MemberOnboarding} />
      </Route>
      <Route path="/fee-management">
        <ProtectedPage component={FeeManagement} />
      </Route>
      <Route path="/deal-rooms/:id">
        <ShellRoute component={DealRoom} />
      </Route>
      <Route path="/manifesto">
        <ProtectedPage component={Manifesto} />
      </Route>
      <Route path="/operator-intake">
        <ProtectedPage component={OperatorIntake} />
      </Route>
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
      <Route path="/crypto-assets">
        <ProtectedPage component={CryptoAssets} />
      </Route>
      <Route path="/ai-brain">
        <ProtectedPage component={AIBrain} />
      </Route>
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
          <TourProvider>
            <Toaster />
            <Router />
          </TourProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
