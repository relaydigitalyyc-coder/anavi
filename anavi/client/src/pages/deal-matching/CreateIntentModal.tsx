import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Building2,
  Users,
  X,
  Check,
  Zap,
  Loader2,
  Shield,
  Bell,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSET_TYPES,
  TIMELINES,
  VERIFICATION_TIERS,
  MATCH_FREQUENCIES,
  LOCATION_OPTIONS,
  COLORS,
  INTENT_TYPE_CONFIG,
} from "./constants";

export function CreateIntentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    intentType: "" as string,
    title: "",
    description: "",
    assetType: "",
    currency: "USD",
    minValue: "",
    maxValue: "",
    targetTimeline: "",
    locations: [] as string[],
    verificationTier: "Any",
    geoRestrictions: [] as string[],
    maxMatches: 5,
    notifyInApp: true,
    notifyEmail: false,
    matchFrequency: "Immediate",
  });

  const createMutation = trpc.intent.create.useMutation({
    onSuccess: () => {
      toast.success("Intent activated! AI matching is now active.");
      onCreated();
    },
    onError: e => toast.error(e.message),
  });

  const patch = (updates: Partial<typeof form>) =>
    setForm(f => ({ ...f, ...updates }));

  const toggleInList = (key: "locations" | "geoRestrictions", val: string) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter(v => v !== val)
        : [...f[key], val],
    }));

  const canNext = () => {
    if (step === 1) return !!form.intentType;
    if (step === 2) return !!form.title;
    return true;
  };

  const handleActivate = () => {
    createMutation.mutate({
      intentType: form.intentType as
        | "buy"
        | "sell"
        | "invest"
        | "seek_investment"
        | "partner",
      title: form.title,
      description: form.description,
      assetType: form.assetType as
        | "commodity"
        | "real_estate"
        | "equity"
        | "debt"
        | "infrastructure"
        | "renewable_energy"
        | "mining"
        | "oil_gas"
        | "business"
        | "other"
        | undefined,
      minValue: form.minValue || undefined,
      maxValue: form.maxValue || undefined,
      targetTimeline: form.targetTimeline || undefined,
      isAnonymous: true,
    });
  };

  const intentTypeOptions = [
    {
      value: "buy",
      label: "Buy",
      icon: DollarSign,
      desc: "Acquire assets or businesses",
    },
    {
      value: "sell",
      label: "Sell",
      icon: TrendingUp,
      desc: "Sell assets or equity positions",
    },
    {
      value: "invest",
      label: "Invest",
      icon: Briefcase,
      desc: "Deploy capital into opportunities",
    },
    {
      value: "seek_investment",
      label: "Raise Capital",
      icon: Building2,
      desc: "Seek funding for ventures",
    },
    {
      value: "partner",
      label: "Co-Invest",
      icon: Users,
      desc: "Find co-investment partners",
    },
  ];

  const estimatedMatches = useMemo(
    () => Math.floor(Math.random() * 21) + 5,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.intentType, form.assetType]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] card-elevated flex flex-col overflow-hidden">
        {/* progress */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(step / 5) * 100}%`,
              backgroundColor: COLORS.gold,
            }}
          />
        </div>

        {/* header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: COLORS.navy }}
            >
              Create Intent
            </h2>
            <p className="text-xs text-gray-500">Step {step} of 5</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ color: COLORS.navy }}
              >
                What type of deal are you looking for?
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Select the intent that best describes your goal.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {intentTypeOptions.map(opt => {
                  const selected = form.intentType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => patch({ intentType: opt.value })}
                      className="flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all"
                      style={{
                        borderColor: selected ? COLORS.blue : COLORS.border,
                        backgroundColor: selected ? "#EFF6FF" : "white",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: selected
                            ? COLORS.blue
                            : COLORS.surface,
                        }}
                      >
                        <opt.icon
                          className="w-5 h-5"
                          style={{ color: selected ? "white" : COLORS.navy }}
                        />
                      </div>
                      <div>
                        <span
                          className="font-medium text-sm"
                          style={{ color: COLORS.navy }}
                        >
                          {opt.label}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {opt.desc}
                        </span>
                      </div>
                      {selected && (
                        <Check
                          className="ml-auto w-5 h-5 shrink-0"
                          style={{ color: COLORS.blue }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h3
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Deal Parameters
              </h3>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Title
                </Label>
                <Input
                  value={form.title}
                  onChange={e => patch({ title: e.target.value })}
                  placeholder="e.g. Acquiring renewable energy assets in Southeast Asia"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Description
                </Label>
                <Textarea
                  value={form.description}
                  onChange={e => patch({ description: e.target.value })}
                  placeholder="Describe your deal intent in detail…"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Asset Type
                </Label>
                <Select
                  value={form.assetType}
                  onValueChange={v => patch({ assetType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(a => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Currency
                  </Label>
                  <Select
                    value={form.currency}
                    onValueChange={v => patch({ currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "CHF", "AED"].map(c => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Min Value
                  </Label>
                  <Input
                    type="number"
                    value={form.minValue}
                    onChange={e => patch({ minValue: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Max Value
                  </Label>
                  <Input
                    type="number"
                    value={form.maxValue}
                    onChange={e => patch({ maxValue: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Target Timeline
                </Label>
                <Select
                  value={form.targetTimeline}
                  onValueChange={v => patch({ targetTimeline: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map(t => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Target Locations
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map(loc => {
                    const selected = form.locations.includes(loc);
                    return (
                      <button
                        key={loc}
                        onClick={() => toggleInList("locations", loc)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                          color: selected ? COLORS.blue : "#6B7280",
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Matching Preferences
              </h3>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">
                  Minimum Verification Tier
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {VERIFICATION_TIERS.map(tier => {
                    const selected = form.verificationTier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => patch({ verificationTier: tier })}
                        className="flex items-center gap-2 p-3 rounded-lg border text-sm transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                        }}
                      >
                        <Shield
                          className="w-4 h-4"
                          style={{ color: selected ? COLORS.blue : "#9CA3AF" }}
                        />
                        <span
                          style={{
                            color: selected ? COLORS.blue : COLORS.navy,
                          }}
                        >
                          {tier}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Geographic Restrictions
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_OPTIONS.map(loc => {
                    const selected = form.geoRestrictions.includes(loc);
                    return (
                      <button
                        key={loc}
                        onClick={() => toggleInList("geoRestrictions", loc)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                          color: selected ? COLORS.blue : "#6B7280",
                        }}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Maximum Simultaneous Matches
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxMatches}
                  onChange={e =>
                    patch({ maxMatches: parseInt(e.target.value) || 5 })
                  }
                  className="w-24"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h3
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Notification Settings
              </h3>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-3 block">
                  Notification Method
                </Label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={form.notifyInApp}
                      onCheckedChange={v => patch({ notifyInApp: !!v })}
                    />
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm" style={{ color: COLORS.navy }}>
                      In-app notifications
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={form.notifyEmail}
                      onCheckedChange={v => patch({ notifyEmail: !!v })}
                    />
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm" style={{ color: COLORS.navy }}>
                      Email notifications
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">
                  Match Frequency
                </Label>
                <div className="flex flex-col gap-2">
                  {MATCH_FREQUENCIES.map(freq => {
                    const selected = form.matchFrequency === freq;
                    return (
                      <button
                        key={freq}
                        onClick={() => patch({ matchFrequency: freq })}
                        className="flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all"
                        style={{
                          borderColor: selected ? COLORS.blue : COLORS.border,
                          backgroundColor: selected ? "#EFF6FF" : "white",
                          color: selected ? COLORS.blue : COLORS.navy,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: selected ? COLORS.blue : "#D1D5DB",
                          }}
                        >
                          {selected && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS.blue }}
                            />
                          )}
                        </div>
                        {freq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-5">
              <h3
                className="text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Review & Activate
              </h3>

              <div
                className="rounded-lg p-4 flex flex-col gap-3"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <SummaryRow
                  label="Intent Type"
                  value={
                    intentTypeOptions.find(o => o.value === form.intentType)
                      ?.label ?? "—"
                  }
                />
                <SummaryRow label="Title" value={form.title || "—"} />
                <SummaryRow
                  label="Description"
                  value={form.description || "—"}
                />
                <SummaryRow label="Asset Type" value={form.assetType || "—"} />
                <SummaryRow
                  label="Value Range"
                  value={
                    form.minValue || form.maxValue
                      ? `${form.currency} ${form.minValue || "0"} – ${form.maxValue || "∞"}`
                      : "—"
                  }
                />
                <SummaryRow
                  label="Timeline"
                  value={form.targetTimeline || "—"}
                />
                <SummaryRow
                  label="Locations"
                  value={form.locations.join(", ") || "Any"}
                />
                <SummaryRow
                  label="Min Verification"
                  value={form.verificationTier}
                />
                <SummaryRow
                  label="Max Matches"
                  value={String(form.maxMatches)}
                />
                <SummaryRow
                  label="Notifications"
                  value={
                    [form.notifyInApp && "In-app", form.notifyEmail && "Email"]
                      .filter(Boolean)
                      .join(", ") || "None"
                  }
                />
                <SummaryRow label="Frequency" value={form.matchFrequency} />
              </div>

              <div
                className="rounded-lg p-4 text-center"
                style={{
                  backgroundColor: "#ECFDF5",
                  border: `1px solid ${COLORS.green}33`,
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: COLORS.green }}
                >
                  Estimated match pool: {estimatedMatches} opportunities
                </p>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: COLORS.border, color: COLORS.navy }}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 5 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: COLORS.blue }}
            >
              Continue
            </button>
          ) : (
            <button
              disabled={createMutation.isPending}
              onClick={handleActivate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: COLORS.gold }}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Activate Intent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className="font-medium text-right max-w-[60%] truncate"
        style={{ color: COLORS.navy }}
      >
        {value}
      </span>
    </div>
  );
}