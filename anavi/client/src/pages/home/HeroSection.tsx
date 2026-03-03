import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Network,
  Lock,
  TrendingUp,
  Users,
  Sparkles,
  Brain,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { Magnetic } from "@/components/AwwwardsAnimations";
import {
  AuroraBackground,
  GlowingBorder,
  MorphingBlob,
  FloatingElement,
} from "@/components/PremiumAnimations";

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
  heroY: any;
  heroOpacity: any;
  heroScale: any;
  setPickerOpen: (open: boolean) => void;
}

export function HeroSection({
  heroRef,
  heroY,
  heroOpacity,
  heroScale,
  setPickerOpen,
}: HeroSectionProps) {
  return (
    <section
      ref={heroRef}
      className="min-h-screen flex items-center pt-16 md:pt-20 relative overflow-hidden"
    >
      {/* Animated gradient mesh */}
      <div
        className="absolute inset-0 bg-mesh pointer-events-none"
        aria-hidden="true"
      />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* HUD accent element */}
      <motion.div
        className="absolute top-24 right-8 hidden lg:block animate-hud-float pointer-events-none z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden="true"
      >
        <div className="glass-dark rounded-lg p-4 space-y-2 min-w-[160px]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22D4F5] animate-glow-pulse" />
            <span className="font-data-hud text-[10px] text-white/40 uppercase tracking-widest">
              System Status
            </span>
          </div>
          <div className="space-y-1">
            {[
              { label: "Trust Engine", value: "ACTIVE", color: "#22D4F5" },
              { label: "Matches Live", value: "247", color: "#C4972A" },
              { label: "Deal Rooms", value: "89", color: "#9B7CF8" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-6"
              >
                <span className="font-data-hud text-[10px] text-white/40">
                  {label}
                </span>
                <span className="font-data-hud text-[10px]" style={{ color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Premium Background Effects - @navi brand */}
      <AuroraBackground className="opacity-30" />
      <MorphingBlob
        className="w-[600px] h-[600px] -top-[200px] -right-[200px]"
        color="oklch(0.65 0.19 230 / 0.08)"
      />
      <MorphingBlob
        className="w-[400px] h-[400px] bottom-[10%] -left-[100px]"
        color="oklch(0.55 0.15 160 / 0.06)"
      />

      <motion.div
        className="max-w-7xl mx-auto px-4 md:px-8 w-full relative z-10 py-12 md:py-0"
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm mb-6 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.span>
              <span className="text-xs uppercase tracking-widest text-white/60">
                The Private Market Operating System
              </span>
            </motion.div>

            <h1 className="font-display text-6xl md:text-7xl lg:text-[120px] font-serif leading-[0.85] mb-8 md:mb-10 text-white">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "120%", rotateX: -40 }}
                  animate={{ y: 0, rotateX: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  Custody
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "120%", rotateX: -40 }}
                  animate={{ y: 0, rotateX: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  Your
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "120%", rotateX: -40 }}
                  animate={{ y: 0, rotateX: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.5,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <span className="text-gradient-gold font-display">
                    Relationships
                  </span>
                </motion.span>
              </span>
            </h1>

            <motion.p
              className="text-lg md:text-xl text-white/70 max-w-lg mb-10 md:mb-14 leading-relaxed"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              The first platform that lets you prove, protect, and profit from
              your professional relationships. Match anonymously. Close deals
              with confidence.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Magnetic strength={0.2}>
                <GlowingBorder>
                  <motion.button
                    onClick={() => setPickerOpen(true)}
                    className="w-full sm:w-auto bg-foreground text-background px-8 md:px-12 py-5 md:py-6 text-sm uppercase tracking-widest flex items-center justify-center gap-4 group cursor-pointer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <span>Enter Demo</span>
                    <motion.span
                      className="inline-block"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </motion.button>
                </GlowingBorder>
              </Magnetic>
              <Link href="/deal-intelligence">
                <motion.button
                  className="w-full sm:w-auto border border-border px-8 md:px-10 py-5 md:py-6 text-sm uppercase tracking-widest hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 flex items-center justify-center gap-3 group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Brain className="w-5 h-5 group-hover:text-accent transition-colors" />
                  <span>AI Intelligence</span>
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Hero Visual - Enhanced */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.2,
              delay: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <div className="relative aspect-square max-w-xl mx-auto">
              {/* Animated orbital rings */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border border-border/20"
                  style={{
                    transform: `scale(${1 - i * 0.12})`,
                  }}
                  animate={{
                    rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                    borderColor: [
                      "rgba(255,255,255,0.05)",
                      "rgba(255,255,255,0.15)",
                      "rgba(255,255,255,0.05)",
                    ],
                  }}
                  transition={{
                    rotate: {
                      duration: 25 + i * 8,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    borderColor: { duration: 4, repeat: Infinity },
                  }}
                />
              ))}

              {/* Central glowing element - @navi sky blue */}
              <motion.div
                className="absolute inset-[25%] bg-gradient-to-br from-sky-500/20 via-sky-500/5 to-transparent border border-sky-500/30 flex items-center justify-center backdrop-blur-sm rounded-lg"
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 60px oklch(0.65 0.19 230 / 0.15)",
                    "0 0 100px oklch(0.65 0.19 230 / 0.3)",
                    "0 0 60px oklch(0.65 0.19 230 / 0.15)",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Network className="w-20 h-20 text-accent" />
                </motion.div>
              </motion.div>

              {/* Floating icons with trails */}
              {[
                { Icon: Shield, pos: "top-[5%] left-[20%]", delay: 0 },
                { Icon: Lock, pos: "top-[20%] right-[5%]", delay: 0.5 },
                { Icon: TrendingUp, pos: "bottom-[20%] left-[5%]", delay: 1 },
                { Icon: Users, pos: "bottom-[5%] right-[20%]", delay: 1.5 },
                { Icon: Zap, pos: "top-[50%] left-[0%]", delay: 2 },
                { Icon: Brain, pos: "top-[50%] right-[0%]", delay: 2.5 },
              ].map(({ Icon, pos, delay }, i) => (
                <FloatingElement key={i} duration={3 + i * 0.5} distance={15}>
                  <motion.div
                    className={`absolute ${pos} w-14 h-14 bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 1 + delay * 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    whileHover={{
                      scale: 1.1,
                      borderColor: "oklch(0.65 0.19 230 / 0.5)",
                    }}
                  >
                    <Icon className="w-6 h-6 text-white/40" />
                  </motion.div>
                </FloatingElement>
              ))}

              {/* Particle dots */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-accent/60"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs uppercase tracking-widest text-white/40">
          Scroll
        </span>
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-accent to-transparent"
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
