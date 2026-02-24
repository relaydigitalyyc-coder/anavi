import { BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Intelligence() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0A1628]/10 text-[#1E3A5F]">
        <BarChart3 className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-[#0A1628] md:text-3xl">
        Intelligence — Coming in Phase 2
      </h1>
      <p className="mt-4 text-[#1E3A5F]/80">
        Market depth, sector analytics, and deal flow intelligence are under development.
        You’ll be able to see intent volumes by vertical, geographic heat maps, and
        AI-powered market signals here.
      </p>
      <div className="mt-10">
        <Link href="/dashboard">
          <a
            className="inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2563EB" }}
          >
            Back to Dashboard
          </a>
        </Link>
      </div>
    </div>
  );
}
