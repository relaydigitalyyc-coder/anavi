import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Handshake,
  TrendingUp,
  Building2,
  Landmark,
  Target,
  Lock,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
  Shield,
  BarChart3,
  Eye,
} from "lucide-react";
import FVMCelebration from "@/components/FVMCelebration";
import { CustodyReceipt as CustodyReceiptModal } from "@/components/CustodyReceipt";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Persona =
  | "originator"
  | "investor"
  | "developer"
  | "allocator"
  | "acquirer";

interface PersonaTile {
  id: Persona;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface StepDef {
  name: string;
  minutes: number;
  benefit: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "anavi_onboarding";

const PERSONAS: PersonaTile[] = [
  {
    id: "originator",
    label: "Deal Originator / Broker",
    icon: Handshake,
    description:
      "I source deals and introduce buyers to sellers. I want my relationships protected.",
  },
  {
    id: "investor",
    label: "Investor / Family Office",
    icon: TrendingUp,
    description:
      "I deploy capital into private deals. I want verified deal flow without public exposure.",
  },
  {
    id: "developer",
    label: "Project Developer",
    icon: Building2,
    description:
      "I develop projects and need qualified capital without tipping off competitors.",
  },
  {
    id: "allocator",
    label: "Institutional Allocator",
    icon: Landmark,
    description:
      "I manage a fund and deploy capital systematically at scale.",
  },
  {
    id: "acquirer",
    label: "Strategic Acquirer",
    icon: Target,
    description:
      "I'm a corporate acquirer seeking acquisition targets confidentially.",
  },
];

const STEPS: Record<Persona, StepDef[]> = {
  originator: [
    { name: "Identity", minutes: 3, benefit: "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims." },
    { name: "Business Profile", minutes: 2, benefit: "Your deal profile enables AI matching against $13T in private market deal flow." },
    { name: "First Relationship", minutes: 3, benefit: "Upload your first relationship. Receive a custody receipt — your timestamped, signed attribution claim." },
    { name: "Upgrade Prompt", minutes: 2, benefit: "Tier 2 unlocks whitelist status: enhanced verification, priority matching, and institutional counterparty access." },
    { name: "Dashboard Intro", minutes: 1, benefit: "Your operating system is ready. Every introduction you make from here is custodied." },
  ],
  investor: [
    { name: "Identity", minutes: 3, benefit: "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims." },
    { name: "Investment Profile", minutes: 4, benefit: "Defines your investment thesis. ANAVI's matching engine runs on this intent — anonymized, sealed, and matched against verified counterparties only." },
    { name: "KYB / KYC", minutes: 4, benefit: "Your compliance passport. It travels with every deal you touch — so counterparties never have to run their own check on you." },
    { name: "First Intent", minutes: 2, benefit: "Broadcast your investment intent to verified counterparties — anonymized until mutual consent." },
    { name: "Market Depth", minutes: 1, benefit: "See the depth of opportunities waiting for your capital." },
  ],
  developer: [
    { name: "Identity", minutes: 3, benefit: "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims." },
    { name: "Project Profile", minutes: 4, benefit: "Your raise profile, sealed. Matched to qualified capital without disclosing your identity until you consent." },
    { name: "Verification", minutes: 3, benefit: "KYB verified, OFAC clean, accredited confirmed — your compliance passport travels with every transaction." },
    { name: "Capital Intent", minutes: 2, benefit: "Signal your raise to qualified investors — anonymous until you authorize disclosure." },
    { name: "Blind Matching", minutes: 1, benefit: "Your thesis, protected until the moment you choose to disclose it." },
  ],
  allocator: [
    { name: "Identity", minutes: 3, benefit: "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims." },
    { name: "Fund Profile", minutes: 4, benefit: "Your fund mandate drives systematic deal matching against verified counterparties only." },
    { name: "Compliance", minutes: 4, benefit: "Your compliance passport enables institutional-grade deal flow without duplicated due diligence." },
    { name: "First Allocation", minutes: 2, benefit: "Define your first allocation target — matched against verified operators, blind until consent." },
    { name: "Pipeline Preview", minutes: 1, benefit: "See the institutional pipeline awaiting your capital." },
  ],
  acquirer: [
    { name: "Identity", minutes: 3, benefit: "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims." },
    { name: "Acquisition Profile", minutes: 4, benefit: "Define your acquisition thesis for confidential matching — your intent stays sealed until mutual consent." },
    { name: "Due Diligence", minutes: 3, benefit: "Pre-configure your compliance requirements. Share them once — access them everywhere on ANAVI." },
    { name: "First Target Intent", minutes: 2, benefit: "Signal your acquisition interest to verified sellers — anonymized until both parties consent." },
    { name: "Target Pipeline", minutes: 1, benefit: "Preview acquisition targets matching your criteria — every counterparty pre-verified." },
  ],
};

const VERTICALS = ["Oil & Gas", "Gold / Mining", "Solar / Renewable", "Real Estate", "M&A", "Infrastructure", "Other"];
const ASSET_TYPES = ["Real Estate", "Private Equity", "Private Credit", "Commodities", "Infrastructure", "Venture Capital", "Digital Assets"];
const GEOGRAPHIES = ["North America", "Europe", "Middle East", "Asia Pacific", "Latin America", "Africa"];
const DEAL_STAGES = ["RTB (Ready to Build)", "Development", "Operating"];
const DEAL_SIZES = ["< $1M", "$1M - $5M", "$5M - $25M", "$25M - $100M", "$100M - $500M", "$500M+"];
const BUSINESS_STRUCTURES = ["Sole Proprietor", "LLC", "Corporation", "Partnership", "Trust", "Other"];
const PROJECT_TYPES = ["Solar Farm", "Wind Farm", "Real Estate Development", "Mining Operation", "Infrastructure", "Mixed Use", "Other"];
const DEV_STAGES = ["Pre-Permit", "Permitted", "Shovel-Ready", "Under Construction", "Operational"];
const DEAL_STRUCTURES = ["Equity", "Debt", "Joint Venture", "Hybrid"];
const TIMELINES = ["< 6 months", "6-12 months", "1-2 years", "2-5 years", "5+ years"];
const FUND_STRATEGIES = ["Value", "Growth", "Income", "Opportunistic", "Core", "Core-Plus"];
const REVENUE_RANGES = ["< $5M", "$5M - $25M", "$25M - $100M", "$100M - $500M", "$500M+"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadProgress(): { persona: Persona | null; step: number; formData: Record<string, unknown> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { persona: null, step: 0, formData: {} };
}

function saveProgress(persona: Persona | null, step: number, formData: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ persona, step, formData }));
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/90">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-[#D1DCF0] bg-white px-4 text-sm text-[#0A1628] outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/90">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-lg border border-[#D1DCF0] bg-white px-4 text-sm text-[#0A1628] outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
      >
        <option value="">{placeholder ?? "Select..."}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectChips({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-white/90">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[#2563EB] text-white"
                  : "border border-[#D1DCF0] bg-white text-[#0A1628]/70 hover:border-[#2563EB]/40"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/90">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-[#D1DCF0] bg-white px-4 py-3 text-sm text-[#0A1628] outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
      />
    </label>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-white/90">{label}</span>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
              value === opt
                ? "border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]"
                : "border-[#D1DCF0] bg-white text-[#0A1628]/70 hover:border-[#2563EB]/40"
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                value === opt ? "border-[#2563EB]" : "border-[#D1DCF0]"
              }`}
            >
              {value === opt && <div className="h-2 w-2 rounded-full bg-[#2563EB]" />}
            </div>
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function UploadZone({ label }: { label: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-white/90">{label}</span>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/30 bg-white/5 px-6 py-8 text-center transition hover:border-[#2563EB]/50">
        <Upload className="h-6 w-6 text-[#2563EB]" />
        {fileName ? (
          <span className="text-sm font-medium text-[#059669]">{fileName}</span>
        ) : (
          <>
            <span className="text-sm text-white/70">Drag & drop or click to upload</span>
            <span className="text-xs text-white/50">PDF, JPG, PNG up to 10MB</span>
          </>
        )}
        <input
          type="file"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFileName(f.name);
          }}
        />
      </label>
    </div>
  );
}

function BenefitCard({ text }: { text: string }) {
  return (
    <div className="mb-6 rounded-lg bg-white/5 border border-white/10 px-4 py-3">
      <p className="text-sm text-[#22D4F5]">{text}</p>
    </div>
  );
}

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

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

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
                  active ? "text-[#22D4F5]" : completed ? "text-[#C4972A]" : "text-white/25"
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

// ---------------------------------------------------------------------------
// Step content renderers per persona
// ---------------------------------------------------------------------------

function IdentityStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField label="Full Name" value={(formData.fullName as string) ?? ""} onChange={(v) => set("fullName", v)} required placeholder="Jane Smith" />
      <InputField label="Email Address" value={(formData.email as string) ?? ""} onChange={(v) => set("email", v)} type="email" required placeholder="jane@example.com" />
      <div>
        <InputField label="Phone Number" value={(formData.phone as string) ?? ""} onChange={(v) => set("phone", v)} type="tel" placeholder="+1 (555) 000-0000" />
        <p className="mt-1 text-xs text-white/40">We may send a verification SMS</p>
      </div>
      <SelectField label="Country of Operation" value={(formData.country as string) ?? ""} onChange={(v) => set("country", v)} options={["United States", "United Kingdom", "Canada", "UAE", "Singapore", "Switzerland", "Australia", "Germany", "Other"]} />
    </div>
  );
}

// ---- ORIGINATOR STEPS ----

function OriginatorBusinessStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField label="Business Name" value={(formData.businessName as string) ?? ""} onChange={(v) => set("businessName", v)} required placeholder="Acme Brokerage LLC" />
      <SelectField label="Business Structure" value={(formData.businessStructure as string) ?? ""} onChange={(v) => set("businessStructure", v)} options={BUSINESS_STRUCTURES} />
      <MultiSelectChips label="Primary Deal Verticals" options={VERTICALS} selected={((formData.verticals as string[]) ?? [])} onChange={(v) => set("verticals", v)} />
      <SelectField label="Typical Deal Size" value={(formData.dealSize as string) ?? ""} onChange={(v) => set("dealSize", v)} options={DEAL_SIZES} />
      <InputField label="Years in Industry" value={(formData.yearsIndustry as string) ?? ""} onChange={(v) => set("yearsIndustry", v)} type="number" placeholder="10" />
      <InputField label="LinkedIn URL (optional)" value={(formData.linkedin as string) ?? ""} onChange={(v) => set("linkedin", v)} placeholder="https://linkedin.com/in/..." />
    </div>
  );
}

function OriginatorRelationshipStep({
  formData,
  set,
  showInlineReceipt,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
  showInlineReceipt: boolean;
}) {
  if (showInlineReceipt) return <CustodyReceipt />;
  return (
    <div className="space-y-5">
      <RadioGroup label="Relationship Type" options={["Buyer", "Seller", "Investor", "Developer", "Other"]} value={(formData.relType as string) ?? ""} onChange={(v) => set("relType", v)} />
      <SelectField label="Sector" value={(formData.relSector as string) ?? ""} onChange={(v) => set("relSector", v)} options={VERTICALS} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Min Deal Size" value={(formData.relMinSize as string) ?? ""} onChange={(v) => set("relMinSize", v)} placeholder="$1M" />
        <InputField label="Max Deal Size" value={(formData.relMaxSize as string) ?? ""} onChange={(v) => set("relMaxSize", v)} placeholder="$50M" />
      </div>
      <MultiSelectChips label="Geographic Focus" options={GEOGRAPHIES} selected={((formData.relGeo as string[]) ?? [])} onChange={(v) => set("relGeo", v)} />
      <TextArea label="Notes" value={(formData.relNotes as string) ?? ""} onChange={(v) => set("relNotes", v)} placeholder="Any relevant context about this relationship..." />
    </div>
  );
}

function OriginatorUpgradeStep() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/20 bg-white/5 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Current — Tier 1</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#059669]" /> Relationship custody</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#059669]" /> Basic AI matching</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#059669]" /> 5 relationships/month</li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-[#C4972A] bg-[#C4972A]/10 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#C4972A]">Upgrade — Tier 2</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#C4972A]" /> Priority deal room access</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#C4972A]" /> Unlimited relationships</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#C4972A]" /> Advanced AI analytics</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#C4972A]" /> Commission tracking</li>
          </ul>
        </div>
      </div>
      <UploadZone label="Business Registration Document" />
      <UploadZone label="Government-Issued ID" />
      <p className="text-center text-xs text-white/40">You can skip this and complete verification later from Settings.</p>
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
        <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> Your relationships are custodied and timestamped</li>
        <li className="flex items-start gap-2"><BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> AI matching is already scanning for opportunities</li>
        <li className="flex items-start gap-2"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> Your dashboard tracks everything in real time</li>
      </ul>
      <button onClick={onGo} className="btn-gold cursor-pointer px-10 text-base">
        Go to Dashboard
      </button>
    </div>
  );
}

// ---- INVESTOR STEPS ----

function InvestorProfileStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <MultiSelectChips label="Asset Types of Interest" options={ASSET_TYPES} selected={((formData.assetTypes as string[]) ?? [])} onChange={(v) => set("assetTypes", v)} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Min Ticket Size" value={(formData.ticketMin as string) ?? ""} onChange={(v) => set("ticketMin", v)} placeholder="$500K" />
        <InputField label="Max Ticket Size" value={(formData.ticketMax as string) ?? ""} onChange={(v) => set("ticketMax", v)} placeholder="$25M" />
      </div>
      <SelectField label="Investment Timeline" value={(formData.investTimeline as string) ?? ""} onChange={(v) => set("investTimeline", v)} options={TIMELINES} />
      <MultiSelectChips label="Geographic Preferences" options={GEOGRAPHIES} selected={((formData.geoPrefs as string[]) ?? [])} onChange={(v) => set("geoPrefs", v)} />
      <InputField label="Target IRR (%)" value={(formData.targetIRR as string) ?? ""} onChange={(v) => set("targetIRR", v)} type="number" placeholder="15" />
      <SelectField label="Deal Stage Preference" value={(formData.dealStage as string) ?? ""} onChange={(v) => set("dealStage", v)} options={DEAL_STAGES} />
    </div>
  );
}

function InvestorKYCStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  const questions = [
    "Are you or any beneficial owners a Politically Exposed Person (PEP)?",
    "Has your entity ever been subject to sanctions or regulatory action?",
    "Do you have an existing AML/KYC program in place?",
    "Are the funds sourced from legitimate, documented business activities?",
  ];
  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <RadioGroup key={i} label={q} options={["Yes", "No"]} value={(formData[`aml_${i}`] as string) ?? ""} onChange={(v) => set(`aml_${i}`, v)} />
      ))}
      <SelectField label="Source of Funds" value={(formData.sourceOfFunds as string) ?? ""} onChange={(v) => set("sourceOfFunds", v)} options={["Business Profits", "Investment Returns", "Inheritance", "Real Estate", "Salary / Employment", "Other"]} />
      <RadioGroup label="Accredited Investor Status" options={["Accredited", "Qualified Purchaser", "Institutional", "Non-Accredited"]} value={(formData.accreditedStatus as string) ?? ""} onChange={(v) => set("accreditedStatus", v)} />
      <UploadZone label="Supporting Documentation" />
    </div>
  );
}

function IntentCreationStep({
  formData,
  set,
  intentType,
  showResult,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
  intentType: string;
  showResult: boolean;
}) {
  if (showResult) {
    const matchCount = 3 + Math.floor(Math.random() * 13);
    return (
      <div className="rounded-xl border border-[#059669]/30 bg-[#059669]/5 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]/10">
          <Target className="h-6 w-6 text-[#2563EB]" />
        </div>
        <p className="text-lg font-bold text-white">Intent Created</p>
        <p className="mt-2 text-sm text-white/80">
          Your intent matches <span className="font-bold text-[#2563EB]">{matchCount}</span> verified opportunities
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-[#2563EB]/5 border border-[#2563EB]/15 px-4 py-2">
        <span className="text-xs font-medium text-[#2563EB]">Intent type: {intentType}</span>
      </div>
      <InputField label="Title" value={(formData.intentTitle as string) ?? ""} onChange={(v) => set("intentTitle", v)} placeholder="e.g. Solar project equity investment" required />
      <TextArea label="Description" value={(formData.intentDesc as string) ?? ""} onChange={(v) => set("intentDesc", v)} placeholder="Describe what you're looking for..." />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Min Value" value={(formData.intentMin as string) ?? ""} onChange={(v) => set("intentMin", v)} placeholder="$1M" />
        <InputField label="Max Value" value={(formData.intentMax as string) ?? ""} onChange={(v) => set("intentMax", v)} placeholder="$25M" />
      </div>
      <SelectField label="Target Timeline" value={(formData.intentTimeline as string) ?? ""} onChange={(v) => set("intentTimeline", v)} options={TIMELINES} />
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
      <p className="mb-4 text-sm text-white/80">Live market depth across key sectors:</p>
      <div className="mb-8 grid gap-3">
        {markets.map((m) => (
          <div key={m.sector} className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-4 py-3">
            <span className="text-sm font-medium text-white">{m.sector}</span>
            <div className="flex gap-4 text-xs">
              <span className="text-[#2563EB]">{m.buyers} buyers</span>
              <span className="text-[#C4972A]">{m.sellers} sellers</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button onClick={onGo} className="btn-gold cursor-pointer px-10 text-base">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ---- DEVELOPER STEPS ----

function DeveloperProjectStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <SelectField label="Project Type" value={(formData.projectType as string) ?? ""} onChange={(v) => set("projectType", v)} options={PROJECT_TYPES} />
      <SelectField label="Development Stage" value={(formData.devStage as string) ?? ""} onChange={(v) => set("devStage", v)} options={DEV_STAGES} />
      <InputField label="Project Location" value={(formData.projectLocation as string) ?? ""} onChange={(v) => set("projectLocation", v)} placeholder="City, State / Country" />
      <InputField label="Capital Requirement" value={(formData.capitalReq as string) ?? ""} onChange={(v) => set("capitalReq", v)} placeholder="$10M" />
      <RadioGroup label="Preferred Deal Structure" options={DEAL_STRUCTURES} value={(formData.dealStructure as string) ?? ""} onChange={(v) => set("dealStructure", v)} />
      <SelectField label="Timeline" value={(formData.projectTimeline as string) ?? ""} onChange={(v) => set("projectTimeline", v)} options={TIMELINES} />
    </div>
  );
}

function DeveloperVerificationStep() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70">Upload project documentation to fast-track verification. Verified projects receive 3× more investor engagement.</p>
      <UploadZone label="Permits / Interconnection Agreement" />
      <UploadZone label="Financial Model" />
      <UploadZone label="Legal Entity Documentation" />
      <p className="text-center text-xs text-white/40">You can skip uploads and complete verification later.</p>
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
        ANAVI uses blind matching to protect your competitive position. Investors see your project parameters — sector, size, stage, returns — without identifying details until both parties opt in. Your project identity stays confidential until you choose to reveal it.
      </p>
      <div className="mx-auto mb-8 grid max-w-sm gap-3">
        {["Your identity stays hidden", "Parameters are matched by AI", "Both parties must opt in to connect"].map((t) => (
          <div key={t} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-left text-sm text-white/80">
            <Shield className="h-4 w-4 shrink-0 text-[#059669]" /> {t}
          </div>
        ))}
      </div>
      <button onClick={onGo} className="btn-gold cursor-pointer px-10 text-base">
        Go to Dashboard
      </button>
    </div>
  );
}

// ---- ALLOCATOR STEPS ----

function AllocatorFundStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField label="Fund Name" value={(formData.fundName as string) ?? ""} onChange={(v) => set("fundName", v)} placeholder="Alpha Capital Partners" required />
      <InputField label="AUM (Assets Under Management)" value={(formData.aum as string) ?? ""} onChange={(v) => set("aum", v)} placeholder="$500M" />
      <SelectField label="Investment Strategy" value={(formData.fundStrategy as string) ?? ""} onChange={(v) => set("fundStrategy", v)} options={FUND_STRATEGIES} />
      <MultiSelectChips label="Mandate Sectors" options={VERTICALS} selected={((formData.mandateSectors as string[]) ?? [])} onChange={(v) => set("mandateSectors", v)} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Min Allocation" value={(formData.allocMin as string) ?? ""} onChange={(v) => set("allocMin", v)} placeholder="$5M" />
        <InputField label="Max Allocation" value={(formData.allocMax as string) ?? ""} onChange={(v) => set("allocMax", v)} placeholder="$100M" />
      </div>
      <MultiSelectChips label="Geographic Targets" options={GEOGRAPHIES} selected={((formData.allocGeo as string[]) ?? [])} onChange={(v) => set("allocGeo", v)} />
    </div>
  );
}

function AllocatorComplianceStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <SelectField label="Regulatory Framework" value={(formData.regFramework as string) ?? ""} onChange={(v) => set("regFramework", v)} options={["SEC Registered", "CFTC Registered", "FCA Regulated", "MAS Licensed", "DFSA Regulated", "Exempt", "Other"]} />
      <RadioGroup label="Do you require ESG compliance?" options={["Yes", "No", "Preferred"]} value={(formData.esgRequired as string) ?? ""} onChange={(v) => set("esgRequired", v)} />
      <RadioGroup label="Do you require Shariah compliance?" options={["Yes", "No"]} value={(formData.shariahRequired as string) ?? ""} onChange={(v) => set("shariahRequired", v)} />
      <UploadZone label="Fund Documentation / PPM" />
      <UploadZone label="Regulatory License" />
    </div>
  );
}

function PipelinePreviewStep({ onGo, label }: { onGo: () => void; label: string }) {
  const pipeline = [
    { name: "Solar Infrastructure Fund", size: "$45M", status: "Active" },
    { name: "Gulf Energy JV", size: "$120M", status: "Pre-Close" },
    { name: "LATAM Real Estate Pool", size: "$28M", status: "Sourcing" },
    { name: "Mining Royalties SPV", size: "$15M", status: "Active" },
  ];
  return (
    <div>
      <p className="mb-4 text-sm text-white/80">{label}</p>
      <div className="mb-8 space-y-3">
        {pipeline.map((p) => (
          <div key={p.name} className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{p.name}</p>
              <p className="text-xs text-white/60">{p.size}</p>
            </div>
            <span className="rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-medium text-[#2563EB]">{p.status}</span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button onClick={onGo} className="btn-gold cursor-pointer px-10 text-base">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ---- ACQUIRER STEPS ----

function AcquirerProfileStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField label="Company Name" value={(formData.companyName as string) ?? ""} onChange={(v) => set("companyName", v)} placeholder="Acme Corp" required />
      <MultiSelectChips label="Target Sectors" options={VERTICALS} selected={((formData.targetSectors as string[]) ?? [])} onChange={(v) => set("targetSectors", v)} />
      <SelectField label="Target Revenue Range" value={(formData.revenueRange as string) ?? ""} onChange={(v) => set("revenueRange", v)} options={REVENUE_RANGES} />
      <InputField label="EBITDA Threshold" value={(formData.ebitda as string) ?? ""} onChange={(v) => set("ebitda", v)} placeholder="$5M+" />
      <MultiSelectChips label="Geographic Focus" options={GEOGRAPHIES} selected={((formData.acqGeo as string[]) ?? [])} onChange={(v) => set("acqGeo", v)} />
      <SelectField label="Preferred Deal Structure" value={(formData.acqStructure as string) ?? ""} onChange={(v) => set("acqStructure", v)} options={["Full Acquisition", "Majority Stake", "Minority Stake", "Merger", "Asset Purchase"]} />
    </div>
  );
}

function AcquirerDDStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70">Pre-configure your due diligence requirements to accelerate future deals.</p>
      <MultiSelectChips label="Key DD Criteria" options={["Financial Audit", "Legal Review", "Environmental", "IP / Technology", "Management Assessment", "Market Analysis", "Tax Structure"]} selected={((formData.ddCriteria as string[]) ?? [])} onChange={(v) => set("ddCriteria", v)} />
      <InputField label="Internal DD Team Size" value={(formData.ddTeamSize as string) ?? ""} onChange={(v) => set("ddTeamSize", v)} type="number" placeholder="5" />
      <SelectField label="Typical DD Timeline" value={(formData.ddTimeline as string) ?? ""} onChange={(v) => set("ddTimeline", v)} options={["< 30 days", "30-60 days", "60-90 days", "90+ days"]} />
      <UploadZone label="DD Checklist Template (optional)" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardingFlow() {
  const [, navigate] = useLocation();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showFVM, setShowFVM] = useState(false);
  // showInlineReceipt: drives the mini CustodyReceipt inside OriginatorRelationshipStep
  // custodyReceiptPayload: drives the full-screen CustodyReceiptModal (fires after FVM dismisses)
  const [showInlineReceipt, setShowInlineReceipt] = useState(false);
  const [showIntentResult, setShowIntentResult] = useState(false);
  const [custodyReceiptPayload, setCustodyReceiptPayload] = useState<{
    relationshipName: string;
    timestamp: string;
    hash: string;
    trustDelta: number;
  } | null>(null);

  useEffect(() => { document.title = "Onboarding | ANAVI"; }, []);

  // Restore progress
  useEffect(() => {
    const saved = loadProgress();
    if (saved.persona) {
      setPersona(saved.persona);
      setStep(saved.step);
      setFormData(saved.formData);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    saveProgress(persona, step, formData);
  }, [persona, step, formData]);

  const set = useCallback(
    (key: string, value: unknown) => setFormData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const goToDashboard = useCallback(() => navigate("/dashboard"), [navigate]);

  const steps = persona ? STEPS[persona] : [];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    // FVM triggers
    if (persona === "originator" && step === 2 && !showInlineReceipt) {
      setShowInlineReceipt(true);
      setCustodyReceiptPayload({
        relationshipName: (formData.relType as string) ? `${formData.relType as string} Relationship` : "New Relationship",
        timestamp: new Date().toISOString(),
        hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        trustDelta: 12,
      });
      setShowFVM(true);
      return;
    }
    if (
      ((persona === "investor" || persona === "allocator") && step === 3 && !showIntentResult) ||
      ((persona === "developer" || persona === "acquirer") && step === 3 && !showIntentResult)
    ) {
      setShowIntentResult(true);
      return;
    }

    if (!isLastStep) {
      setStep((s) => s + 1);
      setShowInlineReceipt(false);
      setShowIntentResult(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setShowInlineReceipt(false);
      setShowIntentResult(false);
    } else {
      setPersona(null);
      setStep(0);
    }
  };

  // Render step content based on persona + step index
  function renderStepContent(): ReactNode {
    if (!persona) return null;

    // Step 0 is always Identity
    if (step === 0) return <IdentityStep formData={formData} set={set} />;

    switch (persona) {
      case "originator":
        if (step === 1) return <OriginatorBusinessStep formData={formData} set={set} />;
        if (step === 2) return <OriginatorRelationshipStep formData={formData} set={set} showInlineReceipt={showInlineReceipt} />;
        if (step === 3) return <OriginatorUpgradeStep />;
        if (step === 4) return <DashboardIntroStep onGo={goToDashboard} />;
        break;
      case "investor":
        if (step === 1) return <InvestorProfileStep formData={formData} set={set} />;
        if (step === 2) return <InvestorKYCStep formData={formData} set={set} />;
        if (step === 3) return <IntentCreationStep formData={formData} set={set} intentType="invest" showResult={showIntentResult} />;
        if (step === 4) return <MarketDepthStep onGo={goToDashboard} />;
        break;
      case "developer":
        if (step === 1) return <DeveloperProjectStep formData={formData} set={set} />;
        if (step === 2) return <DeveloperVerificationStep />;
        if (step === 3) return <IntentCreationStep formData={formData} set={set} intentType="seek_investment" showResult={showIntentResult} />;
        if (step === 4) return <BlindMatchingIntroStep onGo={goToDashboard} />;
        break;
      case "allocator":
        if (step === 1) return <AllocatorFundStep formData={formData} set={set} />;
        if (step === 2) return <AllocatorComplianceStep formData={formData} set={set} />;
        if (step === 3) return <IntentCreationStep formData={formData} set={set} intentType="allocate" showResult={showIntentResult} />;
        if (step === 4) return <PipelinePreviewStep onGo={goToDashboard} label="Institutional pipeline matching your mandate:" />;
        break;
      case "acquirer":
        if (step === 1) return <AcquirerProfileStep formData={formData} set={set} />;
        if (step === 2) return <AcquirerDDStep formData={formData} set={set} />;
        if (step === 3) return <IntentCreationStep formData={formData} set={set} intentType="acquire" showResult={showIntentResult} />;
        if (step === 4) return <PipelinePreviewStep onGo={goToDashboard} label="Acquisition targets matching your criteria:" />;
        break;
    }
    return null;
  }

  // ---- PERSONA SELECTION (Step 0 / The Fork) ----
  if (!persona) {
    return (
      <div className="min-h-screen bg-mesh">
        {/* Navy header */}
        <header className="glass-dark sticky top-0 z-20 px-6 py-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">@</span>
              <span className="text-2xl font-bold text-white">navi</span>
              <span className="ml-1 h-2 w-2 rounded-full bg-[#22D4F5] animate-glow-pulse" />
            </div>
            <p className="mt-1 text-sm text-white/50">Private Market Operating System</p>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            My primary role is...
          </h1>
          <p className="mb-10 text-center text-sm text-white/50">
            Select the role that best describes how you operate in private markets.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPersona(p.id);
                  setStep(0);
                  setFormData({});
                  setShowInlineReceipt(false);
                  setShowIntentResult(false);
                }}
                className="hover-lift group cursor-pointer glass-dark rounded-xl p-6 text-left border-0 hover:bg-white/[0.08] transition-all duration-200"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#22D4F5]/10 transition group-hover:bg-[#22D4F5]/15">
                  <p.icon className="h-6 w-6 text-[#22D4F5]" />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-white">{p.label}</h3>
                <p className="text-sm leading-relaxed text-white/60">{p.description}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ---- WIZARD ----
  const currentStepDef = steps[step];
  const showNavButtons = step < steps.length - 1 || (step === steps.length - 1 && !["originator"].includes(persona) && step !== 4);
  const hideNextOnFinal = isLastStep;

  return (
    <div className="min-h-screen bg-canvas-void">
      {/* Cinematic progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-white/5">
        <motion.div
          className="h-full bg-[#22D4F5]"
          style={{ boxShadow: "0 0 8px oklch(0.75 0.18 200 / 0.60)" }}
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>

      {/* FVM celebration overlay */}
      {showFVM && (
        <FVMCelebration
          title="Relationship Custodied"
          subtitle="Your first relationship is now cryptographically timestamped and protected on ANAVI."
          ctaLabel="Continue Setup"
          onCta={() => setShowFVM(false)}
          icon={<Lock className="h-8 w-8 text-[#059669]" />}
        />
      )}

      {/* Full-screen custody receipt — fires after FVM dismisses */}
      <AnimatePresence>
        {!showFVM && custodyReceiptPayload && (
          <CustodyReceiptModal
            {...custodyReceiptPayload}
            onContinue={() => {
              setCustodyReceiptPayload(null);
              setStep((s) => s + 1);
              setShowInlineReceipt(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass-dark sticky top-0 z-20 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">@</span>
            <span className="text-xl font-bold text-white">navi</span>
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-[#22D4F5] animate-glow-pulse" />
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
            {PERSONAS.find((p) => p.id === persona)?.label}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <ProgressBar steps={steps} current={step} />

        <div className="glass-dark rounded-2xl p-8">
          <h2 className="mb-1 text-xl font-bold text-white">{currentStepDef.name}</h2>
          <p className="mb-4 text-xs text-white/40">~{currentStepDef.minutes} min</p>

          <BenefitCard text={currentStepDef.benefit} />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${persona}-${step}`}
              initial={{ opacity: 0, x: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {!hideNextOnFinal && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={handleNext}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#C4972A] px-6 py-2.5 text-sm font-medium text-[#060A12] transition hover:bg-[#D4A73A]"
              >
                {persona === "originator" && step === 2 && !showInlineReceipt
                  ? "Secure Relationship"
                  : step === 3 && !showIntentResult && persona !== "originator"
                    ? "Create Intent"
                    : "Continue"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Back-only on final steps that have their own CTA */}
          {hideNextOnFinal && (
            <div className="mt-8">
              <button
                onClick={handleBack}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>
          )}

          {/* Skip for originator upgrade step */}
          {persona === "originator" && step === 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleNext}
                className="cursor-pointer text-sm text-white/30 underline transition hover:text-white/50"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
