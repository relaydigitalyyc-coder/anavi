export type CanonicalPersona = "originator" | "investor" | "principal";

/**
 * Map any legacy/marketing-facing persona labels to canonical app personas.
 * - developer → principal (operators/project developers are principals on supply side)
 * - acquirer  → principal (strategic buyers behave like principals in flows)
 * - allocator → investor  (institutional allocators are investors in flows)
 * - otherwise: pass through if already canonical, default to originator
 */
export function canonicalizePersona(input: string | null | undefined): CanonicalPersona {
  const val = (input ?? "").toLowerCase().trim();
  if (val === "originator" || val === "investor" || val === "principal") return val;
  if (val === "developer" || val === "acquirer") return "principal";
  if (val === "allocator") return "investor";
  return "originator";
}

/**
 * Returns a human-readable label for the canonical persona, keeping whitepaper language.
 */
export function canonicalPersonaLabel(p: CanonicalPersona): string {
  switch (p) {
    case "originator":
      return "Deal Originator / Broker";
    case "investor":
      return "Investor / Family Office";
    case "principal":
      return "Principal / Asset Owner";
  }
}

