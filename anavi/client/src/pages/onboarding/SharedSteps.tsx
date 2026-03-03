import { Lock, Check, Shield, BarChart3, Eye } from "lucide-react";
import { InputField, SelectField } from "./FormPrimitives";
import type { StepDef } from "./types";

function CustodyReceipt() {
  const id = `CUST-${Date.now().toString(36).toUpperCase()}`;
  const ts = new Date().toISOString();
  return (
    <div className="rounded-xl border border-[#059669]/30 bg-[#059669]/5 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#059669]/10">
        <Lock className="h-6 w-6 text-[#059669]" />
      </div>
      <p className="text-lg font-bold text-white">Relationship Secured</p>
      <p className="mt-1 text-xs text-white/60">Custody ID: {id}</p>
      <p className="text-xs text-white/60">Timestamp: {ts}</p>
      <p className="mt-3 text-sm font-medium text-[#059669]">
        Your relationship is now protected. Forever.
      </p>
    </div>
  );
}

function ProgressBar({
  steps,
  current,
}: {
  steps: StepDef[];
  current: number;
}) {
  const remaining = steps.slice(current).reduce((a, s) => a + s.minutes, 0);
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1">
        {steps.map((s, i) => {
          const completed = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-3 w-3 shrink-0 rounded-full transition-all duration-500 ${
                    completed
                      ? "progress-node-complete"
                      : active
                        ? "progress-node-active"
                        : "progress-node-pending"
                  }`}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded transition ${
                      completed ? "bg-[#C4972A]" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <span
                className={`hidden text-[10px] font-medium sm:block ${
                  active
                    ? "text-[#22D4F5]"
                    : completed
                      ? "text-[#C4972A]"
                      : "text-white/25"
                }`}
              >
                {s.name}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-right font-data-hud text-[10px] text-white/40">
        ~{remaining} min remaining
      </p>
    </div>
  );
}

function IdentityStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField
        label="Full Name"
        value={(formData.fullName as string) ?? ""}
        onChange={v => set("fullName", v)}
        required
        placeholder="Jane Smith"
      />
      <InputField
        label="Email Address"
        value={(formData.email as string) ?? ""}
        onChange={v => set("email", v)}
        type="email"
        required
        placeholder="jane@example.com"
      />
      <div>
        <InputField
          label="Phone Number"
          value={(formData.phone as string) ?? ""}
          onChange={v => set("phone", v)}
          type="tel"
          placeholder="+1 (555) 000-0000"
        />
        <p className="mt-1 text-xs text-white/40">
          We may send a verification SMS
        </p>
      </div>
      <SelectField
        label="Country of Operation"
        value={(formData.country as string) ?? ""}
        onChange={v => set("country", v)}
        options={[
          "United States",
          "United Kingdom",
          "Canada",
          "UAE",
          "Singapore",
          "Switzerland",
          "Australia",
          "Germany",
          "Other",
        ]}
      />
    </div>
  );
}

function DashboardIntroStep({ onGo }: { onGo: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#059669]/10">
        <Check className="h-8 w-8 text-[#059669]" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-white">You&apos;re ready.</h3>
      <ul className="mx-auto mb-8 max-w-sm space-y-3 text-left text-sm text-white/80">
        <li className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> Your
          relationships are custodied and timestamped
        </li>
        <li className="flex items-start gap-2">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> AI
          matching is already scanning for opportunities
        </li>
        <li className="flex items-start gap-2">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> Your
          dashboard tracks everything in real time
        </li>
      </ul>
      <button
        onClick={onGo}
        className="btn-gold cursor-pointer px-10 text-base"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

function MarketDepthStep({ onGo }: { onGo: () => void }) {
  const markets = [
    { sector: "Solar / Renewable", buyers: 47, sellers: 12 },
    { sector: "Oil & Gas", buyers: 23, sellers: 8 },
    { sector: "Real Estate", buyers: 34, sellers: 19 },
    { sector: "Infrastructure", buyers: 18, sellers: 6 },
    { sector: "Gold / Mining", buyers: 14, sellers: 5 },
  ];
  return (
    <div>
      <p className="mb-4 text-sm text-white/80">
        Live market depth across key sectors:
      </p>
      <div className="mb-8 grid gap-3">
        {markets.map(m => (
          <div
            key={m.sector}
            className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-4 py-3"
          >
            <span className="text-sm font-medium text-white">{m.sector}</span>
            <div className="flex gap-4 text-xs">
              <span className="text-[#2563EB]">{m.buyers} buyers</span>
              <span className="text-[#C4972A]">{m.sellers} sellers</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={onGo}
          className="btn-gold cursor-pointer px-10 text-base"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function BlindMatchingIntroStep({ onGo }: { onGo: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB]/10">
        <Eye className="h-8 w-8 text-[#2563EB]" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-white">Blind Matching</h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-white/80">
        ANAVI uses blind matching to protect your competitive position.
        Investors see your project parameters — sector, size, stage, returns —
        without identifying details until both parties opt in. Your project
        identity stays confidential until you choose to reveal it.
      </p>
      <div className="mx-auto mb-8 grid max-w-sm gap-3">
        {[
          "Your identity stays hidden",
          "Parameters are matched by AI",
          "Both parties must opt in to connect",
        ].map(t => (
          <div
            key={t}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-left text-sm text-white/80"
          >
            <Shield className="h-4 w-4 shrink-0 text-[#059669]" /> {t}
          </div>
        ))}
      </div>
      <button
        onClick={onGo}
        className="btn-gold cursor-pointer px-10 text-base"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export {
  CustodyReceipt,
  ProgressBar,
  IdentityStep,
  DashboardIntroStep,
  MarketDepthStep,
  BlindMatchingIntroStep,
};