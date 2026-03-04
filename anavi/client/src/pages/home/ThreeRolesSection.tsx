import { motion } from "framer-motion";
import { PERSONAS } from "@/lib/copy";
import {
  SmoothReveal,
  SplitText,
} from "@/components/AwwwardsAnimations";
import {
  LiquidGradient,
} from "@/components/PremiumAnimations";

export function ThreeRolesSection() {
  return (
    <section className="py-24 md:py-32 bg-canvas-mid relative overflow-hidden">
      <LiquidGradient className="opacity-20" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <SmoothReveal>
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">Who It's For</p>
            <h2 className="text-5xl md:text-7xl font-serif">
              <SplitText>Three Roles. One Operating System.</SplitText>
            </h2>
          </div>
        </SmoothReveal>
        <div className="space-y-16 md:space-y-24">
          {(Object.entries(PERSONAS) as [keyof typeof PERSONAS, typeof PERSONAS[keyof typeof PERSONAS]][]).map(([key, p], i) => (
            <SmoothReveal key={key} delay={i * 0.1}>
              <motion.div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}
              >
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-3">{p.role}</p>
                  <h3 className="text-4xl md:text-5xl font-serif text-white mb-6">{p.label}</h3>
                  <p className="text-lg text-white/40 italic mb-6">"{p.problem}"</p>
                  <div className="h-px bg-gradient-to-r from-sky-500/50 to-transparent mb-6" />
                  <p className="text-base text-white/70 leading-relaxed">{p.answer}</p>
                </div>
                <div className={`glass-dark rounded-xl p-8 border border-white/10 ${i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-[#22D4F5] animate-pulse" />
                    <span className="text-xs uppercase tracking-widest text-white/40">
                      {key === 'originator' ? 'Custody Register' : key === 'investor' ? 'Blind Match' : 'Deal Room'}
                    </span>
                  </div>
                  {key === 'originator' && (
                    <div className="space-y-3">
                      {[
                        { name: "Ahmad Al-Rashid", tag: "Gulf Sovereign Wealth", score: 91, age: "14 months" },
                        { name: "Sarah Chen", tag: "Pacific Family Office", score: 88, age: "8 months" },
                        { name: "Meridian Group", tag: "Private Equity", score: 76, age: "3 months" },
                      ].map((r) => (
                        <div key={r.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-sm font-medium text-white">{r.name}</p>
                            <p className="text-xs text-white/40">{r.tag} · Custodied {r.age}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-[#22D4F5]">Trust {r.score}</div>
                            <div className="text-xs text-[#C4972A]">Attribution Active</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {key === 'investor' && (
                    <div className="space-y-3">
                      {[
                        { tag: "Solar Infrastructure", size: "$47M", score: 94 },
                        { tag: "Gulf Coast Commodity", size: "$12M", score: 88 },
                        { tag: "PropTech Series B", size: "$8M", score: 82 },
                      ].map((m, mi) => (
                        <div key={mi} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wider text-[#22D4F5]">Match #{mi + 1}</span>
                            <span className="text-xs font-mono text-white/40">Identity Sealed</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">{m.tag} · {m.size}</span>
                            <span className="text-xs bg-[#22D4F5]/10 text-[#22D4F5] px-2 py-0.5 rounded">Score {m.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {key === 'principal' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Riyadh Solar JV</span>
                        <span className="text-xs bg-[#059669]/10 text-[#059669] px-2 py-0.5 rounded">NDA Active</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>Raise Progress</span>
                          <span>$12M / $30M</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: "40%" }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                            viewport={{ once: true }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-white/40">3 qualified investors matched · Identity sealed</div>
                      <div className="text-xs text-[#22D4F5]">Audit trail: 47 events · OFAC clean · KYB verified</div>
                    </div>
                  )}
                </div>
              </motion.div>
            </SmoothReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
