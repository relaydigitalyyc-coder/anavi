import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Lock,
  Shield,
  FolderOpen,
  Users,
  Clock,
  ChevronRight,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ConceptTooltip from '@/components/ConceptTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltipContent';
import { type DemoData, type DemoDealRoom } from '@/pages/demo/demoAdapter';
import {
  C,
  useCountUp,
  getScoreColor,
  TrustRing,
  DashCard,
  NotifBadgeStyle,
  NotifBorderColor,
  ValuePropositionBanner,
} from './atoms';
import { type DemoPage } from './types';

// ─── Content components ──────────────────────────────────────

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
              {typeof rel.earnings === 'number' && rel.earnings > 0 && (
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
                {(match.highlights ?? []).map((h, i) => (
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
                {match.matchedAt && (
                  <span className="text-xs" style={{ color: `${C.navyLight}80` }}>
                    Matched {formatDistanceToNow(new Date(match.matchedAt), { addSuffix: true })}
                  </span>
                )}
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
                {room.lastActivity && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(room.lastActivity), { addSuffix: true })}
                  </span>
                )}
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

function DealRoomInteriorModal({
  room,
  onClose,
}: {
  room: DemoDealRoom;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60000] flex items-center justify-center bg-black/50 p-4"
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

export {
  DemoDashboardContent,
  DemoRelationshipsContent,
  DemoMatchesContent,
  DemoVerificationContent,
  DemoPayoutsContent,
  DemoDealRoomsContent,
  DealRoomInteriorModal,
};
