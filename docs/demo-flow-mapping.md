# Demo Flow Mapping Analysis

## Overview
Analysis of demo mode implementation in ANAVI project, focusing on demo-specific flows, interactions, and gaps. Examined DemoContext, demo fixtures, demo adapter, guided tour, and demo pages.

## Demo Mode Implementation
- **Runtime Modes**: `demo`, `hybrid`, `live` (env variable `APP_RUNTIME_MODE`)
- **Capabilities**: `allowDemoFixtures`, `allowSyntheticUser`, `requireAuthRedirect`
- **DemoContext**: Unified context provider at `client/src/contexts/DemoContext.tsx`
- **Fixtures**: Whitepaper-aligned synthetic data for three personas (`originator`, `investor`, `principal`) in `client/src/lib/demoFixtures.ts`
- **Scenarios**: Baseline, Momentum, Closing Window (adjust fixture data)
- **Adapter**: `demoAdapter.ts` bridges fixtures to demo UI data contract

## Demo Flow Steps
1. **Persona Selection**: `PersonaSelector` presents three personas with descriptions and stats.
2. **Dashboard**: Sidebar navigation to six pages: Dashboard, Relationships, Matches, Deal Rooms, Verification, Payouts.
3. **Guided Tour**: Two tour systems:
   - `GuidedTour` (demo experience) uses `data-tour` attributes.
   - `TourOverlay` (live app onboarding) uses `data-tour-id`.
   - Tour steps map to pages and highlight key concepts.
4. **Interactive Elements**:
   - Create Intent button (navigates to Matches)
   - Protect Relationship button (navigates to Relationships)
   - Enter Deal Room modal (simulated deal room interior)
   - Apply for Access link (navigates to /register)

## Demo-Specific Interactions
- **Persona Switching**: Function exists (`switchPersona`) but no UI after initial selection.
- **Industry Switching**: Function exists (`switchIndustry`) but no UI.
- **Scenario Switching**: `DemoScenarioSwitcher` component exists but not integrated into demo UI.
- **Guided Tour Navigation**: Automatically changes pages as user progresses through tour steps.
- **Simulated Actions**: Buttons navigate but don't simulate actual API calls or state changes.

## Gaps and Inconsistencies
1. **Demo Data Leakage**: Known issue: hardcoded mock data shown regardless of runtime mode; some tRPC queries may lack `enabled: !demo` guard.
2. **Missing UI Controls**: No visible scenario switcher, industry switcher, or persona switcher after initial selection.
3. **Limited Simulation**: Actions like "Create Intent" and "Protect Relationship" only navigate, don't demonstrate outcome.
4. **Persona Taxonomy**: Legacy personas (`developer`, `allocator`, `acquirer`) still present in onboarding but canonical personas are `originator`, `investor`, `principal`.
5. **Tour Coverage**: All major demo sections have `data-tour` attributes, but some interactive elements lack tour hints.
6. **Demo vs Live Separation**: ProtectedRoute correctly bypasses auth for demo/hybrid mode, but demo data may leak into live queries.

## Improvement Proposals
### 1. Enhanced Demo Experience (Education)
- **Interactive Tutorial**: Step-by-step walkthrough with simulated actions (e.g., "Click Create Intent to see how matching works").
- **Concept Tooltips**: Expand tooltip system to explain each UI element in demo mode.
- **Scenario Exploration**: Integrate `DemoScenarioSwitcher` into demo sidebar to show different business scenarios.
- **Industry Switcher**: Dropdown to change asset class (Commodities, Infrastructure, Private Equity) and update fixture data.

### 2. Sales Demonstration Enhancements
- **Outcome Simulation**: Buttons should trigger visual feedback (e.g., "Intent created! Match found.") without requiring backend.
- **Persona Switching**: Allow switching personas mid‑demo to compare perspectives.
- **Deal Room Deep Dive**: Expand deal room modal to show more tabs (documents, audit trail, compliance).
- **Payout Animation**: Visualize attribution payout flow with animated numbers.

### 3. Technical Improvements
- **Data Leakage Fix**: Audit all tRPC queries and add `enabled: !demo` guard where missing.
- **Unified Demo State**: Ensure all demo pages use `useDemoFixtures` and fall back to real data only in live mode.
- **Scenario Persistence**: Persist selected scenario across page navigation.
- **Demo‑Only Components**: Clearly separate demo‑only components with `capabilities.allowDemoFixtures` checks.

### 4. Onboarding/Training Integration
- **Demo as Onboarding**: Use demo mode for new user onboarding (guided tour with interactive tasks).
- **Training Scenarios**: Create scenario‑based training modules (e.g., "Close a deal", "Resolve a compliance alert").
- **Progress Tracking**: Track user completion of demo steps for analytics.

## Files Examined
- `client/src/contexts/DemoContext.tsx`
- `client/src/lib/demoFixtures.ts`
- `client/src/pages/demo/demoAdapter.ts`
- `client/src/pages/demo/index.tsx`
- `client/src/pages/demo/DemoContentPages.tsx`
- `client/src/pages/demo/PersonaSelector.tsx`
- `client/src/pages/demo/DemoBanner.tsx`
- `client/src/components/DemoScenarioSwitcher.tsx`
- `client/src/lib/tourDefinitions.ts`
- `client/src/contexts/AppModeContext.tsx`
- `client/src/components/ProtectedRoute.tsx`
- `shared/appMode.ts`

## Next Steps
- Implement missing UI controls for scenario/industry/persona switching.
- Fix data leakage by auditing tRPC queries.
- Enhance simulation feedback for demo actions.
- Integrate demo more deeply with onboarding flow.