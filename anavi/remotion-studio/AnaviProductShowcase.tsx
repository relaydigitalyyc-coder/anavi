import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  C,
  clamp,
  AnaviLogo,
  CornerBrackets,
  FloatingParticles,
} from "./effects";

export type ShowcaseProps = { trustScore: number };

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const OUT = Easing.bezier(0.0, 0.0, 0.2, 1);

function fade(f: number, s: number, e: number, from = 0, to = 1) {
  return clamp(f, [s, e], [from, to], EASE);
}

// ─── Verification page design tokens (exact from the app) ────────────────────

const V = {
  navy: "#0A1628",
  gold: "#C4972A",
  blue: "#2563EB",
  green: "#059669",
  red: "#DC2626",
  steel: "#1E3A5F",
  surface: "#F3F7FC",
  border: "#D1DCF0",
} as const;

// ─── Ambient ─────────────────────────────────────────────────────────────────

function Ambient({ frame, fps }: { frame: number; fps: number }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          pointerEvents: "none",
        }}
      >
        <FloatingParticles frame={frame} fps={fps} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      >
        <CornerBrackets frame={frame} fps={fps} />
      </div>
    </>
  );
}

// ─── Scene 1 — Brand Opening (3.5s) ─────────────────────────────────────────

function SceneBrand({ f, fps }: { f: number; fps: number }) {
  const lo = fade(f, 0, fps * 0.6);
  const ls = interpolate(f, [0, fps * 0.6], [0.94, 1], {
    extrapolateRight: "clamp",
    easing: OUT,
  });
  const to = fade(f, fps * 0.7, fps * 1.3);
  const lw = clamp(f, [fps * 1.1, fps * 1.8], [0, 120], OUT);
  const so = fade(f, fps * 1.6, fps * 2.4);
  const sy = clamp(f, [fps * 1.6, fps * 2.4], [14, 0], OUT);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            opacity: lo,
            transform: `scale(${ls})`,
            marginBottom: 48,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <AnaviLogo width={300} />
        </div>
        <div
          style={{
            fontSize: 20,
            color: C.gold,
            letterSpacing: 5,
            textTransform: "uppercase",
            fontWeight: 300,
            opacity: to,
          }}
        >
          The Private Market Operating System
        </div>
        <div
          style={{
            width: lw,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.gold}60, transparent)`,
            margin: "24px auto",
          }}
        />
        <div
          style={{
            fontSize: 26,
            color: C.wa(0.4),
            fontStyle: "italic",
            fontWeight: 300,
            opacity: so,
            transform: `translateY(${sy}px)`,
            lineHeight: 1.6,
          }}
        >
          If Bloomberg runs public markets, ANAVI will run private ones.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 2 — Problem (3s) ─────────────────────────────────────────────────

function SceneProblem({ f, fps }: { f: number; fps: number }) {
  const no = fade(f, fps * 0.15, fps * 0.6);
  const ns = interpolate(f, [fps * 0.15, fps * 0.6], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });
  const so = fade(f, fps * 0.7, fps * 1.3);
  const do2 = fade(f, fps * 1.3, fps * 1.9);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 170,
            fontWeight: 800,
            color: "#EF4444",
            lineHeight: 1,
            opacity: no,
            transform: `scale(${ns})`,
            textShadow: "0 0 80px rgba(239,68,68,0.12)",
          }}
        >
          $40B
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 500,
            color: C.wa(0.7),
            opacity: so,
            marginTop: 10,
            letterSpacing: -0.5,
          }}
        >
          in annual private market fraud
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 20,
            color: C.wa(0.3),
            fontWeight: 300,
            lineHeight: 1.8,
            opacity: do2,
            maxWidth: 680,
            margin: "28px auto 0",
          }}
        >
          5–15 intermediaries per deal &nbsp;·&nbsp; $500K duplicated diligence
          &nbsp;·&nbsp; Zero originator protection
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3 — Real Verification Banner (from the app) (4s) ─────────────────
// Exact reproduction of the dark KYB Value Proposition Banner from Verification.tsx

function SceneVerificationBanner({ f, fps }: { f: number; fps: number }) {
  const bannerOp = fade(f, 0, fps * 0.5);
  const bannerScale = interpolate(f, [0, fps * 0.5], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });
  const eyebrowOp = fade(f, fps * 0.3, fps * 0.7);
  const headOp = fade(f, fps * 0.5, fps * 0.9);
  const bodyOp = fade(f, fps * 0.8, fps * 1.3);
  const statsOp = fade(f, fps * 1.1, fps * 1.6);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 120px",
      }}
    >
      {/* Exact replica of the KYB Value Proposition Banner */}
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          borderRadius: 20,
          overflow: "hidden",
          background: "linear-gradient(135deg, #0A1628, #132035, #0A1628)",
          padding: "52px 64px",
          position: "relative",
          opacity: bannerOp,
          transform: `scale(${bannerScale})`,
          boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
        }}
      >
        {/* Glow orbs — from the real component */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 240,
            height: 240,
            background: "rgba(196,151,42,0.05)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 160,
            height: 160,
            background: "rgba(37,99,235,0.05)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: V.gold,
                marginBottom: 10,
                opacity: eyebrowOp,
              }}
            >
              Compliance Passport
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
                letterSpacing: -0.5,
                opacity: headOp,
                fontFamily: "'Instrument Serif','Georgia',serif",
              }}
            >
              Verify once, transact forever.
            </div>
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                marginTop: 14,
                opacity: bodyOp,
              }}
            >
              Your Compliance Passport travels with every deal on ANAVI.
              Counterparties access your verified status — they don't duplicate
              your $50K–$500K in due diligence.
            </div>
          </div>
          <div style={{ display: "flex", gap: 36, opacity: statsOp }}>
            {[
              { val: "$271B", sub: "Global compliance spend" },
              { val: "$34B", sub: "Lost to inefficiency" },
            ].map(s => (
              <div key={s.val} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 36,
                    fontFamily: "'Instrument Serif','Georgia',serif",
                    color: V.gold,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginTop: 6,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 4 — Real Trust Score Dashboard (from the app) (4.5s) ──────────────
// Faithful reproduction of the Trust Score card + Radar + dimension cards

function SceneTrustDashboard({ f, fps }: { f: number; fps: number }) {
  const cardOp = fade(f, 0, fps * 0.4);
  const cardScale = interpolate(f, [0, fps * 0.4], [0.97, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });
  const radarRev = clamp(f, [fps * 0.3, fps * 1.8], [0, 1], OUT);
  const dimOps = Array.from({ length: 6 }, (_, i) =>
    fade(f, fps * (1.0 + i * 0.12), fps * (1.4 + i * 0.12))
  );

  const dims = [
    { label: "KYB Depth", score: 90, status: "Verified", color: V.green },
    { label: "Transaction History", score: 80, status: "Auto", color: V.blue },
    { label: "Dispute Outcomes", score: 70, status: "Auto", color: V.blue },
    { label: "Peer Attestations", score: 85, status: "Auto", color: V.green },
    { label: "Platform Tenure", score: 60, status: "Auto", color: V.gold },
    {
      label: "Identity Verification",
      score: 95,
      status: "Verified",
      color: V.green,
    },
  ];

  const scoreHist = [65, 68, 72, 74, 78, 84];
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];

  // Radar geometry
  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  const rSz = 200;
  const rcx = rSz / 2;
  const rcy = rSz / 2;
  const maxR = rSz / 2 - 18;
  const radarPts = dims.map((d, i) =>
    polar(rcx, rcy, (d.score / 100) * maxR * radarRev, i * 60)
  );
  const radarPoly = radarPts.map(p => `${p.x},${p.y}`).join(" ");
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Mini chart
  const cw = 180;
  const ch = 64;
  const cPad = 6;
  const cMin = Math.min(...scoreHist) - 5;
  const cMax = Math.max(...scoreHist) + 5;
  const cXs = (cw - cPad * 2) / (scoreHist.length - 1);
  const cPts = scoreHist.map((v, i) => ({
    x: cPad + i * cXs,
    y: cPad + ((cMax - v) / (cMax - cMin)) * (ch - cPad * 2),
  }));
  const cLine = cPts.map(p => `${p.x},${p.y}`).join(" ");

  // Status pill colors
  function pillBg(s: string) {
    return s === "Verified" ? `${V.green}22` : `${V.blue}15`;
  }
  function pillFg(s: string) {
    return s === "Verified" ? V.green : V.blue;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          opacity: cardOp,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* Score Overview Card — exact replica */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "36px 40px",
            border: `1px solid ${V.border}`,
            boxShadow: "0 4px 24px rgba(10,22,40,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 40,
            marginBottom: 20,
          }}
        >
          {/* Left — big number */}
          <div style={{ textAlign: "center", minWidth: 140 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "rgba(10,22,40,0.5)",
                marginBottom: 8,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              Trust Score
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: V.green,
                fontFamily: "'JetBrains Mono',monospace",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: -2,
              }}
            >
              {Math.round(84 * radarRev)}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(10,22,40,0.5)",
                marginTop: 4,
              }}
            >
              out of 100
            </div>
          </div>

          {/* Center — radar chart */}
          <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <svg width={rSz} height={rSz} viewBox={`0 0 ${rSz} ${rSz}`}>
              {levels.map(l => {
                const pts = Array.from({ length: 6 }, (_, i) =>
                  polar(rcx, rcy, maxR * l, i * 60)
                );
                return (
                  <polygon
                    key={l}
                    points={pts.map(p => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={V.navy}
                    strokeWidth={0.5}
                    opacity={0.15}
                  />
                );
              })}
              {Array.from({ length: 6 }, (_, i) => {
                const p = polar(rcx, rcy, maxR, i * 60);
                return (
                  <line
                    key={i}
                    x1={rcx}
                    y1={rcy}
                    x2={p.x}
                    y2={p.y}
                    stroke={V.navy}
                    strokeWidth={0.5}
                    opacity={0.12}
                  />
                );
              })}
              <polygon
                points={radarPoly}
                fill={V.blue}
                fillOpacity={0.25}
                stroke={V.blue}
                strokeWidth={2}
              />
              {radarPts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={V.blue} />
              ))}
              {dims.map((d, i) => {
                const p = polar(rcx, rcy, maxR + 16, i * 60);
                return (
                  <text
                    key={d.label}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    fill={V.navy}
                    fontWeight={600}
                  >
                    {Math.round(d.score * radarRev)}%
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Right — mini chart */}
          <div style={{ textAlign: "center", minWidth: 180 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "rgba(10,22,40,0.5)",
                marginBottom: 10,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              6-Month Trend
            </div>
            <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`}>
              <path
                d={`M${cPts[0].x},${ch} ${cPts.map(p => `L${p.x},${p.y}`).join(" ")} L${cPts[cPts.length - 1].x},${ch} Z`}
                fill={V.blue}
                fillOpacity={0.08}
              />
              <polyline
                points={cLine}
                fill="none"
                stroke={V.navy}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              {cPts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2} fill={V.navy} />
              ))}
            </svg>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginTop: 6,
              }}
            >
              {months.map(m => (
                <span
                  key={m}
                  style={{ fontSize: 9, color: "rgba(10,22,40,0.4)" }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension cards — exact replica */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          {dims.map((d, i) => {
            const barW = clamp(
              f,
              [fps * (1.0 + i * 0.12), fps * (1.8 + i * 0.12)],
              [0, d.score],
              OUT
            );
            return (
              <div
                key={d.label}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1px solid ${V.border}`,
                  boxShadow: "0 2px 8px rgba(10,22,40,0.04)",
                  display: "flex",
                  opacity: dimOps[i],
                }}
              >
                <div style={{ width: 4, background: d.color, flexShrink: 0 }} />
                <div style={{ padding: "14px 16px", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: V.navy }}
                    >
                      {d.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: pillBg(d.status),
                        color: pillFg(d.status),
                      }}
                    >
                      {d.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono',monospace",
                        color: V.navy,
                      }}
                    >
                      {Math.round(barW)}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: "rgba(10,22,40,0.4)",
                        }}
                      >
                        /100
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: "rgba(10,22,40,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: `${barW}%`,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          d.score > 80
                            ? V.green
                            : d.score > 60
                              ? V.gold
                              : V.blue,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 5 — Real Compliance Passport Card (from the app) (4.5s) ───────────

function ScenePassportCard({ f, fps }: { f: number; fps: number }) {
  const cardOp = fade(f, 0, fps * 0.5);
  const cardScale = interpolate(f, [0, fps * 0.5], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });
  const checksOp = Array.from({ length: 3 }, (_, i) =>
    fade(f, fps * (0.8 + i * 0.15), fps * (1.1 + i * 0.15))
  );
  const sideOp = fade(f, fps * 1.3, fps * 1.8);
  const moduleOps = Array.from({ length: 8 }, (_, i) =>
    fade(f, fps * (1.5 + i * 0.06), fps * (1.9 + i * 0.06))
  );
  const jurisdOp = fade(f, fps * 2.2, fps * 2.7);
  const partnerOp = fade(f, fps * 2.6, fps * 3.2);

  const checks = [
    { label: "KYC", ok: true },
    { label: "AML", ok: true },
    { label: "Sanctions", ok: true },
  ];
  const modules = [
    "KYB Verification",
    "Sanctions Screening",
    "PEP & Adverse Media",
    "AML Screening",
    "Accreditation",
    "Jurisdiction Check",
    "ID Verification",
    "Legal & Contracting",
  ];
  const juris = ["US", "EU", "UK", "CH", "SG", "UAE", "HK", "KY"];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 48,
          alignItems: "flex-start",
          opacity: cardOp,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* Passport Card — exact replica from Verification.tsx */}
        <div
          style={{
            width: 400,
            borderRadius: 20,
            overflow: "hidden",
            border: `1px solid ${V.border}`,
            boxShadow:
              "0 24px 64px rgba(10,22,40,0.12), 0 0 0 1px rgba(196,151,42,0.08)",
          }}
        >
          {/* Navy header */}
          <div
            style={{
              padding: "16px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#0F172A",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              ANAVI
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              Compliance Passport
            </span>
          </div>
          {/* White body */}
          <div style={{ background: "#FFFFFF", padding: "28px 28px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "rgba(10,22,40,0.45)",
                    marginBottom: 3,
                  }}
                >
                  Participant
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: V.navy }}>
                  Verified Entity LLC
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(10,22,40,0.4)",
                    marginTop: 2,
                  }}
                >
                  ID: a7b3c91e
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: `${V.gold}22`,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: V.gold }}
                  >
                    Tier 3
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: V.green,
                  }}
                >
                  94
                </div>
              </div>
            </div>

            {/* KYC / AML / Sanctions checks */}
            <div style={{ display: "flex", gap: 18, marginTop: 18 }}>
              {checks.map((c, i) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    opacity: checksOp[i],
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      fill="none"
                      stroke={V.green}
                      strokeWidth="1.5"
                    />
                    <path
                      d="M4 7l2 2 4-4"
                      fill="none"
                      stroke={V.green}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: V.green }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Dates + QR */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${V.border}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "rgba(10,22,40,0.4)",
                  }}
                >
                  Issued
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: V.navy,
                    marginTop: 2,
                  }}
                >
                  Mar 1, 2026
                </div>
                <div
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "rgba(10,22,40,0.4)",
                    marginTop: 10,
                  }}
                >
                  Next Renewal
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: V.navy,
                    marginTop: 2,
                  }}
                >
                  Mar 1, 2027
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: "rgba(10,22,40,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(10,22,40,0.25)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <line x1="21" y1="14" x2="21" y2="14" />
                  <line x1="14" y1="21" x2="14" y2="21" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right side — modules, jurisdictions, partner notice */}
        <div style={{ flex: 1, maxWidth: 520, opacity: sideOp }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2.5,
              color: "rgba(10,22,40,0.35)",
              marginBottom: 14,
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            Compliance Modules
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {modules.map((m, i) => (
              <div
                key={m}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(243,247,252,0.6)",
                  border: `1px solid ${V.border}80`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: moduleOps[i],
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: V.green,
                    opacity: 0.7,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: V.steel }}>{m}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, opacity: jurisdOp }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2.5,
                color: "rgba(10,22,40,0.35)",
                marginBottom: 10,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              Jurisdiction Coverage
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {juris.map(j => (
                <div
                  key={j}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: "rgba(37,99,235,0.06)",
                    border: `1px solid rgba(37,99,235,0.15)`,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 500, color: V.blue }}
                  >
                    {j}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: 10,
              background: `${V.green}0c`,
              opacity: partnerOp,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={V.green}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: V.green }}>
              Accepted by 12 institutional partners
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 6 — Blind Match + Deal Room (4.5s) ───────────────────────────────

function SceneMatchDeal({ f, fps }: { f: number; fps: number }) {
  const ph1 = fps * 2.0;

  if (f < ph1) {
    const ho = fade(f, 0, fps * 0.35);
    const lp = clamp(f, [fps * 0.15, fps * 0.9], [0, 1], OUT);
    const rp = clamp(f, [fps * 0.2, fps * 1.0], [0, 1], OUT);
    const mo = fade(f, fps * 1.1, fps * 1.5);
    const lx = -140 + lp * 60;
    const rx = 140 - rp * 60;
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 40, opacity: ho }}>
          <div
            style={{
              fontSize: 16,
              color: C.purple,
              letterSpacing: 4,
              textTransform: "uppercase",
              fontWeight: 300,
              marginBottom: 10,
            }}
          >
            Intent-Based Discovery
          </div>
          <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: -1.5 }}>
            Blind Matching
          </div>
        </div>
        <svg width={520} height={200} viewBox="-260 -100 520 200">
          <circle
            cx={lx}
            cy={0}
            r={72}
            fill={C.ea(0.05)}
            stroke={C.electric}
            strokeWidth={1}
            strokeOpacity={0.35}
          />
          <text
            x={lx}
            textAnchor="middle"
            dy="-6"
            fill={C.white}
            fontSize={15}
            fontWeight={600}
          >
            INVESTOR
          </text>
          <text
            x={lx}
            textAnchor="middle"
            dy="14"
            fill={C.wa(0.2)}
            fontSize={10}
            letterSpacing="1.5"
          >
            SEALED
          </text>
          <circle
            cx={rx}
            cy={0}
            r={72}
            fill={`${C.purple}08`}
            stroke={C.purple}
            strokeWidth={1}
            strokeOpacity={0.35}
          />
          <text
            x={rx}
            textAnchor="middle"
            dy="-6"
            fill={C.white}
            fontSize={15}
            fontWeight={600}
          >
            OPPORTUNITY
          </text>
          <text
            x={rx}
            textAnchor="middle"
            dy="14"
            fill={C.wa(0.2)}
            fontSize={10}
            letterSpacing="1.5"
          >
            SEALED
          </text>
          {mo > 0 && (
            <g opacity={mo}>
              <text
                textAnchor="middle"
                dy="-4"
                fill={C.gold}
                fontSize={20}
                fontWeight={700}
                letterSpacing="2"
              >
                MATCH
              </text>
              <text textAnchor="middle" dy="14" fill={C.wa(0.35)} fontSize={11}>
                → NDA-Gated Deal Room
              </text>
            </g>
          )}
        </svg>
      </AbsoluteFill>
    );
  }

  // Deal room + attribution
  const lf = f - ph1;
  const ho = fade(lf, 0, fps * 0.3);
  const items = [
    "AML/KYC",
    "Sanctions",
    "NDA Signed",
    "Shared Diligence",
    "Escrow",
  ];
  const chain = [
    { label: "Originator", color: C.gold },
    { label: "Introduction", color: C.electricLight },
    { label: "Deal Closed", color: C.emerald },
    { label: "60% Lifetime", color: C.gold },
  ];
  const pct = clamp(lf, [fps * 0.1, fps * 1.0], [0, 60], OUT);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 36, opacity: ho }}>
        <div
          style={{
            fontSize: 16,
            color: C.gold,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 300,
            marginBottom: 10,
          }}
        >
          Embedded Compliance + Attribution
        </div>
        <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: -1.5 }}>
          Deal Room
        </div>
      </div>
      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => {
            const ie = fade(
              lf,
              fps * (0.1 + i * 0.08),
              fps * (0.35 + i * 0.08)
            );
            return (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: ie,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: `${C.emerald}14`,
                    border: `1px solid ${C.emerald}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.emerald,
                  }}
                >
                  ✓
                </div>
                <span style={{ fontSize: 18, color: C.wa(0.7) }}>{item}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {chain.map((c, i) => {
              const ce = fade(
                lf,
                fps * (0.05 + i * 0.08),
                fps * (0.3 + i * 0.08)
              );
              return (
                <div
                  key={c.label}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      background: `${c.color}0a`,
                      border: `1px solid ${c.color}22`,
                      opacity: ce,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: c.color }}
                    >
                      {c.label}
                    </span>
                  </div>
                  {i < chain.length - 1 && (
                    <span
                      style={{
                        fontSize: 16,
                        color: C.wa(0.1),
                        margin: "0 4px",
                      }}
                    >
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: C.gold,
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 50px ${C.goa(0.08)}`,
            }}
          >
            {Math.round(pct)}%
          </div>
          <div
            style={{
              fontSize: 14,
              color: C.wa(0.3),
              letterSpacing: 2,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            Originator Share — Lifetime
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 7 — CTA (4s) ─────────────────────────────────────────────────────

function SceneCTA({
  f,
  fps,
  trustScore,
}: {
  f: number;
  fps: number;
  trustScore: number;
}) {
  const lo = fade(f, 0, fps * 0.4);
  const to = fade(f, fps * 0.5, fps * 1.0);
  const mo = fade(f, fps * 0.8, fps * 1.5);
  const my = clamp(f, [fps * 0.8, fps * 1.5], [14, 0], OUT);
  const co = fade(f, fps * 1.8, fps * 2.4);
  const circ = 2 * Math.PI * 40;
  const rev = clamp(f, [fps * 0.3, fps * 1.2], [0, 1], OUT);
  const glow = 0.7 + Math.sin((f / fps) * 1.8) * 0.3;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 36,
            opacity: lo,
          }}
        >
          <AnaviLogo width={220} />
        </div>
        <div
          style={{
            fontSize: 16,
            color: C.gold,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontWeight: 300,
            opacity: to,
            marginBottom: 20,
          }}
        >
          The Bloomberg of Private Capital
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.2,
            opacity: mo,
            transform: `translateY(${my}px)`,
          }}
        >
          Custody. Trust. Attribution.
          <br />
          <span style={{ color: C.electricLight }}>
            Private markets, reimagined.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 32,
            marginTop: 44,
            opacity: co,
          }}
        >
          <div style={{ position: "relative", width: 96, height: 96 }}>
            <svg
              width={96}
              height={96}
              viewBox="0 0 96 96"
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={C.wa(0.04)}
                strokeWidth="3.5"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={C.emerald}
                strokeWidth="3.5"
                strokeDasharray={`${circ * trustScore * rev} ${circ}`}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 ${5 * glow}px ${C.emerald}60)`,
                }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(trustScore * 100 * rev)}
              </span>
              <span style={{ fontSize: 7, opacity: 0.35, letterSpacing: 1.5 }}>
                TRUST
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "14px 44px",
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.electric}, ${C.electricDim})`,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              boxShadow: `0 0 40px ${C.ea(0.15)}, 0 6px 24px rgba(0,0,0,0.25)`,
            }}
          >
            Apply for Access →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Composition (31s total at 1.3x pace) ────────────────────────────────────

type SceneDef = {
  frames: number;
  render: (f: number, fps: number, ts: number) => React.ReactNode;
};

function scenes(fps: number): SceneDef[] {
  return [
    {
      frames: Math.round(fps * 3.5),
      render: (f, fp) => <SceneBrand f={f} fps={fp} />,
    },
    {
      frames: Math.round(fps * 3.0),
      render: (f, fp) => <SceneProblem f={f} fps={fp} />,
    },
    {
      frames: Math.round(fps * 4.0),
      render: (f, fp) => <SceneVerificationBanner f={f} fps={fp} />,
    },
    {
      frames: Math.round(fps * 4.5),
      render: (f, fp) => <SceneTrustDashboard f={f} fps={fp} />,
    },
    {
      frames: Math.round(fps * 4.5),
      render: (f, fp) => <ScenePassportCard f={f} fps={fp} />,
    },
    {
      frames: Math.round(fps * 4.5),
      render: (f, fp) => <SceneMatchDeal f={f} fps={fp} />,
    },
    {
      frames: Math.round(fps * 4.0),
      render: (f, fp, ts) => <SceneCTA f={f} fps={fp} trustScore={ts} />,
    },
  ];
}

export function AnaviProductShowcase({ trustScore }: ShowcaseProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = scenes(fps);
  const total = sc.reduce((s, x) => s + x.frames, 0);

  let acc = 0;
  let idx = 0;
  for (let i = 0; i < sc.length; i++) {
    if (frame < acc + sc[i].frames) {
      idx = i;
      break;
    }
    acc += sc[i].frames;
    if (i === sc.length - 1) {
      idx = i;
      acc = total - sc[i].frames;
    }
  }

  const lf = frame - acc;
  const scene = sc[idx];

  const fadeIn = clamp(lf, [0, fps * 0.35], [0, 1], EASE);
  const fadeOut = clamp(
    lf,
    [scene.frames - fps * 0.3, scene.frames],
    [1, 0],
    EASE
  );
  const scaleIn = interpolate(lf, [0, fps * 0.35], [0.975, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: OUT,
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 35%, #0D1A2E 0%, ${C.bg} 65%, #030508 100%)`,
        color: C.white,
        fontFamily:
          "'Inter','SF Pro Display',-apple-system,system-ui,sans-serif",
      }}
    >
      <Ambient frame={frame} fps={fps} />
      <AbsoluteFill
        style={{ opacity: fadeIn * fadeOut, transform: `scale(${scaleIn})` }}
      >
        {scene.render(lf, fps, trustScore)}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: C.wa(0.02),
        }}
      >
        <div
          style={{
            width: `${(frame / total) * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${C.ea(0.15)}, ${C.ea(0.35)})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
