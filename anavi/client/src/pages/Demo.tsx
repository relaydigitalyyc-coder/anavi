import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import {
  Handshake,
  TrendingUp,
  Building2,
  Landmark,
  Home,
  Users,
  Target,
  FolderOpen,
  Wallet,
  Shield,
  Bell,
  ArrowRight,
  Lock,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { DemoProvider, useDemo } from '@/lib/DemoContext';
import {
  PERSONA_CARDS,
  type DemoPersona,
  type DemoData,
  type DemoDealRoom,
} from '@/lib/demoData';
import { formatDistanceToNow } from 'date-fns';
import ConceptTooltip from '@/components/ConceptTooltip';
import GuidedTour, { clearTourCompleted } from '@/components/GuidedTour';
import { TOOLTIP_CONTENT } from '@/lib/tooltipContent';
import { demoTour } from '@/lib/tourDefinitions';

// ─── Number counter hook ─────────────────────────────────
function useCountUp(value: number, durationMs = 500, enabled = true) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(value);
  useEffect(() => {
    if (!enabled) {
      setDisplay(value);
      return;
    }
    prevRef.current = value;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [value, durationMs, enabled]);
  return display;
}

// ─── Design tokens ───────────────────────────────────────
const C = {
  navy: '#0A1628',
  navyLight: '#1E3A5F',
  gold: '#C4972A',
  blue: '#2563EB',
  green: '#059669',
  surface: '#F3F7FC',
  border: '#D1DCF0',
  white: '#FFFFFF',
} as const;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Handshake,
  TrendingUp,
  Building2,
  Landmark,
};

// ─── Entry page ──────────────────────────────────────────

function PersonaSelector({
  onStart,
}: {
  onStart: (persona: DemoPersona, name: string) => void;
}) {
  const [selected, setSelected] = useState<DemoPersona | null>(null);
  const [userName, setUserName] = useState('');

  return (
    <div className="flex min-h-screen flex-col bg-geometric">
      {/* Top bar */}
      <div
        className="flex h-14 shrink-0 items-center px-6"
        style={{ backgroundColor: C.navy }}
      >
        <span className="text-lg font-bold tracking-wide text-white">
          ANAVI <span className="ml-2 text-xs font-normal text-white/50">Demo</span>
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-10 text-center">
            <h1 className="gradient-gold text-4xl font-bold tracking-tight">
              Experience ANAVI
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base" style={{ color: C.navyLight }}>
              Choose a persona to explore the platform with realistic private-market data.
              No account required.
            </p>
          </div>

          {/* Persona tiles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PERSONA_CARDS.map((card, i) => {
              const Icon = ICON_MAP[card.icon] ?? Landmark;
              const isSelected = selected === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelected(card.id)}
                  className={`group relative rounded-xl border-2 p-6 text-left transition-all duration-200 animate-fade-in ${
                    i === 0 ? 'stagger-1' : i === 1 ? 'stagger-2' : i === 2 ? 'stagger-3' : 'stagger-4'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${C.blue}08` : C.white,
                    borderColor: isSelected ? C.blue : C.border,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {isSelected && (
                    <div
                      className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: C.blue }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${C.gold}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: C.gold }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.navy }}>
                        {card.role}
                      </p>
                      <p className="text-xs" style={{ color: `${C.navyLight}99` }}>
                        {card.name} — {card.company}
                      </p>
                    </div>
                  </div>

                  <p className="mb-3 text-sm leading-relaxed" style={{ color: C.navyLight }}>
                    {card.headline}
                  </p>
                  <p className="mb-4 text-xs font-medium" style={{ color: C.gold }}>
                    {card.id === 'originator' && 'See how originators protect relationships worth millions.'}
                    {card.id === 'investor' && 'See how investors discover qualified deal flow automatically.'}
                    {card.id === 'developer' && 'See how developers connect with ready capital.'}
                    {card.id === 'institutional' && 'See how institutions streamline compliance and matching.'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {card.stats.map((s) => (
                      <span
                        key={s}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${C.navy}0A`,
                          color: C.navy,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Name input + CTA */}
          {selected && (
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <input
                type="text"
                placeholder="What should we call you? (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full max-w-xs rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
                style={{ borderColor: C.border, color: C.navy }}
              />
              <button
                onClick={() => onStart(selected, userName)}
                className="btn-gold flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-bold text-white"
              >
                Start Demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Demo banner ─────────────────────────────────────────

function DemoBanner({ onRestartTour }: { onRestartTour?: () => void }) {
  return (
    <div
      className="flex h-10 shrink-0 items-center justify-center gap-6 text-sm text-white"
      style={{ backgroundColor: C.blue }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>
        You are in <strong>Demo Mode</strong> — All data is simulated.
      </span>
      {onRestartTour && (
        <button
          type="button"
          onClick={onRestartTour}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          Restart Tour
        </button>
      )}
      <Link
        href="/register"
        className="animate-cta-pulse inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold underline underline-offset-2 hover:no-underline"
        data-tour="apply"
      >
        Apply for Access <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── Shared widgets ──────────────────────────────────────

function getScoreColor(score: number) {
  if (score > 70) return C.green;
  if (score >= 40) return '#F59E0B';
  return '#DC2626';
}

function TrustRing({ score }: { score: number }) {
  const [mounted, setMounted] = useState(false);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
      <circle
        cx="70" cy="70" r={radius}
        fill="none" stroke={C.navy} strokeWidth="8" opacity="0.12"
      />
      <circle
        cx="70" cy="70" r={radius}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={mounted ? offset : circumference}
        transform="rotate(-90 70 70)"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function DashCard({ title, children, dataTour }: { title: string; children: React.ReactNode; dataTour?: string }) {
  return (
    <div
      className="rounded-lg border bg-white p-6"
      style={{ borderColor: C.border }}
      {...(dataTour ? { 'data-tour': dataTour } : {})}
    >
      <h3
        className="mb-4 border-b pb-3 text-sm font-semibold uppercase tracking-wide"
        style={{ color: C.navyLight, borderColor: C.border }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function NotifBadgeStyle(type: string): { bg: string; text: string; label: string } {
  switch (type) {
    case 'match_found': return { bg: `${C.gold}26`, text: C.gold, label: 'MATCH' };
    case 'deal_update': return { bg: `${C.blue}26`, text: C.blue, label: 'DEAL ROOM' };
    case 'payout_received': return { bg: `${C.green}26`, text: C.green, label: 'ATTRIBUTION' };
    case 'compliance_alert': return { bg: `${C.navyLight}26`, text: C.navyLight, label: 'VERIFICATION' };
    case 'relationship_verified': return { bg: `${C.green}26`, text: C.green, label: 'VERIFIED' };
    default: return { bg: `${C.navy}26`, text: C.navy, label: 'INTELLIGENCE' };
  }
}

function NotifBorderColor(type: string): string {
  switch (type) {
    case 'match_found': return C.gold;
    case 'deal_update': return C.blue;
    case 'payout_received': return C.green;
    case 'compliance_alert': return C.navyLight;
    case 'relationship_verified': return C.green;
    default: return C.navy;
  }
}

// ─── Sub-pages ───────────────────────────────────────────

function ValuePropositionBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      className="mb-6 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 animate-fade-in"
      style={{ borderColor: C.border, backgroundColor: C.white }}
    >
      <div className="flex flex-wrap items-center gap-6">
        <span className="text-sm font-bold" style={{ color: C.navy }}>Why ANAVI</span>
        <span className="flex items-center gap-2 text-sm" style={{ color: C.navyLight }}>
          <span className="font-medium">Relationships as Assets</span>
          <span style={{ color: C.border }}>•</span>
          <span className="font-medium">Blind Matching</span>
          <span style={{ color: C.border }}>•</span>
          <span className="font-medium">Automatic Attribution</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-xs font-medium opacity-60 hover:opacity-100"
        style={{ color: C.navyLight }}
      >
        Dismiss
      </button>
    </div>
  );
}

function DemoDashboardContent({ data, onNavigate }: { data: DemoData; onNavigate?: (page: DemoPage) => void }) {
  const { stats, notifications, payouts } = data;
  const scoreColor = getScoreColor(stats.trustScore);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const trustScoreDisplay = useCountUp(stats.trustScore, 600);

  return (
    <>
      <ValuePropositionBanner />
      <div className="grid grid-cols-1 gap-6 py-2 lg:grid-cols-[280px_1fr_280px]" data-tour="dashboard">
      {/* Left Column */}
      <div className="space-y-6 animate-fade-in stagger-1">
        {/* Trust Score */}
        <div
          className="rounded-lg border bg-white p-6 text-center"
          style={{ borderColor: C.border }}
          data-tour="trust-score"
        >
          <ConceptTooltip
            type={TOOLTIP_CONTENT.trustScore.type}
            title={TOOLTIP_CONTENT.trustScore.title}
            content={TOOLTIP_CONTENT.trustScore.content}
            tooltipId="demo-trust-score"
          >
            <span className="mb-4 block text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Trust Score</span>
          </ConceptTooltip>
          <div className="relative mx-auto w-[140px]">
            <TrustRing score={stats.trustScore} />
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold" style={{ color: scoreColor }}>
              {trustScoreDisplay}
            </span>
          </div>
          <p className="mt-3 text-xs" style={{ color: `${C.navyLight}99` }}>
            <TrendingUp className="mr-1 inline h-3 w-3" style={{ color: C.green }} />
            <span style={{ color: C.green }}>+{stats.monthlyTrend}</span> this month
          </p>
          <ConceptTooltip
            type={TOOLTIP_CONTENT.compliancePassport.type}
            title={TOOLTIP_CONTENT.compliancePassport.title}
            content={TOOLTIP_CONTENT.compliancePassport.content}
            tooltipId="demo-trust-tier"
          >
            <span className="mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: `${C.gold}20`, color: C.navy, border: `1px solid ${C.gold}40` }}>
              {stats.verificationTier} — Institutional Access
            </span>
          </ConceptTooltip>
        </div>

        {/* Quick Stats */}
        <DashCard title="Portfolio Overview">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: C.navyLight }}>Relationships</span>
              <span className="font-semibold" style={{ color: C.navy }}>{stats.totalRelationships}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: C.navyLight }}>Active Intents</span>
              <span className="font-semibold" style={{ color: C.navy }}>{stats.activeIntents}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: C.navyLight }}>Total Matches</span>
              <span className="font-semibold" style={{ color: C.navy }}>{stats.totalMatches}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: C.navyLight }}>Deal Rooms</span>
              <span className="font-semibold" style={{ color: C.navy }}>{stats.activeDealRooms}</span>
            </div>
            <div className="mt-2 border-t pt-3" style={{ borderColor: C.border }}>
              <ConceptTooltip
                type={TOOLTIP_CONTENT.attribution.type}
                title={TOOLTIP_CONTENT.attribution.title}
                content={TOOLTIP_CONTENT.attribution.content}
                tooltipId="demo-lifetime-attribution"
              >
                <div className="flex justify-between">
                  <span style={{ color: C.navyLight }}>Lifetime Attribution</span>
                  <span className="font-bold" style={{ color: C.green }}>{stats.lifetimeAttribution}</span>
                </div>
              </ConceptTooltip>
            </div>
          </div>
        </DashCard>

        {/* Quick Actions — wire to logical destinations */}
        <div className="space-y-2">
          <button
            onClick={() => onNavigate?.('matches')}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: C.blue }}
          >
            Create Intent
          </button>
          <button
            onClick={() => onNavigate?.('relationships')}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: C.gold }}
          >
            Protect Relationship
          </button>
        </div>
      </div>

      {/* Center Column — Activity */}
      <div className="animate-fade-in stagger-2">
        <h2 className="mb-4 text-lg font-semibold" style={{ color: C.navy }}>
          Activity
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#DC2626' }}>
              {unreadCount} new
            </span>
          )}
        </h2>
        <div className="space-y-3">
          {notifications.map((n) => {
            const badge = NotifBadgeStyle(n.type);
            const borderColor = NotifBorderColor(n.type);
            return (
              <div
                key={n.id}
                className="rounded-lg border bg-white p-4"
                style={{ borderColor: C.border, borderLeftWidth: 4, borderLeftColor: borderColor }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-xs font-mono" style={{ color: `${C.navyLight}80` }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                  {!n.read && (
                    <span className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: C.blue }} />
                  )}
                </div>
                <p className="text-sm font-semibold" style={{ color: C.navy }}>{n.title}</p>
                <p className="mt-0.5 text-sm" style={{ color: `${C.navyLight}B3` }}>{n.message}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6 animate-fade-in stagger-3">
        {/* Recent Payouts */}
        <DashCard title="Recent Payouts" dataTour="payout">
          <div className="mb-3">
            <ConceptTooltip
              type={TOOLTIP_CONTENT.attribution.type}
              title={TOOLTIP_CONTENT.attribution.title}
              content={TOOLTIP_CONTENT.attribution.content}
              tooltipId="demo-next-payout"
            >
              <span className="text-lg font-bold" style={{ color: C.navy }}>
                Next Payout:{' '}
                <span style={{ color: C.green }}>{stats.nextPayout}</span>
              </span>
            </ConceptTooltip>
          </div>
          <p className="mb-3 text-xs font-medium" style={{ color: C.navyLight }}>
            Your relationships generate lifetime value. This {stats.nextPayout} is just the start.
          </p>
          <div className="space-y-2">
            {payouts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                style={{ borderColor: C.border }}
              >
                <div>
                  <span className="font-semibold" style={{ color: C.navy }}>
                    ${parseFloat(p.amount).toLocaleString()}
                  </span>
                  <span className="ml-2 text-xs" style={{ color: `${C.navyLight}99` }}>
                    {p.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor:
                      p.status === 'completed' ? `${C.green}26` :
                      p.status === 'pending' ? '#F59E0B26' : `${C.blue}26`,
                    color:
                      p.status === 'completed' ? C.green :
                      p.status === 'pending' ? '#F59E0B' : C.blue,
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </DashCard>

        {/* Pending Payouts */}
        <DashCard title="Attribution Summary">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: C.navyLight }}>Pending</span>
              <span className="font-semibold" style={{ color: C.navy }}>{stats.pendingPayouts}</span>
            </div>
            <div className="flex justify-between">
              <ConceptTooltip
                type={TOOLTIP_CONTENT.attribution.type}
                title={TOOLTIP_CONTENT.attribution.title}
                content={TOOLTIP_CONTENT.attribution.content}
                tooltipId="demo-attribution-summary"
              >
                <span style={{ color: C.navyLight }}>Lifetime</span>
              </ConceptTooltip>
              <span className="font-bold" style={{ color: C.green }}>{stats.lifetimeAttribution}</span>
            </div>
          </div>
        </DashCard>
      </div>
    </div>
    </>
  );
}

function DemoRelationshipsContent({ data }: { data: DemoData }) {
  return (
    <div className="animate-fade-in stagger-1" data-tour="relationships">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.navy }}>Protected Relationships</h2>
          <p className="mt-1 text-sm" style={{ color: `${C.navyLight}99` }}>
            {data.stats.totalRelationships} total · {data.relationships.filter(r => r.status === 'verified').length} verified · Custody-stamped on chain
          </p>
        </div>
        <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: C.gold }}>
          + Protect New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.relationships.map((rel, idx) => (
          <div
            key={rel.id}
            className="hover-lift rounded-lg border bg-white p-5 transition-shadow hover:shadow-md"
            style={{ borderColor: C.border }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: C.navy }}>{rel.name}</p>
                <p className="text-xs" style={{ color: `${C.navyLight}99` }}>{rel.company}</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: rel.status === 'verified' ? `${C.green}26` : rel.status === 'active' ? `${C.blue}26` : `${C.gold}26`,
                  color: rel.status === 'verified' ? C.green : rel.status === 'active' ? C.blue : C.gold,
                }}
              >
                {rel.status}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-xs" style={{ color: C.navyLight }}>
              <div className="flex justify-between">
                <span>Sector</span>
                <span className="font-medium" style={{ color: C.navy }}>{rel.sector}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-medium capitalize" style={{ color: C.navy }}>{rel.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Deal Range</span>
                <span className="font-medium" style={{ color: C.navy }}>{rel.dealRange}</span>
              </div>
              <div className="flex justify-between">
                <span>Matches</span>
                <span className="font-medium" style={{ color: C.navy }}>{rel.matchCount}</span>
              </div>
              {rel.earnings > 0 && (
                <div className="flex justify-between">
                  <span>Earnings</span>
                  <span className="font-bold" style={{ color: C.green }}>
                    ${rel.earnings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {idx === 0 ? (
              <ConceptTooltip
                type={TOOLTIP_CONTENT.relationshipCustody.type}
                title={TOOLTIP_CONTENT.relationshipCustody.title}
                content={TOOLTIP_CONTENT.relationshipCustody.content}
                tooltipId="demo-relationship-custody"
              >
                <div className="flex items-center gap-2 rounded border px-2 py-1.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
                  <Lock className="h-3 w-3" style={{ color: C.navyLight }} />
                  <span className="flex-1 truncate font-mono text-[10px]" style={{ color: `${C.navyLight}80` }}>
                    {rel.custodyHash.slice(0, 24)}…
                  </span>
                  <Shield className="h-3 w-3" style={{ color: C.green }} />
                </div>
              </ConceptTooltip>
            ) : (
              <div className="flex items-center gap-2 rounded border px-2 py-1.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
                <Lock className="h-3 w-3" style={{ color: C.navyLight }} />
                <span className="flex-1 truncate font-mono text-[10px]" style={{ color: `${C.navyLight}80` }}>
                  {rel.custodyHash.slice(0, 24)}…
                </span>
                <Shield className="h-3 w-3" style={{ color: C.green }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoMatchesContent({ data, onOpenDealRoom }: { data: DemoData; onOpenDealRoom?: () => void }) {
  return (
    <div className="animate-fade-in stagger-1">
      <div className="mb-6">
        <ConceptTooltip
          type={TOOLTIP_CONTENT.blindMatching.type}
          title={TOOLTIP_CONTENT.blindMatching.title}
          content={TOOLTIP_CONTENT.blindMatching.content}
          tooltipId="demo-blind-matching"
        >
          <h2 className="text-xl font-bold inline" style={{ color: C.navy }}>AI Matches</h2>
        </ConceptTooltip>
        <p className="mt-1 text-sm" style={{ color: `${C.navyLight}99` }}>
          {data.matches.length} compatible counterparties found by our matching engine
        </p>
      </div>

      <div className="space-y-4">
        {data.matches.map((match, idx) => {
          const scoreColor = match.compatibilityScore >= 85 ? C.green : match.compatibilityScore >= 75 ? '#F59E0B' : C.blue;
          return (
            <div
              key={match.id}
              className={`hover-lift rounded-lg border bg-white p-5 transition-shadow hover:shadow-md ${
                idx === 0 && match.compatibilityScore >= 85 ? 'animate-match-highlight' : ''
              }`}
              style={{ borderColor: idx === 0 && match.compatibilityScore >= 85 ? C.blue : C.border }}
              {...(idx === 0 ? { 'data-tour': 'match-card' } : {})}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <p className="text-sm font-bold" style={{ color: C.navy }}>{match.counterpartyAlias}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor:
                          match.status === 'mutual_interest' ? `${C.green}26` :
                          match.status === 'deal_room_created' ? `${C.blue}26` :
                          match.status === 'interested' ? `${C.gold}26` : `${C.navy}14`,
                        color:
                          match.status === 'mutual_interest' ? C.green :
                          match.status === 'deal_room_created' ? C.blue :
                          match.status === 'interested' ? C.gold : C.navyLight,
                      }}
                    >
                      {match.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: `${C.navyLight}99` }}>
                    {match.intentTitle} · {match.sector} · {match.dealSize}
                  </p>
                </div>
                <ConceptTooltip
                  type={TOOLTIP_CONTENT.compatibilityScore.type}
                  title={TOOLTIP_CONTENT.compatibilityScore.title}
                  content={TOOLTIP_CONTENT.compatibilityScore.content}
                  tooltipId="demo-compat-score"
                >
                  <div className="ml-4 flex flex-col items-center">
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                      {match.compatibilityScore}%
                    </span>
                    <span className="text-[10px]" style={{ color: `${C.navyLight}80` }}>match</span>
                  </div>
                </ConceptTooltip>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {match.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{ backgroundColor: C.surface, color: C.navyLight }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3">
                {match.status === 'pending' && (
                  <button className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: C.green }}>
                    Express Interest
                  </button>
                )}
                {match.status === 'mutual_interest' && (
                  <button
                    onClick={() => onOpenDealRoom?.()}
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: C.blue }}
                  >
                    Open Deal Room
                  </button>
                )}
                <span className="text-xs" style={{ color: `${C.navyLight}80` }}>
                  Matched {formatDistanceToNow(new Date(match.matchedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemoVerificationContent({ data }: { data: DemoData }) {
  const scoreColor = getScoreColor(data.stats.trustScore);
  return (
    <div className="animate-fade-in stagger-1" data-tour="verification">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: C.navy }}>Verification & Trust</h2>
        <p className="mt-1 text-sm" style={{ color: `${C.navyLight}99` }}>
          Your Trust Score and compliance passport unlock deal access and matching priority.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Trust Score</h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              <TrustRing score={data.stats.trustScore} />
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold" style={{ color: scoreColor }}>
                {data.stats.trustScore}
              </span>
            </div>
            <div>
              <p className="text-sm" style={{ color: C.navyLight }}>
                6 dimensions: Identity, Financial, Behavioral, Deal Completion, Peer Ratings, Tenure.
              </p>
              <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${C.gold}20`, color: C.navy, border: `1px solid ${C.gold}40` }}>
                {data.stats.verificationTier}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Compliance Passport</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: C.navyLight }}>KYC</span>
              <CheckCircle2 className="h-4 w-4" style={{ color: C.green }} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: C.navyLight }}>AML</span>
              <CheckCircle2 className="h-4 w-4" style={{ color: C.green }} />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: C.navyLight }}>Sanctions</span>
              <CheckCircle2 className="h-4 w-4" style={{ color: C.green }} />
            </div>
          </div>
          <p className="mt-4 text-xs" style={{ color: `${C.navyLight}99` }}>
            Shareable link for counterparties to verify your credentials.
          </p>
        </div>

        <div className="rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Tier Benefits</h3>
          <ul className="space-y-2 text-sm" style={{ color: C.navy }}>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: C.green }} />
              Deal value access up to $50M
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: C.green }} />
              Priority matching in network
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: C.green }} />
              Compliance passport for deal rooms
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DemoPayoutsContent({ data }: { data: DemoData }) {
  const totalEarned = data.payouts
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="animate-fade-in stagger-1" data-tour="payouts">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: C.navy }}>Payouts & Attribution</h2>
        <p className="mt-1 text-sm" style={{ color: `${C.navyLight}99` }}>
          Automatic attribution when deals close. No chasing. No negotiating after the fact.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Total Earned</h3>
          <p className="text-3xl font-bold" style={{ color: C.green }}>
            ${totalEarned.toLocaleString()}
          </p>
          <p className="mt-1 text-xs" style={{ color: `${C.navyLight}99` }}>Lifetime attribution</p>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Next Payout</h3>
          <p className="text-2xl font-bold" style={{ color: C.navy }}>{data.stats.nextPayout}</p>
          <p className="mt-1 text-xs" style={{ color: `${C.navyLight}99` }}>When current deal closes</p>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Pending</h3>
          <p className="text-2xl font-bold" style={{ color: C.navy }}>{data.stats.pendingPayouts}</p>
          <p className="mt-1 text-xs" style={{ color: `${C.navyLight}99` }}>In pipeline</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-6" style={{ borderColor: C.border, backgroundColor: C.white }}>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Recent Payouts</h3>
        <div className="space-y-3">
          {data.payouts.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: C.border }}
            >
              <div>
                <span className="font-semibold" style={{ color: C.navy }}>${parseFloat(p.amount).toLocaleString()}</span>
                <span className="ml-2 text-xs" style={{ color: `${C.navyLight}99` }}>{p.type.replace(/_/g, ' ')}</span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: p.status === 'completed' ? `${C.green}26` : p.status === 'pending' ? '#F59E0B26' : `${C.blue}26`,
                  color: p.status === 'completed' ? C.green : p.status === 'pending' ? '#F59E0B' : C.blue,
                }}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-medium" style={{ color: C.gold }}>
          Your relationships generate lifetime value. Agreed upfront, executes automatically.
        </p>
      </div>
    </div>
  );
}

function DemoDealRoomsContent({ data, onEnterRoom }: { data: DemoData; onEnterRoom?: (room: DemoDealRoom) => void }) {
  const statusStyle = (status: string) => {
    switch (status) {
      case 'active': return { bg: `${C.green}26`, text: C.green, label: 'Active' };
      case 'diligence': return { bg: `${C.blue}26`, text: C.blue, label: 'Diligence' };
      case 'nda_pending': return { bg: `${C.gold}26`, text: C.gold, label: 'NDA Pending' };
      case 'completed': return { bg: `${C.navy}14`, text: C.navyLight, label: 'Completed' };
      default: return { bg: `${C.navy}14`, text: C.navyLight, label: status };
    }
  };

  return (
    <div className="animate-fade-in stagger-1">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.navy }}>Deal Rooms</h2>
          <p className="mt-1 text-sm" style={{ color: `${C.navyLight}99` }}>
            {data.dealRooms.length} rooms · {data.dealRooms.filter(d => d.status === 'active' || d.status === 'diligence').length} active
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.dealRooms.map((room, idx) => {
          const st = statusStyle(room.status);
          return (
            <div
              key={room.id}
              className="hover-lift rounded-lg border bg-white p-5 transition-shadow hover:shadow-md"
              style={{ borderColor: C.border }}
              {...(idx === 0 ? { 'data-tour': 'deal-room' } : {})}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    {idx === 0 ? (
                      <ConceptTooltip
                        type={TOOLTIP_CONTENT.dealRoom.type}
                        title={TOOLTIP_CONTENT.dealRoom.title}
                        content={TOOLTIP_CONTENT.dealRoom.content}
                        tooltipId="demo-deal-room"
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 shrink-0" style={{ color: C.blue }} />
                          <p className="text-sm font-bold" style={{ color: C.navy }}>{room.title}</p>
                        </div>
                      </ConceptTooltip>
                    ) : (
                      <>
                        <FolderOpen className="h-4 w-4 shrink-0" style={{ color: C.blue }} />
                        <p className="text-sm font-bold" style={{ color: C.navy }}>{room.title}</p>
                      </>
                    )}
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ backgroundColor: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: `${C.navyLight}99` }}>
                    Counterparty: {room.counterparty}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: C.navy }}>{room.dealValue}</p>
                  <p className="text-[10px]" style={{ color: `${C.navyLight}80` }}>Deal Value</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-6 text-xs" style={{ color: C.navyLight }}>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {room.documentsCount} documents
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {room.participants} participants
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(room.lastActivity), { addSuffix: true })}
                </span>
              </div>

              {room.status !== 'completed' && (
                <div className="mt-3">
                  <button
                    onClick={() => onEnterRoom?.(room)}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: C.blue }}
                  >
                    Enter Deal Room <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Demo dashboard shell ────────────────────────────────

type DemoPage = 'dashboard' | 'relationships' | 'matches' | 'dealrooms' | 'verification' | 'payouts';

const DEMO_NAV: { icon: React.ComponentType<{ className?: string }>; label: string; page: DemoPage }[] = [
  { icon: Home, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Relationships', page: 'relationships' },
  { icon: Target, label: 'Matches', page: 'matches' },
  { icon: FolderOpen, label: 'Deal Rooms', page: 'dealrooms' },
  { icon: Shield, label: 'Verification', page: 'verification' },
  { icon: Wallet, label: 'Payouts', page: 'payouts' },
];

const TOUR_STEP_TO_PAGE: Record<number, DemoPage> = {
  0: 'dashboard',
  1: 'relationships',
  2: 'matches',
  3: 'dealrooms',
  4: 'dashboard',
  5: 'verification',
  6: 'payouts',
  7: 'dashboard',
};

function DealRoomInteriorModal({
  room,
  onClose,
}: {
  room: DemoDealRoom;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-white"
        style={{ borderColor: C.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5" style={{ color: C.blue }} />
            <h2 className="text-lg font-bold" style={{ color: C.navy }}>{room.title}</h2>
          </div>
          <button onClick={onClose} className="rounded p-2 hover:bg-gray-100" aria-label="Close">
            ×
          </button>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Deal Value</p>
              <p className="text-xl font-bold" style={{ color: C.navy }}>{room.dealValue}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Counterparty</p>
              <p className="text-sm font-medium" style={{ color: C.navy }}>{room.counterparty}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: C.navyLight }}>Deal Room Overview</p>
            <p className="text-sm" style={{ color: C.navyLight }}>
              NDA signed · {room.documentsCount} documents shared · Compliance verified · Escrow staged. Everything you need to close, in one secure workspace.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-lg border px-4 py-3" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <FileText className="h-5 w-5" style={{ color: C.blue }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.navy }}>Documents · Diligence · Compliance · Audit Trail</p>
              <p className="text-xs" style={{ color: `${C.navyLight}99` }}>Full 7-tab deal room available in production</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <nav className="flex-1 px-3 py-2">
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

// ─── Main export ─────────────────────────────────────────

export default function Demo() {
  const [initial, setInitial] = useState<{ persona: DemoPersona; name: string } | null>(null);

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

const DEMO_TOUR_ID = 'anavi-demo';

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
