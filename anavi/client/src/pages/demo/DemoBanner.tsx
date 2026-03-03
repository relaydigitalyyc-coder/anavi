import { Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { C } from './atoms';

export function DemoBanner({ onRestartTour }: { onRestartTour?: () => void }) {
  return (
    <div
      className="flex h-10 shrink-0 items-center justify-center gap-6 text-sm text-white"
      style={{ backgroundColor: C.blue }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>
        You are in <strong>Demo Mode</strong> — All data is simulated.
      </span>
      {onRestartTour && (
        <button
          type="button"
          onClick={onRestartTour}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          Restart Tour
        </button>
      )}
      <Link
        href="/register"
        className="animate-cta-pulse inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold underline underline-offset-2 hover:no-underline"
        data-tour="apply"
      >
        Apply for Access <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}