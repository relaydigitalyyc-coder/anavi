import { Link } from "wouter";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { DASHBOARD } from "@/lib/copy";

export function getScoreColor(score: number) {
  if (score > 70) return "#059669";
  if (score >= 40) return "#F59E0B";
  return "#DC2626";
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, v => Math.round(v));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on("change", v => {
      if (ref.current) ref.current.textContent = String(v);
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, motionVal, rounded]);

  return <span ref={ref}>0</span>;
}

export function TrustRing({
  score,
  size = 140,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0A1628"
          strokeWidth={strokeWidth}
          opacity="0.08"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl" style={{ color }}>
          <AnimatedNumber value={score} />
        </span>
        <span className="data-label mt-0.5">Trust</span>
      </div>
    </div>
  );
}

export function DashCard({
  title,
  children,
  className = "",
  dataTour,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  dataTour?: string;
}) {
  return (
    <div data-tour={dataTour} className={`card-elevated p-6 ${className}`}>
      <h3 className="mb-4 data-label">{title}</h3>
      {children}
    </div>
  );
}

// ── Welcome Banner (shown once after onboarding) ───────────────────────────
const PERSONA_SUBTITLES: Record<string, string> = {
  originator:
    "Your first relationship has been custodied. Deal matching is live.",
  investor:
    "Your investment intent is broadcasting to verified counterparties.",
  developer:
    "Your project is verified. Qualified capital matches are incoming.",
  principal:
    "Your asset is sealed. Qualified demand is arriving under consent.",
  allocator: "Your fund mandate is active. Institutional pipeline is open.",
  acquirer:
    "Your acquisition criteria are live. Confidential matches are sourcing.",
};

const PERSONA_LABELS: Record<string, string> = {
  originator: "Deal Originator",
  investor: "Investor",
  developer: "Project Developer",
  principal: "Principal",
  allocator: "Institutional Allocator",
  acquirer: "Strategic Acquirer",
};

export function WelcomeBanner({
  name,
  persona,
  onDismiss,
}: {
  name: string;
  persona: string;
  onDismiss: () => void;
}) {
  const subtitle = PERSONA_SUBTITLES[persona] ?? "Your profile is ready.";
  const personaLabel = PERSONA_LABELS[persona] ?? persona;
  return (
    <div className="mb-6 card-elevated border-l-4 border-l-[#C4972A] p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C4972A]/15">
          <svg
            className="h-4 w-4 text-[#C4972A]"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0A1628]">
            Welcome, {name}. Your {personaLabel} profile is ready.
          </p>
          <p className="mt-0.5 text-sm text-[#1E3A5F]/70">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="mt-0.5 shrink-0 rounded p-1 text-[#1E3A5F]/40 hover:bg-[#1E3A5F]/8 hover:text-[#1E3A5F]/70 transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 py-2 lg:grid-cols-4">
      {/* Header Zone */}
      <div className="lg:col-span-4 dashboard-zone-header space-y-4">
        <div className="h-10 w-48 animate-shimmer rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 animate-shimmer rounded-xl" />
          ))}
        </div>
      </div>

      {/* Metrics Zone */}
      <div className="lg:col-span-4 dashboard-zone-metrics">
        <div className="card-elevated p-6">
          <div className="h-4 w-32 animate-shimmer rounded mb-4" />
          <div className="mx-auto h-[140px] w-[140px] animate-shimmer rounded-full" />
          <div className="mt-4 h-3 w-20 animate-shimmer rounded mx-auto" />
        </div>
      </div>

      {/* Primary Content Zone */}
      <div className="lg:col-span-2 dashboard-zone-primary space-y-6">
        <div className="card-elevated p-6">
          <div className="h-4 w-48 animate-shimmer rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 animate-shimmer rounded-lg" />
            ))}
          </div>
        </div>
        <div className="card-elevated p-6">
          <div className="h-4 w-32 animate-shimmer rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 animate-shimmer rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Content Zone */}
      <div className="lg:col-span-2 dashboard-zone-secondary space-y-6">
        <div className="card-elevated p-6">
          <div className="h-4 w-40 animate-shimmer rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 animate-shimmer rounded-lg" />
            ))}
          </div>
        </div>
        <div className="card-elevated p-6">
          <div className="h-4 w-24 animate-shimmer rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 animate-shimmer rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** In demo mode suppress navigation so clicking a card doesn't destroy demo context. */
export function MaybeLink({
  href,
  demo,
  children,
}: {
  href: string;
  demo: boolean;
  children: React.ReactNode;
}) {
  if (demo) return <>{children}</>;
  return <Link href={href}>{children}</Link>;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function MarketDepthBar({
  label,
  value,
  max,
  index = 0,
}: {
  label: string;
  value: number;
  max: number;
  index?: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right font-data-hud text-[10px] text-[#1E3A5F]/60">
        {value}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#0A1628]/6">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 0.8,
            delay: index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            background:
              label === DASHBOARD.marketDepth.buyersLabel.toLowerCase()
                ? "#2563EB"
                : "#C4972A",
          }}
        />
      </div>
    </div>
  );
}
