import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, useMotionValue, useAnimationFrame } from "framer-motion";
import { ReactNode, useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

// ============================================================================
// PREMIUM ANIMATION LIBRARY v2.0
// Ultra-premium animations for Awwwards-level experiences
// ============================================================================

// ============================================================================
// LIQUID GRADIENT BACKGROUND
// ============================================================================

export function LiquidGradient({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute w-[150%] h-[150%] -top-1/4 -left-1/4"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, oklch(0.65 0.19 230 / 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, oklch(0.55 0.15 160 / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, oklch(0.6 0.12 200 / 0.06) 0%, transparent 60%)
          `
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 60, repeat: Infinity, ease: "linear" },
          scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      <motion.div
        className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%]"
        style={{
          background: `
            radial-gradient(ellipse at 70% 30%, oklch(0.65 0.19 230 / 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 30% 70%, oklch(0.55 0.15 160 / 0.06) 0%, transparent 45%)
          `
        }}
        animate={{
          rotate: [360, 0],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          rotate: { duration: 45, repeat: Infinity, ease: "linear" },
          x: { duration: 25, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 20, repeat: Infinity, ease: "easeInOut" }
        }}
      />
    </div>
  );
}

// ============================================================================
// AURORA BACKGROUND
// ============================================================================

export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-[200%]"
          style={{
            background: `linear-gradient(${90 + i * 30}deg, 
              transparent 0%, 
              oklch(0.65 0.19 230 / ${0.02 + i * 0.008}) ${20 + i * 10}%, 
              oklch(0.55 0.15 160 / ${0.015 + i * 0.008}) ${50 + i * 5}%, 
              transparent 100%)`,
            filter: "blur(40px)",
          }}
          animate={{
            y: ["-50%", "0%", "-50%"],
            x: ["-10%", "10%", "-10%"],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// TEXT SCRAMBLE EFFECT
// ============================================================================

interface TextScrambleProps {
  children: string;
  className?: string;
  trigger?: boolean;
  duration?: number;
}

export function TextScramble({ children, className = "", trigger = true, duration = 1.5 }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(children);
  const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!trigger || !isInView) return;
    
    let iteration = 0;
    const totalIterations = children.length * 3;
    
    const interval = setInterval(() => {
      setDisplayText(
        children
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration / 3) return children[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      
      iteration++;
      if (iteration >= totalIterations) {
        clearInterval(interval);
        setDisplayText(children);
      }
    }, (duration * 1000) / totalIterations);

    return () => clearInterval(interval);
  }, [children, trigger, isInView, duration]);

  return (
    <span ref={ref} className={`font-mono ${className}`}>
      {displayText}
    </span>
  );
}

// ============================================================================
// 3D CARD TILT EFFECT
// ============================================================================

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export function Card3D({ children, className = "", intensity = 15, glare = true }: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setRotateX((-mouseY / (rect.height / 2)) * intensity);
    setRotateY((mouseX / (rect.width / 2)) * intensity);
    setGlarePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
      {glare && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
          }}
          animate={{ opacity: rotateX !== 0 || rotateY !== 0 ? 1 : 0 }}
        />
      )}
    </motion.div>
  );
}

// ============================================================================
// ELASTIC SPRING BUTTON
// ============================================================================

interface ElasticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ElasticButton({ children, className = "", onClick }: ElasticButtonProps) {
  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
    >
      <motion.span
        className="absolute inset-0 bg-white/10"
        initial={{ x: "-100%", skewX: "-15deg" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      {children}
    </motion.button>
  );
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function RippleButton({ children, className = "", onClick }: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1000);
    
    onClick?.();
  };

  return (
    <Button className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
      {children}
    </Button>
  );
}

// ============================================================================
// STAGGERED LIST
// ============================================================================

interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className = "", staggerDelay = 0.08 }: StaggeredListProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{
            duration: 0.6,
            delay: index * staggerDelay,
            ease: [0.215, 0.61, 0.355, 1]
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// MORPHING BLOB
// ============================================================================

export function MorphingBlob({ className = "", color = "oklch(0.72 0.14 70 / 0.2)" }: { className?: string; color?: string }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        background: color,
        filter: "blur(60px)",
      }}
      animate={{
        borderRadius: [
          "60% 40% 30% 70% / 60% 30% 70% 40%",
          "30% 60% 70% 40% / 50% 60% 30% 60%",
          "60% 40% 30% 70% / 60% 30% 70% 40%",
        ],
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ============================================================================
// FLOATING ELEMENTS
// ============================================================================

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}

export function FloatingElement({ children, className = "", duration = 4, distance = 20 }: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// GRADIENT TEXT
// ============================================================================

interface GradientTextProps {
  children: string;
  className?: string;
  animate?: boolean;
}

export function GradientText({ children, className = "", animate = true }: GradientTextProps) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, oklch(0.65 0.19 230), oklch(0.55 0.15 180), oklch(0.65 0.19 230))",
        backgroundSize: "200% 100%",
      }}
      animate={animate ? {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      } : undefined}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}

// ============================================================================
// SMOOTH REVEAL
// ============================================================================

interface SmoothRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
}

export function SmoothReveal({ children, className = "", direction = "up", delay = 0 }: SmoothRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 80 : direction === "down" ? -80 : 0,
      x: direction === "left" ? 80 : direction === "right" ? -80 : 0,
      filter: "blur(20px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: "blur(0px)",
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// TYPEWRITER EFFECT
// ============================================================================

interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function Typewriter({ text, className = "", speed = 50, delay = 0 }: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let index = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, speed, delay, isInView]);

  return (
    <span ref={ref} className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        |
      </motion.span>
    </span>
  );
}

// ============================================================================
// GLOWING BORDER
// ============================================================================

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export function GlowingBorder({ children, className = "", color = "oklch(0.65 0.19 230)" }: GlowingBorderProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover="hover"
    >
      <motion.div
        className="absolute -inset-[1px] opacity-0 rounded"
        style={{
          background: `linear-gradient(90deg, ${color}, oklch(0.55 0.15 180), ${color})`,
          backgroundSize: "200% 100%",
        }}
        variants={{
          hover: { opacity: 1 }
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
          opacity: { duration: 0.3 }
        }}
      />
      <div className="relative bg-background">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// PARTICLE BURST
// ============================================================================

interface ParticleBurstProps {
  trigger: boolean;
  x: number;
  y: number;
  count?: number;
}

export function ParticleBurst({ trigger, x, y, count = 20 }: ParticleBurstProps) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (360 / count) * i,
      distance: 50 + Math.random() * 100,
      size: 4 + Math.random() * 4,
      duration: 0.6 + Math.random() * 0.4,
    })), [count]
  );

  return (
    <AnimatePresence>
      {trigger && particles.map(particle => (
        <motion.div
          key={particle.id}
          className="fixed w-1 h-1 bg-accent pointer-events-none"
          style={{
            left: x,
            top: y,
            width: particle.size,
            height: particle.size,
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos(particle.angle * Math.PI / 180) * particle.distance,
            y: Math.sin(particle.angle * Math.PI / 180) * particle.distance,
            scale: 0,
            opacity: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: particle.duration, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>
  );
}

// ============================================================================
// SMOOTH COUNTER
// ============================================================================

interface SmoothCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function SmoothCounter({ value, className = "", prefix = "", suffix = "", duration = 2 }: SmoothCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// ============================================================================
// SCROLL VELOCITY
// ============================================================================

interface ScrollVelocityProps {
  children: ReactNode;
  className?: string;
  baseVelocity?: number;
}

export function ScrollVelocity({ children, className = "", baseVelocity = 5 }: ScrollVelocityProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useTransform(scrollY, [0, 1000], [0, 5]);
  const velocityFactor = useTransform(scrollVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(baseX, (v) => `${v}%`);

  useAnimationFrame((_, delta) => {
    const moveBy = baseVelocity * (delta / 1000);
    baseX.set(baseX.get() - moveBy);
    if (baseX.get() <= -100) {
      baseX.set(0);
    }
  });

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div className="flex whitespace-nowrap" style={{ x }}>
        <span className="flex-shrink-0 mr-8">{children}</span>
        <span className="flex-shrink-0 mr-8">{children}</span>
        <span className="flex-shrink-0 mr-8">{children}</span>
        <span className="flex-shrink-0 mr-8">{children}</span>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SPOTLIGHT EFFECT
// ============================================================================

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

export function Spotlight({ children, className = "" }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 400,
          height: 400,
          background: "radial-gradient(circle, oklch(0.65 0.19 230 / 0.12) 0%, transparent 70%)",
          left: position.x - 200,
          top: position.y - 200,
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  TextScrambleProps,
  Card3DProps,
  ElasticButtonProps,
  RippleButtonProps,
  StaggeredListProps,
  FloatingElementProps,
  GradientTextProps,
  SmoothRevealProps,
  TypewriterProps,
  GlowingBorderProps,
  ParticleBurstProps,
  SmoothCounterProps,
  ScrollVelocityProps,
  SpotlightProps,
};
