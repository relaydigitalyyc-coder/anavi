import { motion } from "framer-motion";
import {
  Eye,
  Lock,
  Shield,
  CheckCircle2,
} from "lucide-react";
import {
  SmoothReveal,
} from "@/components/AwwwardsAnimations";
import {
  LiquidGradient,
  GradientText,
} from "@/components/PremiumAnimations";

export function TrustSection() {
  return (
    <section id="trust" className="py-24 md:py-32 bg-canvas-mid relative">
      <LiquidGradient className="opacity-20" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <SmoothReveal>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6">Trust & Security</p>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif mb-8 md:mb-12 leading-[0.95]">
                Your Relationships,<br />
                <GradientText>Your Control</GradientText>
              </h2>
              <div className="space-y-5 md:space-y-6">
                {[
                  { icon: Eye, text: "Anonymous matching until both parties consent" },
                  { icon: Lock, text: "End-to-end encryption for all sensitive data" },
                  { icon: Shield, text: "SOC 2 Type II compliant infrastructure" },
                  { icon: CheckCircle2, text: "Immutable audit logs for every action" },
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
                    <p className="text-base md:text-lg text-white/60 group-hover:text-white transition-colors">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </SmoothReveal>

          <SmoothReveal delay={0.3}>
            <div className="relative aspect-square max-w-lg mx-auto hidden lg:block">
              {/* Animated security visualization */}
              <motion.div
                className="absolute inset-0 border border-border/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-6 border border-border/40"
                animate={{ rotate: -360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-12 border border-accent/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-20 bg-gradient-to-br from-sky-500/15 to-transparent flex items-center justify-center rounded-lg"
                animate={{
                  boxShadow: [
                    "0 0 40px oklch(0.65 0.19 230 / 0.15)",
                    "0 0 80px oklch(0.65 0.19 230 / 0.3)",
                    "0 0 40px oklch(0.65 0.19 230 / 0.15)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="w-20 h-20 text-sky-500" />
              </motion.div>

              {/* Orbiting dots */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-accent/60"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    x: [
                      Math.cos((i / 8) * Math.PI * 2) * 180,
                      Math.cos((i / 8) * Math.PI * 2 + Math.PI) * 180,
                      Math.cos((i / 8) * Math.PI * 2) * 180,
                    ],
                    y: [
                      Math.sin((i / 8) * Math.PI * 2) * 180,
                      Math.sin((i / 8) * Math.PI * 2 + Math.PI) * 180,
                      Math.sin((i / 8) * Math.PI * 2) * 180,
                    ],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </SmoothReveal>
        </div>
      </div>
    </section>
  );
}