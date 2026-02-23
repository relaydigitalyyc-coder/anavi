import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";

interface FVMCelebrationProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
  onClose?: () => void;
  icon?: ReactNode;
}

const CONFETTI_COLORS = ["#C4972A", "#0A1628", "#2563EB", "#D4A73A", "#059669"];

function ConfettiPiece({ index }: { index: number }) {
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 10;
  const delay = Math.random() * 1.5;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const rotation = Math.random() * 360;

  return (
    <div
      className="animate-confetti absolute top-0 rounded-sm"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        transform: `rotate(${rotation}deg)`,
      }}
    />
  );
}

export default function FVMCelebration({
  title,
  subtitle,
  ctaLabel = "Continue",
  onCta,
  onClose,
  icon,
}: FVMCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const handleClose = onClose ?? onCta ?? (() => {});

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      handleClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose, onCta]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#0A1628]/80 backdrop-blur-sm"
        onClick={() => {
          setVisible(false);
          handleClose();
        }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-2xl animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#059669]/10">
          {icon ?? <Lock className="h-8 w-8 text-[#059669]" />}
        </div>

        <h2 className="mb-3 text-2xl font-bold text-[#0A1628]">{title}</h2>
        <p className="mb-2 text-sm text-[#0A1628]/70">{subtitle}</p>
        <p className="mb-8 text-xs font-medium tracking-wide text-[#C4972A]">
          Welcome to serious private markets.
        </p>

        <button
          onClick={() => {
            setVisible(false);
            handleClose();
          }}
          className="btn-gold w-full cursor-pointer text-base"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
