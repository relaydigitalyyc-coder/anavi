import type { ReactNode, ComponentType } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Persona =
  | "originator"
  | "investor"
  | "developer"
  | "allocator"
  | "acquirer";

interface PersonaTile {
  id: Persona;
  label: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

interface StepDef {
  name: string;
  minutes: number;
  benefit: string;
}

export type { Persona, PersonaTile, StepDef };