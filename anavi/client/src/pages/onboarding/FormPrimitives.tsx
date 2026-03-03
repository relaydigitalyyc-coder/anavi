import { useState } from "react";
import { Upload } from "lucide-react";

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
        onChange={e => onChange(e.target.value)}
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
      <span className="mb-1.5 block text-sm font-medium text-white/90">
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-12 w-full rounded-lg border border-[#D1DCF0] bg-white px-4 text-sm text-[#0A1628] outline-none transition focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
      >
        <option value="">{placeholder ?? "Select..."}</option>
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
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
    onChange(
      selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt]
    );
  };
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-white/90">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
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
      <span className="mb-1.5 block text-sm font-medium text-white/90">
        {label}
      </span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
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
      <span className="mb-2 block text-sm font-medium text-white/90">
        {label}
      </span>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
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
              {value === opt && (
                <div className="h-2 w-2 rounded-full bg-[#2563EB]" />
              )}
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
      <span className="mb-1.5 block text-sm font-medium text-white/90">
        {label}
      </span>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/30 bg-white/5 px-6 py-8 text-center transition hover:border-[#2563EB]/50">
        <Upload className="h-6 w-6 text-[#2563EB]" />
        {fileName ? (
          <span className="text-sm font-medium text-[#059669]">{fileName}</span>
        ) : (
          <>
            <span className="text-sm text-white/70">
              Drag & drop or click to upload
            </span>
            <span className="text-xs text-white/50">
              PDF, JPG, PNG up to 10MB
            </span>
          </>
        )}
        <input
          type="file"
          className="sr-only"
          onChange={e => {
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

export {
  InputField,
  SelectField,
  MultiSelectChips,
  TextArea,
  RadioGroup,
  UploadZone,
  BenefitCard,
};