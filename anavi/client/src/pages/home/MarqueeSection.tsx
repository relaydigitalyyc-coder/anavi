import { Marquee } from "@/components/AwwwardsAnimations";

export function MarqueeSection() {
  return (
    <section className="py-8 md:py-10 border-y border-hairline bg-canvas-surface overflow-hidden">
      <Marquee speed={30} className="text-white/50">
        <span className="flex items-center gap-12 px-6">
          {["Family Offices", "Venture Capital", "Private Equity", "Real Estate", "Commodities", "Deal Flow", "LP Management", "SPV Generation"].map((item, i) => (
            <span key={i} className="flex items-center gap-3 text-sm uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-accent" />
              {item}
            </span>
          ))}
        </span>
      </Marquee>
    </section>
  );
}