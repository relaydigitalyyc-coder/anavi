import {
  SmoothReveal,
  Spotlight,
  SmoothCounter,
  RevealOnScroll,
} from "@/components/AwwwardsAnimations";
import { LiquidGradient } from "@/components/PremiumAnimations";

export function StatsSocialSection() {
  return (
    <>
      {/* Platform Stats */}
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
                  <div className="text-4xl md:text-6xl font-serif italic text-white mb-3">
                    {stat.prefix}
                    <SmoothCounter value={stat.value} duration={2.5} />
                    {stat.suffix}
                  </div>
                  <p className="text-xs md:text-sm text-white/50 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </Spotlight>
              </SmoothReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Cost Section — market research backed */}
      <section className="py-20 md:py-28 border-t border-hairline bg-canvas-mid relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <SmoothReveal>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-[#C4972A] mb-4">
                The Compliance Problem
              </p>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif italic text-white leading-tight">
                $34 billion lost annually
              </h2>
              <p className="mt-4 text-base md:text-lg text-white/50 max-w-2xl mx-auto">
                to inefficient KYC/KYB processes — duplicated checks, manual
                reviews, and friction that kills deals before they close.
              </p>
            </div>
          </SmoothReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                metric: "$500K",
                label: "Duplicated per deal",
                detail:
                  "Every investor runs the same KYC, OFAC screen, and accreditation check — independently, expensively, without coordination.",
                source: "ANAVI White Paper",
              },
              {
                metric: "85%",
                label: "Say compliance is more complex",
                detail:
                  "Teams report processes have become significantly more complex over the past three years, driving costs higher.",
                source: "PwC / ComplyCube",
              },
              {
                metric: "30–60%",
                label: "Of paid capacity wasted",
                detail:
                  "Subscription-based compliance tools waste a third to half of capacity when onboarding volume fluctuates.",
                source: "FigsFlow 2026",
              },
            ].map((item, i) => (
              <SmoothReveal key={i} delay={i * 0.12}>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 md:p-8 h-full">
                  <p className="font-serif italic text-3xl md:text-4xl text-[#C4972A] mb-2">
                    {item.metric}
                  </p>
                  <p className="text-sm font-semibold text-white mb-3">
                    {item.label}
                  </p>
                  <p className="text-sm text-white/45 leading-relaxed">
                    {item.detail}
                  </p>
                  <p className="mt-3 text-[9px] uppercase tracking-widest text-white/25">
                    {item.source}
                  </p>
                </div>
              </SmoothReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-24 border-t border-hairline bg-canvas-deep">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <RevealOnScroll>
            <p className="text-center text-sm uppercase tracking-[0.2em] text-white/40 mb-10">
              Built for businesses where compliance matters
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {[
                "Family Offices",
                "Private Equity",
                "Real Estate",
                "Infrastructure",
                "Venture Capital",
                "Sovereign Funds",
              ].map(name => (
                <div
                  key={name}
                  className="px-5 h-12 rounded-lg flex items-center justify-center text-xs font-semibold tracking-wider text-white/30 border border-white/8 bg-white/[0.02] hover:border-[#C4972A]/20 hover:text-white/50 transition-all duration-300"
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
