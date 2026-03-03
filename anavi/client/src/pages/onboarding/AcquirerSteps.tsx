import {
  VERTICALS,
  GEOGRAPHIES,
  REVENUE_RANGES,
} from "./constants";
import {
  InputField,
  SelectField,
  MultiSelectChips,
  UploadZone,
} from "./FormPrimitives";

function AcquirerProfileStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField
        label="Company Name"
        value={(formData.companyName as string) ?? ""}
        onChange={v => set("companyName", v)}
        placeholder="Acme Corp"
        required
      />
      <MultiSelectChips
        label="Target Sectors"
        options={VERTICALS}
        selected={(formData.targetSectors as string[]) ?? []}
        onChange={v => set("targetSectors", v)}
      />
      <SelectField
        label="Target Revenue Range"
        value={(formData.revenueRange as string) ?? ""}
        onChange={v => set("revenueRange", v)}
        options={REVENUE_RANGES}
      />
      <InputField
        label="EBITDA Threshold"
        value={(formData.ebitda as string) ?? ""}
        onChange={v => set("ebitda", v)}
        placeholder="$5M+"
      />
      <MultiSelectChips
        label="Geographic Focus"
        options={GEOGRAPHIES}
        selected={(formData.acqGeo as string[]) ?? []}
        onChange={v => set("acqGeo", v)}
      />
      <SelectField
        label="Preferred Deal Structure"
        value={(formData.acqStructure as string) ?? ""}
        onChange={v => set("acqStructure", v)}
        options={[
          "Full Acquisition",
          "Majority Stake",
          "Minority Stake",
          "Merger",
          "Asset Purchase",
        ]}
      />
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
      <p className="text-sm text-white/70">
        Pre-configure your due diligence requirements to accelerate future
        deals.
      </p>
      <MultiSelectChips
        label="Key DD Criteria"
        options={[
          "Financial Audit",
          "Legal Review",
          "Environmental",
          "IP / Technology",
          "Management Assessment",
          "Market Analysis",
          "Tax Structure",
        ]}
        selected={(formData.ddCriteria as string[]) ?? []}
        onChange={v => set("ddCriteria", v)}
      />
      <InputField
        label="Internal DD Team Size"
        value={(formData.ddTeamSize as string) ?? ""}
        onChange={v => set("ddTeamSize", v)}
        type="number"
        placeholder="5"
      />
      <SelectField
        label="Typical DD Timeline"
        value={(formData.ddTimeline as string) ?? ""}
        onChange={v => set("ddTimeline", v)}
        options={["< 30 days", "30-60 days", "60-90 days", "90+ days"]}
      />
      <UploadZone label="DD Checklist Template (optional)" />
    </div>
  );
}

export { AcquirerProfileStep, AcquirerDDStep };