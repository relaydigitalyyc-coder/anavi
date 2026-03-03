import { COLORS } from "./constants";

// ─── Compatibility Ring SVG ───────────────────────────────────
export function CompatibilityRing({
  score,
  size = 120,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? COLORS.green : score >= 60 ? COLORS.gold : COLORS.red;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={COLORS.border}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? COLORS.green : value >= 60 ? COLORS.gold : COLORS.red;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: COLORS.green, bg: "#ECFDF5" },
    paused: { label: "Paused", color: "#D97706", bg: "#FFFBEB" },
    expired: { label: "Expired", color: "#6B7280", bg: "#F3F4F6" },
  };
  const c = config[status] ?? config.expired;
  const isActive = status === "active";
  return (
    <span
      className={
        isActive
          ? "bg-[#22D4F5]/10 text-[#22D4F5]/80 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          : "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      }
      style={isActive ? undefined : { color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="card-elevated p-6 animate-pulse">
          <div className="h-5 w-16 rounded bg-gray-200 mb-4" />
          <div className="h-5 w-3/4 rounded bg-gray-200 mb-3" />
          <div className="h-4 w-full rounded bg-gray-100 mb-2" />
          <div className="h-4 w-2/3 rounded bg-gray-100 mb-4" />
          <div className="h-8 w-full rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}