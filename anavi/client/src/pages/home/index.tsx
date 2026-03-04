import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Magnetic } from "@/components/AwwwardsAnimations";
import { PersonaPicker } from "@/components/PersonaPicker";
import { HeroSection } from "./HeroSection";
import { MarqueeSection } from "./MarqueeSection";
import { ProblemSection } from "./ProblemSection";
import { ThreeRolesSection } from "./ThreeRolesSection";
import { StatsSocialSection } from "./StatsSocialSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { PlatformPreviewSection } from "./PlatformPreviewSection";
import { TrustSection } from "./TrustSection";
import { TestimonialCarouselSection } from "./TestimonialCarouselSection";
import { EnterprisePricingSection } from "./EnterprisePricingSection";
import { CTAFooterSection } from "./CTAFooterSection";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-canvas-void text-white overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-hairline"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-1"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-2xl md:text-3xl font-medium tracking-tight">
              @
            </span>
            <span className="text-2xl md:text-3xl font-medium tracking-tight">
              navi
            </span>
            <motion.span
              className="w-2 h-2 rounded-full bg-sky-500 mb-4"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex items-center gap-10">
              {["Features", "How It Works", "Trust"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-white/60 hover:text-white transition-all duration-300 relative group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {item}
                  <motion.span className="absolute -bottom-1 left-0 w-0 h-px bg-[#C4972A] group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>
            <Magnetic strength={0.15}>
              <motion.button
                onClick={() => setPickerOpen(true)}
                className="relative bg-[#C4972A] text-[#060A12] px-5 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-semibold overflow-hidden group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  className="absolute inset-0 bg-accent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 group-hover:text-foreground transition-colors">
                  Enter Demo
                </span>
              </motion.button>
            </Magnetic>
            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white/60 hover:text-white p-1 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-x-0 top-16 z-40 md:hidden glass-dark border-b border-hairline"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col p-4 gap-3">
              {["Features", "How It Works", "Trust"].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-white/70 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HeroSection
        heroRef={heroRef}
        heroY={heroY}
        heroOpacity={heroOpacity}
        heroScale={heroScale}
        setPickerOpen={setPickerOpen}
      />
      <MarqueeSection />
      <ProblemSection />
      <ThreeRolesSection />
      <StatsSocialSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PlatformPreviewSection />
      <TrustSection />
      <TestimonialCarouselSection />
      <EnterprisePricingSection />
      <CTAFooterSection setPickerOpen={setPickerOpen} />

      {/* Persona Picker Overlay — mounts when pickerOpen=true */}
      {pickerOpen && <PersonaPicker onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
