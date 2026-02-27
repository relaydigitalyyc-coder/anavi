#!/usr/bin/env python3
"""Builds Phase 2 agent prompts (Agent 9: Validator, Agent 10: Dashboard Upgrade)"""
import os, json

ROOT = "/home/ariel/Documents/anavi-main"
AGENTS = f"{ROOT}/scripts/agents"
OUTPUTS = f"{ROOT}/scripts/outputs"
ANAVI = f"{ROOT}/anavi"

def read(path):
    try:
        with open(path) as f: return f.read()
    except: return f"[NOT FOUND: {path}]"

def load_output(n, name):
    path = f"{OUTPUTS}/agent{n}-{name}.json"
    try:
        with open(path) as f:
            try:
                return json.load(f)
            except:
                return f.read()
    except:
        return {}

# Load all Phase 1 outputs
print("Loading Phase 1 outputs...")
phase1 = {
    "agent1_dashboard": load_output(1, "dashboard-intelligence"),
    "agent2_navigation": load_output(2, "navigation"),
    "agent3_tour": load_output(3, "tour-integrity"),
    "agent4_demo": load_output(4, "demo-data"),
    "agent5_copy": load_output(5, "copy-audit"),
    "agent6_pages": load_output(6, "page-inventory"),
    "agent7_typescript": load_output(7, "typescript"),
}

phase1_summary = json.dumps(phase1, indent=2)
print(f"Phase 1 combined: {len(phase1_summary):,} chars")

dashboard_src = read(f"{ANAVI}/client/src/pages/Dashboard.tsx")
copy_src = read(f"{ANAVI}/client/src/lib/copy.ts")
layout_src = read(f"{ANAVI}/client/src/components/DashboardLayout.tsx")

WHITEPAPER_CONTEXT = """
ANAVI is "The Private Market Operating System" — "If Bloomberg runs public markets, ANAVI will run private ones."
6 Modules: (1) Identity/KYC — Trust Score (2) Relationship Custody (3) Blind Matching (4) Deal Rooms (5) Compliance/Escrow (6) Economics Engine
UX: navy/blue palette, luxury aesthetic, institutional-grade, simplicity + progressive disclosure
Personas: Family Offices, Institutional Investors, Deal Originators, Asset Owners, Project Developers
"""

# ─── AGENT 9: Cross-Patch Validator ─────────────────────────────────────────
print("Building Agent 9: Cross-Patch Validator...")

AGENT9 = f"""You are a senior software architect validating patches produced by 8 independent agents for the ANAVI platform. Be hyper-meticulous.

{WHITEPAPER_CONTEXT}

# ALL PHASE 1 AGENT FINDINGS
```json
{phase1_summary[:80000]}
```

# AUDIT TASK
1. Identify conflicts (two agents proposing different changes to the same file/line)
2. Identify ordering dependencies (patch B must apply after patch A)
3. Find gaps (findings implied by one agent's output that others missed)
4. Produce the definitive consolidated priority-ordered list of all patches to apply

Focus on the HIGHEST IMPACT changes first:
- Critical bugs (broken selectors, wrong data)
- Missing whitepaper alignment
- Navigation/routing issues
- TypeScript/type safety

Return EXACTLY this JSON (no markdown, pure JSON):
{{
  "conflicts": [
    {{"agents": ["agent2", "agent5"], "file": "DashboardLayout.tsx", "description": "Agent 2 wants 'Relationship Custody' label, Agent 5 wants 'Relationships' — resolve by using whitepaper term"}}
  ],
  "critical_patches": [
    {{"priority": 1, "source_agent": "agent3", "file": "client/src/lib/tourDefinitions.ts", "description": "Fix demoTour selector: payouts -> payout", "change": "exact change description"}}
  ],
  "proposed_nav_sections_final": "final agreed TypeScript navSections code from Agent 2, adjusted per Agent 5 nav label recommendations",
  "copy_token_additions_final": "final TypeScript additions to lib/copy.ts from Agent 5",
  "key_dashboard_upgrade_priorities": [
    "priority 1: description",
    "priority 2: description"
  ],
  "validation_summary": "overall summary of what needs to change and why"
}}"""

with open(f"{AGENTS}/agent9-validator.txt", 'w') as f:
    f.write(AGENT9)
print(f"  Agent 9: {len(AGENT9):,} chars")

# ─── AGENT 10: Dashboard UI Upgrade ─────────────────────────────────────────
print("Building Agent 10: Dashboard UI Upgrade...")

AGENT10 = f"""You are a world-class React frontend engineer and product designer. Your task is to upgrade the ANAVI Dashboard component to feel like "The Quiet Operating System That Serious Private Capital Plugs Into."

{WHITEPAPER_CONTEXT}

# AGENT 1 AUDIT FINDINGS (what needs to change in Dashboard)
```json
{json.dumps(load_output(1, "dashboard-intelligence"), indent=2)[:15000]}
```

# AGENT 5 COPY FINDINGS (terminology violations)
```json
{json.dumps(load_output(5, "copy-audit"), indent=2)[:5000]}
```

# AGENT 7 TYPE FINDINGS (unsafe patterns to fix)
```json
{json.dumps(load_output(7, "typescript"), indent=2)[:3000]}
```

# CURRENT DASHBOARD SOURCE
```tsx
{dashboard_src}
```

# CURRENT COPY.TS (for token references)
```ts
{copy_src}
```

# UPGRADE REQUIREMENTS

## Visual Hierarchy Changes (implement ALL)
1. Trust Score → HERO element. Wider section, larger ring (160px+), tier badge prominent, "+3 this month" should show as real delta indicator
2. Relationship Custody section → should show custody hash + timestamp age visually, "Protect" button as primary CTA with more weight
3. Blind Matches section → match cards should feel like "sealed intelligence briefs" — compartmentalized, cryptic, weighty
4. Deal Rooms section → institutional feel — NDA status, stage, audit count all visible at a glance
5. Compliance/Verification section → "Compliance Status" header, pending actions feel urgent-but-calm
6. Payouts section → show originatorShare% explicitly, "Lifetime Attribution" framing

## Copy/Terminology Changes (implement ALL)
- Replace "Pending Actions" with "Compliance Status"
- Replace generic "View Matches" with "View Blind Matches"
- All match cards: show "SEALED — [AssetClass]" not just the intent description
- Payout items: show "Originator Share: X%" prominently
- Activity feed labels: MATCH / ATTRIBUTION / VERIFICATION / DEAL ROOM (not generic)

## Type Safety Changes (implement ALL)
- Remove unnecessary `as unknown as unknown[]` and `as unknown as ReadonlyArray<...>` type assertions for demo arrays
- Use proper TypeScript generics instead

## data-tour Attributes (preserve ALL existing):
- data-tour="dashboard" — keep on page header div
- data-tour="trust-score" — keep on TrustRing wrapper div
- data-tour="create-intent" — keep on Create Intent button
- data-tour="relationships" — keep on Protect Relationship button
- data-tour="deal-matching" — keep on matches section wrapper
- data-tour="match-card" — keep on idx===0 match card
- data-tour="deal-room" — keep on idx===0 deal room card
- data-tour="activity-feed" — keep on activity feed section
- data-tour="verification" — keep on verification section
- data-tour="payout" — keep on payout section (NOTE: "payout" not "payouts")
- data-tour="completion" — keep on completion section
- data-tour="apply" — keep on Request Access CTA

## Demo Mode Preservation (preserve ALL):
- Keep useDemoFixtures() hook
- Keep all `enabled: !demo` guards on tRPC queries
- Keep MaybeLink for all navigation in demo mode
- Keep demo fixture data rendering branches

## Constraints:
- Do NOT add new package imports (use only currently imported packages)
- Do NOT change the component function signature
- Do NOT change the file exports
- Keep all existing utility functions (MaybeLink, TrustRing, DashCard, WelcomeBanner, etc.)
- Keep all existing type definitions

Write the COMPLETE upgraded Dashboard.tsx file. Return JSON with this structure:
{{
  "upgraded_dashboard_tsx": "COMPLETE file content here — all 700+ lines",
  "changes_summary": "bullet list of what changed",
  "data_tour_preservation": "confirm all 12 data-tour attributes preserved"
}}"""

with open(f"{AGENTS}/agent10-dashboard-upgrade.txt", 'w') as f:
    f.write(AGENT10)
print(f"  Agent 10: {len(AGENT10):,} chars")

print("\nPhase 2 agent prompts built.")
