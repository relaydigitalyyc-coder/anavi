import { motion } from "framer-motion";
import { PROBLEMS } from "@/lib/copy";
import { SmoothReveal, SplitText } from "@/components/AwwwardsAnimations";

export function ProblemSection() {
  return (
    <section className="py-24 md:py-32 bg-canvas-deep relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SmoothReveal>
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">The Problem</p>
            <h2 className="text-5xl md:text-7xl font-serif">
              <SplitText>Private Markets Are Broken</SplitText>
            </h2>
          </div>
        </SmoothReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[PROBLEMS.brokerChain, PROBLEMS.fraud, PROBLEMS.dueDiligence].map((p, i) => (
            <SmoothReveal key={i} delay={i * 0.15}>
              <motion.div
                className="glass-dark p-8 md:p-10 relative overflow-hidden group"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div
                  className="text-6xl md:text-7xl font-serif text-white/10 mb-4 group-hover:text-white/20 transition-colors duration-500"
                  style={{ WebkitTextStroke: "1px oklch(0.65 0.19 230 / 0.3)" }}
                >
                  {p.stat}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{p.headline}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{p.body}</p>
              </motion.div>
            </SmoothReveal>
          ))}
        </div>
      </div>
    </section>
  );
}