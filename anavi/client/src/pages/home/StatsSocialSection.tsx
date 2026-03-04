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
              { value: 2100, suffix: "+", label: "GP-LP Relationships" },
              {
                value: 2.1,
                suffix: "B",
                prefix: "$",
                label: "Capital Tracked",
                decimals: 1,
              },
              { value: 94, suffix: "%", label: "Match Accuracy" },
              { value: 340, suffix: "", label: "Active Deal Rooms" },
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

      {/* Fund Intelligence — Real-Time Capital Markets Data (FR-3) */}
      <section className="py-20 md:py-28 bg-canvas-void relative overflow-hidden">
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <SmoothReveal>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-4">
                Fund Intelligence
              </p>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif italic text-white leading-tight">
                Real-Time Capital Markets Data
              </h2>
            </div>
          </SmoothReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                value: 2.1,
                decimals: 1,
                prefix: "$",
                suffix: "B",
                label: "Total Deal Flow",
                source: "ANAVI Platform",
                accent: "border-l-emerald-500",
                textColor: "text-emerald-400",
              },
              {
                value: 2847,
                decimals: 0,
                prefix: "",
                suffix: "",
                label: "Matches Completed",
                source: "Q1 2026",
                accent: "border-l-blue-400",
                textColor: "text-blue-400",
              },
              {
                value: 18,
                decimals: 0,
                prefix: "",
                suffix: " days",
                label: "Avg Time-to-Close",
                source: "Q1 2026",
                accent: "border-l-amber-400",
                textColor: "text-amber-400",
              },
              {
                value: 12400,
                decimals: 0,
                prefix: "",
                suffix: "+",
                label: "Compliance Checks Automated",
                source: "ANAVI Platform",
                accent: "border-l-cyan-400",
                textColor: "text-cyan-400",
              },
            ].map((item, i) => (
              <SmoothReveal key={i} delay={i * 0.1}>
                <div
                  className={`glass-dark rounded-xl p-6 md:p-8 border border-white/8 border-l-2 ${item.accent}`}
                >
                  <p
                    className={`text-3xl md:text-4xl lg:text-5xl font-serif italic mb-2 ${item.textColor}`}
                  >
                    <SmoothCounter
                      value={item.value}
                      duration={2.5}
                      decimals={item.decimals}
                      prefix={item.prefix}
                      suffix={item.suffix}
                    />
                  </p>
                  <p className="text-sm font-semibold text-white/90 mb-2">
                    {item.label}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/25">
                    {item.source}
                  </p>
                </div>
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
                "Growth Equity",
                "Venture Capital",
                "Fund of Funds",
                "Family Offices",
                "Sovereign Wealth",
                "Private Credit",
                "Real Estate PE",
                "Infrastructure",
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
