import { motion } from "framer-motion";
import {
  CheckCircle2,
  Shield,
  Network,
  Lock,
  TrendingUp,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { SmoothReveal, RevealOnScroll } from "@/components/AwwwardsAnimations";
import {
  GradientText,
  GlowingBorder,
  ElasticButton,
} from "@/components/PremiumAnimations";

const PRODUCT_MODULES = [
  {
    icon: Network,
    title: "Onboard",
    desc: "High-converting compliance journeys, no code required.",
    href: "/verification",
    accent: "#22D4F5",
  },
  {
    icon: Shield,
    title: "Decide",
    desc: "Automated case management with 4-eye review and AI.",
    href: "/compliance",
    accent: "#059669",
  },
  {
    icon: Lock,
    title: "Lifecycle",
    desc: "Perpetual monitoring, re-KYB, and policy management.",
    href: "/audit-logs",
    accent: "#9B7CF8",
  },
  {
    icon: TrendingUp,
    title: "Economics",
    desc: "Attribution tracking, automated payouts, fee management.",
    href: "/payouts",
    accent: "#C4972A",
  },
  {
    icon: Building2,
    title: "Deal Rooms",
    desc: "NDA-gated workspaces with immutable audit trails.",
    href: "/deal-rooms",
    accent: "#2563EB",
  },
];

const ENTERPRISE_FEATURES = [
  "Custody-grade relationship timestamps",
  "AI-powered blind matching engine",
  "Secure deal rooms with audit trail",
  "Multi-tier identity verification",
  "Attribution-based payout tracking",
  "Compliance passport & KYC/AML",
  "Enterprise API & webhooks",
  "Dedicated account management",
];

export function EnterprisePricingSection() {
  return (
    <section className="py-24 md:py-32 border-t border-hairline bg-canvas-mid relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Product Modules — Duna-inspired navigation strip */}
        <SmoothReveal>
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">
              Platform Modules
            </p>
            <h3 className="text-4xl md:text-5xl font-serif">
              <GradientText>The Compliance Engine</GradientText>
            </h3>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              Modular infrastructure for every stage of the counterparty
              lifecycle — from first touch to ongoing monitoring.
            </p>
          </div>
        </SmoothReveal>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16 md:mb-20">
          {PRODUCT_MODULES.map((mod, i) => (
            <RevealOnScroll key={mod.title}>
              <Link href={mod.href}>
                <motion.div
                  className="glass-dark rounded-xl p-5 md:p-6 h-full border border-transparent hover:border-white/10 group cursor-pointer"
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <mod.icon
                    className="w-6 h-6 mb-4 text-white/30 group-hover:text-white/70 transition-colors duration-300"
                    style={{ color: undefined }}
                  />
                  <h4 className="text-sm font-semibold text-white mb-1.5 group-hover:text-white transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {mod.desc}
                  </p>
                  <motion.div
                    className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: mod.accent }}
                  >
                    Explore <ArrowRight className="w-3 h-3" />
                  </motion.div>
                </motion.div>
              </Link>
            </RevealOnScroll>
          ))}
        </div>

        {/* Enterprise Plan Card */}
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <GlowingBorder>
              <div className="glass-dark rounded-xl p-8 md:p-10 text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#C4972A] mb-2">
                      Enterprise
                    </p>
                    <h4 className="text-2xl md:text-3xl font-serif text-white mb-2">
                      Full Platform Access
                    </h4>
                    <p className="text-sm text-white/50 max-w-md">
                      Everything you need to protect, match, and close private
                      market transactions at institutional scale.
                    </p>
                  </div>
                  <Link href="/register">
                    <ElasticButton className="bg-foreground text-background px-8 py-3.5 text-sm font-medium uppercase tracking-wider rounded-lg shrink-0">
                      Contact Sales
                    </ElasticButton>
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {ENTERPRISE_FEATURES.map(feature => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22D4F5]" />
                      <span className="text-sm text-white/60">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlowingBorder>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
