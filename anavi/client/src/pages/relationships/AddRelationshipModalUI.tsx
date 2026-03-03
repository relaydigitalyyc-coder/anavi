import { COLORS } from "./constants";

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