import { useState, useCallback, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FVMCelebration from "@/components/FVMCelebration";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { motion } from "framer-motion";
import { SmoothReveal, GlowingBorder, SmoothCounter } from "@/components/PremiumAnimations";
import {
  Shield,
  ShieldCheck,
  TrendingUp,
  Award,
  Clock,
  Users,
  Star,
  FileCheck,
  Lock,
  Copy,
  QrCode,
  ChevronRight,
  Check,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Design Tokens ───────────────────────────────────────────
const C = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  red: "#DC2626",
  steel: "#1E3A5F",
  surface: "#F3F7FC",
  border: "#D1DCF0",
} as const;

// ─── Radar / Score Dimensions ────────────────────────────────
const DIMENSIONS = [
  { key: "identity", label: "Identity Verification", score: 100, icon: ShieldCheck, status: "Verified" },
  { key: "financial", label: "Financial Verification", score: 75, icon: FileCheck, status: "Pending" },
  { key: "behavioral", label: "Behavioral History", score: 85, icon: TrendingUp, status: "Auto" },
  { key: "deals", label: "Deal Completion Rate", score: 80, icon: Award, status: "Auto" },
  { key: "peers", label: "Peer Ratings", score: 70, icon: Users, status: "Auto" },
  { key: "tenure", label: "Platform Tenure", score: 60, icon: Clock, status: "Auto" },
] as const;

const TIER_FEATURES = [
  { label: "Deal value access", t1: "Up to $1M", t2: "Up to $50M", t3: "Unlimited" },
  { label: "Counterparty access", t1: "Basic only", t2: "Enhanced + Basic", t3: "All tiers" },
  { label: "Match priority", t1: "Standard", t2: "Priority", t3: "Premium" },
  { label: "Founding member", t1: "No", t2: "Eligible", t3: "Included" },
];

const AML_QUESTIONS = [
  "Are all funds derived from legitimate business activities?",
  "Are you or any beneficial owner a Politically Exposed Person (PEP)?",
  "Have you or your organization been subject to any sanctions or enforcement actions?",
  "Can you provide documentation for the source of funds used in transactions?",
];

const SCORE_HISTORY = [65, 68, 72, 74, 78, 84];

// ─── SVG Helpers ─────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const p = polarToCartesian(cx, cy, r, i * 60);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

function RadarChart({ scores, size = 240 }: { scores: number[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 20;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = scores.map((s, i) => {
    const r = (s / 100) * maxR;
    return polarToCartesian(cx, cy, r, i * 60);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {levels.map((l) => (
        <polygon
          key={l}
          points={hexPoints(cx, cy, maxR * l)}
          fill="none"
          stroke={C.navy}
          strokeWidth={0.5}
          opacity={0.2}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => {
        const p = polarToCartesian(cx, cy, maxR, i * 60);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.navy} strokeWidth={0.5} opacity={0.15} />;
      })}
      <polygon points={dataPolygon} fill={C.blue} fillOpacity={0.3} stroke={C.blue} strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.blue} />
      ))}
      {DIMENSIONS.map((d, i) => {
        const p = polarToCartesian(cx, cy, maxR + 14, i * 60);
        return (
          <text
            key={d.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fill={C.navy}
            fontWeight={600}
          >
            {d.score}%
          </text>
        );
      })}
    </svg>
  );
}

function MiniLineChart({ data, width = 200, height = 80 }: { data: number[]; width?: number; height?: number }) {
  const pad = 8;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const xStep = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => ({
    x: pad + i * xStep,
    y: pad + ((max - v) / (max - min)) * (height - pad * 2),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${points[0].x},${height} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={C.blue} fillOpacity={0.1} />
      <polyline points={polyline} fill="none" stroke={C.navy} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={C.navy} />
      ))}
    </svg>
  );
}

function ShareLinkRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        className="flex-1 rounded-lg text-sm font-mono px-4"
        style={{ height: 48, border: `1px solid ${C.border}`, color: C.navy }}
      />
      <Button
        variant="outline"
        className="cursor-pointer"
        style={{ height: 48, borderColor: C.border, transition: "all 0.3s" }}
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600 transition-transform scale-110" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

// ─── Drag-Drop Zone ──────────────────────────────────────────
function DropZone({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (f: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="relative rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
      style={{
        borderColor: dragging ? C.blue : C.border,
        backgroundColor: dragging ? `${C.blue}08` : "white",
        height: 120,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.jpg,.png";
        input.onchange = (ev) => {
          const f = (ev.target as HTMLInputElement).files?.[0];
          if (f) onFile(f);
        };
        input.click();
      }}
    >
      {file ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: C.green }}>
          <Check className="w-4 h-4" />
          {file.name}
        </div>
      ) : (
        <>
          <Upload className="w-5 h-5" style={{ color: C.steel }} />
          <span className="text-sm font-medium" style={{ color: C.steel }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: `${C.navy}80` }}>
            PDF, JPG, or PNG — drag & drop or click
          </span>
        </>
      )}
    </div>
  );
}

// ─── Upgrade Modal ───────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [bizDoc, setBizDoc] = useState<File | null>(null);
  const [govId, setGovId] = useState<File | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null, null]);
  const [showCelebration, setShowCelebration] = useState(false);

  const allAnswered = answers.every((a) => a !== null);

  const handleSubmit = useCallback(() => {
    setStep(3);
    setTimeout(() => setShowCelebration(true), 3000);
  }, []);

  if (showCelebration) {
    return (
      <FVMCelebration
        title="Tier 2 Verified!"
        subtitle="You now have access to deals up to $50M and enhanced counterparty matching."
        ctaLabel="Continue to Dashboard"
        onCta={onClose}
        icon={<ShieldCheck className="h-8 w-8" style={{ color: C.green }} />}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: C.navy }}>
          <h3 className="text-white font-bold text-lg">Upgrade to Tier 2</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: step >= s ? C.blue : C.border }}
            />
          ))}
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg" style={{ color: C.navy }}>
                What Tier 2 Unlocks
              </h4>
              <ul className="space-y-3">
                {[
                  "Deal access up to $50M (from $1M)",
                  "Enhanced + Basic counterparty matching",
                  "Priority match queue placement",
                  "Founding member eligibility",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: C.steel }}>
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.green }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full cursor-pointer"
                style={{ backgroundColor: C.gold, color: "white", height: 48 }}
                onClick={() => setStep(1)}
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg" style={{ color: C.navy }}>
                Document Upload
              </h4>
              <DropZone label="Business Registration" file={bizDoc} onFile={setBizDoc} />
              <DropZone label="Government-Issued ID" file={govId} onFile={setGovId} />
              <Button
                className="w-full cursor-pointer"
                style={{ backgroundColor: C.blue, color: "white", height: 48 }}
                disabled={!bizDoc || !govId}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg" style={{ color: C.navy }}>
                AML Questionnaire
              </h4>
              {AML_QUESTIONS.map((q, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: C.steel }}>
                    {i + 1}. {q}
                  </p>
                  <div className="flex gap-3">
                    {(["Yes", "No"] as const).map((opt) => {
                      const selected = answers[i] === (opt === "Yes");
                      return (
                        <button
                          key={opt}
                          className="px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          style={{
                            height: 48,
                            border: `1.5px solid ${selected ? C.blue : C.border}`,
                            backgroundColor: selected ? `${C.blue}10` : "white",
                            color: selected ? C.blue : C.steel,
                          }}
                          onClick={() => {
                            const next = [...answers];
                            next[i] = opt === "Yes";
                            setAnswers(next);
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button
                className="w-full cursor-pointer"
                style={{ backgroundColor: C.blue, color: "white", height: 48 }}
                disabled={!allAnswered}
                onClick={handleSubmit}
              >
                Submit for Review
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="relative w-16 h-16">
                <div
                  className="absolute inset-0 rounded-full animate-spin"
                  style={{
                    border: `3px solid ${C.border}`,
                    borderTopColor: C.blue,
                  }}
                />
              </div>
              <h4 className="font-bold text-lg" style={{ color: C.navy }}>
                Under Review
              </h4>
              <p className="text-sm" style={{ color: C.steel }}>
                Your application is being reviewed — typically under 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Score Color ─────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 80) return C.green;
  if (score >= 60) return C.gold;
  return C.red;
}

function statusPill(status: string) {
  const cls: Record<string, string> = {
    Verified: "bg-[#059669]/15 text-[#059669] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
    Pending:  "bg-[#F59E0B]/15 text-[#F59E0B] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
    Auto:     "bg-[#2563EB]/10 text-[#2563EB] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
  };
  return (
    <span className={cls[status] ?? cls.Auto}>
      {status}
    </span>
  );
}

// ─── Dimension Border Color ──────────────────────────────────
function dimBorderColor(score: number) {
  if (score >= 80) return C.green;
  if (score >= 60) return C.blue;
  return C.gold;
}

// ─── Shield Badge SVG ────────────────────────────────────────
function TierShieldBadge({ tier, size = 64 }: { tier: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path
        d="M32 4 L56 16 V36 C56 50 32 60 32 60 C32 60 8 50 8 36 V16 Z"
        fill={tier >= 2 ? C.gold : C.steel}
        opacity={0.15}
        stroke={tier >= 2 ? C.gold : C.steel}
        strokeWidth={2}
      />
      <text x="32" y="38" textAnchor="middle" fontSize="22" fontWeight="bold" fill={tier >= 2 ? C.gold : C.steel}>
        {tier}
      </text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════
export default function Verification() {
  const { user } = useAuth();
  const { data: docs } = trpc.user.getVerificationDocuments.useQuery();
  const { data: reviews } = trpc.user.getPeerReviews.useQuery();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const tier = (user as any)?.verificationTier ?? 1;
  const trustScore = (user as any)?.trustScore ?? 84;

  const overallColor = scoreColor(trustScore);

  const maskedKey = useMemo(() => "anv_live_••••••••••••" + "k8f2", []);

  useEffect(() => { document.title = "Verification | ANAVI"; }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in" style={{ backgroundColor: C.surface, minHeight: "100vh" }}>
      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}

      {/* ── Page Header ── */}
      <FadeInView>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.navy}10` }}>
          <ShieldCheck className="w-6 h-6" style={{ color: C.navy }} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="dash-heading text-3xl">
              Verification &amp; Trust
            </h1>
            <Badge
              className="text-xs font-semibold px-3 py-1 border-0"
              style={{ backgroundColor: tier >= 2 ? `${C.gold}20` : `${C.steel}20`, color: tier >= 2 ? C.gold : C.steel }}
            >
              Tier {tier}
            </Badge>
          </div>
          <p className="text-sm mt-1" style={{ color: `${C.navy}80` }}>
            Your trust profile across all verification dimensions
          </p>
        </div>
      </div>
      </FadeInView>

      {/* ══════════════════════════════════════════════════════
          Trust Score Dashboard
         ══════════════════════════════════════════════════════ */}

      {/* Score Overview Card */}
      <div className="card-elevated p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Left — big number */}
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: `${C.navy}60` }}>
              Trust Score
            </span>
            <span className="font-data-hud text-4xl font-bold" style={{ color: overallColor }}>
              <SmoothCounter value={trustScore} />
            </span>
            <span className="text-sm mt-2" style={{ color: `${C.navy}60` }}>
              out of 100
            </span>
          </div>

          {/* Center — radar */}
          <SmoothReveal className="flex justify-center">
            <RadarChart scores={DIMENSIONS.map((d) => d.score)} size={240} />
          </SmoothReveal>

          {/* Right — mini line chart */}
          <div className="flex flex-col items-center lg:items-end gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: `${C.navy}60` }}>
              6-Month Trend
            </span>
            <MiniLineChart data={SCORE_HISTORY} width={200} height={80} />
            <div className="flex gap-3 mt-1">
              {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map((m) => (
                <span key={m} className="text-[10px]" style={{ color: `${C.navy}50` }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Component Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DIMENSIONS.map((dim, dimIndex) => {
          const Icon = dim.icon;
          const borderColor = dimBorderColor(dim.score);
          return (
            <div
              key={dim.key}
              className="card-elevated overflow-hidden"
            >
              <div className="flex h-full">
                <div className="w-1 flex-shrink-0" style={{ backgroundColor: borderColor }} />
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: borderColor }} />
                      <span className="text-sm font-semibold" style={{ color: C.navy }}>
                        {dim.label}
                      </span>
                    </div>
                    {statusPill(dim.status)}
                  </div>
                  <div className="flex items-end justify-between mb-3">
                    <span className="font-mono text-2xl font-bold" style={{ color: C.navy }}>
                      {dim.score}
                      <span className="text-sm font-normal" style={{ color: `${C.navy}50` }}>
                        /100
                      </span>
                    </span>
                    {dim.status !== "Auto" && dim.score < 100 && (
                      <button
                        className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                        style={{ color: C.blue }}
                      >
                        Improve <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0A1628]/6">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${dim.score}%`,
                        background: dim.score > 80 ? "#059669" : dim.score > 60 ? "#C4972A" : "#2563EB",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          Tier Status & Upgrade
         ══════════════════════════════════════════════════════ */}

      {/* Current Tier Card */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-6">
          <TierShieldBadge tier={tier} size={72} />
          <div className="flex-1">
            <h3 className="text-lg font-bold" style={{ color: C.navy }}>
              Current Tier: Tier {tier}
            </h3>
            <p className="text-sm mt-1" style={{ color: `${C.navy}70` }}>
              {tier === 1 && "Basic access — deals up to $1M, standard matching, basic counterparty visibility."}
              {tier === 2 && "Enhanced access — deals up to $50M, priority matching, enhanced counterparty data."}
              {tier === 3 && "Full institutional access — unlimited deal size, premium matching, all counterparties."}
            </p>
          </div>
          {tier < 2 && (
            <Button
              className="cursor-pointer font-semibold"
              style={{ backgroundColor: C.gold, color: "white", height: 48, paddingInline: 24 }}
              onClick={() => setUpgradeOpen(true)}
            >
              Upgrade to Tier 2
            </Button>
          )}
        </div>
      </div>

      {/* Tier Comparison Table */}
      <div className="card-elevated p-6 overflow-hidden">
        <h3 className="mb-4 data-label">Tier Comparison</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: `${C.navy}06` }}>
                  <th className="text-left px-6 py-3 font-semibold" style={{ color: C.navy }}>
                    Feature
                  </th>
                  {[1, 2, 3].map((t) => (
                    <th
                      key={t}
                      className={`px-6 py-3 font-semibold text-center ${tier === t ? "border-l border-r border-[#C4972A]/25" : ""}`}
                      style={{
                        color: C.navy,
                        borderBottom: tier === t ? `2px solid ${C.blue}` : undefined,
                      }}
                    >
                      Tier {t}
                      {tier === t && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase" style={{ color: C.blue }}>
                          Current
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIER_FEATURES.map((f, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                    <td className="px-6 py-3 font-medium" style={{ color: C.steel }}>
                      {f.label}
                    </td>
                    {([f.t1, f.t2, f.t3] as const).map((val, ti) => (
                      <td
                        key={ti}
                        className={`px-6 py-3 text-center ${tier === ti + 1 ? "border-l border-r border-[#C4972A]/25" : ""}`}
                        style={{
                          color: tier === ti + 1 ? C.blue : `${C.navy}70`,
                          fontWeight: tier === ti + 1 ? 600 : 400,
                          backgroundColor: tier === ti + 1 ? `${C.blue}06` : undefined,
                        }}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Compliance Passport
         ══════════════════════════════════════════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E25: Passport Card with GlowingBorder */}
        <GlowingBorder color={C.gold}>
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{ border: `1px solid ${C.border}` }}
        >
          {/* Navy header */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.navy }}>
            <span className="text-white font-bold text-sm tracking-widest uppercase">ANAVI</span>
            <span className="text-white/50 text-xs">Compliance Passport</span>
          </div>

          <div className="bg-white p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: `${C.navy}60` }}>
                  Participant
                </div>
                <div className="font-bold text-lg" style={{ color: C.navy }}>
                  {user?.name ?? "—"}
                </div>
                <div className="text-xs mt-0.5" style={{ color: `${C.navy}50` }}>
                  ID: {user?.id != null ? String(user.id).slice(0, 8) : "—"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  className="border-0 font-semibold"
                  style={{ backgroundColor: tier >= 2 ? `${C.gold}20` : `${C.steel}20`, color: tier >= 2 ? C.gold : C.steel }}
                >
                  Tier {tier}
                </Badge>
                <span className="font-mono text-xl font-bold" style={{ color: overallColor }}>
                  {trustScore}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              {[
                { label: "KYC", ok: true },
                { label: "AML", ok: true },
                { label: "Sanctions", ok: true },
              ].map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: c.ok ? C.green : C.red }}
                >
                  {c.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {c.label}
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between pt-2 border-t" style={{ borderColor: C.border }}>
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide" style={{ color: `${C.navy}50` }}>
                  Issued
                </div>
                <div className="text-xs font-medium" style={{ color: C.navy }}>
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="text-[10px] uppercase tracking-wide mt-2" style={{ color: `${C.navy}50` }}>
                  Next Renewal
                </div>
                <div className="text-xs font-medium" style={{ color: C.navy }}>
                  {new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${C.navy}08` }}
              >
                <QrCode className="w-8 h-8" style={{ color: `${C.navy}30` }} />
              </div>
            </div>
          </div>
        </div>
        </GlowingBorder>

        {/* Share Controls */}
        <div className="card-elevated p-6">
          <h3 className="mb-4 data-label">Share & Access</h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: `${C.navy}60` }}>
                Shareable Verification Link
              </label>
              {shareUrl ? (
                <ShareLinkRow url={shareUrl} />
              ) : (
                <Button
                  className="w-full cursor-pointer"
                  style={{ backgroundColor: C.blue, color: "white", height: 48 }}
                  onClick={() => setShareUrl(`https://anavi.io/verify/${user?.id != null ? String(user.id).slice(0, 8) : "abc123"}`)}
                >
                  Generate Shareable Link
                </Button>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: `${C.navy}60` }}>
                API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={maskedKey}
                  className="flex-1 rounded-lg text-sm font-mono px-4"
                  style={{ height: 48, border: `1px solid ${C.border}`, color: C.navy }}
                />
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  style={{ height: 48, borderColor: C.border }}
                  onClick={() => {
                    navigator.clipboard.writeText(maskedKey);
                    toast.success("API key copied");
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: `${C.green}08`, color: C.green }}
            >
              <Lock className="w-4 h-4" />
              <span className="font-medium">Accepted by 12 institutional partners</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
