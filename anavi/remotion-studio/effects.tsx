import { AbsoluteFill, interpolate, spring, Easing } from "remotion";
import type { ReactNode } from "react";

// ─── Brand Colours (landing page aligned) ─────────────────────────────────────
export const C = {
  bg: "#060A12",
  navy: "#071227",
  deep: "#0A1628",
  electric: "#0EA5E9",
  electricDim: "#0369A1",
  electricLight: "#7DD3FC",
  gold: "#C4972A",
  goldLight: "#E5C15E",
  emerald: "#10B981",
  green: "#00FF41",
  greenDim: "#00AA22",
  purple: "#7C3AED",
  purpleLight: "#C4B5FD",
  white: "#FFFFFF",
  wa: (a: number) => `rgba(255,255,255,${a})`,
  ga: (a: number) => `rgba(0,255,65,${a})`,
  ea: (a: number) => `rgba(14,165,233,${a})`,
  goa: (a: number) => `rgba(196,151,42,${a})`,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function clamp(
  frame: number,
  input: [number, number, ...number[]],
  output: [number, number, ...number[]],
  easing?: (t: number) => number
) {
  return interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

// ─── Real ANAVI Logo  (/client/public/navi-logo.svg inlined) ──────────────────
export function AnaviLogo({ width = 220, color = "#FFFFFF" }: { width?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      fill={color}
      width={width}
      height={width * 0.25}
    >
      <path d="M25 5C12.85 5 3 14.85 3 27s9.85 22 22 22c6.08 0 11.6-2.47 15.59-6.46l-3.54-3.54C33.93 42.12 29.68 44 25 44c-9.39 0-17-7.61-17-17s7.61-17 17-17 17 7.61 17 17v2c0 2.21-1.79 4-4 4s-4-1.79-4-4v-2c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.99 0 5.64-1.46 7.28-3.71C33.78 34.3 36.22 35 38 35c4.97 0 9-4.03 9-9v-2c0-12.15-9.85-22-22-22zm0 28c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
      <text
        x="52"
        y="35"
        fontFamily="system-ui,-apple-system,sans-serif"
        fontSize="28"
        fontWeight="500"
        letterSpacing="-0.5"
      >
        navi
      </text>
      <circle cx="182" cy="12" r="3" fill="#0EA5E9" />
    </svg>
  );
}

// ─── Matrix Rain ──────────────────────────────────────────────────────────────
const MATRIX_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@&%アイウエオカキクケコサシスセソ";
const RAIN_COLS = 38;
const COL_W = Math.ceil(1920 / RAIN_COLS);

export function MatrixRain({ frame, fps }: { frame: number; fps: number }) {
  return (
    <AbsoluteFill style={{ opacity: 0.2, pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {Array.from({ length: RAIN_COLS }, (_, col) => {
          const speed = 155 + (col % 7) * 27;
          const startOffset = (col * 317) % 1200;
          const baseY = ((frame / fps) * speed + startOffset) % 1400 - 200;
          const cx = col * COL_W + COL_W / 2;
          return Array.from({ length: 22 }, (_, row) => {
            const y = baseY + row * 32;
            if (y < -32 || y > 1120) return null;
            const ci = Math.floor(Math.abs(col * 13 + row * 7 + frame * 0.4) % MATRIX_CHARS.length);
            const a = row === 0 ? 1 : Math.max(0, 1 - row / 22) * 0.85;
            return (
              <text
                key={`${col}-${row}`}
                x={cx}
                y={y}
                fill={row === 0 ? C.green : C.greenDim}
                fillOpacity={a}
                fontSize={17}
                fontFamily="'JetBrains Mono','IBM Plex Mono',monospace"
                textAnchor="middle"
              >
                {MATRIX_CHARS[ci]}
              </text>
            );
          });
        })}
      </svg>
    </AbsoluteFill>
  );
}

// ─── Rotating Tech Rings ──────────────────────────────────────────────────────
const RINGS = [
  { r: 330, speed: 0.29, dash: "14 8", color: C.electric, op: 0.1 },
  { r: 480, speed: -0.19, dash: "7 16", color: C.electricLight, op: 0.07 },
  { r: 625, speed: 0.14, dash: "22 6 4 6", color: C.gold, op: 0.055 },
  { r: 775, speed: -0.09, dash: "3 11", color: C.electric, op: 0.04 },
  { r: 920, speed: 0.06, dash: "9 21 2 21", color: C.green, op: 0.028 },
];

export function RotatingTechRings({ frame, fps }: { frame: number; fps: number }) {
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        {RINGS.map((ring, i) => (
          <circle
            key={i}
            cx={960}
            cy={540}
            r={ring.r}
            fill="none"
            stroke={ring.color}
            strokeWidth={1.5}
            strokeDasharray={ring.dash}
            strokeDashoffset={-(t * ring.speed * ring.r * 2)}
            strokeOpacity={ring.op}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
}

// ─── Vertical Scanner Line ────────────────────────────────────────────────────
export function VerticalScannerLine({ frame, fps }: { frame: number; fps: number }) {
  const period = 4.8;
  const t = (frame / fps) % period;
  const x = (t / period) * 1980 - 30;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.green} stopOpacity="0" />
            <stop offset="50%" stopColor={C.green} stopOpacity="0.65" />
            <stop offset="100%" stopColor={C.green} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={x - 26} y={0} width={52} height={1080} fill="url(#sg)" />
        <line x1={x} y1={0} x2={x} y2={1080} stroke={C.green} strokeWidth={1} strokeOpacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
}

// ─── Animated Corner Brackets ─────────────────────────────────────────────────
export function CornerBrackets({ frame, fps }: { frame: number; fps: number }) {
  const breathe = Math.sin((frame / fps) * 1.7) * 0.22 + 0.78;
  const extend = clamp(frame, [0, fps * 1.2], [0, 1], Easing.out(Easing.cubic));
  const sz = 48 * extend;
  const pad = 54;

  const bracket = (x: number, y: number, fx: number, fy: number) => (
    <g transform={`translate(${x},${y}) scale(${fx},${fy})`}>
      <path
        d={`M0 ${sz} L0 0 L${sz} 0`}
        fill="none"
        stroke={C.green}
        strokeWidth={2}
        strokeOpacity={breathe * extend}
      />
      <path
        d={`M0 0 L${sz * 0.38} 0`}
        fill="none"
        stroke={C.electric}
        strokeWidth={1}
        strokeOpacity={breathe * 0.5 * extend}
      />
      <circle cx={0} cy={0} r={3} fill={C.green} fillOpacity={breathe * extend} />
    </g>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        {bracket(pad, pad, 1, 1)}
        {bracket(1920 - pad, pad, -1, 1)}
        {bracket(pad, 1080 - pad, 1, -1)}
        {bracket(1920 - pad, 1080 - pad, -1, -1)}
      </svg>
    </AbsoluteFill>
  );
}

// ─── Floating Geometric Particles ────────────────────────────────────────────
type Particle = {
  x: number; y: number; size: number; type: "tri" | "hex";
  color: string; vx: number; vy: number; phase: number;
};

const PARTICLES: Particle[] = [
  { x: 160, y: 130, size: 18, type: "tri", color: C.electric, vx: 22, vy: 14, phase: 0 },
  { x: 1760, y: 200, size: 14, type: "tri", color: C.gold, vx: -18, vy: 20, phase: 1.2 },
  { x: 80, y: 850, size: 22, type: "hex", color: C.electric, vx: 16, vy: -12, phase: 2.4 },
  { x: 1850, y: 780, size: 16, type: "hex", color: C.electricLight, vx: -22, vy: 14, phase: 0.7 },
  { x: 620, y: 55, size: 12, type: "tri", color: C.gold, vx: 10, vy: 17, phase: 3.1 },
  { x: 1380, y: 975, size: 20, type: "hex", color: C.green, vx: -14, vy: -10, phase: 1.8 },
  { x: 310, y: 500, size: 10, type: "tri", color: C.electricLight, vx: 8, vy: 22, phase: 4.2 },
  { x: 1630, y: 480, size: 14, type: "hex", color: C.gold, vx: -10, vy: -18, phase: 5.5 },
  { x: 950, y: 40, size: 11, type: "tri", color: C.purple, vx: 5, vy: 12, phase: 2.9 },
  { x: 950, y: 1040, size: 13, type: "hex", color: C.green, vx: -6, vy: -14, phase: 0.3 },
];

export function FloatingParticles({ frame, fps }: { frame: number; fps: number }) {
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080}>
        {PARTICLES.map((p, i) => {
          const x = ((p.x + t * p.vx) % 2100 + 2100) % 2100 - 90;
          const y = ((p.y + t * p.vy) % 1220 + 1220) % 1220 - 70;
          const rot = t * 28 * (i % 2 === 0 ? 1 : -1) + p.phase * 20;
          const op = 0.16 + Math.sin(t * 1.3 + p.phase) * 0.07;

          if (p.type === "tri") {
            const r = p.size;
            const pts = `${x},${y - r} ${x - r * 0.866},${y + r * 0.5} ${x + r * 0.866},${y + r * 0.5}`;
            return (
              <polygon
                key={i}
                points={pts}
                fill="none"
                stroke={p.color}
                strokeWidth={1.5}
                strokeOpacity={op}
                transform={`rotate(${rot},${x},${y})`}
              />
            );
          }
          const pts = Array.from({ length: 6 }, (_, j) => {
            const a = ((j * 60 + rot) * Math.PI) / 180;
            return `${x + p.size * Math.cos(a)},${y + p.size * Math.sin(a)}`;
          }).join(" ");
          return (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke={p.color}
              strokeWidth={1.5}
              strokeOpacity={op}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}

// ─── Glitch Wrapper ───────────────────────────────────────────────────────────
export function GlitchWrapper({
  frame,
  fps,
  children,
}: {
  frame: number;
  fps: number;
  children: ReactNode;
}) {
  const period = Math.floor(fps * 5.8);
  const dur = Math.floor(fps * 0.26);
  const gf = frame % period;
  const active = gf < dur;
  const prog = active ? gf / dur : 0;

  const skew = active ? Math.sin(gf * 2.6) * 2.8 * prog : 0;
  const hue = active ? Math.floor(prog * 3) * 60 : 0;
  const sliceY = active ? (gf % 5) * 22 : -200;
  const sliceX = active ? Math.sin(gf * 1.8) * 20 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: skew ? `skewX(${skew}deg)` : undefined,
        filter: hue ? `hue-rotate(${hue}deg)` : undefined,
      }}
    >
      {children}
      {active && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: sliceY,
              height: 7,
              background: C.ga(0.2),
              transform: `translateX(${sliceX}px)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: sliceY + 35,
              height: 3,
              background: C.ea(0.14),
              transform: `translateX(${-sliceX * 0.6}px)`,
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </div>
  );
}

// ─── HUD Panel — Glassmorphism CEO Bio ────────────────────────────────────────
export function HUDPanel({ frame, fps }: { frame: number; fps: number }) {
  const slide = Math.min(
    1,
    spring({ frame: Math.max(0, frame - fps * 0.5), fps, config: { damping: 16, stiffness: 62 } })
  );
  const tx = (1 - slide) * -660;
  const scanY = ((frame / fps) * 68) % 370;
  const blink = Math.floor(frame / (fps * 1.3)) % 2 === 0;

  const bio = [
    "→ Private Markets Expert",
    "→ $500M+ Deal Flow",
    "→ Relationship Intelligence",
  ];
  const metrics = ["$13T+ Market TAM", "0.5—2% Platform Fee", "40—60% Originator Share", "RFC 3161 Custody"];

  return (
    <div
      style={{
        position: "absolute",
        left: 54,
        top: 92,
        width: 298,
        transform: `translateX(${tx}px)`,
        zIndex: 20,
      }}
    >
      {/* outer glow aura */}
      <div
        style={{
          position: "absolute",
          inset: -10,
          borderRadius: 6,
          background: `radial-gradient(ellipse, ${C.ga(0.09)} 0%, transparent 70%)`,
          filter: "blur(14px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          background: "rgba(0,28,12,0.78)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${C.ga(0.38)}`,
          clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)",
          padding: "24px 20px 20px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'JetBrains Mono','IBM Plex Mono','Courier New',monospace",
        }}
      >
        {/* internal scanner sweep */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: scanY,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.ga(0.42)}, transparent)`,
            pointerEvents: "none",
          }}
        />

        {/* cut-corner accent */}
        <svg style={{ position: "absolute", top: 0, right: 0, width: 24, height: 24 }}>
          <line x1={0} y1={1} x2={23} y2={24} stroke={C.ga(0.55)} strokeWidth={1} />
        </svg>

        <div style={{ fontSize: 9, color: C.green, letterSpacing: 2.8, marginBottom: 14, opacity: 0.75 }}>
          ▸ PLATFORM LEADERSHIP{blink ? " _" : "  "}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.electric} 0%, #7C3AED 100%)`,
            border: `2px solid ${C.ga(0.5)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 800,
            color: C.white,
            marginBottom: 11,
          }}
        >
          A
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: C.white, letterSpacing: 0.3, marginBottom: 2 }}>
          Founder
        </div>
        <div style={{ fontSize: 9, color: C.green, letterSpacing: 2.8, textTransform: "uppercase", marginBottom: 13 }}>
          CEO &amp; Co-Founder
        </div>

        {/* Bio lines */}
        <div style={{ borderTop: `1px solid ${C.ga(0.2)}`, paddingTop: 11, marginBottom: 11 }}>
          {bio.map((line) => (
            <div key={line} style={{ fontSize: 10, color: C.wa(0.58), lineHeight: 1.9 }}>
              {line}
            </div>
          ))}
        </div>

        {/* Metrics */}
        <div style={{ borderTop: `1px solid ${C.ga(0.2)}`, paddingTop: 11 }}>
          <div style={{ fontSize: 8, color: C.electric, letterSpacing: 2.5, marginBottom: 7 }}>
            PLATFORM METRICS
          </div>
          {metrics.map((line) => (
            <div key={line} style={{ fontSize: 9, color: C.wa(0.54), lineHeight: 1.9 }}>
              {line}
            </div>
          ))}
        </div>

        {/* Trust score badge */}
        <div
          style={{
            marginTop: 11,
            padding: "7px 10px",
            background: C.ea(0.08),
            border: `1px solid ${C.ea(0.28)}`,
            borderRadius: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 8, color: C.electric, letterSpacing: 1.8 }}>TRUST SCORE</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.electric }}>94</span>
        </div>
      </div>
    </div>
  );
}
