import { motion } from "framer-motion";
import {
  Brain,
  Network,
  Lock,
  Building2,
  TrendingUp,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import {
  SmoothReveal,
  SplitText,
  StaggeredList,
} from "@/components/AwwwardsAnimations";
import {
  Card3D,
} from "@/components/PremiumAnimations";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-canvas-mid relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SmoothReveal>
          <div className="text-center mb-16 md:mb-24">
            <motion.p
              className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Platform Features
            </motion.p>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif">
              <SplitText>Everything You Need</SplitText>
            </h2>
          </div>
        </SmoothReveal>

        <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" staggerDelay={0.1}>
          {[
            {
              icon: Brain,
              title: "AI Deal Intelligence",
              description: "Automatically extract deals, action items, and connections from your Fireflies transcripts.",
              link: "/deal-intelligence"
            },
            {
              icon: Network,
              title: "Knowledge Graph",
              description: "Visualize your entire network with Obsidian-style graph views showing all relationships.",
              link: "/knowledge-graph"
            },
            {
              icon: Lock,
              title: "Curated Deal Room",
              description: "Access exclusive, vetted opportunities with full thesis, risk disclosure, and operator backgrounds.",
              link: "/deal-room"
            },
            {
              icon: Building2,
              title: "SPV Generator",
              description: "Launch compliant investment vehicles in minutes with automated legal structure generation.",
              link: "/spv-generator"
            },
            {
              icon: TrendingUp,
              title: "Capital Management",
              description: "Track commitments, manage capital calls, and visualize cap tables in real-time.",
              link: "/capital-management"
            },
            {
              icon: Shield,
              title: "Compliance & Audit",
              description: "Immutable audit logs, KYC verification, and regulatory compliance workflows.",
              link: "/audit-logs"
            },
          ].map((feature, i) => (
            <Link key={i} href={feature.link}>
              <Card3D intensity={8} glare={true}>
                <motion.div
                  className="group p-8 md:p-10 glass-dark cursor-pointer h-full relative overflow-hidden"
                  whileHover={{ y: -4, boxShadow: "0 20px 60px rgb(0 0 0 / 0.28), 0 0 40px oklch(0.75 0.18 200 / 0.12)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <feature.icon className="w-10 h-10 md:w-12 md:h-12 mb-6 md:mb-8 text-white/40 group-hover:text-[#22D4F5] transition-colors duration-300 relative z-10" />
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-3 md:mb-4 relative z-10">{feature.title}</h3>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed relative z-10">{feature.description}</p>
                  <motion.div
                    className="mt-6 flex items-center gap-2 text-sm text-[#22D4F5] opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    Explore <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </Card3D>
            </Link>
          ))}
        </StaggeredList>
      </div>
    </section>
  );
}