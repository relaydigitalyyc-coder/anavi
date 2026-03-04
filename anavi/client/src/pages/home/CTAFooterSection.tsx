import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { PLATFORM } from "@/lib/copy";
import { Magnetic, SmoothReveal } from "@/components/AwwwardsAnimations";
import {
  AuroraBackground,
  GradientText,
  GlowingBorder,
} from "@/components/PremiumAnimations";

const PRODUCT_LINKS: Array<{ label: string; href: string }> = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Deal Rooms", href: "/deal-rooms" },
  { label: "Matching Engine", href: "/deal-matching" },
  { label: "Verification", href: "/verification" },
];

const NEXT_UP_LINKS = [
  {
    label: "Compliance Passport",
    desc: "Verify once, transact forever",
    href: "/compliance",
  },
  {
    label: "Blind Matching",
    desc: "Intent-based, anonymized until consent",
    href: "/deal-matching",
  },
  {
    label: "Deal Rooms",
    desc: "NDA-gated workspaces with audit trails",
    href: "/deal-rooms",
  },
  {
    label: "Attribution Engine",
    desc: "Automated originator economics",
    href: "/payouts",
  },
];

interface CTAFooterSectionProps {
  setPickerOpen: (open: boolean) => void;
}

export function CTAFooterSection({ setPickerOpen }: CTAFooterSectionProps) {
  return (
    <>
      {/* Duna-style "Next Up" navigation */}
      <section className="py-16 md:py-20 border-t border-hairline bg-canvas-deep">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-6">
            Explore the platform
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NEXT_UP_LINKS.map(link => (
              <Link key={link.label} href={link.href}>
                <motion.div
                  className="glass-dark rounded-xl p-5 border border-transparent hover:border-white/10 group cursor-pointer h-full"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <h4 className="text-sm font-semibold text-white mb-1.5">
                    {link.label}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed mb-3">
                    {link.desc}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[#22D4F5] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 border-t border-hairline bg-canvas-void relative overflow-hidden">
        <AuroraBackground className="opacity-40" />
        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center relative z-10">
          <SmoothReveal>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-8 md:mb-12 leading-[0.95]">
              The Private Market
              <br />
              <GradientText>Operating System.</GradientText>
            </h2>
            <p className="text-lg md:text-xl text-white/60 mb-12 md:mb-16 max-w-2xl mx-auto leading-relaxed">
              Every relationship custodied. Every introduction attributed. Every
              deal closed on infrastructure purpose-built for the{" "}
              {PLATFORM.market}.
            </p>
            <Magnetic strength={0.2}>
              <GlowingBorder>
                <motion.button
                  onClick={() => setPickerOpen(true)}
                  className="bg-foreground text-background px-10 md:px-16 py-5 md:py-7 text-sm uppercase tracking-widest inline-flex items-center gap-4 group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Enter Demo</span>
                  <motion.span
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </motion.button>
              </GlowingBorder>
            </Magnetic>
          </SmoothReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 md:py-20 bg-canvas-void border-t border-hairline">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xl font-medium">@</span>
                <span className="text-xl font-serif italic">navi</span>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-sky-500 mb-3"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                The Private Market Operating System for institutional deal flow.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                {PRODUCT_LINKS.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/40 hover:text-white/80 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Compliance", href: "/compliance" },
                  { label: "Verification", href: "/verification" },
                  { label: "Onboarding", href: "/member-onboarding" },
                  { label: "Analytics", href: "/analytics" },
                ].map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/40 hover:text-white/80 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {["About", "Careers", "Press", "Contact"].map(item => (
                  <li key={item}>
                    <span className="text-sm text-white/30">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Trust Center",
                  "Documentation",
                  "API Reference",
                  "Status",
                ].map(item => (
                  <li key={item}>
                    <span className="text-sm text-white/30">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-hairline pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              &copy; 2026 @navi. The Private Market Operating System. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
