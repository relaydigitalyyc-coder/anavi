import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type BeatKey = "custody" | "match" | "dealRoom" | "economics";

const BEAT_LABELS: Record<BeatKey, string> = {
  custody: "Custody",
  match: "Match",
  dealRoom: "Deal Room",
  economics: "Economics",
};

export function StoryBeats({ active }: { active: BeatKey }) {
  const beats: BeatKey[] = ["custody", "match", "dealRoom", "economics"];
  const activeIndex = beats.indexOf(active);
  const progressPercent = ((activeIndex + 1) / beats.length) * 100;

  return (
    <div className="card-elevated p-3 sm:p-4 mb-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#1E3A5F]/50">Execution Rail</p>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#059669]">
          Live
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#1E3A5F]/10">
        <motion.div
          className="h-full rounded-full bg-[#059669]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {beats.map((beat, idx) => {
          const done = idx <= activeIndex;
          const current = idx === activeIndex;
          return (
            <div
              key={beat}
              className={`rounded-lg border px-3 py-2 text-center ${
                current
                  ? "border-[#C4972A]/40 bg-[#C4972A]/10"
                  : done
                    ? "border-[#059669]/25 bg-[#059669]/10"
                    : "border-[#1E3A5F]/15 bg-[#1E3A5F]/5"
              }`}
            >
              <p className={`text-[10px] uppercase tracking-widest font-semibold ${
                current ? "text-[#C4972A]" : done ? "text-[#059669]" : "text-[#1E3A5F]/40"
              }`}>
                {done ? "Active" : "Queued"}
              </p>
              <p className="text-xs font-semibold text-[#0A1628] mt-0.5">{BEAT_LABELS[beat]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KpiRibbon({ items }: { items: Array<{ label: string; value: string; tone?: "gold" | "blue" | "green" }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
      {items.map((item) => {
        const toneClass =
          item.tone === "green"
            ? "border-[#059669]/25 bg-[#059669]/10"
            : item.tone === "blue"
              ? "border-[#2563EB]/25 bg-[#2563EB]/10"
              : "border-[#C4972A]/25 bg-[#C4972A]/10";

        return (
          <motion.div
            key={item.label}
            className={`rounded-lg border px-3 sm:px-4 py-2.5 sm:py-3 ${toneClass}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/55">{item.label}</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`${item.label}-${item.value}`}
                className="text-base sm:text-lg font-semibold text-[#0A1628] mt-1 leading-tight"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {item.value}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function useLivePulse(intervalMs = 5000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return tick;
}

export function LiveProofStrip({
  items,
}: {
  items: Array<{ label: string; value: string; delta?: string }>;
}) {
  const tick = useLivePulse(6000);
  const asOf = useMemo(() => `${tick * 6}s`, [tick]);

  return (
    <div className="mb-4 rounded-xl border border-[#1E3A5F]/15 bg-[#0A1628] px-3 sm:px-4 py-3 text-white">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/55">Live Proof</p>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/50">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22D4F5] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22D4F5]" />
          </span>
          Stream · {asOf}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <motion.div
            key={`${item.label}-${tick}`}
            className="rounded-lg bg-white/5 px-3 py-2"
            initial={{ opacity: 0.78 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[10px] uppercase tracking-widest text-white/45">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-white mt-1 leading-tight">{item.value}</p>
            {item.delta && (
              <p className="text-[10px] uppercase tracking-wider text-[#22D4F5] mt-1">
                {item.delta}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function StatusPulse({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "amber" | "green";
}) {
  const classes =
    tone === "green"
      ? "bg-[#059669]/15 text-[#059669]"
      : tone === "amber"
        ? "bg-[#F59E0B]/15 text-[#F59E0B]"
        : "bg-[#2563EB]/15 text-[#2563EB]";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {label}
    </span>
  );
}

export function ActionCards({
  items,
  primaryIndex = 0,
  onAction,
}: {
  items: Array<{ title: string; body: string; cta: string }>;
  primaryIndex?: number;
  onAction?: (item: { title: string; body: string; cta: string }, index: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-4">
      {items.map((item, index) => (
        <div
          key={item.title}
          className={`card-elevated p-4 border-l-4 ${
            index === primaryIndex ? "border-l-[#2563EB]" : "border-l-[#C4972A]"
          }`}
        >
          <p className="text-sm font-semibold text-[#0A1628]">{item.title}</p>
          <p className="text-xs text-[#1E3A5F]/60 mt-1">{item.body}</p>
          <button
            className={`mt-3 rounded px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors ${
              index === primaryIndex
                ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                : "bg-[#1E3A5F]/8 text-[#1E3A5F] hover:bg-[#1E3A5F]/15"
            }`}
            onClick={() => onAction?.(item, index)}
          >
            {item.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
