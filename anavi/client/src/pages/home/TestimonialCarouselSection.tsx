import {
  SmoothReveal,
  RevealOnScroll,
} from "@/components/AwwwardsAnimations";
import {
  GradientText,
  Card3D,
} from "@/components/PremiumAnimations";

export function TestimonialCarouselSection() {
  return (
    <section className="py-20 md:py-24 border-t border-hairline bg-canvas-deep relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <SmoothReveal>
          <h3 className="text-3xl md:text-4xl font-serif text-center mb-12">
            What Our <GradientText>Members</GradientText> Say
          </h3>
        </SmoothReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "James Harrington",
              title: "Managing Partner, Alpine Capital",
              quote: "ANAVI transformed how we protect originator relationships. The custody timestamps alone have saved us in three disputes this year.",
              initials: "JH",
              color: "#2563EB",
            },
            {
              name: "Sarah Chen",
              title: "Director, Pacific Family Office",
              quote: "The blind matching system is brilliant. We've closed $47M in deals we never would have found through traditional channels.",
              initials: "SC",
              color: "#C4972A",
            },
            {
              name: "Michael Torres",
              title: "VP Acquisitions, Meridian Group",
              quote: "Enterprise-grade compliance with consumer-grade UX. Our diligence team cut deal room setup time by 80%.",
              initials: "MT",
              color: "#059669",
            },
          ].map((t) => (
            <RevealOnScroll key={t.name}>
              <Card3D intensity={8} glare={false}>
                <div className="glass-dark rounded-xl p-6 h-full flex flex-col">
                  <p className="text-sm text-white/60 leading-relaxed flex-1 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
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