import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import {
  SmoothReveal,
  RevealOnScroll,
} from "@/components/AwwwardsAnimations";
import {
  GradientText,
  GlowingBorder,
  ElasticButton,
} from "@/components/PremiumAnimations";

export function EnterprisePricingSection() {
  return (
    <section className="py-20 md:py-24 border-t border-hairline bg-canvas-mid relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        <SmoothReveal>
          <h3 className="text-3xl md:text-4xl font-serif mb-4">
            <GradientText>Enterprise Platform</GradientText>
          </h3>
          <p className="text-white/60 mb-10 max-w-xl mx-auto">
            Everything you need to protect, match, and close private market transactions at institutional scale.
          </p>
        </SmoothReveal>
        <RevealOnScroll>
          <GlowingBorder>
            <div className="glass-dark rounded-xl p-8 md:p-10 text-left">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {[
                  "Custody-grade relationship timestamps",
                  "AI-powered blind matching engine",
                  "Secure deal rooms with audit trail",
                  "Multi-tier identity verification",
                  "Attribution-based payout tracking",
                  "Compliance passport & KYC/AML",
                  "Enterprise API & webhooks",
                  "Dedicated account management",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-sky-500" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">Starting at enterprise pricing</p>
                  <p className="text-sm text-white/50">Custom plans for institutions and funds</p>
                </div>
                <Link href="/register">
                  <ElasticButton className="bg-foreground text-background px-8 py-3 text-sm font-medium uppercase tracking-wider rounded-lg">
                    Contact Sales
                  </ElasticButton>
                </Link>
              </div>
            </div>
          </GlowingBorder>
        </RevealOnScroll>
      </div>
    </section>
  );
}