import { useAuth } from "@/_core/hooks/useAuth";
import { useDemoContext } from "@/contexts/DemoContext";
import {
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  DollarSign,
  FileSearch,
  FolderOpen,
  Handshake,
  Home,
  Info,
  Lightbulb,
  LogOut,
  Menu,
  Network,
  PieChart,
  Search,
  Settings,
  Shield,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { RestartTourBanner } from "./RestartTourBanner";
import { TourOverlay } from "./TourOverlay";
import { useTourContext } from "@/contexts/TourContext";
import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

interface NavItem { icon: LucideIcon; label: string; path: string; tourId?: string }
interface NavSection { label: string; items: NavItem[] }

const navSections: NavSection[] = [
  { label: "OVERVIEW", items: [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ]},
  { label: "TRUST & IDENTITY", items: [
    { icon: Shield, label: "Verification", path: "/verification" },
    { icon: CheckCircle, label: "Compliance", path: "/compliance" },
    { icon: FileSearch, label: "Audit Logs", path: "/audit-logs" },
  ]},
  { label: "RELATIONSHIPS", items: [
    { icon: Users, label: "Relationships", path: "/relationships", tourId: "nav-relationships" },
    { icon: Building2, label: "Family Offices", path: "/family-offices" },
    { icon: Crosshair, label: "Targeting", path: "/targeting" },
    { icon: Network, label: "Network Graph", path: "/network" },
  ]},
  { label: "DEALS", items: [
    { icon: Target, label: "Blind Matching", path: "/deal-matching", tourId: "nav-deal-matching" },
    { icon: Handshake, label: "Intents", path: "/intents" },
    { icon: CheckCircle2, label: "Matches", path: "/matches" },
    { icon: FolderOpen, label: "Deal Rooms", path: "/deal-rooms", tourId: "nav-deal-rooms" },
    { icon: Briefcase, label: "Deals", path: "/deals" },
    { icon: Lightbulb, label: "Deal Intelligence", path: "/deal-intelligence" },
  ]},
  { label: "ECONOMICS", items: [
    { icon: Wallet, label: "Payouts", path: "/payouts", tourId: "nav-payouts" },
    { icon: PieChart, label: "LP Portal", path: "/lp-portal" },
    { icon: DollarSign, label: "Fee Management", path: "/fee-management" },
  ]},
  { label: "INTELLIGENCE", items: [
    { icon: Brain, label: "AI Brain", path: "/ai-brain" },
    { icon: TrendingUp, label: "Intelligence", path: "/intelligence" },
  ]},
  { label: "SETTINGS", items: [
    { icon: CalendarIcon, label: "Calendar", path: "/calendar" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]},
];

const allNavItems = navSections.flatMap(s => s.items);

const pageTitles: Record<string, string> = Object.fromEntries(
  allNavItems.map((item) => [item.path, item.label])
);

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TrustScoreChip({ score }: { score: number }) {
  const bg =
    score > 70
      ? "bg-[#059669]/15 text-[#059669]"
      : score >= 40
        ? "bg-orange-500/15 text-orange-600"
        : "bg-red-500/15 text-red-600";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg}`}
      aria-label={`Trust score ${score} out of 100, Tier 2 Enhanced verification`}
    >
      <span className="font-mono">{score}</span>
      <span className="text-[10px] opacity-60">/ 100</span>
    </div>
  );
}

const mobileNavItems = [
  { icon: Home,   label: "Dashboard",     path: "/dashboard" },
  { icon: Target, label: "Blind Matching", path: "/deal-matching" },
  { icon: Users,  label: "Relationships",  path: "/relationships" },
  { icon: Wallet, label: "Payouts",        path: "/payouts" },
  { icon: Shield, label: "Verification",   path: "/verification" },
  { icon: User,   label: "Profile",        path: "/settings" },
] as const;

const NOTIFICATION_ICONS: Record<string, { Icon: typeof CheckCircle2; color: string }> = {
  match_found: { Icon: Target, color: "#22D4F5" },
  deal_update: { Icon: FolderOpen, color: "#2563EB" },
  document_shared: { Icon: Info, color: "#059669" },
  signature_requested: { Icon: AlertTriangle, color: "#C4972A" },
  payout_received: { Icon: CheckCircle2, color: "#059669" },
  compliance_alert: { Icon: Shield, color: "#DC2626" },
  relationship_request: { Icon: Users, color: "#2563EB" },
  system: { Icon: Info, color: "#6B7280" },
};

const TOUR_BANNER_DISMISSED_KEY = "anavi_tour_banner_dismissed";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { isDemo, fixtures: demoFixtures } = useDemoContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const tour = useTourContext();
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(TOUR_BANNER_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleRestartTour = useCallback(() => {
    tour.restart();
  }, [tour]);

  const handleDismissBanner = useCallback(() => {
    try {
      localStorage.setItem(TOUR_BANNER_DISMISSED_KEY, "true");
    } catch {
      /* ignore */
    }
    setBannerDismissed(true);
  }, []);
  const { data: notificationsData, refetch: refetchNotifications } = trpc.notification.list.useQuery(
    { limit: 20 },
    { enabled: !!user }
  );
  const markAllReadMutation = trpc.notification.markAllRead.useMutation({ onSuccess: () => refetchNotifications() });
  const markReadMutation = trpc.notification.markRead.useMutation({ onSuccess: () => refetchNotifications() });

  const notifications = (notificationsData ?? []).map((n) => {
    const { Icon, color } = NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.system;
    return {
      id: n.id,
      icon: Icon,
      iconColor: color,
      title: n.title,
      message: n.message ?? "",
      time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
      read: n.isRead,
      actionUrl: n.actionUrl,
    };
  });

  const pageTitle = isDemo ? "Dashboard" : (pageTitles[location] ?? "ANAVI");
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const title = pageTitles[location];
    if (title) document.title = `${title} | ANAVI`;
  }, [location]);

  // E51: Scroll restoration
  useEffect(() => {
    const mainEl = document.querySelector('main[role="main"]');
    if (!mainEl) return;

    const savedPos = sessionStorage.getItem(`scroll_${location}`);
    if (savedPos) {
      mainEl.scrollTop = parseInt(savedPos, 10);
    } else {
      mainEl.scrollTop = 0;
    }

    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${location}`, String(mainEl.scrollTop));
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, [location]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
    if (e.key === "Escape") {
      setNotifOpen(false);
      setSearchOpen(false);
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const markAllRead = () => markAllReadMutation.mutate();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((label: string) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const SidebarNav = () => (
    <>
      <nav data-tour="demo-nav" aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections[section.label];
          const hasActive = section.items.some(item => location === item.path);
          return (
            <div key={section.label} className="mb-1">
              <button
                onClick={() => toggleSection(section.label)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/30 hover:text-white/50 transition-colors"
              >
                <span>{section.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
              {!isCollapsed && section.items.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <a
                      data-tour-id={item.tourId}
                      className={`group flex min-h-[40px] cursor-pointer items-center gap-3 rounded-r-md px-3 text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-white/8 text-white"
                          : "border-l-[3px] border-l-transparent text-white/60 hover:bg-white/5 hover:text-white/80"
                      }`}
                      style={isActive ? { boxShadow: "inset 3px 0 0 #C4972A" } : {}}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C4972A] text-xs font-semibold text-white">
            {getInitials(isDemo ? demoFixtures?.user.name : user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {isDemo ? (demoFixtures?.user.name ?? "Demo User") : (user?.name ?? "User")}
            </p>
          </div>
          <button
            onClick={() => logout()}
            aria-label="Log out"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded p-2 text-[11px] text-white/50 hover:bg-white/10 hover:text-white/70"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Sidebar — hidden on mobile, visible lg+ */}
      <aside
        className="hidden w-[240px] shrink-0 flex-col lg:flex"
        style={{ backgroundColor: "#060A12" }}
      >
        <div className="flex h-14 items-center px-5">
          <span className="text-lg font-bold tracking-wide text-white">ANAVI</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed left-0 top-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col bg-[#060A12] shadow-2xl lg:hidden animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-5">
              <span className="text-lg font-bold tracking-wide text-white">ANAVI</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav />
          </aside>
        </>
      )}

      {/* Right side */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header
          role="banner"
          className="flex h-14 shrink-0 items-center justify-between glass-light px-4 md:px-6 sticky top-0 z-30"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[#1E3A5F]/60 hover:bg-[#F3F7FC] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-base font-semibold" style={{ color: "#1E3A5F" }}>
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              data-tour-id="tour-search"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[#1E3A5F]/60 hover:bg-[#F3F7FC]"
              aria-label="Search (Cmd+K)"
              title="Search (Cmd+K)"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="hidden md:block" data-tour-id="trust-score">
              <TrustScoreChip score={isDemo ? (demoFixtures?.user.trustScore ?? 84) : 84} />
            </div>

            {/* E43: Notification bell with drawer */}
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-[#1E3A5F]/60 hover:bg-[#F3F7FC]"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setLocation("/deal-matching")}
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-white sm:block btn-gold"
              aria-label="Create new deal intent"
            >
              Create Intent
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          role="main"
          data-tour-id="welcome"
          className="flex-1 overflow-y-auto pb-20 scrollbar-premium lg:pb-0 relative"
          style={{ backgroundColor: "#F3F7FC" }}
        >
          {/* Subtle ambient depth — very faint, non-animated for performance */}
          <div
            className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px]"
            style={{
              background: "radial-gradient(ellipse at top right, rgb(196 151 42 / 0.04) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
            {!tour.hasCompletedTour() && !bannerDismissed && (
              <RestartTourBanner
                onRestart={handleRestartTour}
                onDismiss={handleDismissBanner}
              />
            )}
            <div className={!tour.hasCompletedTour() && !bannerDismissed ? "mt-4" : ""}>
              {children}
            </div>
          </div>
        </main>

        {tour.isActive && tour.step && (
          <TourOverlay
            step={tour.step}
            currentStep={tour.currentStep}
            totalSteps={tour.totalSteps}
            onNext={tour.next}
            onSkip={tour.skip}
          />
        )}
      </div>

      {/* E43: Notification Drawer */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setNotifOpen(false)} />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-[#0A1628] shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-[#2563EB] hover:underline">
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setNotifOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-white/10"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5 text-white/40" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto scrollbar-premium" style={{ height: "calc(100% - 65px)" }}>
              {notifications.length === 0 ? (
                <div className="px-5 py-12 text-center text-white/50 text-sm">No new notifications.</div>
              ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-white/10 px-5 py-4 transition-colors cursor-pointer hover:bg-white/5 ${n.read ? "bg-[#0A1628]" : "bg-[#0D1628]"}`}
                  onClick={() => {
                    if (!n.read) markReadMutation.mutate({ id: n.id });
                    if (n.actionUrl) { setNotifOpen(false); setLocation(n.actionUrl); }
                  }}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${n.iconColor}15` }}>
                    <n.icon className="h-4 w-4" style={{ color: n.iconColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    <p className="mt-0.5 text-xs text-white/60">{n.message}</p>
                    <p className="mt-1 text-[10px] text-white/40">{n.time}</p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />}
                </div>
              ))
              )}
            </div>
          </div>
        </>
      )}

      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mobile bottom navigation — 44px tap targets */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 min-h-[56px] items-center justify-around border-t border-white/10 bg-[#060A12] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {mobileNavItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-[#22D4F5]" : "text-white/40"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default DashboardLayout;
