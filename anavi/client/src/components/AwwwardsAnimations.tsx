import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence, MotionValue } from "framer-motion";
import { ReactNode, useRef, useEffect, useState, createContext, useContext } from "react";

// ============================================================================
// AWWWARDS-LEVEL ANIMATION LIBRARY
// Premium animations for luxury digital experiences
// Inspired by Bottega Veneta, Celine, Mercury, Apple
// ============================================================================

// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-accent z-[100] origin-left"
      style={{ scaleX }}
    />
  );
}

// ============================================================================
// MAGNETIC BUTTON EFFECT
// ============================================================================

interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function Magnetic({ children, className = "", strength = 0.3 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const x = (clientX - left - width / 2) * strength;
    const y = (clientY - top - height / 2) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// TEXT REVEAL ANIMATIONS
// ============================================================================

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  type?: "char" | "word" | "line";
}

export function TextReveal({ children, className = "", delay = 0, type = "word" }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (type === "char") {
    const chars = children.split("");
    return (
      <span ref={ref} className={className}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.02,
              ease: [0.215, 0.61, 0.355, 1]
            }}
            style={{ display: "inline-block" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    );
  }

  if (type === "word") {
    const words = children.split(" ");
    return (
      <span ref={ref} className={className}>
        {words.map((word, i) => (
          <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
            <motion.span
              initial={{ y: "100%" }}
              animate={isInView ? { y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: delay + i * 0.08,
                ease: [0.215, 0.61, 0.355, 1]
              }}
              style={{ display: "inline-block" }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 && "\u00A0"}
          </span>
        ))}
      </span>
    );
  }

  // Line reveal
  return (
    <span ref={ref} className={className} style={{ display: "block", overflow: "hidden" }}>
      <motion.span
        initial={{ y: "100%" }}
        animate={isInView ? { y: 0 } : {}}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.215, 0.61, 0.355, 1]
        }}
        style={{ display: "block" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// ============================================================================
// PARALLAX SCROLL EFFECT
// ============================================================================

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down";
}

export function Parallax({ children, className = "", speed = 0.5, direction = "up" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const setValues = () => {
      setElementTop(ref.current?.offsetTop || 0);
      setClientHeight(window.innerHeight);
    };
    setValues();
    window.addEventListener('resize', setValues);
    return () => window.removeEventListener('resize', setValues);
  }, []);

  const y = useTransform(
    scrollY,
    [elementTop - clientHeight, elementTop + clientHeight],
    direction === "up" ? [100 * speed, -100 * speed] : [-100 * speed, 100 * speed]
  );

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// FLOATING PARTICLES BACKGROUND
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function FloatingParticles({ count = 20, className = "" }: { count?: number; className?: string }) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5
    }))
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-accent/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MORPHING BACKGROUND SHAPES
// ============================================================================

export function MorphingShapes({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Shape 1 - Large floating square */}
      <motion.div
        className="absolute w-96 h-96 bg-accent/5 border border-accent/10"
        style={{ top: "10%", right: "5%" }}
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1, 0.9, 1],
          x: [0, 30, 0, -30, 0],
          y: [0, -20, 0, 20, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Shape 2 - Medium rectangle */}
      <motion.div
        className="absolute w-64 h-32 bg-foreground/3"
        style={{ bottom: "20%", left: "10%" }}
        animate={{
          rotate: [0, -45, 0, 45, 0],
          scale: [1, 1.2, 1, 0.8, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Shape 3 - Small accent square */}
      <motion.div
        className="absolute w-24 h-24 bg-accent/10"
        style={{ top: "40%", left: "30%" }}
        animate={{
          y: [0, -50, 0, 50, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Shape 4 - Outline square */}
      <motion.div
        className="absolute w-48 h-48 border-2 border-border"
        style={{ bottom: "10%", right: "20%" }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({ 
  value, 
  duration = 2, 
  prefix = "", 
  suffix = "", 
  className = "",
  decimals = 0 
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const startValue = 0;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (value - startValue) * easeOutQuart;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}{suffix}
    </span>
  );
}

// ============================================================================
// STAGGERED GRID REVEAL
// ============================================================================

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  columns?: number;
  staggerDelay?: number;
}

export function StaggeredGrid({ children, className = "", columns = 3, staggerDelay = 0.1 }: StaggeredGridProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ 
        display: "grid", 
        gridTemplateColumns: `repeat(${columns}, 1fr)` 
      }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{
            duration: 0.6,
            delay: i * staggerDelay,
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
// HOVER CARD EFFECT
// ============================================================================

interface HoverCardProps {
  children: ReactNode;
  className?: string;
}

export function HoverCard({ children, className = "" }: HoverCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    setRotateX((y - 0.5) * -10);
    setRotateY((x - 0.5) * 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// ANIMATED BORDER
// ============================================================================

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedBorder({ children, className = "" }: AnimatedBorderProps) {
  return (
    <div className={`relative group ${className}`}>
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className="absolute top-0 left-0 w-full h-[1px] bg-accent"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "left" }}
        />
        <motion.div
          className="absolute top-0 right-0 w-[1px] h-full bg-accent"
          initial={{ scaleY: 0 }}
          whileHover={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ transformOrigin: "top" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-full h-[1px] bg-accent"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ transformOrigin: "right" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[1px] h-full bg-accent"
          initial={{ scaleY: 0 }}
          whileHover={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          style={{ transformOrigin: "bottom" }}
        />
      </motion.div>
      {children}
    </div>
  );
}

// ============================================================================
// REVEAL ON SCROLL
// ============================================================================

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
}

export function RevealOnScroll({ 
  children, 
  className = "", 
  direction = "up",
  delay = 0,
  duration = 0.6
}: RevealOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directions = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{
        duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
}

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  const baseClass = "bg-muted animate-pulse";
  const variantClass = {
    text: "h-4 rounded-none",
    rect: "rounded-none",
    circle: "rounded-full"
  };

  return (
    <motion.div
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ============================================================================
// PREMIUM LOADING SPINNER
// ============================================================================

export function PremiumSpinner({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 border border-border"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-1 border border-accent"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-2 bg-accent"
        animate={{ scale: [1, 0.8, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ============================================================================
// CURSOR FOLLOWER (Global)
// ============================================================================

export function CursorFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [data-cursor-hover]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="fixed w-2 h-2 bg-accent pointer-events-none z-[9999] mix-blend-difference"
        animate={{
          x: position.x - 4,
          y: position.y - 4,
          scale: isHovering ? 3 : 1
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />
      {/* Cursor ring */}
      <motion.div
        className="fixed w-8 h-8 border border-accent/50 pointer-events-none z-[9998]"
        animate={{
          x: position.x - 16,
          y: position.y - 16,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      />
    </>
  );
}

// ============================================================================
// ANIMATED LINE DIVIDER
// ============================================================================

interface AnimatedDividerProps {
  className?: string;
  direction?: "left" | "right" | "center";
}

export function AnimatedDivider({ className = "", direction = "left" }: AnimatedDividerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const origins = {
    left: "left",
    right: "right",
    center: "center"
  };

  return (
    <motion.div
      ref={ref}
      className={`h-px bg-accent ${className}`}
      initial={{ scaleX: 0 }}
      animate={isInView ? { scaleX: 1 } : {}}
      transition={{ duration: 1, ease: [0.215, 0.61, 0.355, 1] }}
      style={{ transformOrigin: origins[direction] }}
    />
  );
}

// ============================================================================
// MARQUEE TEXT
// ============================================================================

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Marquee({ children, speed = 20, className = "" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, "-50%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <span className="flex-shrink-0">{children}</span>
        <span className="flex-shrink-0">{children}</span>
      </motion.div>
    </div>
  );
}

// ============================================================================
// GLOW EFFECT
// ============================================================================

interface GlowProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export function Glow({ children, className = "", color = "oklch(0.72 0.14 70)" }: GlowProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover="hover"
    >
      <motion.div
        className="absolute inset-0 blur-xl opacity-0"
        style={{ backgroundColor: color }}
        variants={{
          hover: { opacity: 0.3 }
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// SPLIT TEXT ANIMATION
// ============================================================================

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export function SplitText({ children, className = "", delay = 0 }: SplitTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const words = children.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", rotateX: -90 }}
            animate={isInView ? { y: 0, rotateX: 0 } : {}}
            transition={{
              duration: 0.8,
              delay: delay + wordIndex * 0.1,
              ease: [0.215, 0.61, 0.355, 1]
            }}
          >
            {word}
          </motion.span>
          {wordIndex < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
}

// ============================================================================
// CHART REVEAL ANIMATION
// ============================================================================

interface ChartRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ChartReveal({ children, className = "", delay = 0 }: ChartRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Reveal mask */}
      <motion.div
        className="absolute inset-0 bg-background z-10"
        initial={{ x: 0 }}
        animate={isInView ? { x: "100%" } : {}}
        transition={{
          duration: 1,
          delay,
          ease: [0.215, 0.61, 0.355, 1]
        }}
      />
      {children}
    </motion.div>
  );
}

// ============================================================================
// NOTIFICATION BADGE ANIMATION
// ============================================================================

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`absolute -top-1 -right-1 w-5 h-5 bg-accent text-foreground text-xs flex items-center justify-center ${className}`}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// ANIMATED GRADIENT BACKGROUND
// ============================================================================

export function AnimatedGradient({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 50%, oklch(0.72 0.14 70 / 0.05) 0%, transparent 50%)"
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  type MagneticProps,
  type TextRevealProps,
  type ParallaxProps,
  type AnimatedCounterProps,
  type StaggeredGridProps,
  type HoverCardProps,
  type AnimatedBorderProps,
  type RevealOnScrollProps,
  type SkeletonProps,
  type AnimatedDividerProps,
  type MarqueeProps,
  type GlowProps,
  type SplitTextProps,
  type ChartRevealProps,
  type NotificationBadgeProps
};
