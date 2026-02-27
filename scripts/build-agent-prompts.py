#!/usr/bin/env python3
"""
Builds all Phase 1 Gemini agent prompt files with real source code injected.
Run from: /home/ariel/Documents/anavi-main/
"""
import os

ROOT = "/home/ariel/Documents/anavi-main"
ANAVI = f"{ROOT}/anavi"
AGENTS = f"{ROOT}/scripts/agents"
os.makedirs(AGENTS, exist_ok=True)

def read(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        return f"[FILE NOT FOUND: {path}]"

def write_agent(n, name, prompt):
    path = f"{AGENTS}/agent{n}-{name}.txt"
    with open(path, 'w') as f:
        f.write(prompt)
    print(f"  Written: {path} ({len(prompt):,} chars)")

# ─── Load all source files ──────────────────────────────────────────────────

WHITEPAPER_CONTEXT = """
ANAVI WHITEPAPER VISION (condensed):
- "The Private Market Operating System" — "If Bloomberg runs public markets, ANAVI will run private ones."
- Positioning: neutral trust infrastructure for the $13+ trillion private markets ecosystem
- Eliminates: broker chains (5-15 per deal), relationship leakage, due diligence duplication, fraud

6 CORE MODULES:
1. Identity/KYC — Trust Score (dynamic, compound), verification tiers: Basic/Enhanced/Institutional, KYB
2. Relationship Custody — Cryptographic timestamps, blind until consent, forever attribution (originators get 40-60%)
3. Blind Matching — Intent-based (Buy/Sell/Invest intents), anonymized until mutual consent, compatibility scoring
4. Deal Rooms — NDA-gated, document versioning, e-signature, immutable audit trail, escrow milestones
5. Compliance/Escrow — AML/KYC rails, OFAC screening, per-deal compliance, milestone-triggered fund release
6. Economics Engine — Automated payouts on deal close, lifetime attribution for follow-on deals, trajectory tracking

TARGET PERSONAS:
- Deal Originator/Broker: "My introductions close deals I never get credit for." → custody + lifetime attribution
- Investor/Family Office: "I can't tell which deals are real." → verified counterparties + blind matching
- Project Developer/Asset Owner: "Raising capital means exposing my thesis." → anonymous until consent

UX PRINCIPLES (from Webaroo spec):
- Navy/blue palette, luxury aesthetic, institutional-grade
- "Simplicity as design principle. Progressive disclosure — advanced features available but not in the way."
- The platform should feel like Bloomberg Terminal meets private club

THE TRANSFORMATION:
Before: 5-15 broker chains → After: Direct verified counterparty access
Before: Manual costly due diligence → After: Pre-verified participant network
Before: Relationship leakage + circumvention → After: Custodied relationships with lifetime attribution
Before: Opaque, negotiated fees → After: Transparent, automated economics
Before: High fraud risk → After: Trust-scored network with blacklist controls
Before: One-time transaction relationships → After: Compounding relationship value over time

CODEBASE ARCHITECTURE:
- Client: React 19, Vite, wouter, tRPC React Query, Tailwind 4, shadcn/ui, framer-motion
- Server: Node, Express, tRPC v11, Drizzle ORM (MySQL/TiDB)
- Working dir: anavi/
- Key paths: client/src/pages/ (40+ pages), client/src/components/, client/src/lib/, client/src/contexts/
- Route wrappers: ShellRoute (auth + DashboardLayout + PageTransition), ProtectedPage (auth only), Bare (public)
"""

src = {
    'dashboard': read(f"{ANAVI}/client/src/pages/Dashboard.tsx"),
    'app': read(f"{ANAVI}/client/src/App.tsx"),
    'layout': read(f"{ANAVI}/client/src/components/DashboardLayout.tsx"),
    'tour_defs': read(f"{ANAVI}/client/src/lib/tourDefinitions.ts"),
    'tour_live': read(f"{ANAVI}/client/src/tour/definitions.ts"),
    'tour_comp': read(f"{ANAVI}/client/src/components/GuidedTour.tsx"),
    'tour_overlay': read(f"{ANAVI}/client/src/components/TourOverlay.tsx"),
    'fixtures': read(f"{ANAVI}/client/src/lib/demoFixtures.ts"),
    'demo_ctx': read(f"{ANAVI}/client/src/contexts/DemoContext.tsx"),
    'copy': read(f"{ANAVI}/client/src/lib/copy.ts"),
    'onboarding_flow': read(f"{ANAVI}/client/src/pages/OnboardingFlow.tsx"),
    'onboarding': read(f"{ANAVI}/client/src/pages/Onboarding.tsx"),
    'guided_tour_overlay': read(f"{ANAVI}/client/src/components/GuidedTourOverlay.tsx"),
    'persona_picker': read(f"{ANAVI}/client/src/components/PersonaPicker.tsx"),
}

# List all page names for Agent 6
import glob
page_files = glob.glob(f"{ANAVI}/client/src/pages/*.tsx")
page_names = sorted([os.path.basename(f) for f in page_files])
page_list = "\n".join(page_names)

print("Source files loaded:")
for k, v in src.items():
    print(f"  {k}: {len(v):,} chars")

# ─── AGENT 1: Dashboard Intelligence ────────────────────────────────────────
print("\nBuilding Agent 1: Dashboard Intelligence...")

AGENT1 = f"""You are a senior frontend architect and product designer auditing the ANAVI Dashboard component against its whitepaper vision. Be hyper-meticulous and non-superficial.

{WHITEPAPER_CONTEXT}

# DASHBOARD SOURCE (client/src/pages/Dashboard.tsx)
```tsx
{src['dashboard']}
```

# COPY TOKENS (client/src/lib/copy.ts)
```ts
{src['copy']}
```

# DEMO FIXTURES (client/src/lib/demoFixtures.ts)
```ts
{src['fixtures']}
```

# AUDIT TASK
Perform a deep, exhaustive audit of Dashboard.tsx against the ANAVI whitepaper vision. Go line by line if necessary.

For EACH of the 6 whitepaper modules, audit the Dashboard:
1. Visual weight: does this module get appropriate prominence?
2. Copy accuracy: does terminology exactly match whitepaper language?
3. Information architecture: is the hierarchy correct for the module's importance?
4. Institutional feel: does this section feel like Bloomberg Terminal or like a generic SaaS dashboard?
5. Data completeness: does it show all the data the whitepaper says this module should expose?

Also audit deeply:
- data-tour attribute coverage and correctness
- MaybeLink usage — are ALL navigation links properly wrapped?
- Demo mode: are ALL tRPC queries using enabled: !demo?
- Copy drift: any hardcoded strings that should use tokens from lib/copy.ts?
- Visual hierarchy: is the 6-module structure legible at a glance?
- CTA clarity: does each section have a clear primary action?
- Missing whitepaper concepts (e.g. "Compliance Passport", "Introduction Chain", "Whitelist Status")

Return a JSON object with EXACTLY this structure (no markdown, no explanation, pure JSON):
{{
  "module_audit": [
    {{
      "module": "Identity/KYC",
      "visual_weight_current": "low|medium|high",
      "visual_weight_needed": "low|medium|high",
      "issues": ["specific issue 1", "specific issue 2"],
      "whitepaper_concepts_missing": ["concept not in UI"],
      "copy_violations": ["specific copy that doesn't match whitepaper"],
      "proposed_changes": ["specific actionable JSX/copy change"]
    }}
  ],
  "data_tour_coverage": {{
    "present": ["trust-score", "relationships", "match-card", "deal-room", "payout", "verification", "apply", "dashboard", "activity-feed", "deal-matching"],
    "referenced_in_tour_defs_but_missing_in_dom": ["list selectors from tourDefinitions.ts NOT found in Dashboard.tsx"],
    "present_but_not_in_tour_defs": ["data-tour values in Dashboard.tsx NOT referenced in tourDefinitions.ts"],
    "incorrect_selectors": [{{"tourFile": "demoTour|onboardingTour|buildDemoTourSteps", "step_title": "title", "selector": "wrong selector", "correct_selector": "right selector"}}]
  }},
  "demo_mode_audit": {{
    "tRPC_queries_missing_enabled_guard": [{{"query": "trpc.x.y.useQuery", "line_approx": 0}}],
    "navigation_links_missing_MaybeLink": [{{"link_target": "/path", "line_approx": 0}}],
    "tRPC_queries_correctly_gated": ["list of queries that ARE correctly gated"]
  }},
  "copy_drift": [
    {{"line_approx": 0, "hardcoded_string": "exact text", "should_use": "COPY.TOKEN or description"}}
  ],
  "visual_hierarchy_score": {{
    "score": 1,
    "max": 10,
    "critique": "honest assessment",
    "top_3_improvements": ["improvement 1", "improvement 2", "improvement 3"]
  }},
  "institutional_feel_score": {{
    "score": 1,
    "max": 10,
    "critique": "honest assessment",
    "what_would_make_it_10": "description"
  }},
  "dashboard_upgrade_spec": {{
    "structural_changes": ["Move Trust Score to hero position at top", "..."],
    "visual_changes": ["Trust Score ring should be 180px with glow effect", "..."],
    "copy_changes": ["Replace 'Pending Actions' with 'Compliance Status'", "..."],
    "information_additions": ["Show originator attribution % on payout items", "..."],
    "cta_improvements": ["Primary CTA per section should be labeled with whitepaper action", "..."]
  }}
}}"""

write_agent(1, "dashboard-intelligence", AGENT1)

# ─── AGENT 2: Navigation Architecture ───────────────────────────────────────
print("Building Agent 2: Navigation Architecture...")

AGENT2 = f"""You are a senior frontend architect auditing the ANAVI navigation structure against its 6-module whitepaper architecture. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# APP.TSX (all routes defined here)
```tsx
{src['app']}
```

# DASHBOARDLAYOUT.TSX (navSections + full component)
```tsx
{src['layout']}
```

# AUDIT TASK
The whitepaper defines 6 core modules. The sidebar navigation should guide users through these modules as a journey, not dump feature links. Audit the current navSections against this 6-module journey.

The PROPOSED 6-module sidebar hierarchy:
```
OVERVIEW
  Dashboard, Analytics

TRUST & IDENTITY
  Verification (Trust Score, KYB), Compliance, Audit Logs

RELATIONSHIPS
  Relationships (Custody), Family Offices, Targeting, Network Graph

DEALS
  Deal Matching (Intent + Blind Matches), Deal Rooms, Deals, Deal Intelligence

ECONOMICS
  Payouts (Attribution), LP Portal, Fee Management

INTELLIGENCE
  AI Brain, Intelligence

SETTINGS
  Calendar, Settings
```

Pages that should be HIDDEN from sidebar (accessible via links only):
- /demo — legacy demo route
- /welcome, /onboarding — onboarding flows (redirected post-signup)
- /deal-rooms/:id — accessed from deal rooms list
- /manifesto — accessible from settings or footer
- /operator-intake — admin/internal
- /knowledge-graph — advanced, accessible from Intelligence section
- /spv-generator — accessible from Deal Rooms
- /trading, /crypto-assets, /commodities, /transaction-matching, /member-onboarding — Phase 2 verticals (visible but labeled "Coming Soon" or in a separate section)
- /real-estate, /capital-management — Phase 2 (similar)

Audit:
1. Which routes have wrong ShellRoute/ProtectedPage/Bare wrappers?
2. Which pages in navSections link to non-existent routes?
3. Which important pages are missing from navSections entirely?
4. Is the current grouping logical from a user journey perspective?
5. Are tourIds assigned to the right nav items?

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "current_nav_issues": [
    {{"section": "section name", "item": "nav item label", "path": "/path", "issue": "description"}}
  ],
  "route_wrapper_issues": [
    {{"path": "/path", "current_wrapper": "ShellRoute|ProtectedPage|Bare", "correct_wrapper": "ShellRoute|ProtectedPage|Bare", "reason": "why"}}
  ],
  "missing_from_nav": [
    {{"page": "PageName.tsx", "path": "/path", "proposed_section": "section name", "reason": "why it matters"}}
  ],
  "should_be_hidden": [
    {{"path": "/path", "reason": "why hidden from sidebar"}}
  ],
  "proposed_navSections": "COMPLETE TypeScript navSections array code — must be valid TypeScript, use correct LucideIcon imports already in the file",
  "nav_improvements": ["improvement 1", "improvement 2"]
}}"""

write_agent(2, "navigation", AGENT2)

# ─── AGENT 3: Tour System Integrity ─────────────────────────────────────────
print("Building Agent 3: Tour System Integrity...")

AGENT3 = f"""You are a senior frontend engineer auditing the ANAVI tour system for selector drift, dead code, and semantic inconsistencies. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# TOUR DEFINITIONS (client/src/lib/tourDefinitions.ts)
```ts
{src['tour_defs']}
```

# LIVE APP TOUR (client/src/tour/definitions.ts)
```ts
{src['tour_live']}
```

# GUIDED TOUR OVERLAY (client/src/components/GuidedTourOverlay.tsx)
```tsx
{src['guided_tour_overlay']}
```

# DASHBOARD (to verify data-tour attributes)
```tsx
{src['dashboard']}
```

# DASHBOARDLAYOUT (to verify data-tour-id attributes)
```tsx
{src['layout']}
```

# AUDIT TASK
There are TWO tour systems in ANAVI that use different attribute conventions:
1. GuidedTour (demo experience) — uses `data-tour="value"` selectors → `[data-tour="value"]`
2. TourOverlay (live app onboarding) — uses `data-tour-id="value"` selectors → `[data-tour-id='value']`

These two systems should NOT be confused. Audit every step in every tour definition.

For each `targetSelector` in every tour (onboardingTour, demoTour, buildDemoTourSteps, tourDefinitions):
1. Does the selector exist in the DOM? (check Dashboard.tsx and DashboardLayout.tsx)
2. Is it using the correct attribute (`data-tour` vs `data-tour-id`)?
3. Is the step title/content still accurate?

Also check:
- Are there any exported symbols that are never imported anywhere?
- Is there semantic overlap between demoTour (legacy) and buildDemoTourSteps (current)?
- Does `tourId` naming in DashboardLayout.tsx navItems match `target` in tour/definitions.ts?

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "selector_drift": [
    {{
      "tour": "demoTour|onboardingTour|buildDemoTourSteps|tourDefinitions",
      "step_title": "exact step title",
      "selector_used": "[data-tour=\\"value\\"]",
      "exists_in_dom": true,
      "dom_element_file": "Dashboard.tsx|DashboardLayout.tsx|NOT_FOUND",
      "issue": "description of problem if any",
      "fix": "corrected selector or 'correct as-is'"
    }}
  ],
  "dead_exports": [
    {{"export_name": "onboardingTour", "file": "tourDefinitions.ts", "evidence": "grep shows no imports"}}
  ],
  "attribute_system_confusion": [
    {{"description": "any place where data-tour and data-tour-id are mixed up"}}
  ],
  "tourId_nav_alignment": [
    {{"nav_item": "Deal Matching", "tourId": "nav-deal-matching", "tour_target": "[data-tour-id='nav-deal-matching']", "exists_in_layout": true}}
  ],
  "patches": [
    {{"file": "client/src/lib/tourDefinitions.ts", "description": "Change payouts to payout", "line_approx": 107, "old_value": "payouts", "new_value": "payout"}}
  ],
  "summary": "human readable summary of all tour system issues"
}}"""

write_agent(3, "tour-integrity", AGENT3)

# ─── AGENT 4: Demo Data Fidelity ─────────────────────────────────────────────
print("Building Agent 4: Demo Data Fidelity...")

AGENT4 = f"""You are a senior frontend engineer auditing the ANAVI demo mode data fixtures for shape alignment, type correctness, and narrative quality. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# DEMO FIXTURES (client/src/lib/demoFixtures.ts)
```ts
{src['fixtures']}
```

# DEMO CONTEXT (client/src/contexts/DemoContext.tsx)
```tsx
{src['demo_ctx']}
```

# DASHBOARD (what it reads from fixtures)
```tsx
{src['dashboard']}
```

# PERSONA PICKER (how personas are used)
```tsx
{src['persona_picker']}
```

# GUIDED TOUR OVERLAY (tour persona references)
```tsx
{src['guided_tour_overlay']}
```

# COPY TOKENS (lib/copy.ts — personas defined here)
```ts
{src['copy']}
```

# AUDIT TASK
The demo mode must be completely self-contained — zero tRPC calls when `isDemo=true`. The fixture data shapes must exactly match what Dashboard.tsx renders.

Go through Dashboard.tsx line by line and for every place it reads from `demo?.xxx`:
1. Does that key exist in demoFixtures.ts for ALL 3 personas?
2. Is the type correct (string vs Date vs number vs object)?
3. Is the value realistic and whitepaper-aligned for each persona?

Also audit:
- Are the persona stories internally consistent? (originator should be doing originator things)
- Do fixture deal names/amounts align with whitepaper examples?
- Are there any fixture keys that Dashboard never reads (dead data)?
- Are all 3 personas (originator, investor, developer) fully represented?

Persona validation:
- Originator persona: Should emphasize relationship custody + attribution + deal origination
- Investor persona: Should emphasize blind matching + deal room + capital deployment
- Developer persona: Should emphasize capital raising + anonymous until consent + escrow milestones

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "shape_mismatches": [
    {{"fixture_path": "originator.notifications[0].type", "fixture_value": "match_found", "dashboard_reads_as": "string", "issue": "description if any"}}
  ],
  "unused_fixture_keys": [
    {{"persona": "originator", "key": "path.to.key", "value_preview": "...", "evidence": "not referenced in Dashboard.tsx"}}
  ],
  "missing_fixture_keys": [
    {{"persona": "originator", "key": "path.to.key", "needed_because": "Dashboard line N reads demo?.xxx"}}
  ],
  "type_mismatches": [
    {{"persona": "all|originator|investor|developer", "key": "path", "fixture_type": "string", "expected_type": "Date", "issue": "description"}}
  ],
  "persona_narrative_issues": [
    {{"persona": "developer", "issue": "deal names don't reflect renewable energy / project finance focus", "fix": "rename deals to solar/infrastructure focused"}}
  ],
  "whitepaper_alignment_issues": [
    {{"persona": "originator", "field": "payouts[0].amount", "current": 1175000, "issue": "originator share % not shown", "fix": "add originatorSharePercent field"}}
  ],
  "patches": {{
    "originator": {{}},
    "investor": {{}},
    "developer": {{}}
  }},
  "narrative_improvements": "description of how to make all 3 persona stories more compelling and whitepaper-aligned"
}}"""

write_agent(4, "demo-data", AGENT4)

# ─── AGENT 5: Whitepaper Copy Audit ──────────────────────────────────────────
print("Building Agent 5: Whitepaper Copy Audit...")

AGENT5 = f"""You are a senior product copywriter auditing the ANAVI platform for whitepaper terminology alignment. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# COPY TOKENS (client/src/lib/copy.ts — the source of truth)
```ts
{src['copy']}
```

# DASHBOARD (primary user-facing page)
```tsx
{src['dashboard']}
```

# DASHBOARDLAYOUT (sidebar labels, page titles)
```tsx
{src['layout']}
```

# ONBOARDINGFLOW (user-facing copy)
```tsx
{src['onboarding_flow']}
```

# AUDIT TASK
The whitepaper establishes very specific terminology. Every user-facing string must use this vocabulary consistently:

REQUIRED TERMINOLOGY:
- "Trust Score" (not "score" or "rating")
- "Relationship Custody" (not "contact management" or "CRM")
- "Blind Matching" (not "matching" or "discovery")
- "Deal Room" (not "data room" or "workspace")
- "Originator Share" or "Attribution" (not "fee split" or "commission")
- "Lifetime Attribution" (not just "attribution")
- "Compliance Passport" (the concept of portable KYC/AML)
- "Introduction Chain" (multi-hop referral chains)
- "Intent" (buy/sell/invest intents — not "listing" or "request")
- "Custody Hash" (cryptographic custody proof)
- "Verification Tier" → Basic/Enhanced/Institutional (not "level 1/2/3")
- "Mutual Consent" (for blind reveal — not "approval" or "accept")
- "Escrow Milestone" (not just "milestone")

Also check:
- Are nav labels in DashboardLayout accurate and whitepaper-aligned?
- Are page titles (pageTitles object) consistent with whitepaper module names?
- Are button labels action-oriented and whitepaper-aligned?
- Are status labels (pending/active/verified) consistent across pages?

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "terminology_violations": [
    {{"file": "Dashboard.tsx", "line_approx": 0, "found": "hardcoded text", "should_be": "whitepaper term", "severity": "high|medium|low"}}
  ],
  "missing_copy_tokens": [
    {{"concept": "Compliance Passport", "appears_in": ["Dashboard.tsx line 571"], "token_needed": "COPY.compliance.passport.label", "suggested_value": "Compliance Passport"}}
  ],
  "nav_label_issues": [
    {{"current": "Deal Matching", "page": "DealMatching.tsx", "whitepaper_module": "Blind Matching", "recommended": "Deal Matching (fine) or change to Intent Matching"}}
  ],
  "copy_token_additions": "TypeScript additions to lib/copy.ts as a code string",
  "label_patches": [
    {{"file": "path", "line_approx": 0, "old": "old text", "new": "whitepaper-aligned text"}}
  ],
  "overall_copy_quality_score": 7,
  "top_copy_improvements": ["improvement 1", "improvement 2", "improvement 3"]
}}"""

write_agent(5, "copy-audit", AGENT5)

# ─── AGENT 6: Page Inventory ──────────────────────────────────────────────────
print("Building Agent 6: Page Inventory...")

AGENT6 = f"""You are a senior frontend architect cataloging all pages in the ANAVI application against its 6-module architecture. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# APP.TSX (all routes)
```tsx
{src['app']}
```

# DASHBOARDLAYOUT.TSX (navSections)
```tsx
{src['layout']}
```

# ALL PAGE FILES IN client/src/pages/:
{page_list}

# CLAUDE.MD NOTES ON PAGES:
tRPC-backed: Dashboard, Relationships, Intents, Matches, Deals, DealRooms, Payouts, Verification, FamilyOffices, Targeting, Calendar, Analytics, AuditLogs, Intelligence, RealEstate, LPPortal, AIBrain
Demo/mock (wire to tRPC when adding real features): Commodities, TransactionMatching, CapitalManagement, TradingPlatform, CryptoAssets, MemberOnboarding, FeeManagement

# AUDIT TASK
Map every page to the 6-module architecture. Determine what's real, what's demo-mock, what's a stub, and what's an orphan.

For EACH page, determine:
1. Which whitepaper module does it serve?
2. Is it tRPC-backed, demo-mock, or a stub?
3. Is it in navSections? Should it be?
4. Does it have a proper route wrapper (ShellRoute vs ProtectedPage vs Bare)?
5. Is it reachable from the main user flow?
6. What's its quality/completeness level?

Also identify:
- Feature gaps: module capabilities from the whitepaper with NO page implementing them
- Redundant pages: multiple pages serving the same purpose
- Upgrade priorities: which stub/demo pages should be real-tRPC soonest?

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "page_inventory": [
    {{
      "file": "Dashboard.tsx",
      "route": "/dashboard",
      "whitepaper_module": "Overview (all 6 modules)",
      "status": "tRPC-backed|demo-mock|stub|orphaned|hybrid",
      "in_nav": true,
      "nav_section": "Overview",
      "route_wrapper": "ShellRoute",
      "route_wrapper_correct": true,
      "reachable_from_main_flow": true,
      "completeness": "high|medium|low",
      "notes": "primary landing page, demo-aware"
    }}
  ],
  "module_coverage": {{
    "Identity/KYC": ["Verification.tsx (tRPC-backed)", "Onboarding.tsx"],
    "Relationship Custody": [],
    "Blind Matching": [],
    "Deal Rooms": [],
    "Compliance/Escrow": [],
    "Economics Engine": []
  }},
  "feature_gaps": [
    {{"module": "Relationship Custody", "missing_feature": "Introduction chain visualization", "whitepaper_reference": "Track multi-hop referrals with graph-based attribution flows"}}
  ],
  "redundant_pages": [
    {{"pages": ["Matches.tsx", "DealMatching.tsx"], "issue": "both handle matching — unclear distinction", "recommendation": "consolidate or clarify separation"}}
  ],
  "upgrade_priorities": [
    {{"page": "FeeManagement.tsx", "current_status": "demo-mock", "priority": "high", "reason": "Economics Engine is core whitepaper module"}}
  ],
  "orphaned_pages": ["pages with no route or no nav item and no clear purpose"],
  "summary": "high-level summary of page inventory findings"
}}"""

write_agent(6, "page-inventory", AGENT6)

# ─── AGENT 7: TypeScript Health ───────────────────────────────────────────────
print("Building Agent 7: TypeScript Health...")

import subprocess
result = subprocess.run(
    ["pnpm", "check"],
    capture_output=True, text=True,
    cwd=ANAVI
)
ts_output = result.stdout + result.stderr

AGENT7 = f"""You are a TypeScript expert auditing the ANAVI codebase for type errors, unsafe patterns, and missing type declarations. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# PNPM CHECK OUTPUT (current TypeScript errors)
```
{ts_output}
```

# LLMFACTORY SOURCE (main file with error)
```ts
{read(f"{ANAVI}/server/_core/llmFactory.ts")}
```

# PACKAGE.JSON
```json
{read(f"{ANAVI}/package.json")}
```

# DEMO CONTEXT (for type audit)
```tsx
{src['demo_ctx']}
```

# DEMO FIXTURES (for type audit)
```tsx
{src['fixtures']}
```

# DASHBOARD (for type audit — check tRPC query types)
```tsx
{src['dashboard']}
```

# AUDIT TASK
1. Analyze every TypeScript error in the pnpm check output
2. Propose minimal, targeted fixes (don't over-engineer)
3. Identify any unsafe patterns (any casts, non-null assertions used dangerously, implicit any)
4. Check that demoFixtures types align with what Dashboard.tsx expects
5. Check DemoContextValue type is used correctly everywhere

For the openai error specifically: is openai in package.json? If not, the fix is `pnpm add openai`. If yes, is it a type-only import issue?

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "typescript_errors": [
    {{
      "file": "server/_core/llmFactory.ts",
      "line": 3,
      "error_code": "TS2307",
      "error_text": "Cannot find module 'openai'",
      "root_cause": "openai package not installed",
      "fix_command": "pnpm add openai",
      "fix_code": null
    }}
  ],
  "unsafe_patterns": [
    {{"file": "path", "line_approx": 0, "pattern": "any cast", "description": "description", "severity": "high|medium|low"}}
  ],
  "demo_type_issues": [
    {{"description": "type mismatch between fixtures and Dashboard expectations"}}
  ],
  "patches": [
    {{"file": "path", "description": "what to change", "old_code": "...", "new_code": "..."}}
  ],
  "summary": "summary of all TypeScript health issues"
}}"""

write_agent(7, "typescript", AGENT7)

# ─── AGENT 8: Onboarding Flow ─────────────────────────────────────────────────
print("Building Agent 8: Onboarding Flow...")

AGENT8 = f"""You are a senior UX designer and product strategist auditing the ANAVI onboarding flow for whitepaper value proposition alignment. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# ONBOARDINGFLOW.TSX (primary onboarding experience)
```tsx
{src['onboarding_flow']}
```

# ONBOARDING.TSX (welcome/choice screen)
```tsx
{src['onboarding']}
```

# COPY TOKENS (lib/copy.ts)
```ts
{src['copy']}
```

# CUSTODY RECEIPT CONTEXT
The whitepaper says onboarding should end with the user's first relationship being custodied — a "Relationship Custody Receipt" that proves the timestamp of their first introduction. This is the key "aha moment" that demonstrates ANAVI's core value prop.

# AUDIT TASK
The onboarding flow is the platform's first impression. It must:
1. Establish the core problem (broker chains, relationship leakage, fraud)
2. Demonstrate the solution (custody, trust score, blind matching)
3. Create a visceral "aha moment" (the custody receipt)
4. Set clear expectations for what the user will do next

Audit every step of OnboardingFlow.tsx:
- Does each step's copy align with whitepaper language?
- Does the flow demonstrate value BEFORE asking for commitment?
- Is the custody receipt moment properly implemented?
- Are the step transitions logical and momentum-building?
- Does the completion state clearly set up what the user does in Dashboard?

Also check:
- Does it correctly use CUSTODY_RECEIPT tokens from lib/copy.ts?
- Are tRPC mutations called correctly (with proper error handling)?
- Is the onboarding connected to the demo flow appropriately?

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "step_audit": [
    {{
      "step_index": 0,
      "step_name": "description",
      "current_copy_quality": "high|medium|low",
      "whitepaper_alignment": "high|medium|low",
      "issues": ["specific issue"],
      "proposed_copy": "improved version of key copy",
      "cta_quality": "high|medium|low"
    }}
  ],
  "custody_receipt_implementation": {{
    "is_implemented": true,
    "quality": "high|medium|low",
    "issues": [],
    "improvements": []
  }},
  "flow_logic_issues": [
    {{"description": "issue with flow logic", "step": "step name", "fix": "proposed fix"}}
  ],
  "value_prop_gaps": [
    {{"missing_concept": "Lifetime Attribution", "where_to_add": "step 3 copy", "suggested_copy": "..."}}
  ],
  "patches": [
    {{"file": "client/src/pages/OnboardingFlow.tsx", "description": "what to change", "old_code": "...", "new_code": "..."}}
  ],
  "overall_onboarding_score": 7,
  "summary": "honest assessment of onboarding quality and top improvements"
}}"""

write_agent(8, "onboarding", AGENT8)

print("\n=== All 8 agent prompts built successfully ===")
print(f"Saved to: {AGENTS}/")
for i, name in [(1,'dashboard-intelligence'),(2,'navigation'),(3,'tour-integrity'),
                (4,'demo-data'),(5,'copy-audit'),(6,'page-inventory'),
                (7,'typescript'),(8,'onboarding')]:
    path = f"{AGENTS}/agent{i}-{name}.txt"
    size = os.path.getsize(path)
    print(f"  agent{i}-{name}.txt: {size:,} bytes")
