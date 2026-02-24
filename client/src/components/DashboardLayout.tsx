import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
  Bell,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  Target,
  User,
  Users,
  Wallet,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Relationships", path: "/relationships" },
  { icon: Target, label: "Deal Matching", path: "/deal-matching" },
  { icon: FolderOpen, label: "Deal Rooms", path: "/deal-rooms" },
  { icon: Shield, label: "Verification", path: "/verification" },
  { icon: BarChart3, label: "Intelligence", path: "/intelligence", comingSoon: true },
  { icon: Wallet, label: "Payouts", path: "/payouts" },
  { icon: Settings, label: "Settings", path: "/settings" },
] as const;

const pageTitles: Record<string, string> = Object.fromEntries(
  navItems.map((item) => [item.path, item.label])
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
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Target, label: "Matches", path: "/deal-matching" },
  { icon: Users, label: "Relationships", path: "/relationships" },
  { icon: FolderOpen, label: "Deal Rooms", path: "/deal-rooms" },
  { icon: User, label: "Profile", path: "/settings" },
] as const;

const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: CheckCircle2, iconColor: "#059669", title: "Match accepted", message: "Solar deal match #A4F2 accepted by counterparty", time: "2 min ago", read: false },
  { id: 2, icon: AlertTriangle, iconColor: "#C4972A", title: "NDA expiring", message: "Deal Room #12 NDA expires in 48 hours", time: "1 hour ago", read: false },
  { id: 3, icon: Info, iconColor: "#2563EB", title: "New match found", message: "85% compatibility match for Real Estate intent", time: "3 hours ago", read: false },
  { id: 4, icon: CheckCircle2, iconColor: "#059669", title: "Payout completed", message: "Originator fee of $12,500 deposited", time: "Yesterday", read: true },
  { id: 5, icon: Info, iconColor: "#2563EB", title: "Verification updated", message: "Your Trust Score increased to 86", time: "Yesterday", read: true },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const pageTitle = pageTitles[location] ?? "ANAVI";
  const unreadCount = notifications.filter(n => !n.read).length;

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      import("sonner").then(({ toast }) => toast.info("Search coming soon"));
    }
    if (e.key === "Escape") {
      setNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar — hidden on mobile */}
      <aside
        className="hidden w-[240px] shrink-0 flex-col md:flex"
        style={{ backgroundColor: "#060A12" }}
      >
        <div className="flex h-14 items-center px-5">
          <span className="text-lg font-bold tracking-wide text-white">ANAVI</span>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`group flex h-10 cursor-pointer items-center gap-3 rounded-r-md px-3 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white/8 text-white"
                      : "border-l-[3px] border-l-transparent text-white/60 hover:bg-white/5 hover:text-white/80"
                  }`}
                  style={isActive ? { boxShadow: "inset 3px 0 0 #C4972A" } : {}}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {"comingSoon" in item && item.comingSoon && (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                      Soon
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C4972A] text-xs font-semibold text-white">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name ?? "User"}
              </p>
            </div>
            <button
              onClick={() => logout()}
              aria-label="Log out"
              className="rounded p-2 text-[11px] text-white/50 hover:bg-white/10 hover:text-white/70"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header
          role="banner"
          className="flex h-14 shrink-0 items-center justify-between glass-light px-4 md:px-6 sticky top-0 z-30"
        >
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md text-[#1E3A5F]/60 hover:bg-[#F3F7FC] md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-base font-semibold" style={{ color: "#1E3A5F" }}>
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <TrustScoreChip score={84} />
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
          className="flex-1 overflow-y-auto pb-16 scrollbar-premium md:pb-0 relative"
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
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8">
            {children}
          </div>
        </main>
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
                <button onClick={() => setNotifOpen(false)} className="rounded p-1 hover:bg-white/10">
                  <X className="h-5 w-5 text-white/40" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto scrollbar-premium" style={{ height: "calc(100% - 65px)" }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 border-b border-white/10 px-5 py-4 transition-colors ${n.read ? "bg-[#0A1628]" : "bg-[#0D1628]"}`}
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
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-white/10 bg-[#060A12] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {mobileNavItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? "text-[#22D4F5]" : "text-white/40"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ShellRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

export default DashboardLayout;
