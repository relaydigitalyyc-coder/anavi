import {
  SmoothReveal,
  Spotlight,
  SmoothCounter,
  RevealOnScroll,
} from "@/components/AwwwardsAnimations";
import {
  LiquidGradient,
} from "@/components/PremiumAnimations";

export function StatsSocialSection() {
  return (
    <>
      {/* Stats Section */}
      <section className="py-20 md:py-28 bg-canvas-deep relative">
        <LiquidGradient className="opacity-30" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 847, suffix: "+", label: "Relationships Tracked" },
              { value: 156, suffix: "M", prefix: "$", label: "Deal Flow" },
              { value: 94, suffix: "%", label: "Match Accuracy" },
              { value: 12, suffix: "", label: "Active Deals" },
            ].map((stat, i) => (
              <SmoothReveal key={i} delay={i * 0.1}>
                <Spotlight className="text-center p-6 border border-transparent hover:border-border/50 transition-colors">
                  <div className="text-4xl md:text-6xl font-display font-serif text-white mb-3">
                    {stat.prefix}
                    <SmoothCounter value={stat.value} duration={2.5} />
                    {stat.suffix}
                  </div>
                  <p className="text-xs md:text-sm text-white/50 uppercase tracking-widest">{stat.label}</p>
                </Spotlight>
              </SmoothReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 md:py-24 border-t border-hairline bg-canvas-deep">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <RevealOnScroll>
            <p className="text-center text-sm uppercase tracking-[0.2em] text-white/40 mb-10">
              Trusted by Leading Institutions
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {["Institution I", "Institution II", "Institution III", "Institution IV", "Institution V", "Institution VI"].map((name) => (
                <div
                  key={name}
                  className="w-32 h-12 rounded-lg flex items-center justify-center text-xs font-semibold tracking-wider text-white/20 border border-white/10"
                  style={{ background: "linear-gradient(135deg, transparent, oklch(0.95 0.01 240 / 0.3))" }}
                >
                  {name}
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}