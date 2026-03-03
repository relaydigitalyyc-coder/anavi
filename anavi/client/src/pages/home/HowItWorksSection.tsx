import { motion } from "framer-motion";
import { SmoothReveal } from "@/components/AwwwardsAnimations";
import { MorphingBlob } from "@/components/PremiumAnimations";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-canvas-deep relative overflow-hidden">
      <MorphingBlob className="w-[500px] h-[500px] top-[20%] -right-[150px]" color="oklch(0.72 0.14 70 / 0.08)" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <SmoothReveal>
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6">Process</p>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif">How It Works</h2>
          </div>
        </SmoothReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
          {[
            { step: "01", title: "Connect", desc: "Sync your Fireflies, calendar, and CRM to import your network automatically." },
            { step: "02", title: "Analyze", desc: "AI extracts deals, relationships, and action items from your conversations." },
            { step: "03", title: "Match", desc: "Get matched with opportunities based on your network and expertise." },
            { step: "04", title: "Close", desc: "Execute deals with compliant SPVs, capital management, and audit trails." },
          ].map((item, i) => (
            <SmoothReveal key={i} delay={i * 0.15}>
              <motion.div
                className="text-center md:text-left relative group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="font-display text-7xl md:text-9xl font-serif text-white/10 mb-4 md:mb-6 group-hover:text-white/20 transition-colors duration-500"
                  style={{ WebkitTextStroke: "1px oklch(1 0 0 / 0.15)" }}
                >
                  {item.step}
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-medium mb-3 md:mb-4">{item.title}</h3>
                <p className="text-sm md:text-base text-white/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            </SmoothReveal>
          ))}
        </div>
      </div>
    </section>
  );
}