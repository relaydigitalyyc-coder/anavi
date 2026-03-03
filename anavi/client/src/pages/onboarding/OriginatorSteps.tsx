import { Check } from "lucide-react";
import {
  VERTICALS,
  BUSINESS_STRUCTURES,
  DEAL_SIZES,
  GEOGRAPHIES,
} from "./constants";
import {
  InputField,
  SelectField,
  MultiSelectChips,
  TextArea,
  RadioGroup,
  UploadZone,
} from "./FormPrimitives";
import { CustodyReceipt } from "./SharedSteps";

function OriginatorBusinessStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField
        label="Business Name"
        value={(formData.businessName as string) ?? ""}
        onChange={v => set("businessName", v)}
        required
        placeholder="Acme Brokerage LLC"
      />
      <SelectField
        label="Business Structure"
        value={(formData.businessStructure as string) ?? ""}
        onChange={v => set("businessStructure", v)}
        options={BUSINESS_STRUCTURES}
      />
      <MultiSelectChips
        label="Primary Deal Verticals"
        options={VERTICALS}
        selected={(formData.verticals as string[]) ?? []}
        onChange={v => set("verticals", v)}
      />
      <SelectField
        label="Typical Deal Size"
        value={(formData.dealSize as string) ?? ""}
        onChange={v => set("dealSize", v)}
        options={DEAL_SIZES}
      />
      <InputField
        label="Years in Industry"
        value={(formData.yearsIndustry as string) ?? ""}
        onChange={v => set("yearsIndustry", v)}
        type="number"
        placeholder="10"
      />
      <InputField
        label="LinkedIn URL (optional)"
        value={(formData.linkedin as string) ?? ""}
        onChange={v => set("linkedin", v)}
        placeholder="https://linkedin.com/in/..."
      />
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
      <RadioGroup
        label="Relationship Type"
        options={["Buyer", "Seller", "Investor", "Developer", "Other"]}
        value={(formData.relType as string) ?? ""}
        onChange={v => set("relType", v)}
      />
      <SelectField
        label="Sector"
        value={(formData.relSector as string) ?? ""}
        onChange={v => set("relSector", v)}
        options={VERTICALS}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Min Deal Size"
          value={(formData.relMinSize as string) ?? ""}
          onChange={v => set("relMinSize", v)}
          placeholder="$1M"
        />
        <InputField
          label="Max Deal Size"
          value={(formData.relMaxSize as string) ?? ""}
          onChange={v => set("relMaxSize", v)}
          placeholder="$50M"
        />
      </div>
      <MultiSelectChips
        label="Geographic Focus"
        options={GEOGRAPHIES}
        selected={(formData.relGeo as string[]) ?? []}
        onChange={v => set("relGeo", v)}
      />
      <TextArea
        label="Notes"
        value={(formData.relNotes as string) ?? ""}
        onChange={v => set("relNotes", v)}
        placeholder="Any relevant context about this relationship..."
      />
    </div>
  );
}

function OriginatorUpgradeStep() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/20 bg-white/5 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            Current — Tier 1
          </p>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#059669]" /> Relationship custody
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#059669]" /> Basic AI matching
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#059669]" /> 5 relationships/month
            </li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-[#C4972A] bg-[#C4972A]/10 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#C4972A]">
            Upgrade — Tier 2
          </p>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#C4972A]" /> Priority deal room
              access
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#C4972A]" /> Unlimited
              relationships
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#C4972A]" /> Advanced AI analytics
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#C4972A]" /> Commission tracking
            </li>
          </ul>
        </div>
      </div>
      <UploadZone label="Business Registration Document" />
      <UploadZone label="Government-Issued ID" />
      <p className="text-center text-xs text-white/40">
        You can skip this and complete verification later from Settings.
      </p>
    </div>
  );
}

export { OriginatorBusinessStep, OriginatorRelationshipStep, OriginatorUpgradeStep };