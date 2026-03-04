import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { GradientText } from "@/components/PremiumAnimations";

export function PlatformPreviewSection() {
  return (
    <section className="bg-canvas-deep relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6">
              Platform Preview
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white leading-[0.95]">
              Built for the
              <br />
              <GradientText>$13 Trillion Private Market</GradientText>
            </h2>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=720&fit=crop&q=80"
          alt="ANAVI platform dashboard — analytics and deal flow intelligence"
          className="mx-auto rounded-2xl object-cover h-full w-full object-left-top"
          draggable={false}
          loading="lazy"
        />
      </ContainerScroll>
    </section>
  );
}
