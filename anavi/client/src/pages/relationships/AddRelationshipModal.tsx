import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  Lock,
  Copy,
  LayoutGrid,
  List,
  Plus,
  Search,
  Filter,
  Check,
  Upload,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Globe,
  ChevronDown,
  X,
  Loader2,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  Linkedin,
  Save,
  QrCode,
  ExternalLink,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { CUSTODY_RECEIPT } from "@/lib/copy";
import {
  COLORS,
  SECTORS,
  REGIONS,
  REL_TYPES,
  VERIFICATION_LEVELS,
  formatCurrency,
  generateFakeHash,
} from "./constants";

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 42,
          padding: "0 32px 0 14px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: "#fff",
          fontSize: 14,
          color: value ? COLORS.navy : "#94A3B8",
          appearance: "none",
          cursor: "pointer",
          minWidth: 140,
        }}
      >
        <option value="">{label}</option>
        {options.map(opt => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#94A3B8",
        }}
      />
    </div>
  );
}

export function QRCanvas({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, { width: 200 }, err => {
        if (err) console.error("QR generation error:", err);
      });
    }
  }, [url]);
  return <canvas ref={canvasRef} />;
}

export function ProofModal({
  relationshipId,
  onClose,
}: {
  relationshipId: number;
  onClose: () => void;
}) {
  const { data: proof, isLoading } = trpc.relationship.getProof.useQuery(
    { id: relationshipId },
    { enabled: !!relationshipId }
  );

  const copyProof = () => {
    if (!proof) return;
    const json = JSON.stringify(proof, null, 2);
    navigator.clipboard.writeText(json);
    toast.success("Proof copied to clipboard");
  };

  const timestampHash = proof?.timestampHash;
  const establishedAt = proof?.establishedAt;
  const truncated = timestampHash
    ? `${timestampHash.slice(0, 8)}...${timestampHash.slice(-8)}`
    : "—";
  const verifyUrl = timestampHash
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/verify/relationship/${timestampHash}`
    : "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 22, 40, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card-elevated"
        style={{ width: 420, maxHeight: "80vh", overflow: "auto" }}
      >
        <div
          style={{
            padding: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy }}>
            Relationship Proof
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          {isLoading ? (
            <p style={{ color: "#6B7A90", fontSize: 14 }}>Loading proof…</p>
          ) : proof ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#6B7A90",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Custody Proof
                </p>
                <code
                  className="font-data-mono"
                  style={{
                    fontSize: 13,
                    color: COLORS.gold,
                    wordBreak: "break-all",
                  }}
                >
                  {truncated}
                </code>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "#6B7A90",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Established
                </p>
                <p style={{ fontSize: 13, color: COLORS.navy }}>
                  {establishedAt instanceof Date
                    ? establishedAt.toLocaleString()
                    : establishedAt
                      ? new Date(establishedAt).toLocaleString()
                      : "—"}
                </p>
              </div>
              {verifyUrl && (
                <>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <QRCanvas url={verifyUrl} />
                  </div>
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: COLORS.blue,
                      fontSize: 12,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <ExternalLink size={12} />
                    Open verification URL
                  </a>
                </>
              )}
              <pre
                style={{
                  background: "#F8FAFC",
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 11,
                  overflow: "auto",
                  maxHeight: 140,
                  fontFamily: "monospace",
                  color: COLORS.navy,
                }}
              >
                {JSON.stringify(proof, null, 2)}
              </pre>
              <button
                onClick={copyProof}
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  background: COLORS.gold,
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          ) : (
            <p style={{ color: "#6B7A90", fontSize: 14 }}>Proof not found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalStepType({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.navy,
          marginBottom: 4,
        }}
      >
        Relationship Type
      </h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>
        Select the type of relationship you want to protect.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {REL_TYPES.map(t => {
          const Icon = t.icon;
          const isSelected = selected === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onSelect(t.value)}
              style={{
                padding: 16,
                borderRadius: 10,
                border: `2px solid ${isSelected ? COLORS.gold : COLORS.border}`,
                background: isSelected ? `${COLORS.gold}08` : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isSelected ? COLORS.gold : COLORS.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  size={18}
                  style={{ color: isSelected ? "#fff" : "#6B7A90" }}
                />
              </div>
              <span
                style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}
              >
                {t.label}
              </span>
              {isSelected && (
                <Check
                  size={16}
                  style={{ marginLeft: "auto", color: COLORS.gold }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ModalStepProfile({
  sectors,
  onSectorsChange,
  dealMin,
  dealMax,
  onDealMinChange,
  onDealMaxChange,
  regions,
  onRegionsChange,
  requirements,
  onRequirementsChange,
}: {
  sectors: string[];
  onSectorsChange: (v: string[]) => void;
  dealMin: string;
  dealMax: string;
  onDealMinChange: (v: string) => void;
  onDealMaxChange: (v: string) => void;
  regions: string[];
  onRegionsChange: (v: string[]) => void;
  requirements: string;
  onRequirementsChange: (v: string) => void;
}) {
  const toggleChip = (
    list: string[],
    setter: (v: string[]) => void,
    val: string
  ) => {
    setter(list.includes(val) ? list.filter(v => v !== val) : [...list, val]);
  };

  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.navy,
          marginBottom: 4,
        }}
      >
        Deal Profile
      </h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>
        Define the deal profile for this relationship.
      </p>

      <FieldLabel>Sector</FieldLabel>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}
      >
        {SECTORS.map(s => (
          <ChipButton
            key={s}
            active={sectors.includes(s)}
            onClick={() => toggleChip(sectors, onSectorsChange, s)}
          >
            {s}
          </ChipButton>
        ))}
      </div>

      <FieldLabel>Deal Size Range</FieldLabel>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Min ($)"
          value={dealMin}
          onChange={e => onDealMinChange(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Max ($)"
          value={dealMax}
          onChange={e => onDealMaxChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      <FieldLabel>Geographic Focus</FieldLabel>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}
      >
        {REGIONS.map(r => (
          <ChipButton
            key={r}
            active={regions.includes(r)}
            onClick={() => toggleChip(regions, onRegionsChange, r)}
          >
            {r}
          </ChipButton>
        ))}
      </div>

      <FieldLabel>Specific Requirements</FieldLabel>
      <textarea
        rows={3}
        placeholder="Add any specific requirements..."
        value={requirements}
        onChange={e => onRequirementsChange(e.target.value)}
        style={{
          ...inputStyle,
          height: "auto",
          resize: "vertical" as const,
          padding: 12,
        }}
      />
    </div>
  );
}

export function ModalStepVerification({
  level,
  onLevelChange,
}: {
  level: string;
  onLevelChange: (v: string) => void;
}) {
  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.navy,
          marginBottom: 4,
        }}
      >
        Verification Level
      </h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>
        What level of verification can you provide?
      </p>

      <FieldLabel>What can you confirm?</FieldLabel>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <select
          value={level}
          onChange={e => onLevelChange(e.target.value)}
          style={{
            ...inputStyle,
            appearance: "none",
            paddingRight: 36,
            cursor: "pointer",
            color: level ? COLORS.navy : "#94A3B8",
          }}
        >
          <option value="">Select verification level</option>
          {VERIFICATION_LEVELS.map(v => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#94A3B8",
          }}
        />
      </div>

      <FieldLabel>Document Upload (Optional)</FieldLabel>
      <div
        style={{
          border: `2px dashed ${COLORS.border}`,
          borderRadius: 10,
          padding: "32px 16px",
          textAlign: "center",
          color: "#94A3B8",
          cursor: "pointer",
        }}
      >
        <Upload size={28} style={{ margin: "0 auto 8px", display: "block" }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          Drop files here or click to upload
        </div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          PDF, DOC, or images up to 10MB
        </div>
      </div>
    </div>
  );
}

export function ModalStepCustody({
  exposure,
  onExposureChange,
  autoMatch,
  onAutoMatchChange,
}: {
  exposure: string;
  onExposureChange: (v: string) => void;
  autoMatch: boolean;
  onAutoMatchChange: (v: boolean) => void;
}) {
  const exposureOptions = [
    {
      value: "full",
      label: "Full",
      desc: "Complete profile visible to matches",
    },
    {
      value: "sector-only",
      label: "Sector-only",
      desc: "Only sector and deal size visible",
    },
    {
      value: "hidden",
      label: "Hidden",
      desc: "No details shared until you approve",
    },
  ];

  return (
    <div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.navy,
          marginBottom: 4,
        }}
      >
        Custody Settings
      </h3>
      <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>
        Control how your relationship data is shared.
      </p>

      <FieldLabel>Match Exposure</FieldLabel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {exposureOptions.map(opt => (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 10,
              border: `2px solid ${exposure === opt.value ? COLORS.gold : COLORS.border}`,
              background: exposure === opt.value ? `${COLORS.gold}08` : "#fff",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="exposure"
              value={opt.value}
              checked={exposure === opt.value}
              onChange={e => onExposureChange(e.target.value)}
              style={{ accentColor: COLORS.gold }}
            />
            <div>
              <div
                style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}
              >
                {opt.label}
              </div>
              <div style={{ fontSize: 12, color: "#6B7A90" }}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.navy }}>
            Auto-match consent
          </div>
          <div style={{ fontSize: 12, color: "#6B7A90" }}>
            Allow automatic matching with compatible deals
          </div>
        </div>
        <button
          onClick={() => onAutoMatchChange(!autoMatch)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            background: autoMatch ? COLORS.green : "#CBD5E1",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 3,
              left: autoMatch ? 23 : 3,
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: COLORS.navy,
            marginBottom: 4,
          }}
        >
          Attribution Split
        </div>
        <div style={{ fontSize: 13, color: "#6B7A90" }}>
          Team attribution splitting will be available for team accounts.
          Contact support to upgrade.
        </div>
      </div>
    </div>
  );
}

export function ModalStepConfirmation({
  id,
  hash,
  onDone,
}: {
  id: string;
  hash: string;
  onDone: () => void;
}) {
  const now = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `${COLORS.green}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <Shield size={32} style={{ color: COLORS.green }} />
      </div>

      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: COLORS.navy,
          marginBottom: 8,
        }}
      >
        {CUSTODY_RECEIPT.title}
      </h3>
      <p style={{ fontSize: 14, color: "#6B7A90", marginBottom: 28 }}>
        {CUSTODY_RECEIPT.body}
      </p>

      <div
        className="card-elevated"
        style={{
          padding: 20,
          textAlign: "left",
          marginBottom: 28,
        }}
      >
        <ReceiptRow label="Timestamp" value={now} />
        <ReceiptRow label="Custody ID" value={id} mono />
        <ReceiptRow
          label="Custody Proof"
          value={hash.slice(0, 32) + "..."}
          mono
          last
        />
      </div>

      <button
        onClick={onDone}
        style={{
          height: 44,
          padding: "0 40px",
          borderRadius: 8,
          background: COLORS.gold,
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
        }}
      >
        Done
      </button>
    </div>
  );
}

export function ReceiptRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${COLORS.border}`,
      }}
    >
      <span style={{ fontSize: 13, color: "#6B7A90" }}>{label}</span>
      <span
        className={
          mono
            ? "font-data-mono text-[10px] text-[#1E3A5F]/50 font-semibold"
            : ""
        }
        style={
          !mono
            ? { fontSize: 13, fontWeight: 600, color: COLORS.navy }
            : undefined
        }
      >
        {value}
      </span>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: COLORS.navy,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export function ChipButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 20,
        border: `1px solid ${active ? COLORS.gold : COLORS.border}`,
        background: active ? `${COLORS.gold}15` : "#fff",
        color: active ? COLORS.gold : "#6B7A90",
        fontWeight: 500,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 14px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
  fontSize: 14,
  outline: "none",
  color: COLORS.navy,
};

export function AddRelationshipFlow({
  open,
  onClose,
  refetch,
}: {
  open: boolean;
  onClose: () => void;
  refetch: () => void;
}) {
  const [modalStep, setModalStep] = useState(1);
  const [formType, setFormType] = useState("");
  const [formSectors, setFormSectors] = useState<string[]>([]);
  const [formDealMin, setFormDealMin] = useState("");
  const [formDealMax, setFormDealMax] = useState("");
  const [formRegions, setFormRegions] = useState<string[]>([]);
  const [formRequirements, setFormRequirements] = useState("");
  const [formVerification, setFormVerification] = useState("");
  const [formExposure, setFormExposure] = useState("full");
  const [formAutoMatch, setFormAutoMatch] = useState(true);

  const createMutation = trpc.relationship.create.useMutation({
    onSuccess: () => {
      refetch();
      setModalStep(5);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const resetModal = () => {
    setModalStep(1);
    setFormType("");
    setFormSectors([]);
    setFormDealMin("");
    setFormDealMax("");
    setFormRegions([]);
    setFormRequirements("");
    setFormVerification("");
    setFormExposure("full");
    setFormAutoMatch(true);
  };

  useEffect(() => {
    if (open) {
      resetModal();
    }
  }, [open]);

  const submitRelationship = () => {
    createMutation.mutate({
      contactId: 0,
      relationshipType: (formType || "direct") as any,
      notes: formRequirements,
      tags: [...formSectors, ...formRegions],
    });
  };

  const confirmationId = `REL-${Math.floor(Math.random() * 90000) + 10000}`;
  const confirmationHash = generateFakeHash();

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 22, 40, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-elevated"
        style={{
          width: 560,
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            padding: "24px 28px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy }}
            >
              Protect a Relationship
            </h2>
            <p style={{ fontSize: 13, color: "#6B7A90", marginTop: 4 }}>
              Step {modalStep} of 5
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            margin: "16px 28px",
            height: 4,
            background: "#E2E8F0",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(modalStep / 5) * 100}%`,
              background: COLORS.gold,
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>

        <div style={{ padding: "8px 28px 28px" }}>
          {modalStep === 1 && (
            <ModalStepType selected={formType} onSelect={setFormType} />
          )}
          {modalStep === 2 && (
            <ModalStepProfile
              sectors={formSectors}
              onSectorsChange={setFormSectors}
              dealMin={formDealMin}
              dealMax={formDealMax}
              onDealMinChange={setFormDealMin}
              onDealMaxChange={setFormDealMax}
              regions={formRegions}
              onRegionsChange={setFormRegions}
              requirements={formRequirements}
              onRequirementsChange={setFormRequirements}
            />
          )}
          {modalStep === 3 && (
            <ModalStepVerification
              level={formVerification}
              onLevelChange={setFormVerification}
            />
          )}
          {modalStep === 4 && (
            <ModalStepCustody
              exposure={formExposure}
              onExposureChange={setFormExposure}
              autoMatch={formAutoMatch}
              onAutoMatchChange={setFormAutoMatch}
            />
          )}
          {modalStep === 5 && (
            <ModalStepConfirmation
              id={confirmationId}
              hash={confirmationHash}
              onDone={onClose}
            />
          )}

          {modalStep < 5 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setModalStep(Math.max(1, modalStep - 1))}
                disabled={modalStep === 1}
                style={{
                  height: 40,
                  padding: "0 20px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: "#fff",
                  color: modalStep === 1 ? "#CBD5E1" : COLORS.navy,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: modalStep === 1 ? "default" : "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (modalStep === 4) {
                    submitRelationship();
                  } else {
                    setModalStep(modalStep + 1);
                  }
                }}
                disabled={createMutation.isPending}
                style={{
                  height: 40,
                  padding: "0 24px",
                  borderRadius: 8,
                  background: COLORS.gold,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {modalStep === 4
                  ? createMutation.isPending
                    ? "Protecting..."
                    : "Protect Relationship"
                  : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}