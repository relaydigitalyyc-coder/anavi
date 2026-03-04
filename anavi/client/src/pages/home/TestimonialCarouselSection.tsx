import { motion } from "framer-motion";
import { SmoothReveal, RevealOnScroll } from "@/components/AwwwardsAnimations";
import { GradientText, Card3D } from "@/components/PremiumAnimations";

const TESTIMONIALS = [
  {
    quote:
      "We deployed $240M through ANAVI-sourced deals last year. The blind matching system surfaces opportunities our network would never find — and the trust scores mean we skip weeks of preliminary diligence.",
    name: "David Rothschild",
    title: "Managing Partner, Horizon Ventures",
    initials: "DR",
    color: "#2563EB",
  },
  {
    quote:
      "Our fund-of-funds allocates across 40+ GPs. ANAVI's compliance passport eliminated redundant KYB checks entirely — saving us $2M annually and 6 weeks per new GP relationship.",
    name: "Katherine Wei",
    title: "CIO, Meridian Family Office",
    initials: "KW",
    color: "#C4972A",
  },
  {
    quote:
      "The attribution engine changed how we think about deal sourcing. Every introduction is timestamped and compensated. Our origination team's deal flow increased 340% in the first quarter.",
    name: "Marcus Okonkwo",
    title: "Head of Deal Origination, Summit Capital",
    initials: "MO",
    color: "#059669",
  },
];

export function TestimonialCarouselSection() {
  return (
    <section className="py-24 md:py-32 border-t border-hairline bg-canvas-deep relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <SmoothReveal>
          <div className="text-center mb-14 md:mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C4972A] mb-4">
              Trusted by Leaders
            </p>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif">
              What Our <GradientText>Members</GradientText> Say
            </h3>
          </div>
        </SmoothReveal>

        {/* Featured quote */}
        <RevealOnScroll>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.blockquote
              className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-white/80 leading-snug mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              "ANAVI is doing for private markets what Bloomberg did for public ones — making deal intelligence, compliance, and counterparty trust systematic and institutional-grade."
            </motion.blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C4972A] flex items-center justify-center text-white text-xs font-bold">
                JB
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  Jonathan Bernstein
                </p>
                <p className="text-xs text-white/40">
                  General Partner, Catalyst Fund
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Card grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <RevealOnScroll key={t.name}>
              <Card3D intensity={6} glare={false}>
                <div className="glass-dark rounded-xl p-6 md:p-8 h-full flex flex-col border border-white/[0.06]">
                  <div className="mb-4">
                    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                      <path
                        d="M0 18V10.8C0 7.36 0.72 4.68 2.16 2.76C3.64 0.84 5.68 0 8.28 0.12L8.88 2.64C7.36 2.76 6.08 3.36 5.04 4.44C4.04 5.48 3.44 6.8 3.24 8.4H5.4C6.44 8.4 7.28 8.72 7.92 9.36C8.6 9.96 8.94 10.82 8.94 11.94V14.46C8.94 15.58 8.6 16.46 7.92 17.1C7.28 17.7 6.44 18 5.4 18H0ZM14.46 18V10.8C14.46 7.36 15.18 4.68 16.62 2.76C18.1 0.84 20.14 0 22.74 0.12L23.34 2.64C21.82 2.76 20.54 3.36 19.5 4.44C18.5 5.48 17.9 6.8 17.7 8.4H19.86C20.9 8.4 21.74 8.72 22.38 9.36C23.06 9.96 23.4 10.82 23.4 11.94V14.46C23.4 15.58 23.06 16.46 22.38 17.1C21.74 17.7 20.9 18 19.86 18H14.46Z"
                        fill="white"
                        fillOpacity="0.06"
                      />
                    </svg>
                  </div>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed flex-1">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/[0.06]">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-white/40">{t.title}</p>
                    </div>
                  </div>
                </div>
              </Card3D>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
