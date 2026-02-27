# Page Wiring & Vision Conformance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 functional wiring issues and upgrade 6 primary user-journey pages to visually and linguistically conform with the ANAVI whitepaper vision.

**Architecture:** Phase 1 — direct edits to 3 files. Phase 2 — 7-agent Gemini swarm (6 page agents + 1 synthesis), prompts built by `scripts/build-page-agent-prompts.py`, run in parallel via `scripts/run-page-agents.sh`, patches applied sequentially.

**Tech Stack:** React 19, Vite, tRPC v11, Tailwind 4, framer-motion, Gemini 2.5 Flash API (via existing `scripts/gemini-agent.sh`), copy.ts token system

---

## Context

All commands run from `/home/ariel/Documents/anavi-main/anavi` unless stated otherwise.

Key files already in place:
- `scripts/gemini-agent.sh` — Gemini API caller (reused from round 1)
- `client/src/lib/copy.ts` — whitepaper copy token system (DASHBOARD, NOTIFICATIONS, TOASTS, etc.)
- `client/src/pages/Dashboard.tsx` — visual reference for card styles, animation patterns, color palette

Whitepaper color palette: navy `#0A1628` / `#1E3A5F`, gold `#C4972A`, green `#059669`.
Card class: `card-elevated`. Animations: `FadeInView`, `StaggerContainer`, `StaggerItem`.

---

## Phase 1: Direct Functional Fixes

---

### Task 1: Fix broken link in Onboarding.tsx

**Files:**
- Modify: `client/src/pages/Onboarding.tsx:252`

**Step 1: Make the edit**

In `client/src/pages/Onboarding.tsx` at line 252, change:
```tsx
<Link href="/deal-room">
```
to:
```tsx
<Link href="/deal-rooms">
```

**Step 2: Verify TypeScript passes**

Run (from `anavi/`):
```bash
pnpm check
```
Expected: no output (0 errors).

---

### Task 2: Update mobile nav to match 6-module structure

**Files:**
- Modify: `client/src/components/DashboardLayout.tsx:123–129`

**Step 1: Make the edit**

Replace lines 123–129 in `client/src/components/DashboardLayout.tsx`:
```tsx
const mobileNavItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Target, label: "Matches", path: "/deal-matching" },
  { icon: Users, label: "Relationships", path: "/relationships" },
  { icon: FolderOpen, label: "Deal Rooms", path: "/deal-rooms" },
  { icon: User, label: "Profile", path: "/settings" },
] as const;
```

With:
```tsx
const mobileNavItems = [
  { icon: Home,       label: "Dashboard",     path: "/dashboard" },
  { icon: Target,     label: "Blind Matching", path: "/deal-matching" },
  { icon: Users,      label: "Relationships",  path: "/relationships" },
  { icon: Wallet,     label: "Payouts",        path: "/payouts" },
  { icon: Shield,     label: "Verification",   path: "/verification" },
  { icon: User,       label: "Profile",        path: "/settings" },
] as const;
```

All icons (`Home`, `Target`, `Users`, `Wallet`, `Shield`, `User`) are already imported in DashboardLayout.tsx.

**Step 2: Verify TypeScript passes**

```bash
pnpm check
```
Expected: no output.

---

### Task 3: Fix FeeManagement.tsx data boundary

**Files:**
- Modify: `client/src/pages/FeeManagement.tsx:18–52`

**Step 1: Add a clear demo/live boundary**

At the top of `FeeManagement.tsx`, the hardcoded constants (`feeStats`, `feeStructure`, `partnerPayouts`, `monthlyRevenue`) should be wrapped in a block comment that clearly marks them as demo data:

Add this comment above line 18:
```tsx
// ─── DEMO DATA ──────────────────────────────────────────────────────────────
// TODO: Replace with live tRPC queries when fee schema is finalised.
// trpc.fees.list returns recentFees only; aggregate stats are not yet in schema.
```

And add this comment after line 52 (after the `monthlyRevenue` array closes):
```tsx
// ─── END DEMO DATA ──────────────────────────────────────────────────────────
```

**Step 2: Verify TypeScript passes**

```bash
pnpm check
```
Expected: no output.

---

### Task 4: Run tests and commit Phase 1

**Step 1: Run full verification**

```bash
pnpm check && pnpm test
```
Expected:
```
# pnpm check: no output
Tests  60 passed (60)
```

**Step 2: Commit**

```bash
cd /home/ariel/Documents/anavi-main
git add anavi/client/src/pages/Onboarding.tsx \
        anavi/client/src/components/DashboardLayout.tsx \
        anavi/client/src/pages/FeeManagement.tsx
git commit -m "fix: functional wiring — broken link, mobile nav, FeeManagement boundary

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 2: Agent Swarm — Page Vision Conformance

---

### Task 5: Write the page agent prompt builder

**Files:**
- Create: `scripts/build-page-agent-prompts.py` (run from repo root `/home/ariel/Documents/anavi-main`)

**Step 1: Write the script**

Create `/home/ariel/Documents/anavi-main/scripts/build-page-agent-prompts.py`:

```python
#!/usr/bin/env python3
"""
Build Gemini agent prompts for page wiring + vision conformance (round 2).
Run from repo root: python3 scripts/build-page-agent-prompts.py
Outputs prompt files to scripts/agents/page-agent{N}-{name}.txt
"""
import pathlib, json

ROOT   = pathlib.Path(__file__).parent.parent / "anavi"
OUT    = pathlib.Path(__file__).parent / "agents"
OUT.mkdir(exist_ok=True)

def read(rel: str) -> str:
    return (ROOT / rel).read_text()

def read_lines(rel: str, start: int, end: int) -> str:
    lines = (ROOT / rel).read_text().splitlines()
    return "\n".join(lines[start - 1 : end])

COPY_TS            = read("client/src/lib/copy.ts")
DASHBOARD_IMPORTS  = read_lines("client/src/pages/Dashboard.tsx", 1, 60)

SHARED_CONTEXT = f"""
=== ANAVI WHITEPAPER CONTEXT ===

ANAVI is "The Private Market Operating System" ("If Bloomberg runs public markets, ANAVI will run private ones").

Six core modules:
1. TRUST & IDENTITY — Trust Score (0–100), composite of KYB depth, transaction history,
   dispute outcomes, peer attestations. Three tiers: Basic / Enhanced / Institutional.
   Compliance Passport travels with every transaction.
2. RELATIONSHIP CUSTODY — Timestamped, cryptographically signed introductions.
   "Custodied" = protected with hash proof. "Open" = visible but unprotected.
3. BLIND MATCHING — Intents expressed anonymously. Counterparty identity sealed until
   mutual consent. Match cards: "Sealed — [AssetClass]", compatibility score, deal size.
   "Blind Intent" = anonymous intent. "Blind Match" = sealed result brief.
4. DEAL ROOMS — NDA-gated workspaces. Immutable audit trail. Workflow:
   NDA Pending → Active → Diligence → Closing → Completed.
5. COMPLIANCE / ESCROW — KYB verified, OFAC clean, AML passed. Escrow milestones trigger automatically.
6. ECONOMICS ENGINE — Lifetime attribution. Originators earn 40–60% of fees. Follow-on deals
   compound. Attribution Chain. Payout types: originator_fee, introducer_fee, advisor_fee,
   milestone_bonus, success_fee.

Visual language:
- Navy: #0A1628 (darkest), #1E3A5F (body text/secondary)
- Gold: #C4972A (accent, CTAs)
- Trust green: #059669
- Cards: className="card-elevated p-6"
- Stat chips: "rounded-full bg-[COLOR]/15 px-3 py-1 text-xs font-semibold text-[COLOR]"
- Animations: FadeInView, StaggerContainer, StaggerItem (from @/components/PageTransition)
- Numbers: font-data-hud class; hashes/IDs: font-data-mono class
- Primary CTA: className="btn-gold ..."

=== COPY TOKENS (client/src/lib/copy.ts) ===
{COPY_TS}

=== DASHBOARD.TSX IMPORTS (style reference) ===
{DASHBOARD_IMPORTS}
"""

OUTPUT_SCHEMA = """
=== OUTPUT FORMAT ===
Respond with ONLY valid JSON (no markdown, no code blocks):
{{
  "upgraded_tsx": "<complete upgraded TypeScript/TSX file content>",
  "changes_summary": ["change 1", "change 2", ...],
  "whitepaper_terms_added": ["term 1", "term 2", ...],
  "copy_tokens_used": ["DASHBOARD.xxx", "TOUR.xxx", ...]
}}

CRITICAL RULES:
1. upgraded_tsx must be the COMPLETE file — do not truncate.
2. Preserve ALL existing tRPC queries and mutations — do not remove any.
3. Preserve ALL existing form logic, modals, validation.
4. Only change: copy/labels, visual aesthetics, terminology alignment.
5. Do not add new tRPC queries unless explicitly instructed.
6. TypeScript must compile — no implicit any, no missing imports.
7. Only import from libraries already in the project: react, wouter, framer-motion,
   lucide-react, sonner, date-fns, @/lib/trpc, @/lib/copy, @/components/ui/*,
   @/components/EmptyState, @/components/PageTransition, @/components/PremiumAnimations,
   @/_core/hooks/useAuth.
"""

PAGES = [
    {
        "id": 1,
        "name": "intents",
        "file": "client/src/pages/Intents.tsx",
        "module": "BLIND MATCHING — Intent Submission",
        "task": """
Your task: upgrade Intents.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. Individual intent cards are not labeled as "Blind Intents" — add a "Blind Intent" badge
   to each intent card (small rounded-full badge, navy background).
2. The page imports nothing from @/lib/copy — import TOUR and use TOUR.blindMatch.title
   and TOUR.blindMatch.body as a subtitle or info tooltip under the page heading.
3. The anonymous toggle label "Anonymous Mode" is fine but the description could say
   "Identity sealed until mutual consent is established."

DO NOT CHANGE: All trpc.intent.* queries/mutations, the 10-field create form,
the 4-stat cards structure, the play/pause/sparkles action buttons.
""",
    },
    {
        "id": 2,
        "name": "matches",
        "file": "client/src/pages/Matches.tsx",
        "module": "BLIND MATCHING — Sealed Match Results",
        "task": """
Your task: upgrade Matches.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. Page heading "AI Matches" → "Blind Matches". Stat card label "Total Matches" → "Blind Matches".
2. Each match card should have the sealed-brief aesthetic from the upgraded Dashboard:
   - Add a subtle dark gradient overlay (bg-gradient-to-br from-[#0A1628]/5 to-transparent)
   - Add a "SEALED — [assetClass]" badge (gold) at top-left of each card
   - Add a Lock icon (from lucide-react) at top-right
   - Import Lock from lucide-react if not already imported
3. Fix: `const isUser1 = true;` (hardcoded). Instead derive it:
   - Import useAuth from @/_core/hooks/useAuth
   - `const { user } = useAuth();`
   - `const isUser1 = match.user1Id === user?.id;`
   Note: check the exact field name on the match object (may be user1Id, userId1, etc.)
   — if the field doesn't exist, add a comment `// TODO: derive from match.user1Id` and
   keep the hardcoded fallback rather than introducing a TS error.
4. The compatibility score progress bar label could say "Match Compatibility" instead of
   just showing a number.

DO NOT CHANGE: All trpc.match.* queries/mutations, status pills, action buttons
(Express Interest, Decline, Create Deal Room, Go to Deal Room), the AI Analysis section.
""",
    },
    {
        "id": 3,
        "name": "relationships",
        "file": "client/src/pages/Relationships.tsx",
        "module": "RELATIONSHIP CUSTODY",
        "task": """
Your task: upgrade Relationships.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. Page heading "Relationships" → "Relationship Custody".
   Add a subtitle: "Timestamped introductions with cryptographic proof of custody."
2. The filter options for verification/visibility status:
   - "Protected" → "Custodied"
   - "Visible" → "Open"
   Update both the filter option labels and any status badges on relationship cards.
3. Where the custody hash is shown, label it "Custody Proof" (not just "Hash" or unlabeled).
   Use font-data-mono class for the hash value.
4. In the "Protect a Relationship" modal step 5 (the confirmation screen), import
   CUSTODY_RECEIPT from @/lib/copy and use CUSTODY_RECEIPT.title and CUSTODY_RECEIPT.body
   as the confirmation text.
5. In the 4-stat cards, "Total Attribution Earned" can stay; "Total Relationships" can
   become "Custodied Relationships" if the underlying data is filtered to custodied ones,
   otherwise add a "(custodied)" suffix.

DO NOT CHANGE: All trpc.relationship.* queries/mutations, all 5 modal steps, the proof
export modal, the grid/list toggle, all 4 filter dropdowns, the detail sheet.
""",
    },
    {
        "id": 4,
        "name": "verification",
        "file": "client/src/pages/Verification.tsx",
        "module": "TRUST SCORE / IDENTITY & KYC",
        "task": """
Your task: upgrade Verification.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. The radar chart has a duplicate dimension label — "verification" appears twice.
   Fix the DIMENSIONS array so all 6 names are unique. Rename them to match whitepaper:
   "KYB Depth", "Transaction History", "Dispute Outcomes", "Peer Attestations",
   "Platform Tenure", "Identity Verification" (these are the 6 components of Trust Score).
2. The hardcoded string "12 institutional partners" — replace with a variable:
   `const PARTNER_COUNT = 12; // TODO: source from live data`
   and reference `{PARTNER_COUNT} institutional partners` in the JSX.
3. Mark the SCORE_HISTORY array as a placeholder:
   Add comment `// TODO: replace with live trpc.user.getTrustScoreHistory data`
   above the SCORE_HISTORY constant.
4. The page title can stay "Verification & Trust". The tier badge labels can add the
   whitepaper tier names: "Basic", "Enhanced", "Institutional" (check if already present).

DO NOT CHANGE: All tRPC queries, the 6-component score cards, the tier upgrade modal,
the document upload section, the Compliance Passport card, the Share & Access controls.
""",
    },
    {
        "id": 5,
        "name": "payouts",
        "file": "client/src/pages/Payouts.tsx",
        "module": "ECONOMICS ENGINE / LIFETIME ATTRIBUTION",
        "task": """
Your task: upgrade Payouts.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. This file does not import from @/lib/copy. Add:
   `import { DASHBOARD } from "@/lib/copy";`
   Then use:
   - DASHBOARD.payouts.lifetimeAttribution as the label for the "Lifetime Attribution" stat card header
   - DASHBOARD.payouts.originationShare as the label for originator share percentage display
2. Before the deal timeline accordion, add a section heading:
   "Attribution Chain"
   with a subtitle: "Every credit in this chain is cryptographically linked to your origination event."
   Style it as: <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
3. The ANAVI Economics Model bar chart (Originator 40-60%, Contributors 20-30%, Platform 10-20%)
   is well-aligned; no changes needed there.
4. In payout type display, "originator_fee" can render as "Originator Fee" (already formatted
   via .replace(/_/g, " ")) — ensure the label is capitalized.

DO NOT CHANGE: All trpc.payout.* queries, the 4-stat cards, the period picker, the statement
modal, the bar chart, the attribution history filters, the deal timeline accordion.
""",
    },
    {
        "id": 6,
        "name": "dealrooms",
        "file": "client/src/pages/DealRooms.tsx",
        "module": "DEAL ROOMS — Embedded Deal Infrastructure",
        "task": """
Your task: upgrade DealRooms.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. The status filter buttons include "Diligence" and "Closing" but the filter logic
   never matches them (lines ~86-87 map them to non-existent status values).
   Fix by checking what trpc.dealRoom.list actually returns. The schema statuses are:
   "active", "closed", "archived". Update the filter mapping:
   - "Active" → status === "active"
   - "Diligence" → remove this filter OR map to a real status
   - "Closing" → remove this filter OR map to a real status
   - "Completed" → status === "closed"
   - "Declined" → status === "archived"
   If the granular statuses don't exist in the schema, REMOVE the Diligence and Closing
   filter buttons (they are dead code). Do not add new schema fields.
2. The "Total Value" stat card uses `stats.total * 2.5` — this is fake data.
   Replace with: remove the multiplication and either show `stats.total` as a count
   (rename to "Total Rooms") or remove the card entirely and replace with a more
   meaningful stat (e.g. "Rooms with NDA" count).
3. Add a subtitle under the "Deal Rooms" page heading:
   "NDA-gated workspaces. Immutable audit trail active on every room."
4. In each deal room card, under the room name, add a small text line:
   "Every document access and signature is cryptographically logged."
   Style: text-[10px] text-[#1E3A5F]/50

DO NOT CHANGE: All trpc.dealRoom.list wiring, the card grid layout, status pills,
"Enter Room" CTAs, NDA/Watermarking/Download Controls badges.
""",
    },
]

SYNTHESIS_TASK = """
You are Agent 7 — the synthesis and consistency checker.

You will receive the upgraded TSX content of 6 pages. Your job is to identify any
remaining cross-page inconsistencies and produce a list of small targeted corrections.

You do NOT need to rewrite any full file. Instead, produce a list of precise edits:
each edit has a file, an old string (exact), and a new string.

Check for:
1. Terminology consistency — does every page use the same whitepaper terms?
   (e.g. "Blind Match" not "AI Match", "Custodied" not "Protected", "Attribution Chain" etc.)
2. Color consistency — all gold CTAs use #C4972A, trust badges use #059669.
3. Empty state consistency — are all 6 pages handling empty tRPC states gracefully?
4. Animation consistency — do all pages use FadeInView / StaggerContainer patterns?

Output format (ONLY valid JSON, no markdown):
{
  "consistency_report": "2-3 sentence summary of cross-page consistency",
  "corrections": [
    {
      "file": "client/src/pages/Matches.tsx",
      "old_string": "exact text to replace",
      "new_string": "replacement text",
      "reason": "why this change"
    }
  ],
  "all_clear": true/false
}

If all_clear is true, corrections can be an empty array.
"""


def build_prompt(page: dict) -> str:
    source = read(page["file"])
    return f"""
=== TASK: Upgrade {page['file']} for ANAVI whitepaper vision conformance ===
Module: {page['module']}

{SHARED_CONTEXT}

=== SOURCE FILE: {page['file']} ===
{source}

=== INSTRUCTIONS ===
{page['task']}

{OUTPUT_SCHEMA}
""".strip()


def build_synthesis_prompt(upgraded_pages: dict[str, str]) -> str:
    sections = "\n\n".join(
        f"=== {name}.tsx ===\n{content[:8000]}..."  # first 8k chars each to fit context
        for name, content in upgraded_pages.items()
    )
    return f"""
=== TASK: Cross-page consistency audit ===

{SHARED_CONTEXT}

=== UPGRADED PAGE CONTENT (first 8000 chars each) ===
{sections}

=== INSTRUCTIONS ===
{SYNTHESIS_TASK}
""".strip()


if __name__ == "__main__":
    print("Building page agent prompts...")
    for page in PAGES:
        prompt = build_prompt(page)
        out_file = OUT / f"page-agent{page['id']}-{page['name']}.txt"
        out_file.write_text(prompt)
        size_kb = len(prompt) // 1024
        print(f"  Agent {page['id']} ({page['name']}): {size_kb}KB → {out_file.name}")

    # Synthesis prompt — uses placeholder; real synthesis prompt built after agents run
    synthesis_placeholder = build_synthesis_prompt({
        "intents": "[run page agents first]",
        "matches": "[run page agents first]",
        "relationships": "[run page agents first]",
        "verification": "[run page agents first]",
        "payouts": "[run page agents first]",
        "dealrooms": "[run page agents first]",
    })
    syn_file = OUT / "page-agent7-synthesis.txt"
    syn_file.write_text(synthesis_placeholder)
    print(f"  Agent 7 (synthesis): placeholder → {syn_file.name}")
    print("Done. Run: bash scripts/run-page-agents.sh")
```

**Step 2: Make it executable and run it**

```bash
cd /home/ariel/Documents/anavi-main
chmod +x scripts/build-page-agent-prompts.py
python3 scripts/build-page-agent-prompts.py
```

Expected output:
```
Building page agent prompts...
  Agent 1 (intents): XXkB → page-agent1-intents.txt
  Agent 2 (matches): XXkB → page-agent2-matches.txt
  Agent 3 (relationships): XXkB → page-agent3-relationships.txt
  Agent 4 (verification): XXkB → page-agent4-verification.txt
  Agent 5 (payouts): XXkB → page-agent5-payouts.txt
  Agent 6 (dealrooms): XXkB → page-agent6-dealrooms.txt
  Agent 7 (synthesis): placeholder → page-agent7-synthesis.txt
Done. Run: bash scripts/run-page-agents.sh
```

---

### Task 6: Write the parallel runner script

**Files:**
- Create: `scripts/run-page-agents.sh`

**Step 1: Write the script**

Create `/home/ariel/Documents/anavi-main/scripts/run-page-agents.sh`:

```bash
#!/usr/bin/env bash
# Run 6 page agents in parallel, then synthesis agent.
# Usage: bash scripts/run-page-agents.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$SCRIPT_DIR/agents"
OUTPUTS_DIR="$SCRIPT_DIR/outputs"
mkdir -p "$OUTPUTS_DIR"

echo "=== Phase 2: Page Vision Conformance Agents ==="
echo "Starting 6 page agents in parallel..."

PIDS=()
NAMES=(intents matches relationships verification payouts dealrooms)

for i in 1 2 3 4 5 6; do
  NAME="${NAMES[$((i-1))]}"
  PROMPT_FILE="$AGENTS_DIR/page-agent${i}-${NAME}.txt"
  OUTPUT_FILE="$OUTPUTS_DIR/page-agent${i}-${NAME}.json"
  bash "$SCRIPT_DIR/gemini-agent.sh" "$PROMPT_FILE" "$OUTPUT_FILE" &
  PIDS+=($!)
  echo "  Launched agent $i ($NAME) PID=${PIDS[-1]}"
done

echo "Waiting for all 6 agents..."
FAILED=0
for i in "${!PIDS[@]}"; do
  PID="${PIDS[$i]}"
  NAME="${NAMES[$i]}"
  if wait "$PID"; then
    echo "  ✓ Agent $((i+1)) ($NAME) complete"
  else
    echo "  ✗ Agent $((i+1)) ($NAME) FAILED"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo "One or more agents failed. Check outputs dir."
  exit 1
fi

echo ""
echo "All 6 page agents complete. Building synthesis prompt..."

# Build real synthesis prompt with actual outputs
python3 - << 'PYEOF'
import json, pathlib

SCRIPT_DIR = pathlib.Path(__file__).parent if '__file__' in dir() else pathlib.Path('scripts')
OUTPUTS_DIR = pathlib.Path('scripts/outputs')
AGENTS_DIR  = pathlib.Path('scripts/agents')
ANAVI_ROOT  = pathlib.Path('anavi')

NAMES = ['intents', 'matches', 'relationships', 'verification', 'payouts', 'dealrooms']

upgraded = {}
for i, name in enumerate(NAMES, 1):
    out_file = OUTPUTS_DIR / f'page-agent{i}-{name}.json'
    try:
        data = json.loads(out_file.read_text())
        tsx = data.get('upgraded_tsx', '[not found]')
        upgraded[name] = tsx[:8000]  # first 8k chars
    except Exception as e:
        upgraded[name] = f'[error reading: {e}]'

# Read shared context
copy_ts = (ANAVI_ROOT / 'client/src/lib/copy.ts').read_text()

sections = '\n\n'.join(
    f'=== {name}.tsx (first 8000 chars) ===\n{content}'
    for name, content in upgraded.items()
)

synthesis_task = """
You are Agent 7 — the synthesis and consistency checker.

You will receive the upgraded TSX content of 6 pages. Your job is to identify any
remaining cross-page inconsistencies and produce a list of small targeted corrections.

You do NOT need to rewrite any full file. Instead, produce a list of precise edits:
each edit has a file, an old_string (exact, unique in the file), and a new_string.

Check for:
1. Terminology — "Blind Match" not "AI Match"; "Custodied" not "Protected"; "Attribution Chain" consistent.
2. Color — gold CTAs #C4972A, trust green #059669.
3. Empty states — all pages handle empty tRPC gracefully (EmptyState component or message).
4. Animation patterns — FadeInView / StaggerContainer used consistently.

Output ONLY valid JSON (no markdown, no code blocks):
{
  "consistency_report": "2-3 sentence summary",
  "corrections": [
    {
      "file": "client/src/pages/Matches.tsx",
      "old_string": "exact text",
      "new_string": "replacement",
      "reason": "why"
    }
  ],
  "all_clear": true
}
"""

prompt = f"""=== TASK: Cross-page consistency audit ===

=== COPY TOKENS (client/src/lib/copy.ts) ===
{copy_ts}

=== UPGRADED PAGE CONTENT ===
{sections}

=== INSTRUCTIONS ===
{synthesis_task}
""".strip()

out_file = AGENTS_DIR / 'page-agent7-synthesis.txt'
out_file.write_text(prompt)
print(f'Synthesis prompt written: {len(prompt)//1024}KB')
PYEOF

echo "Running synthesis agent..."
bash "$SCRIPT_DIR/gemini-agent.sh" \
  "$AGENTS_DIR/page-agent7-synthesis.txt" \
  "$OUTPUTS_DIR/page-agent7-synthesis.json"

echo ""
echo "=== All 7 agents complete ==="
echo "Outputs in: scripts/outputs/page-agent*.json"
echo "Next: apply patches from each agent output."
```

**Step 2: Make it executable**

```bash
chmod +x scripts/run-page-agents.sh
```

---

### Task 7: Run the agent swarm

**Step 1: Set the Gemini API key**

```bash
export GEMINI_API_KEY="AIzaSyB8Bk3pXuwnhhfkXcwVbCfUBQtJxMNsQxk"
```

**Step 2: Run all agents**

```bash
cd /home/ariel/Documents/anavi-main
bash scripts/run-page-agents.sh
```

Expected (takes ~90–120 seconds):
```
=== Phase 2: Page Vision Conformance Agents ===
Starting 6 page agents in parallel...
  Launched agent 1 (intents) PID=XXXX
  ...
Waiting for all 6 agents...
  ✓ Agent 1 (intents) complete
  ...
All 6 page agents complete. Building synthesis prompt...
Running synthesis agent...
=== All 7 agents complete ===
```

**Step 3: Verify all 7 outputs exist**

```bash
ls -la scripts/outputs/page-agent*.json
```

Expected: 7 files, each > 1KB.

**Step 4: Validate JSON for all 6 page agents**

```bash
for i in 1 2 3 4 5 6; do
  names=(intents matches relationships verification payouts dealrooms)
  name="${names[$((i-1))]}"
  python3 -c "
import json, sys
with open('scripts/outputs/page-agent${i}-${name}.json') as f:
    d = json.load(f)
tsx = d.get('upgraded_tsx', '')
print(f'Agent $i ($name): {len(tsx)} chars, keys: {list(d.keys())}')
if not tsx or len(tsx) < 1000:
    print('  WARNING: upgraded_tsx suspiciously short')
    sys.exit(1)
"
done
```

Expected: each agent produced `upgraded_tsx` of at least 5000+ chars.

---

### Task 8: Apply patches from page agents 1–6

For each agent, extract `upgraded_tsx` from the JSON and write it to the target file.
Run each patch one at a time, checking TypeScript after each.

**Step 1: Apply all 6 page upgrades**

```bash
cd /home/ariel/Documents/anavi-main
python3 - << 'PYEOF'
import json, pathlib

OUTPUTS = pathlib.Path('scripts/outputs')
ANAVI   = pathlib.Path('anavi/client/src/pages')

PAGE_MAP = {
    1: ('intents',       'Intents.tsx'),
    2: ('matches',       'Matches.tsx'),
    3: ('relationships', 'Relationships.tsx'),
    4: ('verification',  'Verification.tsx'),
    5: ('payouts',       'Payouts.tsx'),
    6: ('dealrooms',     'DealRooms.tsx'),
}

for agent_id, (name, filename) in PAGE_MAP.items():
    json_file = OUTPUTS / f'page-agent{agent_id}-{name}.json'
    target    = ANAVI / filename
    try:
        data = json.loads(json_file.read_text())
        tsx  = data.get('upgraded_tsx', '')
        if len(tsx) < 1000:
            print(f'  SKIP agent {agent_id} ({name}): tsx too short ({len(tsx)} chars)')
            continue
        target.write_text(tsx)
        print(f'  ✓ Agent {agent_id} ({name}): wrote {len(tsx)} chars to {filename}')
    except Exception as e:
        print(f'  ✗ Agent {agent_id} ({name}): ERROR — {e}')
PYEOF
```

**Step 2: Run TypeScript check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1
```

Expected: 0 errors. If errors appear, fix them now (see Task 8a below).

---

### Task 8a: Fix TypeScript errors from page agent patches (if any)

This task only applies if `pnpm check` produced errors in Task 8 Step 2.

**Common error patterns and fixes:**

**Error: Property X does not exist on type Y**
The agent referenced a property that doesn't exist on the tRPC return type.
Fix: use optional chaining `?.` or remove the reference.
Example: if agent wrote `match.user1Id` and the type doesn't have it:
```tsx
// Change:
const isUser1 = match.user1Id === user?.id;
// To:
const isUser1 = (match as any).user1Id === user?.id; // TODO: add user1Id to match type
```

**Error: Cannot find module '@/lib/copy' export 'X'**
The agent imported a token that doesn't exist in copy.ts yet.
Fix: add the token to `client/src/lib/copy.ts`, or remove the import from the page.

**Error: Type '...' is not assignable to type '...'**
The agent changed a prop type. Use a type assertion or restore the original prop.

After fixing each error, re-run `pnpm check` until clean.

---

### Task 9: Apply synthesis corrections from Agent 7

**Step 1: Read Agent 7 output**

```bash
python3 -c "
import json
with open('scripts/outputs/page-agent7-synthesis.json') as f:
    d = json.load(f)
print('Report:', d.get('consistency_report', ''))
print('All clear:', d.get('all_clear'))
print('Corrections:', len(d.get('corrections', [])))
for c in d.get('corrections', []):
    print(f\"  {c['file']}: {c['reason']}\")
"
```

**Step 2: Apply each correction**

For each correction in `d['corrections']`, find the file and apply the `old_string` → `new_string` replacement.

```bash
python3 - << 'PYEOF'
import json, pathlib

ANAVI = pathlib.Path('anavi')

with open('scripts/outputs/page-agent7-synthesis.json') as f:
    data = json.load(f)

corrections = data.get('corrections', [])
if not corrections:
    print('No corrections needed — all_clear.')
else:
    for c in corrections:
        filepath = ANAVI / c['file']
        if not filepath.exists():
            print(f"  SKIP: {c['file']} not found")
            continue
        content = filepath.read_text()
        old = c['old_string']
        new = c['new_string']
        if old not in content:
            print(f"  SKIP: old_string not found in {c['file']}: {old[:60]!r}")
            continue
        filepath.write_text(content.replace(old, new, 1))
        print(f"  ✓ {c['file']}: {c['reason']}")
PYEOF
```

**Step 3: Run TypeScript check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1
```

Expected: 0 errors.

---

### Task 10: Final verification and commit

**Step 1: Run full test suite**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check && pnpm test
```

Expected:
```
# pnpm check: no output
Tests  60 passed (60)
```

**Step 2: Commit all changes**

```bash
cd /home/ariel/Documents/anavi-main
git add \
  anavi/client/src/pages/Onboarding.tsx \
  anavi/client/src/components/DashboardLayout.tsx \
  anavi/client/src/pages/FeeManagement.tsx \
  anavi/client/src/pages/Intents.tsx \
  anavi/client/src/pages/Matches.tsx \
  anavi/client/src/pages/Relationships.tsx \
  anavi/client/src/pages/Verification.tsx \
  anavi/client/src/pages/Payouts.tsx \
  anavi/client/src/pages/DealRooms.tsx \
  scripts/build-page-agent-prompts.py \
  scripts/run-page-agents.sh \
  scripts/agents/page-agent*.txt \
  scripts/outputs/page-agent*.json

git commit -m "feat: upgrade 6 user-journey pages for whitepaper vision conformance

Phase 1 functional fixes:
- Onboarding.tsx: /deal-room → /deal-rooms (broken link)
- DashboardLayout.tsx: mobile nav expanded to 6-module structure
- FeeManagement.tsx: clear demo/live data boundary

Phase 2 page upgrades (7-agent Gemini swarm):
- Intents.tsx: 'Blind Intent' labels, copy.ts tokens, sealed language
- Matches.tsx: 'Blind Matches' header, sealed-brief card aesthetic, isUser1 fix
- Relationships.tsx: 'Relationship Custody' heading, Custodied/Open terminology
- Verification.tsx: radar labels fixed, whitepaper component names, hardcoded values cleaned
- Payouts.tsx: DASHBOARD.payouts tokens, Attribution Chain section
- DealRooms.tsx: status filter mapping fixed, fake Total Value removed, NDA language

pnpm check: 0 errors | pnpm test: 60/60 passed

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] `pnpm check` — 0 errors
- [ ] `pnpm test` — 60/60 pass
- [ ] `Onboarding.tsx:252` links to `/deal-rooms`
- [ ] Mobile nav has 6 items including Payouts and Verification
- [ ] `Intents.tsx` — intent cards have "Blind Intent" badge
- [ ] `Matches.tsx` — header says "Blind Matches", cards have sealed-brief aesthetic
- [ ] `Relationships.tsx` — heading is "Relationship Custody", filters use Custodied/Open
- [ ] `Verification.tsx` — no duplicate radar labels, whitepaper component names
- [ ] `Payouts.tsx` — DASHBOARD.payouts tokens used, Attribution Chain heading present
- [ ] `DealRooms.tsx` — all status filters match real schema values, no fake Total Value
