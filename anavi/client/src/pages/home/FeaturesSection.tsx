import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Network,
  Lock,
  Building2,
  TrendingUp,
  Shield,
} from "lucide-react";
import { SmoothReveal, SplitText } from "@/components/AwwwardsAnimations";
import { cn } from "@/lib/utils";

const PLATFORM_FEATURES = [
  {
    step: "01",
    title: "AI Deal Intelligence",
    content:
      "Automatically extract deals, action items, and connections from your Fireflies transcripts. The AI engine surfaces hidden patterns across your network.",
    image:
      "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=500&fit=crop&q=80",
    icon: Brain,
    accent: "#22D4F5",
  },
  {
    step: "02",
    title: "Relationship Custody",
    content:
      "Timestamp, attribute, and protect every introduction with cryptographic custody. If a relationship produces a deal in three years, this record is your claim.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80",
    icon: Network,
    accent: "#C4972A",
  },
  {
    step: "03",
    title: "Blind Matching Engine",
    content:
      "Get matched with qualified counterparties based on intent — anonymously. Identities remain sealed until both parties consent to disclosure.",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&h=500&fit=crop&q=80",
    icon: Lock,
    accent: "#9B7CF8",
  },
  {
    step: "04",
    title: "Secure Deal Rooms",
    content:
      "NDA-gated workspaces with immutable audit trails. Every document access, version change, and signature event is cryptographically logged.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&q=80",
    icon: Building2,
    accent: "#059669",
  },
  {
    step: "05",
    title: "Attribution Economics",
    content:
      "Originators earn 40-60% of fees automatically. Follow-on deals compound your attribution. No negotiation, no intermediary.",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop&q=80",
    icon: TrendingUp,
    accent: "#C4972A",
  },
  {
    step: "06",
    title: "Compliance Passport",
    content:
      "KYB verified, OFAC screened, accredited — your compliance passport travels with every transaction. Share verification, don't duplicate it.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop&q=80",
    icon: Shield,
    accent: "#22D4F5",
  },
];

const AUTO_PLAY_MS = 5000;

export function FeaturesSection() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setCurrent(c => (c + 1) % PLATFORM_FEATURES.length);
          return 0;
        }
        return p + 100 / (AUTO_PLAY_MS / 100);
      });
    }, 100);
    return () => clearInterval(tick);
  }, []);

  const feat = PLATFORM_FEATURES[current];
  const Icon = feat.icon;

  return (
    <section id="features" className="py-24 md:py-32 bg-canvas-mid relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SmoothReveal>
          <div className="text-center mb-16 md:mb-20">
            <motion.p
              className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Platform Features
            </motion.p>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-serif">
              <SplitText>Everything You Need</SplitText>
            </h2>
          </div>
        </SmoothReveal>

        {/* FeatureSteps — ANAVI-adapted dark variant */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Left: Feature list */}
          <div className="order-2 lg:order-1 space-y-3">
            {PLATFORM_FEATURES.map((f, i) => {
              const FIcon = f.icon;
              const isActive = i === current;
              return (
                <motion.button
                  key={i}
                  className={cn(
                    "w-full flex items-start gap-5 p-5 rounded-xl text-left transition-all duration-300 cursor-pointer border",
                    isActive
                      ? "bg-white/[0.06] border-white/10"
                      : "bg-transparent border-transparent hover:bg-white/[0.03]"
                  )}
                  onClick={() => {
                    setCurrent(i);
                    setProgress(0);
                  }}
                  animate={{ opacity: isActive ? 1 : 0.45 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300",
                      isActive ? "bg-white/10" : "bg-white/5"
                    )}
                  >
                    <FIcon
                      className="w-5 h-5"
                      style={{
                        color: isActive ? f.accent : "rgba(255,255,255,0.3)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest"
                        style={{
                          color: isActive ? f.accent : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {f.step}
                      </span>
                      <h3
                        className={cn(
                          "text-base md:text-lg font-semibold transition-colors",
                          isActive ? "text-white" : "text-white/50"
                        )}
                      >
                        {f.title}
                      </h3>
                    </div>
                    {isActive && (
                      <motion.p
                        className="text-sm text-white/50 leading-relaxed"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {f.content}
                      </motion.p>
                    )}
                    {isActive && (
                      <div className="mt-3 h-0.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: f.accent,
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right: Feature visual */}
          <div className="order-1 lg:order-2 relative h-[280px] md:h-[400px] lg:h-[520px] rounded-2xl overflow-hidden lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                className="absolute inset-0 rounded-2xl overflow-hidden"
                initial={{ y: 60, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -60, opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <img
                  src={feat.image}
                  alt={feat.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060A12] via-[#060A12]/40 to-transparent" />
                {/* Feature badge */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5" style={{ color: feat.accent }} />
                    <span
                      className="text-xs uppercase tracking-widest font-semibold"
                      style={{ color: feat.accent }}
                    >
                      {feat.title}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed max-w-md">
                    {feat.content}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
