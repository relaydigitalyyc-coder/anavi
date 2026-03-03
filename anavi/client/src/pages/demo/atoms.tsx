import { useState, useEffect, useRef } from 'react';
import {
  Handshake,
  TrendingUp,
  Building2,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

// ─── Design tokens ───────────────────────────────────────
export const C = {
  navy: '#0A1628',
  navyLight: '#1E3A5F',
  gold: '#C4972A',
  blue: '#2563EB',
  green: '#059669',
  surface: '#F3F7FC',
  border: '#D1DCF0',
  white: '#FFFFFF',
} as const;

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Handshake,
  TrendingUp,
  Building2,
  Landmark,
};

// ─── Number counter hook ─────────────────────────────────
export function useCountUp(value: number, durationMs = 500, enabled = true) {
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

// ─── Shared widgets ──────────────────────────────────────
export function getScoreColor(score: number) {
  if (score > 70) return C.green;
  if (score >= 40) return '#F59E0B';
  return '#DC2626';
}

export function TrustRing({ score }: { score: number }) {
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

export function DashCard({ title, children, dataTour }: { title: string; children: React.ReactNode; dataTour?: string }) {
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

export function NotifBadgeStyle(type: string): { bg: string; text: string; label: string } {
  switch (type) {
    case 'match_found': return { bg: `${C.gold}26`, text: C.gold, label: 'MATCH' };
    case 'deal_update': return { bg: `${C.blue}26`, text: C.blue, label: 'DEAL ROOM' };
    case 'payout_received': return { bg: `${C.green}26`, text: C.green, label: 'ATTRIBUTION' };
    case 'compliance_alert': return { bg: `${C.navyLight}26`, text: C.navyLight, label: 'VERIFICATION' };
    case 'relationship_verified': return { bg: `${C.green}26`, text: C.green, label: 'VERIFIED' };
    default: return { bg: `${C.navy}26`, text: C.navy, label: 'INTELLIGENCE' };
  }
}

export function NotifBorderColor(type: string): string {
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
export function ValuePropositionBanner() {
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