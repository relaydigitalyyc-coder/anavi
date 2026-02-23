import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
  enter: {
    opacity: 1,
    scale: 1.0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={{
        enter: { duration: 0.35, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] },
        exit:  { duration: 0.20, ease: [0.4, 0, 1, 1] },
        default: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animation wrapper
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerContainer({ children, className = "" }: StaggerContainerProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const itemVariants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: "blur(6px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div 
      variants={itemVariants} 
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in on scroll
interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInView({ children, className = "", delay = 0 }: FadeInViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover
interface ScaleHoverProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function ScaleHover({ children, className = "", scale = 1.02 }: ScaleHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide in from direction
interface SlideInProps {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
}

export function SlideIn({ children, className = "", direction = "up", delay = 0 }: SlideInProps) {
  const directionOffset = {
    left: { x: -40, y: 0 },
    right: { x: 40, y: 0 },
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
