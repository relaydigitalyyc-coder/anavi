import {
  VERTICALS,
  GEOGRAPHIES,
  FUND_STRATEGIES,
} from "./constants";
import {
  InputField,
  SelectField,
  MultiSelectChips,
  RadioGroup,
  UploadZone,
} from "./FormPrimitives";

function AllocatorFundStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <InputField
        label="Fund Name"
        value={(formData.fundName as string) ?? ""}
        onChange={v => set("fundName", v)}
        placeholder="Alpha Capital Partners"
        required
      />
      <InputField
        label="AUM (Assets Under Management)"
        value={(formData.aum as string) ?? ""}
        onChange={v => set("aum", v)}
        placeholder="$500M"
      />
      <SelectField
        label="Investment Strategy"
        value={(formData.fundStrategy as string) ?? ""}
        onChange={v => set("fundStrategy", v)}
        options={FUND_STRATEGIES}
      />
      <MultiSelectChips
        label="Mandate Sectors"
        options={VERTICALS}
        selected={(formData.mandateSectors as string[]) ?? []}
        onChange={v => set("mandateSectors", v)}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Min Allocation"
          value={(formData.allocMin as string) ?? ""}
          onChange={v => set("allocMin", v)}
          placeholder="$5M"
        />
        <InputField
          label="Max Allocation"
          value={(formData.allocMax as string) ?? ""}
          onChange={v => set("allocMax", v)}
          placeholder="$100M"
        />
      </div>
      <MultiSelectChips
        label="Geographic Targets"
        options={GEOGRAPHIES}
        selected={(formData.allocGeo as string[]) ?? []}
        onChange={v => set("allocGeo", v)}
      />
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
      <SelectField
        label="Regulatory Framework"
        value={(formData.regFramework as string) ?? ""}
        onChange={v => set("regFramework", v)}
        options={[
          "SEC Registered",
          "CFTC Registered",
          "FCA Regulated",
          "MAS Licensed",
          "DFSA Regulated",
          "Exempt",
          "Other",
        ]}
      />
      <RadioGroup
        label="Do you require ESG compliance?"
        options={["Yes", "No", "Preferred"]}
        value={(formData.esgRequired as string) ?? ""}
        onChange={v => set("esgRequired", v)}
      />
      <RadioGroup
        label="Do you require Shariah compliance?"
        options={["Yes", "No"]}
        value={(formData.shariahRequired as string) ?? ""}
        onChange={v => set("shariahRequired", v)}
      />
      <UploadZone label="Fund Documentation / PPM" />
      <UploadZone label="Regulatory License" />
    </div>
  );
}

function PipelinePreviewStep({
  onGo,
  label,
}: {
  onGo: () => void;
  label: string;
}) {
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
        {pipeline.map(p => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{p.name}</p>
              <p className="text-xs text-white/60">{p.size}</p>
            </div>
            <span className="rounded-full bg-[#2563EB]/10 px-3 py-1 text-xs font-medium text-[#2563EB]">
              {p.status}
            </span>
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

export { AllocatorFundStep, AllocatorComplianceStep, PipelinePreviewStep };