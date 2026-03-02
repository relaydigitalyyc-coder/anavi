# Persona-Industry Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build three fully distinct persona dashboards (Originator, Investor, Principal) with persona switching, industry context, and a fully wired demo across all 15 dashboard pages.

**Architecture:** Option C (primary + explore, schema supports multi-role). `primaryPersona` on users table drives defaults. `activePersona` in React context drives rendering. Three exclusive nav module sets swap on switch. Shared core (Verification, Audit Logs, Deal Rooms, Settings) persists across switches. Demo mode uses extended `demoFixtures.ts` with all three personas' data for all pages.

**Tech Stack:** React 19, Vite, wouter, tRPC v11, Drizzle ORM (MySQL), Tailwind 4, shadcn/ui, framer-motion, Vitest

**Design doc:** `docs/plans/2026-02-28-persona-industry-architecture-design.md`

**Verify after every task:** `pnpm check && pnpm test`

---

## Phase 1 — Schema + Runtime Foundation

### Task 1: Add persona fields to users schema

**Files:**
- Modify: `drizzle/schema/users.ts`

**Context:** The users table already has `participantType` enum (`originator | investor | developer | institutional | acquirer`). We are adding a cleaner `primaryPersona` enum (originator | investor | principal) alongside it — we do not remove `participantType` as it may have existing data. We also add `enabledPersonas` (JSON, for future multi-role) and `primaryIndustries` (JSON array for user-level industry profile).

**Step 1: Add fields to the schema**

In `drizzle/schema/users.ts`, after the `participantType` line (line 25), add:

```ts
// Persona System
primaryPersona: mysqlEnum("primaryPersona", ["originator", "investor", "principal"]),
enabledPersonas: json("enabledPersonas").$type<Array<"originator" | "investor" | "principal">>(),
primaryIndustries: json("primaryIndustries").$type<string[]>(),
```

**Step 2: Run TypeScript check**

```bash
pnpm check
```
Expected: passes (or only pre-existing GuidedTour errors)

**Step 3: Generate and run migration**

```bash
pnpm db:push
```
Expected: migration created and applied

**Step 4: Run tests**

```bash
pnpm test
```
Expected: all 37 tests pass

**Step 5: Commit**

```bash
git add drizzle/schema/users.ts drizzle/
git commit -m "feat: add primaryPersona, enabledPersonas, primaryIndustries to users schema"
```

---

### Task 2: Extend PersonaKey type and copy tokens

**Files:**
- Modify: `client/src/lib/copy.ts`

**Context:** `PersonaKey` is currently `"originator" | "investor" | "developer"`. We need to add `"principal"` and update the `PERSONAS` object. The `"developer"` key stays for backward compat (existing demo tour uses it) — we add `"principal"` as the new canonical third persona.

**Step 1: Add principal to PERSONAS and PersonaKey**

In `client/src/lib/copy.ts`, add to the `PERSONAS` object after `developer`:

```ts
principal: {
  label: "Principal / Asset Owner",
  role: "Supply Side",
  problem: "Raising capital means exposing my thesis before anyone commits.",
  answer: "Seal your asset. Match anonymously. Disclose only on consent.",
  tourPitch: "You raised $30M. ANAVI protected your thesis until the moment you chose to disclose it.",
},
```

Update `PersonaKey` export (it's auto-derived from `typeof PERSONAS` so no manual change needed — verify it picks up `principal`).

**Step 2: Add persona nav labels to MODULES**

```ts
export const PERSONA_NAV = {
  originator: {
    exclusive: ["Custody Register", "Attribution Ledger", "Introduction Pipeline"],
    routes: ["/custody", "/attribution", "/pipeline"],
  },
  investor: {
    exclusive: ["Deal Flow", "Portfolio", "Counterparty Intelligence"],
    routes: ["/deal-flow", "/portfolio", "/counterparty-intelligence"],
  },
  principal: {
    exclusive: ["Asset Register", "Demand Room", "Close Tracker"],
    routes: ["/assets", "/demand", "/close"],
  },
} as const;
```

**Step 3: Run check**

```bash
pnpm check
```

**Step 4: Commit**

```bash
git add client/src/lib/copy.ts
git commit -m "feat: add principal persona + PERSONA_NAV to copy tokens"
```

---

### Task 3: Extend DemoContext with activePersona + activeIndustry

**Files:**
- Modify: `client/src/contexts/DemoContext.tsx`
- Modify: `client/src/lib/demoFixtures.ts`

**Context:** `DemoContext` currently holds `isDemo`, `persona`, `fixtures`. We need to add `activeIndustry` and a `switchPersona` function so the persona switcher (built in Task 5) can change the active persona during a demo session without unmounting the whole context tree.

**Step 1: Update DemoContextValue interface**

```ts
interface DemoContextValue {
  isDemo: boolean;
  persona: PersonaKey | null;
  activePersona: PersonaKey | null;       // current lens (switchable)
  activeIndustry: string;                  // current industry context
  fixtures: DemoFixtures[PersonaKey] | null;
  switchPersona: (p: PersonaKey) => void;
  switchIndustry: (i: string) => void;
}
```

**Step 2: Update DemoContextProvider to use useState for activePersona/activeIndustry**

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

export function DemoContextProvider({
  persona,
  children,
}: {
  persona: PersonaKey;
  children: ReactNode;
}) {
  const [activePersona, setActivePersona] = useState<PersonaKey>(persona);
  const [activeIndustry, setActiveIndustry] = useState<string>(
    persona === "investor" ? "Infrastructure" : "Commodities"
  );

  return (
    <DemoContext.Provider
      value={{
        isDemo: true,
        persona,                          // original persona from picker (immutable)
        activePersona,                    // current lens (switchable)
        activeIndustry,
        fixtures: DEMO_FIXTURES[activePersona],
        switchPersona: setActivePersona,
        switchIndustry: setActiveIndustry,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
```

**Step 3: Update useDemoFixtures to use activePersona**

`useDemoFixtures` already returns `ctx.fixtures` which now tracks `activePersona` — no change needed.

**Step 4: Add `useActivePersona` and `useActiveIndustry` convenience hooks**

```ts
export function useActivePersona() {
  const ctx = useContext(DemoContext);
  return ctx.activePersona;
}

export function useActiveIndustry() {
  const ctx = useContext(DemoContext);
  return ctx.activeIndustry;
}

export function usePersonaSwitcher() {
  const ctx = useContext(DemoContext);
  return { switchPersona: ctx.switchPersona, switchIndustry: ctx.switchIndustry };
}
```

**Step 5: Run check**

```bash
pnpm check
```

**Step 6: Commit**

```bash
git add client/src/contexts/DemoContext.tsx
git commit -m "feat: extend DemoContext with switchable activePersona and activeIndustry"
```

---

### Task 4: Build PersonaSwitcher component

**Files:**
- Create: `client/src/components/PersonaSwitcher.tsx`

**Context:** Lives at bottom of sidebar. Shows three persona tiles. In demo mode: uses `switchPersona` from DemoContext. In live mode: reads `primaryPersona` from user settings (future — for now, live mode shows tiles as static with active highlighting based on localStorage value `anavi_active_persona`).

**Step 1: Create the component**

```tsx
// client/src/components/PersonaSwitcher.tsx
import { motion } from "framer-motion";
import { useDemoContext, usePersonaSwitcher } from "@/contexts/DemoContext";
import type { PersonaKey } from "@/lib/copy";

const PERSONA_TILES: Array<{
  key: PersonaKey;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { key: "originator", label: "Originator", shortLabel: "ORI", icon: "🔗" },
  { key: "investor",   label: "Investor",   shortLabel: "INV", icon: "📊" },
  { key: "principal",  label: "Principal",  shortLabel: "PRI", icon: "🏛" },
];

export function PersonaSwitcher() {
  const { isDemo, activePersona } = useDemoContext();
  const { switchPersona } = usePersonaSwitcher();

  // Live mode: read from localStorage, no switching yet
  const livePersona = (
    typeof window !== "undefined"
      ? localStorage.getItem("anavi_active_persona") ?? "originator"
      : "originator"
  ) as PersonaKey;

  const current = isDemo ? activePersona : livePersona;

  return (
    <div className="mt-auto border-t border-[#1E3A5F]/20 pt-3 pb-2 px-3">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#1E3A5F]/40 mb-2">
        Active Persona
      </p>
      <div className="flex gap-1.5">
        {PERSONA_TILES.map((tile) => {
          const isActive = current === tile.key;
          return (
            <motion.button
              key={tile.key}
              onClick={() => {
                if (isDemo) switchPersona(tile.key);
                else localStorage.setItem("anavi_active_persona", tile.key);
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded text-center transition-colors ${
                isActive
                  ? "bg-[#1E3A5F] text-white"
                  : "bg-[#1E3A5F]/8 text-[#1E3A5F]/50 hover:bg-[#1E3A5F]/15 hover:text-[#1E3A5F]/80"
              }`}
              title={tile.label}
            >
              <span className="text-base leading-none">{tile.icon}</span>
              <span className="text-[8px] font-bold tracking-wider">{tile.shortLabel}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Run check**

```bash
pnpm check
```

**Step 3: Commit**

```bash
git add client/src/components/PersonaSwitcher.tsx
git commit -m "feat: PersonaSwitcher component — three persona tiles, demo-switchable"
```

---

### Task 5: Update DashboardLayout with persona-conditional nav

**Files:**
- Modify: `client/src/components/DashboardLayout.tsx`

**Context:** `DashboardLayout` currently has a hardcoded `navSections` array. We need to make the OVERVIEW section persona-conditional — swap in the 3 exclusive module links based on `activePersona`, keep shared core sections (TRUST & IDENTITY, SETTINGS) unchanged.

**Step 1: Import new dependencies at top of DashboardLayout**

```tsx
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { useActivePersona } from "@/contexts/DemoContext";
import { PERSONA_NAV } from "@/lib/copy";
```

**Step 2: Build persona-exclusive nav section**

Inside the component, before `navSections`, add:

```tsx
const activePersona = useActivePersona() ?? "originator";

const personaExclusiveItems = {
  originator: [
    { label: "Custody Register", href: "/custody", icon: Lock },
    { label: "Attribution Ledger", href: "/attribution", icon: TrendingUp },
    { label: "Introduction Pipeline", href: "/pipeline", icon: Network },
  ],
  investor: [
    { label: "Deal Flow", href: "/deal-flow", icon: Target },
    { label: "Portfolio", href: "/portfolio", icon: TrendingUp },
    { label: "Counterparty Intel", href: "/counterparty-intelligence", icon: Shield },
  ],
  principal: [
    { label: "Asset Register", href: "/assets", icon: Building2 },
    { label: "Demand Room", href: "/demand", icon: Users },
    { label: "Close Tracker", href: "/close", icon: CheckCircle },
  ],
}[activePersona];
```

**Step 3: Add exclusive section to navSections**

Add as the FIRST section in `navSections` (before existing OVERVIEW):

```tsx
{
  label: `${activePersona.toUpperCase()} TOOLS`,
  items: personaExclusiveItems,
},
```

**Step 4: Add PersonaSwitcher at bottom of sidebar**

In the sidebar JSX, after the nav links and before the closing div, add:

```tsx
<PersonaSwitcher />
```

**Step 5: Run check + test**

```bash
pnpm check && pnpm test
```

**Step 6: Commit**

```bash
git add client/src/components/DashboardLayout.tsx
git commit -m "feat: persona-conditional nav sections + PersonaSwitcher in sidebar"
```

---

## Phase 2 — Three Persona Dashboards

### Task 6: Persona-aware Dashboard router

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`

**Context:** Dashboard.tsx is 850 lines of unified dashboard. We need it to render one of three persona-specific dashboard views based on `activePersona`. The cleanest approach without gutting the file: extract the current content into `OriginatorDashboard` sub-component, then add routing logic at the top of `Dashboard` to render the correct persona dashboard. The Investor and Principal dashboards are built in Tasks 7-8.

**Step 1: Add activePersona read to Dashboard**

At the top of the `Dashboard` function body, after `const demo = useDemoFixtures();`:

```tsx
const { activePersona } = useDemoContext();
const persona = activePersona ?? "originator";
```

**Step 2: Wrap existing content in OriginatorDashboardContent**

Extract all the JSX return of Dashboard (everything inside `<>...</>`) into a new function at the bottom of the file:

```tsx
function OriginatorDashboardContent({ ... }: { ... }) {
  // everything that was in the Dashboard return
}
```

Then the main `Dashboard` return becomes:

```tsx
if (persona === "investor") return <InvestorDashboardContent />;
if (persona === "principal") return <PrincipalDashboardContent />;
return <OriginatorDashboardContent />;
```

**Step 3: Add stub components for Investor and Principal**

```tsx
function InvestorDashboardContent() {
  return (
    <div className="flex items-center justify-center h-64 text-[#1E3A5F]/40 text-sm">
      Investor Dashboard — coming in Task 7
    </div>
  );
}

function PrincipalDashboardContent() {
  return (
    <div className="flex items-center justify-center h-64 text-[#1E3A5F]/40 text-sm">
      Principal Dashboard — coming in Task 8
    </div>
  );
}
```

**Step 4: Run check**

```bash
pnpm check
```

**Step 5: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: persona-routing in Dashboard — stubs for Investor and Principal"
```

---

### Task 7: Build InvestorDashboardContent

**Files:**
- Modify: `client/src/pages/Dashboard.tsx` (replace stub)

**Context:** Investor dashboard has 5 widgets: Deal Flow Intelligence (curation summary), Deployment Capacity (AUM breakdown), Counterparty Intelligence feed, Portfolio Performance, Active Deal Rooms. All read from demo fixtures when in demo mode.

**Step 1: Replace InvestorDashboardContent stub with full implementation**

```tsx
function InvestorDashboardContent() {
  const demo = useDemoFixtures();

  const deploymentCapacity = demo
    ? { available: 196000000, committed: 2850000, deployed: 141150000, total: 340000000 }
    : null;

  const portfolioPositions = demo?.payouts ?? [];

  return (
    <FadeInView>
      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="dash-heading text-3xl">Deal Flow Intelligence</h1>
          <p className="mt-1 text-sm text-[#1E3A5F]/60">
            {demo
              ? `${demo.matches.length} blind matches active · ${demo.dealRooms.length} deal room requires action`
              : "Loading deal flow..."}
          </p>
        </div>
      </div>

      <StaggerContainer>
        {/* Deployment Capacity */}
        <StaggerItem>
          <DashCard title="Capital Deployment" className="mb-4">
            {deploymentCapacity ? (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Available", value: `$${(deploymentCapacity.available / 1e6).toFixed(0)}M`, color: "#059669" },
                  { label: "Committed", value: `$${(deploymentCapacity.committed / 1e6).toFixed(1)}M`, color: "#F59E0B" },
                  { label: "Deployed", value: `$${(deploymentCapacity.deployed / 1e6).toFixed(0)}M`, color: "#2563EB" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <SmoothCounter
                      value={parseFloat(value.replace(/[$M]/g, ""))}
                      prefix="$" suffix="M"
                      className="text-2xl font-bold"
                      style={{ color }}
                    />
                    <p className="text-xs text-[#1E3A5F]/50 mt-1 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-16 animate-shimmer rounded" />
            )}
          </DashCard>
        </StaggerItem>

        {/* Blind Matches (investor view) */}
        <StaggerItem>
          <DashCard title="Active Deal Flow" className="mb-4">
            <div className="space-y-2">
              {(demo?.matches ?? []).map((m) => (
                <div key={m.id} className="card-elevated px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">{m.tag}</p>
                    <p className="text-xs text-[#1E3A5F]/50 mt-0.5">{m.assetClass} · {m.dealSize}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#C4972A]">{m.compatibilityScore}%</span>
                    <motion.button
                      className="text-xs px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded font-medium"
                      whileHover={{ scale: 1.04 }}
                    >
                      Express Interest
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        {/* Portfolio */}
        <StaggerItem>
          <DashCard title="Portfolio Performance" className="mb-4">
            <div className="space-y-2">
              {portfolioPositions.map((p) => (
                <div key={p.id} className="card-elevated px-3 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">{p.deal}</span>
                    {"irr" in p && (
                      <span className="ml-2 text-xs text-[#059669] font-medium">{(p as { irr: number }).irr}% IRR</span>
                    )}
                  </div>
                  <span className="font-bold text-[#0A1628]">${(p.amount / 1e6).toFixed(2)}M</span>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        {/* Deal Rooms */}
        <StaggerItem>
          <DashCard title="Active Deal Rooms">
            <div className="space-y-2">
              {(demo?.dealRooms ?? []).map((dr) => (
                <div key={dr.id} className="card-elevated px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{dr.name}</span>
                    <span className="text-xs uppercase tracking-wider text-[#2563EB] font-bold">{dr.stage}</span>
                  </div>
                  <div className="h-1.5 bg-[#0A1628]/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#2563EB] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${dr.escrowProgress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <p className="text-xs text-[#1E3A5F]/50 mt-1">{dr.escrowProgress}% escrow · {dr.auditEvents} audit events</p>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 2: Run check**

```bash
pnpm check
```

**Step 3: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: InvestorDashboardContent — deal flow, deployment capacity, portfolio"
```

---

### Task 8: Build PrincipalDashboardContent

**Files:**
- Modify: `client/src/pages/Dashboard.tsx` (replace stub)

**Context:** Principal dashboard has 5 widgets: Asset Register hero (raise progress), Demand Pipeline (anonymous match cards), Sealed Disclosure Ledger, Milestone & Escrow Status, Trust Score tier CTA.

**Step 1: Replace PrincipalDashboardContent stub**

```tsx
function PrincipalDashboardContent() {
  const demo = useDemoFixtures();
  const dr = demo?.dealRooms[0];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="dash-heading text-3xl">Asset Register</h1>
        <p className="mt-1 text-sm text-[#1E3A5F]/60">
          {demo ? "Your asset is sealed until you choose otherwise." : "Loading..."}
        </p>
      </div>

      <StaggerContainer>
        {/* Raise Progress */}
        {dr && (
          <StaggerItem>
            <DashCard title={dr.name} className="mb-4">
              <div className="flex items-baseline gap-3 mb-3">
                <SmoothCounter
                  value={dr.escrowCurrent / 1e6}
                  prefix="$" suffix="M committed"
                  className="text-3xl font-bold text-[#0A1628]"
                />
                <span className="text-sm text-[#1E3A5F]/50">of ${(dr.escrowTarget / 1e6).toFixed(0)}M target</span>
              </div>
              <div className="h-2 bg-[#0A1628]/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#C4972A] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${dr.escrowProgress}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="text-xs text-[#1E3A5F]/50 mt-2">{dr.escrowProgress}% · {dr.counterparty}</p>
            </DashCard>
          </StaggerItem>
        )}

        {/* Demand Pipeline */}
        <StaggerItem>
          <DashCard title="Qualified Demand (Sealed)" className="mb-4">
            <div className="space-y-2">
              {(demo?.matches ?? []).map((m) => (
                <div key={m.id} className="card-elevated px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0A1628]">{m.tag}</p>
                    <p className="text-xs text-[#1E3A5F]/50 mt-0.5">{m.assetClass} · {m.dealSize}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1E3A5F]/10 text-[#1E3A5F]/60">
                      SEALED
                    </span>
                    <span className="text-xs font-bold text-[#C4972A]">{m.compatibilityScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        {/* Sealed Disclosure Ledger */}
        <StaggerItem>
          <DashCard title="Sealed Disclosure Ledger" className="mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Sealed Matches", value: demo?.matches.length ?? 0, color: "#1E3A5F" },
                { label: "NDAs Executed", value: demo?.dealRooms.length ?? 0, color: "#F59E0B" },
                { label: "Uncontrolled Disclosures", value: 0, color: "#059669" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs text-[#1E3A5F]/50 mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </DashCard>
        </StaggerItem>

        {/* Trust Score upgrade CTA */}
        <StaggerItem>
          <DashCard title="Verification Tier">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0A1628]">Current: Basic Tier</p>
                <p className="text-xs text-[#1E3A5F]/60 mt-0.5">
                  Upgrade to Enhanced to unlock Tier 3 investor mandates
                </p>
              </div>
              <motion.button
                className="text-xs px-3 py-1.5 border border-[#C4972A]/40 text-[#C4972A] font-semibold uppercase tracking-wider hover:bg-[#C4972A]/5"
                whileHover={{ scale: 1.02 }}
              >
                Upgrade
              </motion.button>
            </div>
          </DashCard>
        </StaggerItem>
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 2: Run check**

```bash
pnpm check
```

**Step 3: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: PrincipalDashboardContent — asset register, demand pipeline, disclosure ledger"
```

---

### Task 9: Build Originator exclusive pages (Custody, Attribution, Pipeline)

**Files:**
- Create: `client/src/pages/CustodyRegister.tsx`
- Create: `client/src/pages/AttributionLedger.tsx`
- Create: `client/src/pages/IntroductionPipeline.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create CustodyRegister page**

```tsx
// client/src/pages/CustodyRegister.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { Lock, Hash, Clock, CheckCircle } from "lucide-react";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";

export default function CustodyRegister() {
  const demo = useDemoFixtures();
  const { data: liveRelationships } = trpc.relationship.list.useQuery(undefined, { enabled: !demo });
  const relationships = demo?.relationships ?? liveRelationships ?? [];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Custody Register</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Every introduction timestamped. Every attribution claim protected.
        </p>
      </div>

      <StaggerContainer>
        {relationships.map((r) => (
          <StaggerItem key={r.id}>
            <div className="card-elevated p-4 mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#0A1628]">{r.name}</p>
                  <p className="text-sm text-[#1E3A5F]/60">{r.company}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  r.attributionStatus === "active"
                    ? "bg-[#059669]/15 text-[#059669]"
                    : "bg-[#F59E0B]/15 text-[#F59E0B]"
                }`}>
                  {r.attributionStatus}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[#1E3A5F]/60">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{r.custodyAge}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{r.hash}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>{r.assetClass}</span>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}

        {relationships.length === 0 && (
          <div className="text-center py-16 text-[#1E3A5F]/40 text-sm">
            No custodied relationships yet. Timestamp your first introduction.
          </div>
        )}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 2: Create AttributionLedger page**

```tsx
// client/src/pages/AttributionLedger.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { TrendingUp, DollarSign } from "lucide-react";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";

export default function AttributionLedger() {
  const demo = useDemoFixtures();
  const { data: livePayouts } = trpc.payout.list.useQuery(undefined, { enabled: !demo });
  const payouts = demo?.payouts ?? livePayouts ?? [];

  const lifetimeTotal = payouts.reduce((s, p) => s + (typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount))), 0);

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A1628]">Attribution Ledger</h1>
          <p className="text-sm text-[#1E3A5F]/60 mt-1">Lifetime attribution — every originator fee, every follow-on.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#059669]">
            ${(lifetimeTotal / 1e6).toFixed(2)}M
          </p>
          <p className="text-xs text-[#1E3A5F]/50">Lifetime attributed</p>
        </div>
      </div>

      <StaggerContainer>
        {payouts.map((p) => (
          <StaggerItem key={p.id}>
            <div className="card-elevated p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#0A1628]">{p.deal}</p>
                {"originatorShare" in p && (
                  <p className="text-xs text-[#C4972A] font-medium mt-0.5">
                    {(p as { originatorShare: number }).originatorShare}% originator share
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0A1628]">
                  ${(typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount))).toLocaleString()}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  p.status === "triggered" || p.status === "completed"
                    ? "bg-[#059669]/15 text-[#059669]"
                    : "bg-[#F59E0B]/15 text-[#F59E0B]"
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 3: Create IntroductionPipeline page**

```tsx
// client/src/pages/IntroductionPipeline.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const PIPELINE_STAGES = ["Custodied", "Matched", "Consented", "Deal Room", "Closing", "Attributed"] as const;

export default function IntroductionPipeline() {
  const demo = useDemoFixtures();
  const { data: liveMatches } = trpc.match.list.useQuery(undefined, { enabled: !demo });
  const matches = demo?.matches ?? liveMatches ?? [];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Introduction Pipeline</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">Every introduction. Every stage. Every attribution claim.</p>
      </div>

      {/* Stage headers */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1E3A5F]/40">{stage}</p>
          </div>
        ))}
      </div>

      {/* Deals in pipeline — simplified kanban */}
      <StaggerContainer>
        {matches.map((m) => (
          <StaggerItem key={m.id}>
            <div className="card-elevated p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#0A1628] text-sm">{m.tag}</p>
                  <p className="text-xs text-[#1E3A5F]/50 mt-0.5">{m.assetClass} · {m.dealSize}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#C4972A]">{m.compatibilityScore}%</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1E3A5F]/10 text-[#1E3A5F]/60">
                    {m.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 4: Register routes in App.tsx**

Add imports:
```tsx
import CustodyRegister from "./pages/CustodyRegister";
import AttributionLedger from "./pages/AttributionLedger";
import IntroductionPipeline from "./pages/IntroductionPipeline";
```

Add routes (after existing routes, before NotFound):
```tsx
<Route path="/custody">
  <ShellRoute component={CustodyRegister} />
</Route>
<Route path="/attribution">
  <ShellRoute component={AttributionLedger} />
</Route>
<Route path="/pipeline">
  <ShellRoute component={IntroductionPipeline} />
</Route>
```

**Step 5: Run check**

```bash
pnpm check
```

**Step 6: Commit**

```bash
git add client/src/pages/CustodyRegister.tsx client/src/pages/AttributionLedger.tsx client/src/pages/IntroductionPipeline.tsx client/src/App.tsx
git commit -m "feat: Originator exclusive pages — CustodyRegister, AttributionLedger, IntroductionPipeline"
```

---

### Task 10: Build Investor exclusive pages (DealFlow, Portfolio, CounterpartyIntelligence)

**Files:**
- Create: `client/src/pages/DealFlow.tsx`
- Create: `client/src/pages/Portfolio.tsx`
- Create: `client/src/pages/CounterpartyIntelligence.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create DealFlow page**

```tsx
// client/src/pages/DealFlow.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { Shield, Target } from "lucide-react";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";

export default function DealFlow() {
  const demo = useDemoFixtures();
  const { data: liveMatches } = trpc.match.list.useQuery(undefined, { enabled: !demo });
  const matches = demo?.matches ?? liveMatches ?? [];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Deal Flow</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Verified counterparties only. Identities sealed until mutual consent.
        </p>
      </div>

      <StaggerContainer>
        {matches.map((m) => (
          <StaggerItem key={m.id}>
            <div className="card-elevated p-5 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-[#059669]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#059669]">Verified Counterparty</span>
                  </div>
                  <p className="font-semibold text-[#0A1628]">{m.tag}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#C4972A]">{m.compatibilityScore}%</p>
                  <p className="text-xs text-[#1E3A5F]/50">compatibility</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#1E3A5F]/60 mb-4">
                <span className="px-2 py-0.5 bg-[#1E3A5F]/8 rounded">{m.assetClass}</span>
                <span>{m.dealSize}</span>
                <span className="px-2 py-0.5 bg-[#1E3A5F]/8 rounded uppercase font-bold">SEALED</span>
              </div>

              <div className="flex gap-2">
                <motion.button
                  className="flex-1 py-2 bg-[#2563EB] text-white text-xs font-semibold uppercase tracking-wider rounded"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Express Interest → NDA
                </motion.button>
                <motion.button
                  className="px-4 py-2 border border-[#1E3A5F]/20 text-[#1E3A5F]/50 text-xs font-semibold uppercase tracking-wider rounded"
                  whileHover={{ scale: 1.02 }}
                >
                  Pass
                </motion.button>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 2: Create Portfolio page**

```tsx
// client/src/pages/Portfolio.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";

export default function Portfolio() {
  const demo = useDemoFixtures();
  const { data: livePayouts } = trpc.payout.list.useQuery(undefined, { enabled: !demo });
  const positions = demo?.payouts ?? livePayouts ?? [];

  const totalDeployed = positions.reduce((s, p) => s + (typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount))), 0);

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A1628]">Portfolio</h1>
          <p className="text-sm text-[#1E3A5F]/60 mt-1">Capital deployed across verified opportunities.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#0A1628]">${(totalDeployed / 1e6).toFixed(2)}M</p>
          <p className="text-xs text-[#1E3A5F]/50">total deployed</p>
        </div>
      </div>

      <StaggerContainer>
        {positions.map((p) => (
          <StaggerItem key={p.id}>
            <div className="card-elevated p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#0A1628]">{p.deal}</p>
                {"vintage" in p && (
                  <p className="text-xs text-[#1E3A5F]/50 mt-0.5">Vintage {(p as { vintage: string }).vintage}</p>
                )}
                {"irr" in p && (
                  <p className="text-xs text-[#059669] font-bold mt-0.5">{(p as { irr: number }).irr}% IRR</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#0A1628]">
                  ${(typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount))).toLocaleString()}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#059669]/15 text-[#059669] font-bold uppercase">
                  {p.status}
                </span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 3: Create CounterpartyIntelligence page**

```tsx
// client/src/pages/CounterpartyIntelligence.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { trpc } from "@/lib/trpc";
import { Shield, CheckCircle } from "lucide-react";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";

export default function CounterpartyIntelligence() {
  const demo = useDemoFixtures();
  const { data: liveRelationships } = trpc.relationship.list.useQuery(undefined, { enabled: !demo });
  const counterparties = demo?.relationships ?? liveRelationships ?? [];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Counterparty Intelligence</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Shared compliance passports. You access verification records — you don't duplicate them.
        </p>
      </div>

      <StaggerContainer>
        {counterparties.map((c) => (
          <StaggerItem key={c.id}>
            <div className="card-elevated p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#0A1628]">{c.name}</p>
                  <p className="text-sm text-[#1E3A5F]/60">{c.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#0A1628]">{c.trustScore}</p>
                  <p className="text-xs text-[#1E3A5F]/50">trust score</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["KYB", "OFAC", "AML"].map((check) => (
                  <div key={check} className="flex items-center gap-1.5 bg-[#059669]/8 rounded px-2 py-1">
                    <CheckCircle className="w-3 h-3 text-[#059669]" />
                    <span className="text-xs font-bold text-[#059669]">{check} Clean</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#1E3A5F]/40 mt-2">
                Shared compliance passport · {c.assetClass} · Custodied {c.custodyAge}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 4: Register routes in App.tsx**

```tsx
import DealFlow from "./pages/DealFlow";
import Portfolio from "./pages/Portfolio";
import CounterpartyIntelligence from "./pages/CounterpartyIntelligence";
```

```tsx
<Route path="/deal-flow">
  <ShellRoute component={DealFlow} />
</Route>
<Route path="/portfolio">
  <ShellRoute component={Portfolio} />
</Route>
<Route path="/counterparty-intelligence">
  <ShellRoute component={CounterpartyIntelligence} />
</Route>
```

**Step 5: Run check**

```bash
pnpm check
```

**Step 6: Commit**

```bash
git add client/src/pages/DealFlow.tsx client/src/pages/Portfolio.tsx client/src/pages/CounterpartyIntelligence.tsx client/src/App.tsx
git commit -m "feat: Investor exclusive pages — DealFlow, Portfolio, CounterpartyIntelligence"
```

---

### Task 11: Build Principal exclusive pages (AssetRegister, DemandRoom, CloseTracker)

**Files:**
- Create: `client/src/pages/AssetRegister.tsx`
- Create: `client/src/pages/DemandRoom.tsx`
- Create: `client/src/pages/CloseTracker.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create AssetRegister page**

```tsx
// client/src/pages/AssetRegister.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { motion } from "framer-motion";

export default function AssetRegister() {
  const demo = useDemoFixtures();
  const dealRooms = demo?.dealRooms ?? [];

  return (
    <FadeInView>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A1628]">Asset Register</h1>
          <p className="text-sm text-[#1E3A5F]/60 mt-1">Your assets. Sealed until you choose otherwise.</p>
        </div>
        <motion.button
          className="text-xs px-4 py-2 bg-[#C4972A] text-white font-semibold uppercase tracking-wider"
          whileHover={{ scale: 1.02 }}
        >
          + List New Asset
        </motion.button>
      </div>

      <StaggerContainer>
        {dealRooms.map((dr) => (
          <StaggerItem key={dr.id}>
            <div className="card-elevated p-5 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#0A1628]">{dr.name}</p>
                  <p className="text-sm text-[#1E3A5F]/60 mt-0.5">{dr.counterparty}</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-[#1E3A5F]/10 text-[#1E3A5F]/60 font-bold uppercase rounded-full">
                  {dr.stage}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[#1E3A5F]/50 mb-1">
                  <span>Capital Committed</span>
                  <span>${(dr.escrowCurrent / 1e6).toFixed(1)}M / ${(dr.escrowTarget / 1e6).toFixed(0)}M</span>
                </div>
                <div className="h-1.5 bg-[#0A1628]/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#C4972A] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${dr.escrowProgress}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              <div className="flex gap-4 text-xs text-[#1E3A5F]/50">
                <span>{dr.documentCount} documents</span>
                <span>{dr.auditEvents} audit events</span>
                <span>NDA: {dr.ndaStatus}</span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 2: Create DemandRoom page**

```tsx
// client/src/pages/DemandRoom.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { motion } from "framer-motion";

export default function DemandRoom() {
  const demo = useDemoFixtures();
  const matches = demo?.matches ?? [];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Demand Room</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          Qualified counterparty interactions. You control every disclosure.
        </p>
      </div>

      <StaggerContainer>
        {matches.map((m) => (
          <StaggerItem key={m.id}>
            <div className="card-elevated p-4 mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0A1628]">{m.tag}</p>
                <p className="text-xs text-[#1E3A5F]/50 mt-0.5">
                  Trust {m.compatibilityScore} · {m.assetClass} · {m.dealSize}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F59E0B]/15 text-[#F59E0B]">
                  Pending Consent
                </span>
                <motion.button
                  className="text-xs px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded font-medium"
                  whileHover={{ scale: 1.04 }}
                >
                  Open NDA
                </motion.button>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 3: Create CloseTracker page**

```tsx
// client/src/pages/CloseTracker.tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { CheckCircle, Circle } from "lucide-react";

const DEMO_MILESTONES = [
  { label: "Thesis Protection Active", done: true },
  { label: "First Qualified Match", done: true },
  { label: "NDA Executed", done: true },
  { label: "Due Diligence Complete", done: false },
  { label: "$18M Committed (next escrow trigger)", done: false },
  { label: "Regulatory Sign-off", done: false },
  { label: "Full Funding Close — $30M", done: false },
];

export default function CloseTracker() {
  const demo = useDemoFixtures();
  const dr = demo?.dealRooms[0];

  return (
    <FadeInView>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0A1628]">Close Tracker</h1>
        <p className="text-sm text-[#1E3A5F]/60 mt-1">
          {dr ? dr.name : "No active raise"} — milestone-by-milestone close coordination.
        </p>
      </div>

      <StaggerContainer>
        <StaggerItem>
          <div className="card-elevated p-5 mb-4">
            <h3 className="text-sm font-semibold text-[#0A1628] mb-4">Closing Milestones</h3>
            <div className="space-y-3">
              {DEMO_MILESTONES.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.done
                    ? <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
                    : <Circle className="w-4 h-4 text-[#1E3A5F]/20 shrink-0" />
                  }
                  <span className={`text-sm ${m.done ? "text-[#0A1628]" : "text-[#1E3A5F]/40"}`}>
                    {m.label}
                  </span>
                  {!m.done && i === DEMO_MILESTONES.findIndex(x => !x.done) && (
                    <span className="ml-auto text-xs px-2 py-0.5 bg-[#F59E0B]/15 text-[#F59E0B] font-bold uppercase rounded-full">
                      Next
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {dr && (
          <StaggerItem>
            <div className="card-elevated p-5">
              <h3 className="text-sm font-semibold text-[#0A1628] mb-2">Escrow Status</h3>
              <p className="text-2xl font-bold text-[#C4972A]">
                ${(dr.escrowCurrent / 1e6).toFixed(1)}M
                <span className="text-sm font-normal text-[#1E3A5F]/50 ml-2">
                  of ${(dr.escrowTarget / 1e6).toFixed(0)}M committed
                </span>
              </p>
              <p className="text-xs text-[#1E3A5F]/50 mt-1">
                Next release trigger: $18M committed
              </p>
            </div>
          </StaggerItem>
        )}
      </StaggerContainer>
    </FadeInView>
  );
}
```

**Step 4: Register routes in App.tsx**

```tsx
import AssetRegister from "./pages/AssetRegister";
import DemandRoom from "./pages/DemandRoom";
import CloseTracker from "./pages/CloseTracker";
```

```tsx
<Route path="/assets">
  <ShellRoute component={AssetRegister} />
</Route>
<Route path="/demand">
  <ShellRoute component={DemandRoom} />
</Route>
<Route path="/close">
  <ShellRoute component={CloseTracker} />
</Route>
```

**Step 5: Run check**

```bash
pnpm check
```

**Step 6: Commit**

```bash
git add client/src/pages/AssetRegister.tsx client/src/pages/DemandRoom.tsx client/src/pages/CloseTracker.tsx client/src/App.tsx
git commit -m "feat: Principal exclusive pages — AssetRegister, DemandRoom, CloseTracker"
```

---

## Phase 3 — Fully Wired Demo

### Task 12: Extend demoFixtures.ts with all missing page data

**Files:**
- Modify: `client/src/lib/demoFixtures.ts`

**Context:** 14 pages need fixture data. Some data already exists (relationships, intents, matches, dealRooms, payouts, notifications). Missing: deals, verification, familyOffices, capitalManagement, targeting, auditLogs, analytics, dealIntelligence, feeManagement, aiInsights. Each must be provided for all 3 personas.

**Step 1: Add missing fixture shapes to each persona**

Add the following structure to each of the three persona objects in `DEMO_FIXTURES`. Add after the existing `payouts` array.

**For originator:**
```ts
deals: [
  { id: 1, name: "Riyadh Solar JV", stage: "due_diligence", value: 47000000, originatorId: "demo-originator", counterparty: "Sealed — Institutional Allocator", createdAt: "2026-01-15" },
  { id: 2, name: "Gulf Coast Refinery", stage: "qualification", value: 12000000, originatorId: "demo-originator", counterparty: "Sealed — Family Office", createdAt: "2026-02-01" },
],
verification: {
  trustScore: 78, tier: "enhanced", kybStatus: "verified",
  components: { verification: 24, deals: 18, peerReviews: 14, compliance: 12, tenure: 10 },
  documents: [
    { id: 1, type: "Business Registration", status: "approved", uploadedAt: "2025-12-01" },
    { id: 2, type: "Director ID", status: "approved", uploadedAt: "2025-12-01" },
    { id: 3, type: "Proof of Address", status: "approved", uploadedAt: "2025-12-01" },
  ],
  nextUpgrade: { tier: "institutional", unlocks: ["$100M+ mandates", "Priority matching", "Whitelist status"] },
},
familyOffices: [
  { id: 1, name: "Al-Rashid Family Office", aum: "$2.4B", focus: ["Infrastructure", "Commodities"], trustScore: 91, location: "Riyadh", status: "active" },
  { id: 2, name: "Pacific Capital Partners", aum: "$340M", focus: ["Infrastructure", "Private Equity"], trustScore: 88, location: "Singapore", status: "active" },
],
targeting: [
  { id: 1, name: "Gulf Infrastructure Mandate", type: "family_office", criteria: { minAum: "500M", focus: ["Infrastructure"] }, matchCount: 14, status: "active" },
],
auditLogs: [
  { id: 1, action: "relationship.custody", entity: "Ahmad Al-Rashid introduction", actor: "Alex Mercer", hash: "0x7f3a...c12e", timestamp: "2026-02-18T14:22:00Z" },
  { id: 2, action: "match.found", entity: "Riyadh Solar JV", actor: "system", hash: "0x2b9d...4f7a", timestamp: "2026-02-17T09:15:00Z" },
  { id: 3, action: "payout.triggered", entity: "$1.175M originator fee", actor: "system", hash: "0x9e1c...8b3d", timestamp: "2026-02-16T11:30:00Z" },
],
analytics: {
  totalDeals: 2, totalDealValue: 59000000, totalEarnings: 1415000, avgTrustScore: 78,
  dealsByMonth: [
    { month: "Oct", deals: 0, value: 0 }, { month: "Nov", deals: 1, value: 12000000 },
    { month: "Dec", deals: 0, value: 0 }, { month: "Jan", deals: 1, value: 47000000 },
    { month: "Feb", deals: 0, value: 0 },
  ],
  topAssetClasses: [{ name: "Infrastructure", count: 1 }, { name: "Commodities", count: 1 }],
},
capitalManagement: {
  spvs: [],
  capitalCalls: [],
  commitments: [],
  summary: { totalCommitted: 0, totalDeployed: 0, available: 0 },
},
feeManagement: {
  totalRevenue: 1415000, originatorFees: 1175000, introducerFees: 240000, platformFees: 0,
  recentFees: [
    { id: 1, deal: "Riyadh Solar JV", type: "originator_fee", amount: 1175000, status: "triggered", date: "2026-02-18" },
    { id: 2, deal: "Gulf Coast Refinery", type: "originator_fee", amount: 240000, status: "pending", date: null },
  ],
},
aiInsights: [
  { id: 1, type: "opportunity", title: "Custody 3 more relationships to unlock Tier 3 matching", confidence: 92 },
  { id: 2, type: "risk", title: "Gulf Coast deal has been in qualification for 28 days — consider follow-up", confidence: 78 },
],
dealIntelligence: [
  { id: 1, name: "Riyadh Solar JV", sector: "Infrastructure", signals: ["Stage 2 ready", "IRR 18%+", "Regulatory cleared"], actionItems: ["Review term sheet", "Confirm escrow structure"] },
],
```

**Copy the analogous blocks for `investor` and `principal` with persona-appropriate data (investor sees portfolio analytics, principal sees raise-side analytics).**

**Investor additions:**
```ts
deals: [
  { id: 1, name: "Solar Infrastructure SPV", stage: "closing", value: 47000000, originatorId: "demo-originator", counterparty: "Meridian Renewables · Trust 91", createdAt: "2026-01-20" },
],
verification: {
  trustScore: 91, tier: "institutional", kybStatus: "verified",
  components: { verification: 30, deals: 25, peerReviews: 20, compliance: 10, tenure: 6 },
  documents: [
    { id: 1, type: "Fund Registration", status: "approved", uploadedAt: "2025-10-01" },
    { id: 2, type: "LP Agreement", status: "approved", uploadedAt: "2025-10-01" },
    { id: 3, type: "Accreditation Proof", status: "approved", uploadedAt: "2025-10-01" },
  ],
  nextUpgrade: null,
},
familyOffices: [
  { id: 1, name: "Pacific Capital Partners", aum: "$340M", focus: ["Infrastructure", "PE"], trustScore: 91, location: "Singapore", status: "self" },
],
targeting: [
  { id: 1, name: "Solar Infrastructure — $30M+", type: "deal", criteria: { minSize: "30M", sector: "Infrastructure" }, matchCount: 4, status: "active" },
  { id: 2, name: "Gulf Commodities — EN590 spot", type: "deal", criteria: { minSize: "10M", sector: "Commodities" }, matchCount: 2, status: "active" },
],
auditLogs: [
  { id: 1, action: "match.expressed_interest", entity: "Solar Infrastructure SPV", actor: "Pacific Capital Partners", hash: "0x1a2b...3c4d", timestamp: "2026-02-17T10:00:00Z" },
  { id: 2, action: "dealroom.nda_executed", entity: "Solar Infrastructure SPV", actor: "Pacific Capital Partners", hash: "0x5e6f...7g8h", timestamp: "2026-02-17T10:32:00Z" },
  { id: 3, action: "capital_call.issued", entity: "$450K · Solar Infrastructure SPV", actor: "system", hash: "0x9a0b...1c2d", timestamp: "2026-02-15T09:00:00Z" },
],
analytics: {
  totalDeals: 1, totalDealValue: 47000000, totalEarnings: 0, avgTrustScore: 91,
  dealsByMonth: [
    { month: "Oct", deals: 0, value: 0 }, { month: "Nov", deals: 0, value: 0 },
    { month: "Dec", deals: 0, value: 0 }, { month: "Jan", deals: 1, value: 47000000 },
    { month: "Feb", deals: 0, value: 0 },
  ],
  topAssetClasses: [{ name: "Infrastructure", count: 1 }],
},
capitalManagement: {
  spvs: [{ id: 1, name: "Solar Infrastructure SPV", status: "active", committed: 2100000, target: 47000000 }],
  capitalCalls: [{ id: 1, spvId: 1, amount: 450000, dueDate: "2026-03-01", status: "pending" }],
  commitments: [{ id: 1, spvId: 1, amount: 2100000, status: "deployed" }],
  summary: { totalCommitted: 2100000, totalDeployed: 2100000, available: 337900000 },
},
feeManagement: {
  totalRevenue: 0, originatorFees: 0, introducerFees: 0, platformFees: 0,
  recentFees: [],
},
aiInsights: [
  { id: 1, type: "opportunity", title: "Solar Infrastructure SPV closing window: 14 days to full funding", confidence: 88 },
  { id: 2, type: "signal", title: "PropTech Series B match has 84% compatibility — express interest before mandate expires", confidence: 81 },
],
dealIntelligence: [
  { id: 1, name: "Solar Infrastructure SPV", sector: "Infrastructure", signals: ["Stage 2 ready", "Escrow 65%", "Meridian Trust 91"], actionItems: ["Sign final term sheet", "Wire capital call"] },
],
```

**Principal additions:**
```ts
deals: [
  { id: 1, name: "Riyadh Solar JV — $30M Raise", stage: "fundraising", value: 30000000, originatorId: null, counterparty: "3 qualified investors — sealed", createdAt: "2025-12-01" },
],
verification: {
  trustScore: 65, tier: "basic", kybStatus: "verified",
  components: { verification: 12, deals: 8, peerReviews: 0, compliance: 10, tenure: 5 },
  documents: [
    { id: 1, type: "Company Registration", status: "approved", uploadedAt: "2025-11-01" },
    { id: 2, type: "Director ID", status: "approved", uploadedAt: "2025-11-01" },
  ],
  nextUpgrade: { tier: "enhanced", unlocks: ["Tier 2 investor mandates", "Direct introductions", "Compliance passport sharing"] },
},
familyOffices: [],
targeting: [
  { id: 1, name: "Institutional Solar Mandate", type: "investor", criteria: { minDeployment: "30M", sector: "Infrastructure" }, matchCount: 3, status: "active" },
],
auditLogs: [
  { id: 1, action: "asset.listed", entity: "Riyadh Solar JV — $30M Raise", actor: "Meridian Renewables", hash: "0x3f4g...5h6i", timestamp: "2025-12-01T08:00:00Z" },
  { id: 2, action: "match.found", entity: "Institutional Allocator match", actor: "system", hash: "0x7j8k...9l0m", timestamp: "2026-01-10T14:00:00Z" },
  { id: 3, action: "escrow.milestone", entity: "$12M of $30M committed", actor: "system", hash: "0x1n2o...3p4q", timestamp: "2026-02-10T11:00:00Z" },
],
analytics: {
  totalDeals: 1, totalDealValue: 30000000, totalEarnings: 0, avgTrustScore: 65,
  dealsByMonth: [
    { month: "Oct", deals: 0, value: 0 }, { month: "Nov", deals: 0, value: 0 },
    { month: "Dec", deals: 1, value: 30000000 }, { month: "Jan", deals: 0, value: 0 },
    { month: "Feb", deals: 0, value: 0 },
  ],
  topAssetClasses: [{ name: "Infrastructure", count: 1 }],
},
capitalManagement: {
  spvs: [{ id: 1, name: "Riyadh Solar JV SPV", status: "fundraising", committed: 12000000, target: 30000000 }],
  capitalCalls: [],
  commitments: [],
  summary: { totalCommitted: 12000000, totalDeployed: 0, available: 0 },
},
feeManagement: {
  totalRevenue: 0, originatorFees: 0, introducerFees: 0, platformFees: 0,
  recentFees: [],
},
aiInsights: [
  { id: 1, type: "upgrade", title: "Upgrade to Enhanced tier to unlock Tier 3 institutional mandates worth $100M+", confidence: 95 },
  { id: 2, type: "signal", title: "Investor 3 (PE Fund, 78% match) has not responded — consider adjusting minimum ticket", confidence: 72 },
],
dealIntelligence: [
  { id: 1, name: "Riyadh Solar JV", sector: "Infrastructure", signals: ["$12M committed", "3 investors engaged", "Stage 2 certified"], actionItems: ["Follow up with PE Fund match", "Upgrade verification tier"] },
],
```

**Step 2: Update DemoFixtures type**

The TypeScript type is auto-inferred from `DEMO_FIXTURES as const` — verify it picks up the new fields.

```bash
pnpm check
```

**Step 3: Commit**

```bash
git add client/src/lib/demoFixtures.ts
git commit -m "feat: extend demoFixtures with all 15 page data sets for all 3 personas"
```

---

### Tasks 13–22: Wire all 14 remaining pages

**For each page below, the pattern is identical:**

```tsx
const demo = useDemoFixtures();
// disable tRPC in demo
const { data: liveData } = trpc.x.y.useQuery(undefined, { enabled: !demo });
// fixture takes priority
const data = demo?.pageKey ?? liveData ?? fallback;
```

Apply this pattern to:

| Task | Page | File | Demo key | tRPC query |
|------|------|------|----------|------------|
| 13 | Relationships | `pages/Relationships.tsx` | `demo.relationships` | `trpc.relationship.list` |
| 14 | Intents | `pages/Intents.tsx` | `demo.intents` | `trpc.intent.list` |
| 15 | Matches | `pages/Matches.tsx` | `demo.matches` | `trpc.match.list` |
| 16 | DealRooms | `pages/DealRooms.tsx` | `demo.dealRooms` | `trpc.dealRoom.list` |
| 17 | Payouts | `pages/Payouts.tsx` | `demo.payouts` | `trpc.payout.list` |
| 18 | Deals | `pages/Deals.tsx` | `demo.deals` | `trpc.deal.list` |
| 19 | Verification | `pages/Verification.tsx` | `demo.verification` | multiple queries |
| 20 | FamilyOffices | `pages/FamilyOffices.tsx` | `demo.familyOffices` | `trpc.familyOffice.list` |
| 21 | CapitalManagement | `pages/CapitalManagement.tsx` | `demo.capitalManagement` | `trpc.capital.*` |
| 22 | Targeting | `pages/Targeting.tsx` | `demo.targeting` | `trpc.targeting.list` |
| 23 | AuditLogs | `pages/AuditLogs.tsx` | `demo.auditLogs` | `trpc.audit.query` |
| 24 | DealIntelligence | `pages/DealIntelligence.tsx` | `demo.dealIntelligence` | hardcoded → fixtures |
| 25 | FeeManagement | `pages/FeeManagement.tsx` | `demo.feeManagement` | hardcoded → fixtures |
| 26 | AIBrain | `pages/AIBrain.tsx` | `demo.aiInsights` | hardcoded → fixtures |

**Each task follows the same steps:**

**Step 1:** Add `import { useDemoFixtures } from "@/contexts/DemoContext";` at top of file

**Step 2:** Add `const demo = useDemoFixtures();` at top of component body

**Step 3:** Add `enabled: !demo` to every `useQuery()` call in the component

**Step 4:** Replace data source: `const items = demo?.KEY ?? liveData ?? [];`

**Step 5:** For pages with multiple queries (Verification: 6 queries, FamilyOffices: 8 queries), add `enabled: !demo` to every single one — search for `useQuery` and `useMutation` and disable mutations in demo mode with `onMutate: () => { if (demo) return; }` or by gating the submit handler.

**Step 6:** For DealIntelligence, FeeManagement, AIBrain — replace the inline hardcoded arrays with `demo?.KEY ?? hardcodedFallback` so fixture data is persona-aware but the fallback still works.

**Step 7 (each task):**
```bash
pnpm check && pnpm test
git add client/src/pages/PageName.tsx
git commit -m "feat: wire PAGE_NAME to demo fixtures — enabled:!demo on all tRPC queries"
```

---

## Phase 4 — Industry Selection

### Task 27: Industry selection step in OnboardingFlow

**Files:**
- Modify: `client/src/pages/OnboardingFlow.tsx`

**Context:** After the persona selection step (step 0), add an industry selection step (step 1) that multi-selects from the industry taxonomy. Saves to `primaryIndustries` via a new `trpc.user.updateProfile` call.

**Step 1: Add industry taxonomy constant**

In `client/src/lib/copy.ts`:

```ts
export const INDUSTRY_TAXONOMY = {
  Commodities: ["Oil & Gas", "Metals & Mining", "Agricultural", "Chemicals", "LNG"],
  "Real Estate": ["Commercial", "Residential", "Land", "Industrial", "Mixed-Use"],
  Infrastructure: ["Renewable Energy", "Utilities", "Transport", "Telecoms", "Water"],
  "Private Equity & M&A": ["Growth", "Buyout", "Venture", "Distressed", "Secondary"],
  "Financial Instruments": ["Debt", "Structured Products", "Trade Finance", "Bonds"],
  "Fine Art & Collectibles": [],
  "Digital Assets & Crypto": [],
  "Other / Bespoke": [],
} as const;

export type IndustryCategory = keyof typeof INDUSTRY_TAXONOMY;
```

**Step 2: Add industry step to STEPS array in OnboardingFlow**

After the persona step (index 0), insert:

```tsx
{
  id: "industries",
  title: "Your Industries",
  subtitle: "Select the asset classes you operate in. This shapes your deal flow, match filters, and dashboard vocabulary.",
  component: <IndustrySelectionStep
    selected={formData.industries as string[] ?? []}
    onChange={(v) => set("industries", v)}
  />,
},
```

**Step 3: Build IndustrySelectionStep component inline**

```tsx
function IndustrySelectionStep({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (cat: string) => {
    onChange(selected.includes(cat)
      ? selected.filter(x => x !== cat)
      : [...selected, cat]
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.keys(INDUSTRY_TAXONOMY).map((cat) => (
        <motion.button
          key={cat}
          type="button"
          onClick={() => toggle(cat)}
          className={`p-3 text-left border text-sm rounded transition-colors ${
            selected.includes(cat)
              ? "border-[#C4972A] bg-[#C4972A]/8 text-[#0A1628]"
              : "border-[#1E3A5F]/15 text-[#1E3A5F]/60 hover:border-[#1E3A5F]/30"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {selected.includes(cat) && <CheckCircle className="w-3 h-3 text-[#C4972A] mb-1" />}
          <span className="font-medium">{cat}</span>
        </motion.button>
      ))}
    </div>
  );
}
```

**Step 4: Run check**

```bash
pnpm check
```

**Step 5: Commit**

```bash
git add client/src/pages/OnboardingFlow.tsx client/src/lib/copy.ts
git commit -m "feat: industry selection step in OnboardingFlow + INDUSTRY_TAXONOMY"
```

---

### Task 28: Industry context switcher in sidebar

**Files:**
- Create: `client/src/components/IndustrySwitcher.tsx`
- Modify: `client/src/components/DashboardLayout.tsx`

**Step 1: Create IndustrySwitcher**

```tsx
// client/src/components/IndustrySwitcher.tsx
import { useState } from "react";
import { useDemoContext, usePersonaSwitcher } from "@/contexts/DemoContext";
import { INDUSTRY_TAXONOMY, type IndustryCategory } from "@/lib/copy";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRY_KEYS = Object.keys(INDUSTRY_TAXONOMY) as IndustryCategory[];

export function IndustrySwitcher() {
  const { activeIndustry, isDemo } = useDemoContext();
  const { switchIndustry } = usePersonaSwitcher();
  const [open, setOpen] = useState(false);

  const current = activeIndustry ?? "Commodities";

  return (
    <div className="px-3 mb-2 relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs text-[#1E3A5F]/50 hover:text-[#1E3A5F]/80 py-1 transition-colors"
      >
        <span className="font-semibold uppercase tracking-widest text-[9px]">
          {current}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-3 right-3 top-full z-50 bg-white border border-[#1E3A5F]/10 rounded shadow-lg py-1"
          >
            {INDUSTRY_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => { switchIndustry(k); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  current === k
                    ? "text-[#C4972A] font-semibold"
                    : "text-[#1E3A5F]/60 hover:text-[#1E3A5F]/90 hover:bg-[#1E3A5F]/4"
                }`}
              >
                {k}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Add IndustrySwitcher to DashboardLayout sidebar above PersonaSwitcher**

```tsx
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
// ...
<IndustrySwitcher />
<PersonaSwitcher />
```

**Step 3: Run check**

```bash
pnpm check
```

**Step 4: Commit**

```bash
git add client/src/components/IndustrySwitcher.tsx client/src/components/DashboardLayout.tsx
git commit -m "feat: IndustrySwitcher in sidebar — industry context switcher above PersonaSwitcher"
```

---

### Task 29: Final verification — full demo run

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Manual demo walkthrough checklist**

Visit `http://localhost:5173` and verify:

- [ ] Landing page loads, "Enter Demo" opens PersonaPicker
- [ ] Select Originator → Dashboard shows Originator widgets (Custody Register Summary, Attribution Earnings, Payout Waterfall)
- [ ] Originator nav shows: Custody Register, Attribution Ledger, Introduction Pipeline
- [ ] PersonaSwitcher at sidebar bottom — click Investor → dashboard switches instantly to Investor view
- [ ] Investor nav shows: Deal Flow, Portfolio, Counterparty Intelligence
- [ ] Click Principal → dashboard switches to Principal view
- [ ] Principal nav shows: Asset Register, Demand Room, Close Tracker
- [ ] Navigate to each exclusive page — no empty states, all show fixture data
- [ ] Navigate to Relationships, Intents, Matches, Deals, DealRooms, Payouts — all show fixture data
- [ ] Navigate to Verification — shows trust score + documents
- [ ] Navigate to Audit Logs — shows hash-chained events
- [ ] Navigate to AI Brain, Deal Intelligence, Fee Management — persona-aware data
- [ ] IndustrySwitcher in sidebar opens taxonomy dropdown
- [ ] Switch industry → widget vocabulary updates (future: full vocabulary system)
- [ ] Shared core (Verification, Audit Logs, Settings) visible in all persona navs

**Step 3: Run full check + test**

```bash
pnpm check && pnpm test
```

Expected: TypeScript clean (minus pre-existing GuidedTour errors), all 37 tests pass.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: fully wired demo — all 15 pages persona-aware, industry switcher, three persona dashboards complete"
```

**Step 5: Deploy**

```bash
vercel deploy --prod
```

---

## Key Invariants (Do Not Break)

1. **`enabled: !demo` on every `useQuery` in every page** — not just the main query, but every secondary query too. Missing one causes a tRPC call that may error in demo mode.

2. **`demo?.key ?? liveData ?? []` fallback chain** — always three levels: demo fixture → live data → empty default. Never just `demo?.key ?? []` (breaks live mode) or `liveData ?? []` (breaks demo mode).

3. **PersonaSwitcher switches `activePersona` in context** — it does NOT change `primaryPersona` on the server. Primary persona is a profile setting changed in Settings only.

4. **Attribution data is originator-persona-scoped** — never display `originatorId`, `attributionChain`, or `attributionPercentage` in the Investor or Principal pages' primary UI. These fields are Originator-exclusive.

5. **No empty states in demo** — if a fixture key is missing for a page, the page will show empty. Always check every page in every persona before marking demo complete.
