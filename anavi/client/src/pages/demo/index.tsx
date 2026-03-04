import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  Home,
  Users,
  Target,
  FolderOpen,
  Shield,
  Wallet,
  Bell,
} from 'lucide-react';
import { DemoProvider, useDemo } from '@/lib/DemoContext';
// Demo data now unified via contexts/DemoContext -> lib/demoFixtures adapter bridge
import { type DemoDealRoom, type DemoPersona } from '@/pages/demo/demoAdapter';
import GuidedTour, { clearTourCompleted } from '@/components/GuidedTour';
import { demoTour } from '@/lib/tourDefinitions';
import { useAppMode } from '@/contexts/AppModeContext';
import { DemoBanner } from './DemoBanner';
import { PersonaSelector } from './PersonaSelector';
import { C } from './atoms';
import { type DemoPage } from './types';
import {
  DemoDashboardContent,
  DemoRelationshipsContent,
  DemoMatchesContent,
  DemoDealRoomsContent,
  DemoVerificationContent,
  DemoPayoutsContent,
  DealRoomInteriorModal,
} from './DemoContentPages';

const DEMO_NAV: { icon: React.ComponentType<{ className?: string }>; label: string; page: DemoPage }[] = [
  { icon: Home, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Relationships', page: 'relationships' },
  { icon: Target, label: 'Matches', page: 'matches' },
  { icon: FolderOpen, label: 'Deal Rooms', page: 'dealrooms' },
  { icon: Shield, label: 'Verification', page: 'verification' },
  { icon: Wallet, label: 'Payouts', page: 'payouts' },
];

const TOUR_STEP_TO_PAGE: Record<number, DemoPage> = {
  0: 'dashboard',  // nav step - start on dashboard
  1: 'dashboard',
  2: 'relationships',
  3: 'matches',
  4: 'dealrooms',
  5: 'dashboard',
  6: 'verification',
  7: 'payouts',
  8: 'dashboard',
};

const DEMO_TOUR_ID = 'anavi-demo';

function DemoDashboard({
  activePage,
  setActivePage,
  onRestartTour,
}: {
  activePage: DemoPage;
  setActivePage: (p: DemoPage) => void;
  onRestartTour?: () => void;
}) {
  const { demoData, demoUserName } = useDemo();
  const [dealRoomOpen, setDealRoomOpen] = useState<DemoDealRoom | null>(null);

  if (!demoData) return null;

  const displayName = demoUserName || demoData.user.name;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const unreadCount = demoData.notifications.filter((n) => !n.read).length;

  const pageTitle =
    activePage === 'dashboard' ? 'Dashboard' :
    activePage === 'relationships' ? 'Relationships' :
    activePage === 'matches' ? 'AI Matches' :
    activePage === 'dealrooms' ? 'Deal Rooms' :
    activePage === 'verification' ? 'Verification' :
    'Payouts';

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner onRestartTour={onRestartTour} />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="flex w-[240px] shrink-0 flex-col" style={{ backgroundColor: C.navy }}>
          <div className="flex h-14 items-center px-5">
            <span className="text-lg font-bold tracking-wide text-white">ANAVI</span>
          </div>
          <nav className="flex-1 px-3 py-2" data-tour="demo-nav">
            {DEMO_NAV.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => setActivePage(item.page)}
                  className={`group flex h-10 w-full cursor-pointer items-center gap-3 rounded-r-md px-3 text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-l-[3px] border-l-[#2563EB] bg-white/10 text-white'
                      : 'border-l-[3px] border-l-transparent text-white/60 hover:bg-white/5 hover:text-white/80 hover:border-l-white/20'
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: C.gold }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-[11px] text-white/40">{demoData.user.company}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right side */}
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-14 shrink-0 items-center justify-between bg-white px-6" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h1 className="text-base font-semibold gradient-text">{pageTitle}</h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${demoData.stats.trustScore > 70 ? 'bg-[#059669]/15 text-[#059669]' : 'bg-orange-500/15 text-orange-600'}`}>
                <span className="font-mono">{demoData.stats.trustScore}</span>
                <span className="text-[10px] opacity-60">/ 100</span>
              </div>
              <div className="relative rounded-md p-1.5" style={{ color: `${C.navyLight}99` }}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActivePage('matches')}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: C.gold }}
              >
                Create Intent
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto" style={{ backgroundColor: C.surface }}>
            <div className="mx-auto w-full max-w-[1280px] px-8 py-6">
              {activePage === 'dashboard' && <DemoDashboardContent data={demoData} onNavigate={setActivePage} />}
              {activePage === 'relationships' && <DemoRelationshipsContent data={demoData} />}
              {activePage === 'matches' && (
                <DemoMatchesContent
                  data={demoData}
                  onOpenDealRoom={() => {
                    setActivePage('dealrooms');
                    const first = demoData.dealRooms[0];
                    if (first) setDealRoomOpen(first);
                  }}
                />
              )}
              {activePage === 'dealrooms' && <DemoDealRoomsContent data={demoData} onEnterRoom={setDealRoomOpen} />}
              {activePage === 'verification' && <DemoVerificationContent data={demoData} />}
              {activePage === 'payouts' && <DemoPayoutsContent data={demoData} />}
            </div>
          </main>
        </div>
      </div>

      {dealRoomOpen && (
        <DealRoomInteriorModal room={dealRoomOpen} onClose={() => setDealRoomOpen(null)} />
      )}
    </div>
  );
}

export default function Demo() {
  const { capabilities } = useAppMode();
  const [initial, setInitial] = useState<{ persona: DemoPersona; name: string } | null>(null);

  if (!capabilities.allowDemoFixtures) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F7FC] px-6">
        <div className="max-w-xl rounded-xl border border-[#D1DCF0] bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-[#0A1628]">Demo mode is disabled</h1>
          <p className="mt-3 text-sm text-[#1E3A5F]/70">
            This environment is running in live mode. Set <code>APP_RUNTIME_MODE=demo</code> or <code>APP_RUNTIME_MODE=hybrid</code> to enable demo surfaces.
          </p>
          <Link href="/" className="mt-5 inline-flex rounded-md bg-[#0A1628] px-4 py-2 text-sm font-semibold text-white">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!initial) {
    return (
      <PersonaSelector
        onStart={(persona, name) => setInitial({ persona, name })}
      />
    );
  }

  return (
    <DemoProvider>
      <DemoInner initial={initial} />
    </DemoProvider>
  );
}

function DemoInner({ initial }: { initial: { persona: DemoPersona; name: string } }) {
  const { setPersona, setDemoUserName, persona } = useDemo();
  const initialized = useRef(false);
  const [activePage, setActivePage] = useState<DemoPage>('dashboard');
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setPersona(initial.persona);
      if (initial.name) setDemoUserName(initial.name);
    }
  }, [initial, setPersona, setDemoUserName]);

  const handleTourStepChange = (stepIndex: number) => {
    const page = TOUR_STEP_TO_PAGE[stepIndex];
    if (page) setActivePage(page);
  };

  const handleRestartTour = () => {
    clearTourCompleted(DEMO_TOUR_ID);
    setTourKey((k) => k + 1);
  };

  if (!persona) return null;

  return (
    <>
      <GuidedTour
        key={tourKey}
        tourId={DEMO_TOUR_ID}
        steps={demoTour}
        onComplete={() => {}}
        onSkip={() => {}}
        onStepChange={handleTourStepChange}
      />
      <DemoDashboard
        activePage={activePage}
        setActivePage={setActivePage}
        onRestartTour={handleRestartTour}
      />
    </>
  );
}
