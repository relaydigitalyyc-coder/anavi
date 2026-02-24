import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Network,
  Lock,
  TrendingUp,
  Users,
  Eye,
  CheckCircle2,
  Building2,
  Sparkles,
  Brain,
  Zap,
  Play
} from "lucide-react";
import { Link } from "wouter";
import { useRef } from "react";
import {
  AnimatedCounter,
  Magnetic,
  RevealOnScroll,
  Glow,
  SplitText,
  Marquee,
} from "@/components/AwwwardsAnimations";
import {
  LiquidGradient,
  AuroraBackground,
  Card3D,
  ElasticButton,
  SmoothReveal,
  GradientText,
  FloatingElement,
  MorphingBlob,
  Spotlight,
  GlowingBorder,
  SmoothCounter,
  TextScramble,
  StaggeredList,
} from "@/components/PremiumAnimations";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-canvas-void text-white overflow-hidden">
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
            <span className="text-2xl md:text-3xl font-medium tracking-tight">@</span>
            <span className="text-2xl md:text-3xl font-medium tracking-tight">navi</span>
            <motion.span
              className="w-2 h-2 rounded-full bg-sky-500 mb-4"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex items-center gap-10">
              {["Features", "How It Works", "Trust"].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-white/60 hover:text-white transition-all duration-300 relative group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {item}
                  <motion.span
                    className="absolute -bottom-1 left-0 w-0 h-px bg-[#C4972A] group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
            </div>
            <Link href="/dashboard">
              <Magnetic strength={0.15}>
                <motion.button
                  className="relative bg-[#C4972A] text-[#060A12] px-5 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-semibold overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.span
                    className="absolute inset-0 bg-accent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 group-hover:text-foreground transition-colors">Enter Demo</span>
                </motion.button>
              </Magnetic>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center pt-16 md:pt-20 relative overflow-hidden">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-mesh pointer-events-none" aria-hidden="true" />
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
                { label: "Matches Live", value: "247",    color: "#C4972A" },
                { label: "Deal Rooms",   value: "89",     color: "#9B7CF8" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-6">
                  <span className="font-data-hud text-[10px] text-white/40">{label}</span>
                  <span className="font-data-hud text-[10px]" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Premium Background Effects - @navi brand */}
        <AuroraBackground className="opacity-30" />
        <MorphingBlob className="w-[600px] h-[600px] -top-[200px] -right-[200px]" color="oklch(0.65 0.19 230 / 0.08)" />
        <MorphingBlob className="w-[400px] h-[400px] bottom-[10%] -left-[100px]" color="oklch(0.55 0.15 160 / 0.06)" />

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
                <span className="text-xs uppercase tracking-widest text-white/60">The Private Market Operating System</span>
              </motion.div>

              <h1 className="font-display text-6xl md:text-7xl lg:text-[120px] font-serif leading-[0.85] mb-8 md:mb-10 text-white">
                <span className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "120%", rotateX: -40 }}
                    animate={{ y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    Custody
                  </motion.span>
                </span>
                <span className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "120%", rotateX: -40 }}
                    animate={{ y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    Your
                  </motion.span>
                </span>
                <span className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "120%", rotateX: -40 }}
                    animate={{ y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <span className="text-gradient-gold font-display">Relationships</span>
                  </motion.span>
                </span>
              </h1>

              <motion.p
                className="text-lg md:text-xl text-white/70 max-w-lg mb-10 md:mb-14 leading-relaxed"
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                The first platform that lets you prove, protect, and profit from your professional relationships.
                Match anonymously. Close deals with confidence.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-5"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Link href="/dashboard">
                  <Magnetic strength={0.2}>
                    <GlowingBorder>
                      <motion.button
                        className="w-full sm:w-auto bg-foreground text-background px-8 md:px-12 py-5 md:py-6 text-sm uppercase tracking-widest flex items-center justify-center gap-4 group"
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
                </Link>
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
              transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
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
                      borderColor: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]
                    }}
                    transition={{
                      rotate: { duration: 25 + i * 8, repeat: Infinity, ease: "linear" },
                      borderColor: { duration: 4, repeat: Infinity }
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
                      "0 0 60px oklch(0.65 0.19 230 / 0.15)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
                      transition={{ delay: 1 + delay * 0.2, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1, borderColor: "oklch(0.65 0.19 230 / 0.5)" }}
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
          <span className="text-xs uppercase tracking-widest text-white/40">Scroll</span>
          <motion.div
            className="w-px h-12 bg-gradient-to-b from-accent to-transparent"
            animate={{ scaleY: [0, 1, 0], originY: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className="py-6 border-y border-hairline bg-canvas-surface overflow-hidden">
        <Marquee speed={30} className="text-white/50">
          <span className="flex items-center gap-12 px-6">
            {["Family Offices", "Venture Capital", "Private Equity", "Real Estate", "Commodities", "Deal Flow", "LP Management", "SPV Generation"].map((item, i) => (
              <span key={i} className="flex items-center gap-3 text-sm uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-accent" />
                {item}
              </span>
            ))}
          </span>
        </Marquee>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32 bg-canvas-deep relative">
        <LiquidGradient className="opacity-30" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 847, suffix: "+", label: "Relationships Tracked" },
              { value: 156, suffix: "M", prefix: "$", label: "Deal Flow" },
              { value: 94, suffix: "%", label: "Match Accuracy" },
              { value: 12, suffix: "", label: "Active Deals" },
            ].map((stat, i) => (
              <SmoothReveal key={i} delay={i * 0.1}>
                <Spotlight className="text-center p-6 border border-transparent hover:border-border/50 transition-colors">
                  <div className="text-4xl md:text-6xl font-display font-serif text-white mb-3">
                    {stat.prefix}
                    <SmoothCounter value={stat.value} duration={2.5} />
                    {stat.suffix}
                  </div>
                  <p className="text-xs md:text-sm text-white/50 uppercase tracking-widest">{stat.label}</p>
                </Spotlight>
              </SmoothReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-40 bg-canvas-mid relative">
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

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-40 bg-canvas-deep relative overflow-hidden">
        <MorphingBlob className="w-[500px] h-[500px] top-[20%] -right-[150px]" color="oklch(0.72 0.14 70 / 0.08)" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <SmoothReveal>
            <div className="text-center mb-16 md:mb-24">
              <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6">Process</p>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif">How It Works</h2>
            </div>
          </SmoothReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { step: "01", title: "Connect", desc: "Sync your Fireflies, calendar, and CRM to import your network automatically." },
              { step: "02", title: "Analyze", desc: "AI extracts deals, relationships, and action items from your conversations." },
              { step: "03", title: "Match", desc: "Get matched with opportunities based on your network and expertise." },
              { step: "04", title: "Close", desc: "Execute deals with compliant SPVs, capital management, and audit trails." },
            ].map((item, i) => (
              <SmoothReveal key={i} delay={i * 0.15}>
                <motion.div
                  className="text-center md:text-left relative group"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="font-display text-7xl md:text-9xl font-serif text-white/10 mb-4 md:mb-6 group-hover:text-white/20 transition-colors duration-500"
                    style={{ WebkitTextStroke: "1px oklch(1 0 0 / 0.15)" }}
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-medium mb-3 md:mb-4">{item.title}</h3>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              </SmoothReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="py-20 md:py-40 bg-canvas-mid relative">
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

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 border-t border-hairline bg-canvas-deep">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <RevealOnScroll>
            <p className="text-center text-sm uppercase tracking-[0.2em] text-white/40 mb-10">
              Trusted by Leading Institutions
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {["Institution I", "Institution II", "Institution III", "Institution IV", "Institution V", "Institution VI"].map((name) => (
                <div
                  key={name}
                  className="w-32 h-12 rounded-lg flex items-center justify-center text-xs font-semibold tracking-wider text-white/20 border border-white/10"
                  style={{ background: "linear-gradient(135deg, transparent, oklch(0.95 0.01 240 / 0.3))" }}
                >
                  {name}
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <section className="py-16 md:py-24 border-t border-hairline bg-canvas-deep relative overflow-hidden">
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

      {/* Enterprise/Pricing Section */}
      <section className="py-16 md:py-24 border-t border-hairline bg-canvas-mid relative overflow-hidden">
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

      {/* CTA Section */}
      <section className="py-24 md:py-40 border-t border-hairline bg-canvas-void relative overflow-hidden">
        <AuroraBackground className="opacity-40" />
        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center relative z-10">
          <SmoothReveal>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-8 md:mb-12 leading-[0.95]">
              Ready to Transform Your<br />
              <GradientText>Deal Flow?</GradientText>
            </h2>
            <p className="text-lg md:text-xl text-white/60 mb-12 md:mb-16 max-w-2xl mx-auto leading-relaxed">
              Join the private market operating system trusted by family offices,
              venture capitalists, and deal makers worldwide.
            </p>
            <Link href="/dashboard">
              <Magnetic strength={0.2}>
                <GlowingBorder>
                  <motion.button
                    className="bg-foreground text-background px-10 md:px-16 py-5 md:py-7 text-sm uppercase tracking-widest inline-flex items-center gap-4 group"
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
            </Link>
          </SmoothReveal>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-16 md:py-20 bg-canvas-void border-t border-hairline">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xl font-medium">@</span>
                <span className="text-xl font-medium">navi</span>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Dashboard", "Deal Rooms", "Matching Engine", "Verification"].map(item => (
                  <li key={item}><span className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Careers", "Press", "Contact"].map(item => (
                  <li key={item}><span className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(item => (
                  <li key={item}><span className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">Support</h4>
              <ul className="space-y-2.5">
                {["Documentation", "API Reference", "Status", "Help Center"].map(item => (
                  <li key={item}><span className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-hairline pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © 2026 @navi. The Private Market Operating System. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <span className="hover:text-white/80 transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white/80 transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white/80 transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
