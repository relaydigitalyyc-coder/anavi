import { Compass } from "lucide-react";

interface RestartTourBannerProps {
  onRestart: () => void;
  onDismiss?: () => void;
}

export function RestartTourBanner({ onRestart, onDismiss }: RestartTourBannerProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C4972A]/30 bg-[#C4972A]/5 px-4 py-3"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C4972A]/15">
          <Compass className="h-4 w-4 text-[#C4972A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0A1628]">New here?</p>
          <p className="text-xs text-[#1E3A5F]/70">Take a 2-minute tour of the platform</p>
        </div>
      </div>
      <div className="flex gap-2">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#1E3A5F]/60 hover:bg-[#0A1628]/5"
          >
            Dismiss
          </button>
        )}
        <button
          onClick={onRestart}
          className="btn-gold rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Restart Tour
        </button>
      </div>
    </div>
  );
}
