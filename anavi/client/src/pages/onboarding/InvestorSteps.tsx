import { Target } from "lucide-react";
import {
  ASSET_TYPES,
  GEOGRAPHIES,
  TIMELINES,
  DEAL_STAGES,
} from "./constants";
import {
  InputField,
  SelectField,
  MultiSelectChips,
  RadioGroup,
  UploadZone,
  TextArea,
} from "./FormPrimitives";

function InvestorProfileStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <MultiSelectChips
        label="Asset Types of Interest"
        options={ASSET_TYPES}
        selected={(formData.assetTypes as string[]) ?? []}
        onChange={v => set("assetTypes", v)}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Min Ticket Size"
          value={(formData.ticketMin as string) ?? ""}
          onChange={v => set("ticketMin", v)}
          placeholder="$500K"
        />
        <InputField
          label="Max Ticket Size"
          value={(formData.ticketMax as string) ?? ""}
          onChange={v => set("ticketMax", v)}
          placeholder="$25M"
        />
      </div>
      <SelectField
        label="Investment Timeline"
        value={(formData.investTimeline as string) ?? ""}
        onChange={v => set("investTimeline", v)}
        options={TIMELINES}
      />
      <MultiSelectChips
        label="Geographic Preferences"
        options={GEOGRAPHIES}
        selected={(formData.geoPrefs as string[]) ?? []}
        onChange={v => set("geoPrefs", v)}
      />
      <InputField
        label="Target IRR (%)"
        value={(formData.targetIRR as string) ?? ""}
        onChange={v => set("targetIRR", v)}
        type="number"
        placeholder="15"
      />
      <SelectField
        label="Deal Stage Preference"
        value={(formData.dealStage as string) ?? ""}
        onChange={v => set("dealStage", v)}
        options={DEAL_STAGES}
      />
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
        <RadioGroup
          key={i}
          label={q}
          options={["Yes", "No"]}
          value={(formData[`aml_${i}`] as string) ?? ""}
          onChange={v => set(`aml_${i}`, v)}
        />
      ))}
      <SelectField
        label="Source of Funds"
        value={(formData.sourceOfFunds as string) ?? ""}
        onChange={v => set("sourceOfFunds", v)}
        options={[
          "Business Profits",
          "Investment Returns",
          "Inheritance",
          "Real Estate",
          "Salary / Employment",
          "Other",
        ]}
      />
      <RadioGroup
        label="Accredited Investor Status"
        options={[
          "Accredited",
          "Qualified Purchaser",
          "Institutional",
          "Non-Accredited",
        ]}
        value={(formData.accreditedStatus as string) ?? ""}
        onChange={v => set("accreditedStatus", v)}
      />
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
          Your intent matches{" "}
          <span className="font-bold text-[#2563EB]">{matchCount}</span>{" "}
          verified opportunities
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-[#2563EB]/5 border border-[#2563EB]/15 px-4 py-2">
        <span className="text-xs font-medium text-[#2563EB]">
          Intent type: {intentType}
        </span>
      </div>
      <InputField
        label="Title"
        value={(formData.intentTitle as string) ?? ""}
        onChange={v => set("intentTitle", v)}
        placeholder="e.g. Solar project equity investment"
        required
      />
      <TextArea
        label="Description"
        value={(formData.intentDesc as string) ?? ""}
        onChange={v => set("intentDesc", v)}
        placeholder="Describe what you're looking for..."
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Min Value"
          value={(formData.intentMin as string) ?? ""}
          onChange={v => set("intentMin", v)}
          placeholder="$1M"
        />
        <InputField
          label="Max Value"
          value={(formData.intentMax as string) ?? ""}
          onChange={v => set("intentMax", v)}
          placeholder="$25M"
        />
      </div>
      <SelectField
        label="Target Timeline"
        value={(formData.intentTimeline as string) ?? ""}
        onChange={v => set("intentTimeline", v)}
        options={TIMELINES}
      />
    </div>
  );
}

export { InvestorProfileStep, InvestorKYCStep, IntentCreationStep };