import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'wouter';
import { 
  ArrowRight, 
  Shield, 
  Network, 
  TrendingUp,
  Users,
  Building2,
  Sparkles,
  Brain,
  Zap,
  CheckCircle2,
  ChevronRight,
  Lock,
  Globe,
  Target,
  Briefcase,
  Crown,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LiquidGradient,
  Card3D,
  GradientText,
  FloatingElement,
  MorphingBlob,
  SmoothCounter,
  StaggeredList,
} from '@/components/PremiumAnimations';
import {
  Magnetic,
  AnimatedCounter,
} from '@/components/AwwwardsAnimations';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const capabilities = [
    {
      icon: Building2,
      title: "Family Office Network",
      description: "Access 500+ verified family offices with $2.4T+ in combined AUM",
      stat: "500+",
      statLabel: "Family Offices"
    },
    {
      icon: Target,
      title: "Deal Flow Intelligence",
      description: "AI-powered matching connects you to curated opportunities",
      stat: "$47M",
      statLabel: "Active Pipeline"
    },
    {
      icon: Shield,
      title: "Trust & Verification",
      description: "Every relationship cryptographically timestamped and verified",
      stat: "100%",
      statLabel: "Verified"
    },
    {
      icon: Brain,
      title: "AI Deal Partner",
      description: "Claude-powered intelligence for market analysis and introductions",
      stat: "24/7",
      statLabel: "Intelligence"
    },
  ];

  const exclusiveFeatures = [
    "Curated deal room with live $45M+ opportunities",
    "Direct access to verified family office principals",
    "AI-generated introduction recommendations",
    "Real-time market intelligence across commodities & real estate",
    "Cryptographic relationship custody & attribution",
    "Automated commission tracking & payout management"
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated Background */}
      <LiquidGradient className="opacity-30" />
      <MorphingBlob className="w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-20" color="oklch(0.65 0.19 230 / 0.15)" />
      <MorphingBlob className="w-[500px] h-[500px] -bottom-[150px] -left-[150px] opacity-15" color="oklch(0.55 0.15 160 / 0.1)" />

      {/* Welcome Splash Screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#2D3748] flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-6xl md:text-8xl font-medium text-white">@</span>
                  <span className="text-6xl md:text-8xl font-medium text-white">navi</span>
                  <motion.span 
                    className="w-4 h-4 rounded-full bg-sky-500 mb-12"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <p className="text-2xl md:text-4xl font-serif text-white/90 mb-4">
                  Welcome, <span className="text-sky-400">Avraham</span>
                </p>
                <motion.p 
                  className="text-lg text-white/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  Your private market operating system awaits
                </motion.p>
              </motion.div>

              <motion.div
                className="mt-12 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-sky-500 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showWelcome ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center relative px-4 py-20">
          <div className="max-w-6xl mx-auto text-center relative z-10">
            {/* Crown Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/30 mb-8"
            >
              <Crown className="w-4 h-4 text-sky-500" />
              <span className="text-xs uppercase tracking-[0.2em] text-sky-500">Founding Member Access</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-serif mb-8 leading-[0.95]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <span className="block">Welcome to</span>
              <span className="block mt-2">
                <GradientText>@navi</GradientText>
              </span>
            </motion.h1>

            {/* Personalized Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              <span className="text-foreground font-medium">Avraham</span>, you've been granted exclusive access to 
              the private market operating system trusted by elite family offices and institutional investors.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              <Link href="/dashboard">
                <Magnetic strength={0.15}>
                  <motion.button
                    className="relative bg-foreground text-background px-10 py-4 text-base font-medium overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-sky-500"
                      initial={{ x: "-100%", skewX: "-15deg" }}
                      whileHover={{ x: "0%" }}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="relative flex items-center gap-3">
                      Enter Platform
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </motion.button>
                </Magnetic>
              </Link>
              <Link href="/deal-rooms">
                <motion.button
                  className="px-10 py-4 text-base font-medium border border-border/50 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5" />
                    View Live Deals
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {[
                { value: "$2.4T+", label: "Network AUM" },
                { value: "500+", label: "Family Offices" },
                { value: "98%", label: "Repeat Rate" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-light text-foreground">{stat.value}</div>
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Explore</span>
              <div className="w-px h-12 bg-gradient-to-b from-sky-500 to-transparent" />
            </motion.div>
          </motion.div>
        </section>

        {/* Capabilities Section */}
        <section className="py-24 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-sky-500 mb-4">Your Unfair Advantage</p>
              <h2 className="text-4xl md:text-5xl font-serif">
                Everything You Need to <GradientText>Win</GradientText>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card3D intensity={4} glare={true}>
                    <div className="bg-card/80 backdrop-blur-sm border border-border/50 p-8 h-full hover:border-sky-500/30 transition-all duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 bg-sky-500/10 flex items-center justify-center">
                          <cap.icon className="w-7 h-7 text-sky-500" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-light">{cap.stat}</div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">{cap.statLabel}</div>
                        </div>
                      </div>
                      <h3 className="text-xl font-medium mb-3">{cap.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{cap.description}</p>
                    </div>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Exclusive Features */}
        <section className="py-24 px-4 bg-[#2D3748] text-white relative overflow-hidden">
          <MorphingBlob className="w-[400px] h-[400px] top-0 right-0 opacity-10" color="oklch(0.65 0.19 230 / 0.3)" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 mb-6">
                <Star className="w-4 h-4 text-sky-400" />
                <span className="text-xs uppercase tracking-[0.2em]">Founding Member Benefits</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif">
                Your Exclusive Access
              </h2>
            </motion.div>

            <div className="space-y-4">
              {exclusiveFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 hover:border-sky-500/30 transition-all duration-300"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-8 h-8 bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="text-lg text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link href="/dashboard">
                <motion.button
                  className="bg-sky-500 text-white px-12 py-4 text-base font-medium hover:bg-sky-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-3">
                    Start Exploring
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-serif mb-8">
                Ready to Transform Your <GradientText>Deal Flow</GradientText>?
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                Join the elite network of family offices and institutional investors who trust @navi for their private market operations.
              </p>
              <Link href="/dashboard">
                <Magnetic strength={0.2}>
                  <motion.button
                    className="relative bg-foreground text-background px-14 py-5 text-lg font-medium overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-sky-500"
                      initial={{ x: "-100%", skewX: "-15deg" }}
                      whileHover={{ x: "0%" }}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="relative flex items-center gap-3">
                      Enter @navi
                      <ArrowRight className="w-6 h-6" />
                    </span>
                  </motion.button>
                </Magnetic>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-border/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-medium">@</span>
              <span className="text-2xl font-medium">navi</span>
              <span className="w-2 h-2 rounded-full bg-sky-500 mb-3" />
            </div>
            <p className="text-sm text-muted-foreground">
              The Private Market Operating System
            </p>
            <div className="flex items-center gap-6">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Bank-Grade Security</span>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
