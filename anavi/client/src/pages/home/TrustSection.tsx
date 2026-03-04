import { motion } from "framer-motion";
import { Eye, Lock, Shield, CheckCircle2 } from "lucide-react";
import { SmoothReveal } from "@/components/AwwwardsAnimations";
import { LiquidGradient, GradientText } from "@/components/PremiumAnimations";
import { EvervaultCard } from "@/components/ui/evervault-card";

export function TrustSection() {
  return (
    <section id="trust" className="py-24 md:py-32 bg-canvas-mid relative">
      <LiquidGradient className="opacity-20" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <SmoothReveal>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6">
                Trust & Security
              </p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif mb-8 md:mb-12 leading-[0.95]">
                Your Relationships,
                <br />
                <GradientText>Your Control</GradientText>
              </h2>
              <div className="space-y-5 md:space-y-6">
                {[
                  {
                    icon: Eye,
                    text: "Anonymous matching until both parties consent",
                  },
                  {
                    icon: Lock,
                    text: "End-to-end encryption for all sensitive data",
                  },
                  {
                    icon: Shield,
                    text: "SOC 2 Type II compliant infrastructure",
                  },
                  {
                    icon: CheckCircle2,
                    text: "Immutable audit logs for every action",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 md:gap-5 group"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      className="w-14 h-14 md:w-16 md:h-16 border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:border-accent/50 group-hover:bg-accent/5 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white/60 group-hover:text-accent transition-colors" />
                    </motion.div>
                    <p className="text-base md:text-lg text-white/60 group-hover:text-white transition-colors">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </SmoothReveal>

          <SmoothReveal delay={0.3}>
            <div className="relative max-w-lg mx-auto hidden lg:block h-[28rem]">
              <EvervaultCard text="Blind" />
            </div>
          </SmoothReveal>
        </div>
      </div>
    </section>
  );
}
