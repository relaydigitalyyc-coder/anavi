import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ScenePlan } from "../scripts/scene-plan";
import {
  C,
  clamp,
  AnaviLogo,
  MatrixRain,
  RotatingTechRings,
  VerticalScannerLine,
  CornerBrackets,
  FloatingParticles,
  GlitchWrapper,
  HUDPanel,
} from "./effects";

export type StudioVideoProps = {
  title: string;
  subtitle: string;
  plan: ScenePlan;
  trustScore: number;
};

// ─── 3D Maths (globe) ─────────────────────────────────────────────────────────
function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-(r * Math.sin(phi) * Math.cos(theta)), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}
function rotX(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}
function rotY(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}
function proj(x: number, y: number, z: number, cx: number, cy: number, fov: number): [number, number, number] {
  const s = fov / (fov + z);
  return [x * s + cx, y * s + cy, z];
}

const GLOBE_MARKERS = [
  [37.78, -122.42], [51.51, -0.13], [35.68, 139.69],
  [1.35, 103.82], [25.2, 55.27], [47.37, 8.54], [22.32, 114.17], [-33.87, 151.21],
];
const GLOBE_ARCS: Array<[number, number]> = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[2,6],[6,3]];

// ─── Scene: Globe Network ─────────────────────────────────────────────────────
function GlobeNetwork({ localFrame, fps }: { localFrame: number; fps: number }) {
  const W = 560; const H = 430; const R = 148; const cx = W / 2; const cy = H / 2; const fov = 520;
  const rotYAng = 0.4 + (localFrame / fps) * 0.85;
  const rotXAng = 0.26 + Math.sin((localFrame / fps) * 0.75) * 0.08;
  const flowT = (localFrame / fps) * 1.6;
  const numDots = 230; const golden = (1 + Math.sqrt(5)) / 2;

  const dots = Array.from({ length: numDots }, (_, i) => {
    const theta = (2 * Math.PI * i) / golden;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / numDots);
    let [x, y, z] = [Math.cos(theta) * Math.sin(phi) * R, Math.cos(phi) * R, Math.sin(theta) * Math.sin(phi) * R];
    [x, y, z] = rotX(x, y, z, rotXAng);
    [x, y, z] = rotY(x, y, z, rotYAng);
    const [px, py, pz] = proj(x, y, z, cx, cy, fov);
    const d = Math.max(0.1, 1 - (pz + R) / (2 * R));
    return { x: px, y: py, z: pz, op: d * 0.75, sz: 1 + d * 1.1 };
  }).sort((a, b) => a.z - b.z);

  const markers = GLOBE_MARKERS.map(([lat, lng], idx) => {
    let [x, y, z] = latLngToXYZ(lat, lng, R);
    [x, y, z] = rotX(x, y, z, rotXAng);
    [x, y, z] = rotY(x, y, z, rotYAng);
    const [px, py] = proj(x, y, z, cx, cy, fov);
    return { idx, x: px, y: py };
  });

  const counterEnter = clamp(localFrame, [fps * 0.4, fps * 2.2], [0, 1], Easing.out(Easing.cubic));
  const count = Math.round(4200 * counterEnter);
  const pulse = Math.sin((localFrame / fps) * 2.2) * 0.2 + 0.8;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 20, borderRadius: 24, background: `radial-gradient(ellipse at center, ${C.ea(0.06)} 0%, transparent 70%)` }} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {GLOBE_ARCS.map(([ai, bi], idx) => {
          const a = markers[ai]!; const b = markers[bi]!;
          const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2 - 40;
          const travel = (Math.sin(flowT + idx * 0.9) + 1) / 2;
          const tx = (1-travel)**2*a.x + 2*(1-travel)*travel*mx + travel**2*b.x;
          const ty = (1-travel)**2*a.y + 2*(1-travel)*travel*my + travel**2*b.y;
          return (
            <g key={idx}>
              <path d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`} fill="none" stroke={C.gold} strokeOpacity={0.42} strokeWidth={1.2} />
              <circle cx={tx} cy={ty} r={2.4} fill={C.goldLight} />
            </g>
          );
        })}
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.sz} fill={C.electricLight} fillOpacity={d.op} />)}
        {markers.map(m => (
          <g key={m.idx}>
            <circle cx={m.x} cy={m.y} r={4} fill={C.electric} />
            <circle cx={m.x} cy={m.y} r={9 + Math.sin(flowT + m.idx) * 2} fill="none" stroke={C.electricLight} strokeOpacity={0.5} strokeWidth={1} />
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", bottom: 20, right: 16, textAlign: "right" }}>
        <div style={{ fontSize: 58, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.electricLight, lineHeight: 1, textShadow: `0 0 ${18*pulse}px ${C.ea(0.4)}` }}>
          {count.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: 2.2, textTransform: "uppercase", marginTop: 5 }}>
          Verified Relationship Graph
        </div>
      </div>
    </div>
  );
}

// ─── Scene: Cipher Overlay (blind matching backdrop) ─────────────────────────
const CIPHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@";
function CipherOverlay({ localFrame, fps, tint }: { localFrame: number; fps: number; tint: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 26, background: `linear-gradient(140deg, ${C.wa(0.04)} 0%, transparent 75%)` }}>
      {Array.from({ length: 10 }, (_, row) => {
        const shift = ((localFrame * (1.5 + row * 0.06)) % 88) - 44;
        const reveal = clamp(localFrame, [fps * 0.15 + row * 2, fps * 0.8 + row * 2], [0, 1]);
        const chars = Array.from({ length: 72 }, (_, i) => CIPHER_CHARS[Math.floor((i * 11 + row * 7 + localFrame * 2) % CIPHER_CHARS.length)]).join("");
        return (
          <div key={row} style={{ position: "absolute", left: -40 + shift, right: -40, top: 16 + row * 27, fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace", fontSize: 13, letterSpacing: 1, color: tint, opacity: reveal * (0.18 + row * 0.025), whiteSpace: "nowrap" }}>
            {chars}
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,10,18,0) 0%, rgba(6,10,18,0.88) 100%)" }} />
    </div>
  );
}

// ─── Intro Sequence ───────────────────────────────────────────────────────────
function IntroSequence({ frame, fps, title, subtitle }: { frame: number; fps: number; title: string; subtitle: string }) {
  const logoScale = Math.min(1, spring({ frame, fps, config: { damping: 14, stiffness: 100 } }));
  const titleY = clamp(frame, [fps * 0.3, fps * 1.1], [40, 0], Easing.out(Easing.cubic));
  const titleOp = clamp(frame, [fps * 0.3, fps * 1.1], [0, 1], Easing.out(Easing.cubic));
  const subOp = clamp(frame, [fps * 0.8, fps * 1.6], [0, 1], Easing.out(Easing.cubic));
  const pillsOp = clamp(frame, [fps * 1.4, fps * 2.0], [0, 1], Easing.out(Easing.cubic));
  const tagline = "If Bloomberg runs public markets, ANAVI will run private ones.";
  const pills = ["Relationship Custody", "Blind Matching", "Deal Room", "Attribution"];
  const floatY = Math.sin((frame / fps) * 0.8) * 6;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 1100, transform: `translateY(${floatY}px)` }}>
        <div style={{ transform: `scale(${logoScale}) translateY(${(1-logoScale)*-40}px)`, marginBottom: 40, display: "flex", justifyContent: "center" }}>
          <AnaviLogo width={260} />
        </div>
        <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: -2, lineHeight: 1.06, opacity: titleOp, transform: `translateY(${titleY}px)` }}>
          {title}
        </div>
        <div style={{ marginTop: 22, fontSize: 26, color: C.wa(0.72), fontWeight: 400, opacity: subOp }}>
          {subtitle}
        </div>
        <div style={{ marginTop: 16, fontSize: 18, color: C.goldLight, fontStyle: "italic", opacity: subOp * 0.8 }}>
          "{tagline}"
        </div>
        <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 28, opacity: pillsOp, flexWrap: "wrap" }}>
          {pills.map((p) => (
            <span key={p} style={{ fontSize: 13, color: C.electricLight, letterSpacing: 1.8, textTransform: "uppercase", padding: "6px 14px", border: `1px solid ${C.ea(0.3)}`, borderRadius: 4 }}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Outro Sequence ───────────────────────────────────────────────────────────
function OutroSequence({ frame, fps, trustScore }: { frame: number; fps: number; trustScore: number }) {
  const enter = Math.min(1, spring({ frame, fps, config: { damping: 14, stiffness: 80 } }));
  const ctaEnter = clamp(frame, [fps * 0.7, fps * 1.4], [0, 1], Easing.out(Easing.cubic));
  const floatY = Math.sin((frame / fps) * 0.9) * 5;
  const circumference = 2 * Math.PI * 54;
  const revealProgress = clamp(frame, [fps * 0.5, fps * 1.6], [0, 1], Easing.out(Easing.cubic));
  const strokeDash = circumference * trustScore * revealProgress;
  const glow = Math.sin((frame / fps) * 2) * 0.3 + 0.7;
  const ctaScore = Math.round(trustScore * 100 * revealProgress);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 1080, opacity: enter, transform: `scale(${0.9 + enter*0.1}) translateY(${floatY}px)` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <AnaviLogo width={240} />
        </div>
        <div style={{ fontSize: 18, color: C.gold, letterSpacing: 2.4, textTransform: "uppercase", marginBottom: 16 }}>
          The Private Market Operating System
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.1 }}>
          If Bloomberg runs public markets,
          <br />
          <span style={{ color: C.electricLight }}>ANAVI runs private ones.</span>
        </div>
        <div style={{ marginTop: 18, fontSize: 22, color: C.wa(0.65) }}>
          Relationship Custody Intelligence for the $13T+ private markets
        </div>
        <div style={{ marginTop: 44, display: "flex", justifyContent: "center", gap: 48, opacity: ctaEnter }}>
          {/* Trust gauge */}
          <div style={{ position: "relative", width: 140, height: 140 }}>
            <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="54" fill="none" stroke={C.wa(0.08)} strokeWidth="6" />
              <circle cx="70" cy="70" r="54" fill="none" stroke={C.emerald} strokeWidth="6"
                strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 ${8*glow}px ${C.emerald}90)` }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 34, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{ctaScore}</span>
              <span style={{ fontSize: 10, opacity: 0.55, letterSpacing: 1.6, textTransform: "uppercase" }}>Trust</span>
            </div>
          </div>
          {/* Key metrics */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "left", gap: 12 }}>
            {[
              { label: "Relationships Verified", value: "4,200+", color: C.electricLight },
              { label: "Attribution Rate", value: "94%", color: C.emerald },
              { label: "Market TAM", value: "$13T+", color: C.gold },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 38, fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene Visuals ─────────────────────────────────────────────────────────────

function ProblemStatementVisual({ localFrame, fps }: { localFrame: number; fps: number }) {
  const brokers = ["Originator", "Broker 1", "Broker 2", "Broker 3", "Broker 4", "Principal"];
  const fees = ["", "−2%", "−1.5%", "−2%", "−1.5%", "−4%"];
  const enterDelay = (i: number) => fps * (0.15 + i * 0.22);
  const lossCount = Math.round(40 * clamp(localFrame, [fps * 0.8, fps * 2.5], [0, 1], Easing.out(Easing.cubic)));
  const fraudOpacity = clamp(localFrame, [fps * 1.5, fps * 2.0], [0, 1]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
      {/* Broker chain */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {brokers.map((label, i) => {
          const itemEnter = clamp(localFrame, [enterDelay(i), enterDelay(i) + fps * 0.3], [0, 1], Easing.out(Easing.cubic));
          const isOrigin = i === 0; const isPrincipal = i === brokers.length - 1;
          const color = isOrigin ? C.electric : isPrincipal ? C.gold : C.wa(0.35);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", opacity: itemEnter, transform: `translateY(${(1-itemEnter)*16}px)` }}>
                <div style={{ width: 68, height: 44, borderRadius: 8, background: isOrigin ? C.ea(0.15) : isPrincipal ? C.goa(0.15) : C.wa(0.05), border: `1px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color, textAlign: "center", letterSpacing: 0.3 }}>{label}</span>
                </div>
                {fees[i] && <div style={{ fontSize: 10, color: "#EF4444", marginTop: 4, fontWeight: 700 }}>{fees[i]}</div>}
              </div>
              {i < brokers.length - 1 && (
                <div style={{ fontSize: 18, color: C.wa(0.2), margin: "0 2px", marginTop: -10 }}>→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", gap: 20 }}>
        {[
          { val: `$${lossCount}B+`, label: "Annual Fraud (US)", color: "#EF4444" },
          { val: "5—15", label: "Intermediaries per Deal", color: C.gold },
          { val: "$500K", label: "Due Diligence per Deal", color: C.electricLight },
          { val: "0%", label: "Originator Protection", color: C.wa(0.4) },
        ].map((stat, i) => {
          const statEnter = clamp(localFrame, [fps * (1.0 + i * 0.2), fps * (1.4 + i * 0.2)], [0, 1], Easing.out(Easing.cubic));
          return (
            <div key={stat.label} style={{ textAlign: "center", padding: "14px 16px", borderRadius: 10, background: C.wa(0.04), border: `1px solid ${C.wa(0.1)}`, opacity: statEnter, transform: `translateY(${(1-statEnter)*20}px)`, minWidth: 110 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: stat.color, fontVariantNumeric: "tabular-nums" }}>{stat.val}</div>
              <div style={{ fontSize: 10, opacity: 0.5, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 4 }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 13, color: C.wa(0.35), letterSpacing: 1.8, textTransform: "uppercase", opacity: fraudOpacity }}>
        Private Markets Run on Trust That Cannot Be Verified
      </div>
    </div>
  );
}

function TrustScoreVisual({ localFrame, fps }: { localFrame: number; fps: number }) {
  const score = 0.94;
  const revealProg = clamp(localFrame, [fps * 0.5, fps * 2.0], [0, 1], Easing.out(Easing.cubic));
  const displayScore = Math.round(score * 100 * revealProg);
  const circumference = 2 * Math.PI * 70;
  const glow = Math.sin((localFrame / fps) * 2) * 0.3 + 0.7;

  const tiers = ["BASIC", "ENHANCED", "INSTITUTIONAL"];
  const tierColors = [C.electricLight, C.gold, C.emerald];
  const checks = ["KYB Verified", "OFAC Cleared", "Accreditation Confirmed", "Peer Reviews 5★", "Transaction History"];

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
      {/* Ring gauge */}
      <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="90" cy="90" r="70" fill="none" stroke={C.wa(0.08)} strokeWidth="8" />
          <circle cx="90" cy="90" r="70" fill="none" stroke={C.emerald} strokeWidth="8"
            strokeDasharray={`${circumference * score * revealProg} ${circumference}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 ${10*glow}px ${C.emerald}80)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 46, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{displayScore}</span>
          <span style={{ fontSize: 11, opacity: 0.55, letterSpacing: 2 }}>TRUST SCORE</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tier badges */}
        <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
          {tiers.map((tier, i) => {
            const tEnter = clamp(localFrame, [fps * (0.4 + i * 0.3), fps * (0.8 + i * 0.3)], [0, 1], Easing.out(Easing.cubic));
            return (
              <div key={tier} style={{ padding: "6px 12px", borderRadius: 6, background: `${tierColors[i]}18`, border: `1px solid ${tierColors[i]}50`, opacity: tEnter }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: tierColors[i], letterSpacing: 1.5 }}>{tier}</span>
              </div>
            );
          })}
        </div>
        {/* Verification checklist */}
        {checks.map((item, i) => {
          const iEnter = clamp(localFrame, [fps * (0.5 + i * 0.22), fps * (0.9 + i * 0.22)], [0, 1], Easing.out(Easing.cubic));
          return (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, opacity: iEnter, transform: `translateX(${(1-iEnter)*-20}px)` }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: C.emerald, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>✓</div>
              <span style={{ fontSize: 16, fontWeight: 500, color: C.wa(0.85) }}>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlindMatchingVisual({ localFrame, fps }: { localFrame: number; fps: number }) {
  const lp = clamp(localFrame, [0, fps * 1.6], [0, 1], Easing.inOut(Easing.cubic));
  const rp = clamp(localFrame, [fps * 0.3, fps * 1.9], [0, 1], Easing.inOut(Easing.cubic));
  const matchReveal = clamp(localFrame, [fps * 1.9, fps * 2.5], [0, 1], Easing.out(Easing.cubic));
  const glowPulse = Math.sin((localFrame / fps) * 3) * 0.25 + 0.75;
  const lx = -155 + lp * 75; const rx = 155 - rp * 75;
  const matchCount = Math.round(143 * clamp(localFrame, [fps * 0.5, fps * 2.2], [0, 1], Easing.out(Easing.cubic)));

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 24, borderRadius: 26, border: `1px solid ${C.ga(0.25)}`, overflow: "hidden" }}>
        <CipherOverlay localFrame={localFrame} fps={fps} tint={C.purpleLight} />
      </div>
      <svg width={560} height={400} viewBox="-280 -200 560 400">
        {matchReveal > 0 && <ellipse cx={0} cy={0} rx={108 + matchReveal*24} ry={88 + matchReveal*14} fill={C.gold} fillOpacity={matchReveal * glowPulse * 0.1} />}
        <circle cx={lx} cy={0} r={86} fill={C.ea(0.18)} stroke={C.electric} strokeWidth={2} />
        <text x={lx} textAnchor="middle" dy="-11" fill={C.white} fontSize={11} fontWeight={700}>INVESTOR</text>
        <text x={lx} textAnchor="middle" dy="8" fill={C.electricLight} fontSize={9}>Anonymous</text>
        <text x={lx} textAnchor="middle" dy="24" fill={C.wa(0.35)} fontSize={8} letterSpacing={1.2}>IDENTITY SEALED</text>
        <circle cx={rx} cy={0} r={86} fill={`${C.purple}30`} stroke={C.purple} strokeWidth={2} />
        <text x={rx} textAnchor="middle" dy="-11" fill={C.white} fontSize={11} fontWeight={700}>OPPORTUNITY</text>
        <text x={rx} textAnchor="middle" dy="8" fill={C.purpleLight} fontSize={9}>Anonymous</text>
        <text x={rx} textAnchor="middle" dy="24" fill={C.wa(0.35)} fontSize={8} letterSpacing={1.2}>IDENTITY SEALED</text>
        {lp < 0.9 && <>
          <text x={lx+100} textAnchor="middle" dy="5" fill={C.wa(0.22)} fontSize={24}>→</text>
          <text x={rx-100} textAnchor="middle" dy="5" fill={C.wa(0.22)} fontSize={24}>←</text>
        </>}
        {matchReveal > 0.2 && (
          <g opacity={matchReveal}>
            <text textAnchor="middle" dy="-8" fill={C.gold} fontSize={18} fontWeight={800} letterSpacing={1.2}>MATCH FOUND</text>
            <text textAnchor="middle" dy="12" fill={C.wa(0.6)} fontSize={10}>Awaiting Mutual Consent → NDA-Gated Deal Room</text>
          </g>
        )}
      </svg>
      <div style={{ position: "absolute", bottom: 22, right: 16, textAlign: "right" }}>
        <div style={{ fontSize: 52, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.purpleLight, lineHeight: 1 }}>{matchCount}</div>
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase", marginTop: 5 }}>Active Blind Matches</div>
      </div>
    </div>
  );
}

function DealRoomVisual({ localFrame, fps }: { localFrame: number; fps: number }) {
  const ITEMS = [
    { label: "AML/KYC Automated", delay: 0.15 },
    { label: "Sanctions Screening", delay: 0.52 },
    { label: "NDA Signed (DocuSign)", delay: 0.88 },
    { label: "Shared Diligence Repo", delay: 1.24 },
    { label: "Escrow Activated", delay: 1.60 },
  ];
  const progressValue = clamp(localFrame, [fps * 0.4, fps * 2.8], [0, 82], Easing.out(Easing.cubic));
  const dealCount = Math.round(47 * clamp(localFrame, [fps * 0.5, fps * 2.0], [0, 1], Easing.out(Easing.cubic)));
  const tilt = interpolate(localFrame, [0, fps * 0.8, fps * 1.8, fps * 2.6], [16, 8, 5, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = Math.sin((localFrame / fps) * 2.1) * 14;
  const zoom = clamp(localFrame, [0, fps * 1.4], [0.92, 1], Easing.out(Easing.cubic));

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {ITEMS.map((item) => {
          const ie = clamp(localFrame, [fps * item.delay, fps * (item.delay + 0.3)], [0, 1], Easing.out(Easing.cubic));
          const checked = localFrame > fps * item.delay;
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 13, opacity: ie, transform: `translateX(${(1-ie)*-26}px)` }}>
              <div style={{ width: 25, height: 25, borderRadius: 5, background: checked ? C.emerald : C.wa(0.05), border: `2px solid ${checked ? C.emerald : C.wa(0.18)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {checked ? "✓" : ""}
              </div>
              <span style={{ fontSize: 17, fontWeight: checked ? 600 : 400, color: checked ? C.white : C.wa(0.4) }}>{item.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 200 }}>
        <div style={{ padding: "20px 22px", borderRadius: 16, background: C.ea(0.08), border: `1px solid ${C.ea(0.28)}`, transform: `perspective(860px) rotateX(${tilt}deg) scale(${zoom}) translateY(${-10 + lift * 0.22}px)`, boxShadow: "0 14px 28px rgba(0,0,0,0.4), 0 0 60px rgba(14,165,233,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -60, right: -60, top: -30 + (localFrame * 3.8) % 110, height: 32, background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.22), transparent)", transform: "rotate(-7deg)" }} />
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 8 }}>Active Deal</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.electric }}>$12.5M</div>
          <div style={{ fontSize: 14, opacity: 0.6, marginTop: 3 }}>Series B Round</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, opacity: 0.45 }}>Completion</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.electric }}>{Math.round(progressValue)}%</span>
            </div>
            <div style={{ width: "100%", height: 5, borderRadius: 3, background: C.wa(0.1) }}>
              <div style={{ width: `${progressValue}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${C.electric}, ${C.electricLight})` }} />
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: C.emerald }}>$500K Diligence Saved</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 46, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.electric }}>{dealCount}</div>
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Active Deal Rooms</div>
        </div>
      </div>
    </div>
  );
}

function AttributionVisual({ localFrame, fps }: { localFrame: number; fps: number }) {
  const CHAIN = [
    { label: "Originator", sub: "RFC 3161 Timestamp", color: C.gold },
    { label: "Introduction", sub: "Cryptographically Signed", color: C.electricLight },
    { label: "Deal Closed", sub: "$47.2M Transaction", color: C.emerald },
    { label: "Attribution", sub: "Auto-Paid Forever", color: C.gold },
  ];
  const pct = clamp(localFrame, [fps * 0.8, fps * 2.8], [0, 60], Easing.out(Easing.cubic));
  const earnings = clamp(localFrame, [fps * 1.2, fps * 3.0], [0, 47200], Easing.out(Easing.cubic));
  const footerEnter = clamp(localFrame, [fps * 2.2, fps * 2.8], [0, 1], Easing.out(Easing.cubic));
  const floatY = Math.sin((localFrame / fps) * 1.1) * 5;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, transform: `translateY(${floatY}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {CHAIN.map((item, i) => {
          const ie = clamp(localFrame, [fps * (0.1 + i * 0.28), fps * (0.5 + i * 0.28)], [0, 1], Easing.out(Easing.cubic));
          const ae = i < CHAIN.length - 1 ? clamp(localFrame, [fps * (0.38 + i * 0.28), fps * (0.62 + i * 0.28)], [0, 1]) : 0;
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ padding: "13px 16px", borderRadius: 11, background: `${item.color}16`, border: `1.5px solid ${item.color}55`, textAlign: "center", minWidth: 100, opacity: ie, transform: `scale(${0.8 + ie*0.2}) translateY(${(1-ie)*18}px)` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, letterSpacing: 0.4 }}>{item.label}</div>
                <div style={{ fontSize: 9, opacity: 0.55, marginTop: 3 }}>{item.sub}</div>
              </div>
              {i < CHAIN.length - 1 && <div style={{ fontSize: 20, color: C.wa(0.3 * ae), margin: "0 2px" }}>→</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 52 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 62, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.gold, lineHeight: 1 }}>{Math.round(pct)}%</div>
          <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>Originator Share</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.goldLight, lineHeight: 1 }}>
            ${Math.round(earnings).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>Originator Earnings</div>
        </div>
      </div>
      <div style={{ opacity: footerEnter, fontSize: 13, color: C.wa(0.38), letterSpacing: 2.2, textTransform: "uppercase" }}>
        Lifetime · Compounding · Circumvention-Detected · Automated
      </div>
    </div>
  );
}

function MarketOpportunityVisual({ localFrame, fps }: { localFrame: number; fps: number }) {
  const markets = [
    { name: "Private Markets AUM", val2024: 13, val2030: 25, color: C.electric },
    { name: "Family Office AUM", val2024: 3.1, val2030: 5.4, color: C.gold },
    { name: "Commodities Market", val2024: 142, val2030: 163, color: C.emerald },
    { name: "Oil & Gas", val2024: 7.4, val2030: 10.4, color: C.electricLight },
  ];
  const barEnter = clamp(localFrame, [fps * 0.4, fps * 2.2], [0, 1], Easing.out(Easing.cubic));
  const taglineEnter = clamp(localFrame, [fps * 1.6, fps * 2.2], [0, 1], Easing.out(Easing.cubic));
  const maxVal = 163;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {markets.map((m, i) => {
          const rowEnter = clamp(localFrame, [fps * (0.2 + i * 0.2), fps * (0.6 + i * 0.2)], [0, 1], Easing.out(Easing.cubic));
          const bar24W = (m.val2024 / maxVal) * 100 * barEnter;
          const bar30W = (m.val2030 / maxVal) * 100 * barEnter;
          return (
            <div key={m.name} style={{ marginBottom: 16, opacity: rowEnter, transform: `translateX(${(1-rowEnter)*-30}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: C.wa(0.7) }}>{m.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>${m.val2024}T → ${m.val2030}T</span>
              </div>
              <div style={{ width: "100%", height: 10, borderRadius: 5, background: C.wa(0.07), position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${bar30W}%`, borderRadius: 5, background: `${m.color}25` }} />
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${bar24W}%`, borderRadius: 5, background: m.color }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
        {[{ label: "2024", color: C.electric }, { label: "2030", color: C.ea(0.3) }].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 10, color: C.wa(0.55), letterSpacing: 1.2 }}>{l.label} PROJECTION</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, textAlign: "center", opacity: taglineEnter }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, letterSpacing: 0.5 }}>
          "If Bloomberg runs public markets,
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.goldLight }}>
          ANAVI will run private ones."
        </div>
      </div>
    </div>
  );
}

// ─── Scene dispatch ────────────────────────────────────────────────────────────
const SCENE_META: Record<string, { color: string; label: string }> = {
  "problem-statement": { color: "#EF4444", label: "Market Problem" },
  "relationship-custody": { color: C.electric, label: "Relationship Custody" },
  "trust-score": { color: C.emerald, label: "Trust Score" },
  "blind-matching": { color: C.purple, label: "Blind Matching" },
  "deal-room": { color: C.electric, label: "Deal Room" },
  attribution: { color: C.gold, label: "Lifetime Attribution" },
  "market-opportunity": { color: C.gold, label: "Market Opportunity" },
};

function SceneVisual({ sceneId, localFrame, fps }: { sceneId: string; localFrame: number; fps: number }) {
  if (sceneId === "problem-statement") return <ProblemStatementVisual localFrame={localFrame} fps={fps} />;
  if (sceneId === "relationship-custody") return <GlobeNetwork localFrame={localFrame} fps={fps} />;
  if (sceneId === "trust-score") return <TrustScoreVisual localFrame={localFrame} fps={fps} />;
  if (sceneId === "blind-matching") return <BlindMatchingVisual localFrame={localFrame} fps={fps} />;
  if (sceneId === "deal-room") return <DealRoomVisual localFrame={localFrame} fps={fps} />;
  if (sceneId === "attribution") return <AttributionVisual localFrame={localFrame} fps={fps} />;
  if (sceneId === "market-opportunity") return <MarketOpportunityVisual localFrame={localFrame} fps={fps} />;
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 80, opacity: 0.06 }}>◆</div>;
}

// ─── Main Composition ──────────────────────────────────────────────────────────
export function AnaviInvestorComposition(props: StudioVideoProps) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const scenes = props.plan.scenes.length > 0 ? props.plan.scenes : [{ id: "intro", description: "ANAVI overview" }];
  const introFrames = Math.min(fps * 3, Math.floor(durationInFrames * 0.12));
  const outroFrames = Math.min(fps * 5, Math.floor(durationInFrames * 0.16));
  const bodyFrames = durationInFrames - introFrames - outroFrames;
  const sceneLength = Math.max(1, Math.floor(bodyFrames / scenes.length));

  const isIntro = frame < introFrames;
  const isOutro = frame >= durationInFrames - outroFrames;
  const bodyFrame = frame - introFrames;
  const activeSceneIndex = isIntro || isOutro ? 0 : Math.min(scenes.length - 1, Math.max(0, Math.floor(bodyFrame / sceneLength)));
  const activeScene = scenes[activeSceneIndex]!;
  const localFrame = bodyFrame - activeSceneIndex * sceneLength;
  const accent = SCENE_META[activeScene.id] ?? { color: C.electric, label: activeScene.id };

  const introFadeOut = clamp(frame, [introFrames - fps * 0.5, introFrames], [1, 0]);
  const outroFadeIn = clamp(frame, [durationInFrames - outroFrames, durationInFrames - outroFrames + fps * 0.5], [0, 1]);
  const sceneEnter = Math.min(1, spring({ frame: Math.max(0, localFrame), fps, config: { damping: 16, stiffness: 88 } }));
  const sceneExit = clamp(localFrame, [sceneLength - 18, sceneLength], [1, 0]);
  const progressPct = isIntro ? 0 : isOutro ? 100 : (bodyFrame / bodyFrames) * 100;

  // continuous global float
  const floatY = Math.sin((frame / fps) * 0.72) * 5;
  const floatX = Math.cos((frame / fps) * 0.38) * 2.5;

  // HUD only during body + outro, not intro
  const hudVisible = frame >= introFrames - fps * 0.5;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.bg} 0%, ${C.navy} 50%, #0C1830 100%)`,
        color: C.white,
        fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif",
      }}
    >
      <GlitchWrapper frame={frame} fps={fps}>
        {/* Persistent background layers */}
        <MatrixRain frame={frame} fps={fps} />
        <RotatingTechRings frame={frame} fps={fps} />
        <FloatingParticles frame={frame} fps={fps} />
        <VerticalScannerLine frame={frame} fps={fps} />
        <CornerBrackets frame={frame} fps={fps} />

        {/* HUD panel — slides in once intro is done */}
        {hudVisible && <HUDPanel frame={frame - (introFrames - fps * 0.5)} fps={fps} />}

        {/* ── INTRO ── */}
        {isIntro && (
          <AbsoluteFill style={{ opacity: introFadeOut }}>
            <IntroSequence frame={frame} fps={fps} title={props.title} subtitle={props.subtitle} />
          </AbsoluteFill>
        )}

        {/* ── OUTRO ── */}
        {isOutro && (
          <AbsoluteFill style={{ opacity: outroFadeIn }}>
            <OutroSequence frame={frame - (durationInFrames - outroFrames)} fps={fps} trustScore={props.trustScore} />
          </AbsoluteFill>
        )}

        {/* ── BODY SCENES ── */}
        {!isIntro && !isOutro && (
          <AbsoluteFill
            style={{
              paddingLeft: 374,   // clear HUD panel
              paddingRight: 64,
              paddingTop: 66,
              paddingBottom: 52,
              display: "flex",
              flexDirection: "column",
              transform: `translate(${floatX}px, ${floatY}px)`,
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, marginBottom: 28 }}>
              <AnaviLogo width={160} />
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 18px",
                  borderRadius: 100,
                  background: `${accent.color}1e`,
                  border: `1px solid ${accent.color}45`,
                  opacity: Math.sin((localFrame / fps) * 2.8) * 0.12 + 0.88,
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: accent.color }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: accent.color, letterSpacing: 0.4 }}>{accent.label}</span>
              </div>
            </div>

            {/* Two-column content */}
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: 48,
                alignItems: "center",
                opacity: sceneEnter * sceneExit,
              }}
            >
              {/* Left: text */}
              <div
                style={{
                  width: "36%",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  transform: `translateX(${(1 - sceneEnter) * -55}px)`,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: accent.color, letterSpacing: 2.6, textTransform: "uppercase", marginBottom: 14 }}>
                  {String(activeSceneIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.12 }}>
                  {accent.label}
                </div>
                <div style={{ marginTop: 18, fontSize: 17, color: C.wa(0.68), lineHeight: 1.6, fontWeight: 400 }}>
                  {activeScene.description}
                </div>
                <div style={{ marginTop: 22, width: 64, height: 3, borderRadius: 2, background: accent.color }} />
              </div>

              {/* Right: visual */}
              <div style={{ flex: 1, position: "relative", height: "100%", transform: `translateX(${(1 - sceneEnter) * 55}px)` }}>
                <SceneVisual sceneId={activeScene.id} localFrame={localFrame} fps={fps} />
              </div>
            </div>

            {/* Footer progress */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, marginTop: 16 }}>
              <span style={{ fontSize: 11, opacity: 0.38, letterSpacing: 1.4 }}>
                ANAVI — Relationship Custody Intelligence — $13T+ Private Markets
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 180, height: 2, borderRadius: 2, background: C.wa(0.1) }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${C.electric}, ${C.electricLight})` }} />
                </div>
                <span style={{ fontSize: 11, opacity: 0.38, fontVariantNumeric: "tabular-nums" }}>{Math.round(progressPct)}%</span>
              </div>
            </div>
          </AbsoluteFill>
        )}
      </GlitchWrapper>
    </AbsoluteFill>
  );
}
