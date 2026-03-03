import {
  PROJECT_TYPES,
  DEV_STAGES,
  DEAL_STRUCTURES,
  TIMELINES,
} from "./constants";
import { SelectField, InputField, RadioGroup, UploadZone } from "./FormPrimitives";

function DeveloperProjectStep({
  formData,
  set,
}: {
  formData: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      <SelectField
        label="Project Type"
        value={(formData.projectType as string) ?? ""}
        onChange={v => set("projectType", v)}
        options={PROJECT_TYPES}
      />
      <SelectField
        label="Development Stage"
        value={(formData.devStage as string) ?? ""}
        onChange={v => set("devStage", v)}
        options={DEV_STAGES}
      />
      <InputField
        label="Project Location"
        value={(formData.projectLocation as string) ?? ""}
        onChange={v => set("projectLocation", v)}
        placeholder="City, State / Country"
      />
      <InputField
        label="Capital Requirement"
        value={(formData.capitalReq as string) ?? ""}
        onChange={v => set("capitalReq", v)}
        placeholder="$10M"
      />
      <RadioGroup
        label="Preferred Deal Structure"
        options={DEAL_STRUCTURES}
        value={(formData.dealStructure as string) ?? ""}
        onChange={v => set("dealStructure", v)}
      />
      <SelectField
        label="Timeline"
        value={(formData.projectTimeline as string) ?? ""}
        onChange={v => set("projectTimeline", v)}
        options={TIMELINES}
      />
    </div>
  );
}

function DeveloperVerificationStep() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70">
        Upload project documentation to fast-track verification. Verified
        projects receive 3× more investor engagement.
      </p>
      <UploadZone label="Permits / Interconnection Agreement" />
      <UploadZone label="Financial Model" />
      <UploadZone label="Legal Entity Documentation" />
      <p className="text-center text-xs text-white/40">
        You can skip uploads and complete verification later.
      </p>
    </div>
  );
}

export { DeveloperProjectStep, DeveloperVerificationStep };