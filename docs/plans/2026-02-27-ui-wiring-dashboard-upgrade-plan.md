# UI Wiring & Dashboard Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all UI wiring inconsistencies and upgrade the Dashboard to feel like the institutional "Private Market Operating System" described in the ANAVI whitepaper.

**Architecture:** A 10-agent Gemini swarm (Phase 1: 8 parallel analysis+patch agents; Phase 2: 2 synthesis agents) reads the full codebase deeply, produces structured JSON findings + patches, which are then applied in merge order and validated with `pnpm check && pnpm test`.

**Tech Stack:** React 19, Vite, tRPC v11, Tailwind 4, shadcn/ui, framer-motion, Gemini 2.5 Flash API (direct HTTP via curl), Node.js bash scripting

---

## Prerequisites

- Working dir: `anavi/` (all pnpm commands run from there)
- Gemini API key: `YOUR_GEMINI_API_KEY`
- Baseline: `pnpm check` currently shows 1 error: `llmFactory.ts` missing `openai` package

---

## Task 0: Fix Baseline TypeScript Error

**Files:**
- Modify: `anavi/package.json`

**Step 1: Install missing openai package**

```bash
cd anavi && pnpm add openai
```

Expected output: `+ openai <version>`

**Step 2: Verify baseline is clean**

```bash
pnpm check
```

Expected: `Exit code 0` (no errors)

**Step 3: Commit**

```bash
git add anavi/package.json anavi/pnpm-lock.yaml
git commit -m "fix: add missing openai package dependency"
```

---

## Task 1: Write the Gemini Swarm Infrastructure Script

**Files:**
- Create: `scripts/gemini-agent.sh` — wrapper to call Gemini API with a prompt file
- Create: `scripts/gemini-swarm.sh` — Phase 1 parallel launcher

**Step 1: Create the single-agent caller**

Create `scripts/gemini-agent.sh`:

```bash
#!/bin/bash
# Usage: ./gemini-agent.sh <prompt-file> <output-file>
# Calls Gemini 2.5 Flash with the prompt and saves JSON response to output-file

PROMPT_FILE="$1"
OUTPUT_FILE="$2"
API_KEY="YOUR_GEMINI_API_KEY"

if [ -z "$PROMPT_FILE" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 <prompt-file> <output-file>"
  exit 1
fi

PROMPT_TEXT=$(cat "$PROMPT_FILE")

# Escape for JSON
ESCAPED=$(echo "$PROMPT_TEXT" | python3 -c "
import sys, json
text = sys.stdin.read()
print(json.dumps(text))
")

curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "{\"contents\":[{\"parts\":[{\"text\":${ESCAPED}}]}],\"generationConfig\":{\"responseMimeType\":\"application/json\"}}" \
  > "$OUTPUT_FILE.raw"

# Extract text from response
python3 -c "
import sys, json
with open('${OUTPUT_FILE}.raw') as f:
    data = json.load(f)
try:
    text = data['candidates'][0]['content']['parts'][0]['text']
    with open('${OUTPUT_FILE}', 'w') as out:
        out.write(text)
    print(f'Agent output saved to ${OUTPUT_FILE}')
except Exception as e:
    print(f'Error extracting response: {e}')
    print(json.dumps(data, indent=2))
    sys.exit(1)
"
```

**Step 2: Make executable**

```bash
chmod +x scripts/gemini-agent.sh
```

**Step 3: Test the agent caller**

Create `scripts/test-agent.txt`:
```
Return a JSON object: {"status": "ok", "model": "gemini-2.5-flash"}
```

```bash
./scripts/gemini-agent.sh scripts/test-agent.txt /tmp/test-agent-out.json
cat /tmp/test-agent-out.json
```

Expected: `{"status": "ok", "model": "gemini-2.5-flash"}`

---

## Task 2: Write Agent 1 Prompt — Dashboard Intelligence

**Files:**
- Create: `scripts/agents/agent1-dashboard-intelligence.txt`

**Step 1: Write the prompt file**

This prompt embeds full Dashboard.tsx + whitepaper vision and asks for a deep audit.

```bash
cat > scripts/agents/agent1-dashboard-intelligence.txt << 'PROMPT_EOF'
You are a senior frontend architect auditing the ANAVI platform's Dashboard component against its whitepaper vision.

# VISION CONTEXT
ANAVI is "The Private Market Operating System" — "If Bloomberg runs public markets, ANAVI will run private ones."
The platform has 6 core modules:
1. Identity/KYC — Trust Score (dynamic, compound, tiered: Basic/Enhanced/Institutional)
2. Relationship Custody — Timestamped, cryptographic, blind until consent
3. Blind Matching — Intent-based, anonymized until mutual consent
4. Deal Rooms — NDA-gated, audit trail, escrow-backed
5. Compliance/Escrow — AML/KYC rails, compliance passport
6. Economics Engine — Originator gets 40-60%, lifetime attribution, automated payouts

UX principle: "Simplicity as design principle. Progressive disclosure."
Visual identity: navy/blue palette, luxury aesthetic, institutional-grade.

Target users: Family Offices, Institutional Investors, Deal Originators, Asset Owners, Project Developers

The transformation ANAVI promises:
- Before: 5-15 broker chains → After: Direct verified counterparty access
- Before: Manual costly due diligence → After: Pre-verified participant network
- Before: Relationship leakage → After: Custodied relationships with lifetime attribution
- Before: Opaque negotiated fees → After: Transparent, automated economics

# DASHBOARD SOURCE (client/src/pages/Dashboard.tsx — full file)
[DASHBOARD_SOURCE_PLACEHOLDER]

# AUDIT TASK
Perform a deep, hyper-meticulous audit of Dashboard.tsx against the ANAVI vision. For EACH of the 6 modules, answer:
1. Is this module represented with appropriate visual weight?
2. Does the copy/terminology match whitepaper language exactly?
3. Is the hierarchy correct? (Most important = largest visual presence)
4. What specific JSX changes would make it feel institutional vs prototype?

Also audit:
- data-tour attribute coverage (list all data-tour values present)
- MaybeLink usage correctness
- Demo mode (enabled: !demo) completeness
- Any hardcoded strings that should come from lib/copy.ts

Return a JSON object with this exact structure:
{
  "module_audit": [
    {
      "module": "Identity/KYC",
      "current_weight": "low|medium|high",
      "issues": ["issue 1", "issue 2"],
      "proposed_changes": ["specific JSX change 1", "specific JSX change 2"]
    }
  ],
  "data_tour_coverage": {
    "present": ["trust-score", "relationships", ...],
    "missing": ["module names that should have data-tour but don't"],
    "broken": ["selectors referenced in tourDefinitions.ts that don't match"]
  },
  "demo_mode_issues": [
    {"issue": "description", "file": "path", "line_approx": 0}
  ],
  "copy_drift": [
    {"hardcoded_string": "text", "should_use": "COPY_TOKEN from lib/copy.ts"}
  ],
  "dashboard_upgrade_spec": {
    "structural_changes": [
      "Specific structural change 1 (e.g. move Trust Score to hero position)"
    ],
    "visual_changes": [
      "Specific visual change 1"
    ],
    "copy_changes": [
      "Specific copy change 1"
    ],
    "new_components_needed": [
      "Component name and purpose"
    ]
  }
}
PROMPT_EOF
```

**Step 2: Inject actual Dashboard.tsx content into prompt**

```bash
DASHBOARD=$(cat anavi/client/src/pages/Dashboard.tsx)
sed -i "s|\[DASHBOARD_SOURCE_PLACEHOLDER\]|${DASHBOARD}|g" scripts/agents/agent1-dashboard-intelligence.txt
```

Note: If `sed` fails due to special characters, use the Python injector:
```bash
python3 scripts/inject-source.py \
  scripts/agents/agent1-dashboard-intelligence.txt \
  "[DASHBOARD_SOURCE_PLACEHOLDER]" \
  anavi/client/src/pages/Dashboard.tsx
```

---

## Task 3: Write Agent 2 Prompt — Navigation Architecture

**Files:**
- Create: `scripts/agents/agent2-navigation.txt`

This agent receives App.tsx + DashboardLayout.tsx and the 6-module hierarchy spec.

Output format:
```json
{
  "route_issues": [
    {"route": "/intents", "issue": "not in navSections", "fix": "add to Network section"}
  ],
  "wrapper_issues": [
    {"route": "/demo", "current": "bare", "should_be": "bare", "note": "correct — demo is public"}
  ],
  "proposed_navSections": "full TypeScript navSections array code",
  "orphaned_routes": ["routes with no nav item and no documented reason"],
  "missing_routes": ["pages imported but no Route defined"]
}
```

---

## Task 4: Write Agent 3 Prompt — Tour System Integrity

**Files:**
- Create: `scripts/agents/agent3-tour-integrity.txt`

Receives: tourDefinitions.ts, tour/definitions.ts, GuidedTour.tsx, TourOverlay.tsx

Output:
```json
{
  "selector_drift": [
    {"tourId": "demoTour", "step": "payout", "selector": "[data-tour=\"payouts\"]",
     "actual_dom": "[data-tour=\"payout\"]", "fix": "change selector to [data-tour=\"payout\"]"}
  ],
  "dead_exports": ["onboardingTour — never imported anywhere"],
  "system_confusion": "description of data-tour vs data-tour-id overlap",
  "patches": [
    {"file": "client/src/lib/tourDefinitions.ts", "line": 107, "old": "payouts", "new": "payout"}
  ]
}
```

---

## Task 5: Write Agent 4 Prompt — Demo Data Fidelity

**Files:**
- Create: `scripts/agents/agent4-demo-data.txt`

Receives: demoFixtures.ts + Dashboard.tsx + DemoContext.tsx

Output:
```json
{
  "shape_mismatches": [
    {"fixture_key": "notifications[].time", "fixture_type": "string",
     "dashboard_expects": "Date|string", "issue": "hardcoded 'ago' string vs formatDistanceToNow"}
  ],
  "unused_fixture_keys": ["keys in fixtures that Dashboard never reads"],
  "missing_fixture_keys": ["things Dashboard tries to read that aren't in fixtures"],
  "persona_narrative_issues": [
    {"persona": "developer", "issue": "story doesn't connect to whitepaper Project Developer use case"}
  ],
  "patches": []
}
```

---

## Task 6: Write Agent 5 Prompt — Whitepaper Copy Audit

**Files:**
- Create: `scripts/agents/agent5-copy-audit.txt`

Receives: lib/copy.ts + all page files (key excerpts)

Output:
```json
{
  "missing_copy_tokens": [
    {"token_needed": "PLATFORM.modules[1].name", "used_where": "Dashboard line 45",
     "hardcoded_as": "Relationship Custody"}
  ],
  "terminology_violations": [
    {"file": "Payouts.tsx", "hardcoded": "Fee Split", "should_be": "Originator Share"}
  ],
  "copy_token_additions": "TypeScript code additions to lib/copy.ts",
  "label_patches": []
}
```

---

## Task 7: Write Agent 6 Prompt — Page Inventory

**Files:**
- Create: `scripts/agents/agent6-page-inventory.txt`

Receives: all page file names + App.tsx routes + navSections

Output:
```json
{
  "pages": [
    {
      "page": "Intents.tsx",
      "route": "/intents",
      "in_nav": false,
      "trpc_backed": true,
      "demo_gated": false,
      "module": "Blind Matching",
      "status": "real|demo-mock|orphaned|stub",
      "action_needed": "Add to navSections under Deals section"
    }
  ],
  "module_coverage": {
    "Identity/KYC": ["Verification.tsx", "Onboarding.tsx"],
    "Relationship Custody": ["Relationships.tsx"],
    "Blind Matching": ["Intents.tsx", "Matches.tsx", "DealMatching.tsx"],
    "Deal Rooms": ["DealRooms.tsx", "DealRoom.tsx"],
    "Compliance/Escrow": ["Compliance.tsx", "AuditLogs.tsx"],
    "Economics Engine": ["Payouts.tsx", "FeeManagement.tsx"]
  },
  "feature_gaps": ["Module X has no page for Y feature"]
}
```

---

## Task 8: Write Agent 7 Prompt — TypeScript Health

**Files:**
- Create: `scripts/agents/agent7-typescript.txt`

This agent receives the `pnpm check` output and relevant file sources.

Output:
```json
{
  "errors": [
    {"file": "path", "line": 0, "error": "TS error text", "fix": "specific code fix"}
  ],
  "patches": []
}
```

---

## Task 9: Write Agent 8 Prompt — Onboarding Flow

**Files:**
- Create: `scripts/agents/agent8-onboarding.txt`

Receives: OnboardingFlow.tsx + Onboarding.tsx + whitepaper vision

Output:
```json
{
  "value_prop_gaps": [
    {"step": "step name", "current": "what it says", "should_say": "whitepaper-aligned version"}
  ],
  "custody_receipt_issues": [],
  "flow_logic_issues": [],
  "patches": []
}
```

---

## Task 10: Create Python Source Injector

**Files:**
- Create: `scripts/inject-source.py`

This utility injects file contents into prompt templates safely (handles special chars).

```python
#!/usr/bin/env python3
"""
Usage: python3 inject-source.py <prompt-file> <placeholder> <source-file>
Replaces placeholder in prompt-file with the escaped contents of source-file.
"""
import sys

prompt_file = sys.argv[1]
placeholder = sys.argv[2]
source_file = sys.argv[3]

with open(prompt_file, 'r') as f:
    prompt = f.read()

with open(source_file, 'r') as f:
    source = f.read()

result = prompt.replace(placeholder, source)

with open(prompt_file, 'w') as f:
    f.write(result)

print(f"Injected {source_file} into {prompt_file}")
```

---

## Task 11: Build Phase 1 Parallel Launcher

**Files:**
- Create: `scripts/run-phase1.sh`

```bash
#!/bin/bash
# Runs all 8 Phase 1 agents in parallel and waits for completion

mkdir -p scripts/agents scripts/outputs

echo "=== ANAVI UI Wiring Swarm — Phase 1 ==="
echo "Launching 8 agents in parallel..."

run_agent() {
  local n=$1
  local name=$2
  echo "[Agent $n] Starting: $name"
  ./scripts/gemini-agent.sh \
    "scripts/agents/agent${n}-${name}.txt" \
    "scripts/outputs/agent${n}-${name}.json" \
    && echo "[Agent $n] DONE: $name" \
    || echo "[Agent $n] FAILED: $name"
}

# Launch all 8 in parallel
run_agent 1 "dashboard-intelligence" &
run_agent 2 "navigation" &
run_agent 3 "tour-integrity" &
run_agent 4 "demo-data" &
run_agent 5 "copy-audit" &
run_agent 6 "page-inventory" &
run_agent 7 "typescript" &
run_agent 8 "onboarding" &

# Wait for all to complete
wait
echo ""
echo "=== Phase 1 Complete. Check scripts/outputs/ ==="
ls -la scripts/outputs/
```

```bash
chmod +x scripts/run-phase1.sh
```

---

## Task 12: Populate All Agent Prompts with Source Context

**Step 1: Create the source injection script**

```bash
cat > scripts/build-prompts.sh << 'EOF'
#!/bin/bash
# Injects actual source code into all agent prompt templates
ANAVI="anavi"

echo "Building agent prompts with source context..."

# Agent 1: Dashboard
python3 scripts/inject-source.py \
  scripts/agents/agent1-dashboard-intelligence.txt \
  "[DASHBOARD_SOURCE_PLACEHOLDER]" \
  "$ANAVI/client/src/pages/Dashboard.tsx"

# Agent 2: Navigation
# Combine App.tsx + DashboardLayout.tsx into prompt
cat scripts/agents/agent2-navigation.txt > /tmp/agent2.txt
echo "\n\n# APP.TSX SOURCE\n" >> /tmp/agent2.txt
cat "$ANAVI/client/src/App.tsx" >> /tmp/agent2.txt
echo "\n\n# DASHBOARDLAYOUT.TSX SOURCE (navSections relevant)\n" >> /tmp/agent2.txt
cat "$ANAVI/client/src/components/DashboardLayout.tsx" >> /tmp/agent2.txt
cp /tmp/agent2.txt scripts/agents/agent2-navigation.txt

# Agent 3: Tour System
cat scripts/agents/agent3-tour-integrity.txt > /tmp/agent3.txt
echo "\n\n# TOURDEFINITIONS.TSX SOURCE\n" >> /tmp/agent3.txt
cat "$ANAVI/client/src/lib/tourDefinitions.ts" >> /tmp/agent3.txt
echo "\n\n# TOUR/DEFINITIONS.TS SOURCE\n" >> /tmp/agent3.txt
cat "$ANAVI/client/src/tour/definitions.ts" >> /tmp/agent3.txt
cp /tmp/agent3.txt scripts/agents/agent3-tour-integrity.txt

# Agent 4: Demo Data
cat scripts/agents/agent4-demo-data.txt > /tmp/agent4.txt
echo "\n\n# DEMOFIXTURES.TS SOURCE\n" >> /tmp/agent4.txt
cat "$ANAVI/client/src/lib/demoFixtures.ts" >> /tmp/agent4.txt
echo "\n\n# DEMOCONTEXT.TSX SOURCE\n" >> /tmp/agent4.txt
cat "$ANAVI/client/src/contexts/DemoContext.tsx" >> /tmp/agent4.txt
cp /tmp/agent4.txt scripts/agents/agent4-demo-data.txt

# Agent 5: Copy Audit
cat scripts/agents/agent5-copy-audit.txt > /tmp/agent5.txt
echo "\n\n# COPY.TS SOURCE\n" >> /tmp/agent5.txt
cat "$ANAVI/client/src/lib/copy.ts" >> /tmp/agent5.txt
cp /tmp/agent5.txt scripts/agents/agent5-copy-audit.txt

# Agent 7: TypeScript — inject pnpm check output
cd "$ANAVI" && pnpm check 2>&1 > /tmp/ts-errors.txt; cd ..
cat scripts/agents/agent7-typescript.txt > /tmp/agent7.txt
echo "\n\n# PNPM CHECK OUTPUT\n" >> /tmp/agent7.txt
cat /tmp/ts-errors.txt >> /tmp/agent7.txt
cp /tmp/agent7.txt scripts/agents/agent7-typescript.txt

# Agent 8: Onboarding Flow
cat scripts/agents/agent8-onboarding.txt > /tmp/agent8.txt
echo "\n\n# ONBOARDINGFLOW.TSX SOURCE\n" >> /tmp/agent8.txt
cat "$ANAVI/client/src/pages/OnboardingFlow.tsx" >> /tmp/agent8.txt
cp /tmp/agent8.txt scripts/agents/agent8-onboarding.txt

echo "All prompts built with source context."
EOF
chmod +x scripts/build-prompts.sh
```

**Step 2: Run the prompt builder**

```bash
./scripts/build-prompts.sh
```

Expected: "All prompts built with source context."

---

## Task 13: Run Phase 1 Agents

**Step 1: Run all 8 in parallel**

```bash
./scripts/run-phase1.sh
```

Expected: 8 agents complete, outputs in `scripts/outputs/`

**Step 2: Verify outputs**

```bash
for i in 1 2 3 4 5 6 7 8; do
  echo "=== Agent $i ==="
  python3 -c "
import json, sys
files = {
  1: 'dashboard-intelligence', 2: 'navigation', 3: 'tour-integrity',
  4: 'demo-data', 5: 'copy-audit', 6: 'page-inventory',
  7: 'typescript', 8: 'onboarding'
}
name = files[$i]
with open(f'scripts/outputs/agent${i}-{name}.json') as f:
    data = json.load(f)
print(json.dumps(list(data.keys()), indent=2))
"
done
```

Expected: Each agent output has its defined top-level keys

---

## Task 14: Apply Patch 1 — TypeScript Health

Read Agent 7 output and apply fixes.

**Step 1: Review Agent 7 findings**

```bash
cat scripts/outputs/agent7-typescript.json | python3 -m json.tool
```

**Step 2: Apply patches**

Apply each `patches[]` entry. Example:
```bash
# For each patch in agent7 output, edit the file manually or via Edit tool
# Then verify:
cd anavi && pnpm check
```

Expected: `Exit code 0`

**Step 3: Commit**
```bash
git add -p
git commit -m "fix: resolve TypeScript errors from Agent 7 audit"
```

---

## Task 15: Apply Patch 2 — Navigation Architecture

**Step 1: Review Agent 2 findings**

```bash
cat scripts/outputs/agent2-navigation.json | python3 -m json.tool
```

**Step 2: Apply `proposed_navSections` to DashboardLayout.tsx**

Replace the `navSections` array with Agent 2's output.

**Step 3: Fix route wrappers in App.tsx per `wrapper_issues`**

**Step 4: Verify**

```bash
cd anavi && pnpm check && pnpm test
```

**Step 5: Commit**
```bash
git commit -m "feat: reorganize sidebar navigation into 6-module architecture"
```

---

## Task 16: Apply Patch 3 — Tour System Integrity

**Step 1: Review Agent 3 findings**

```bash
cat scripts/outputs/agent3-tour-integrity.json | python3 -m json.tool
```

**Step 2: Apply `patches` to tourDefinitions.ts**

Key known fix: change `[data-tour="payouts"]` → `[data-tour="payout"]` in demoTour step 6.

**Step 3: Remove dead `onboardingTour` export** if Agent 3 confirms it's unused.

**Step 4: Verify**

```bash
cd anavi && pnpm check && pnpm test
```

**Step 5: Commit**
```bash
git commit -m "fix: resolve tour selector drift and remove dead onboardingTour export"
```

---

## Task 17: Apply Patch 4 — Demo Data Fidelity

**Step 1: Review Agent 4 findings**

```bash
cat scripts/outputs/agent4-demo-data.json | python3 -m json.tool
```

**Step 2: Apply shape alignment fixes to demoFixtures.ts**

**Step 3: Apply any persona narrative improvements**

**Step 4: Verify**

```bash
cd anavi && pnpm check && pnpm test
```

**Step 5: Commit**
```bash
git commit -m "fix: align demoFixtures shapes with tRPC output types"
```

---

## Task 18: Apply Patch 5 — Whitepaper Copy

**Step 1: Review Agent 5 findings**

```bash
cat scripts/outputs/agent5-copy-audit.json | python3 -m json.tool
```

**Step 2: Add missing tokens to lib/copy.ts per `copy_token_additions`**

**Step 3: Apply `label_patches` to affected page files**

**Step 4: Verify**

```bash
cd anavi && pnpm check && pnpm test
```

**Step 5: Commit**
```bash
git commit -m "feat: align all copy tokens with whitepaper terminology"
```

---

## Task 19: Apply Patch 6 — Onboarding Flow

**Step 1: Review Agent 8 findings**

```bash
cat scripts/outputs/agent8-onboarding.json | python3 -m json.tool
```

**Step 2: Apply value prop alignment patches to OnboardingFlow.tsx**

**Step 3: Verify**

```bash
cd anavi && pnpm check && pnpm test
```

**Step 4: Commit**
```bash
git commit -m "feat: align onboarding flow with whitepaper value proposition"
```

---

## Task 20: Write Phase 2 Agent 9 — Cross-Patch Validator

**Files:**
- Create: `scripts/agents/agent9-validator.txt`

This agent receives all Phase 1 JSON outputs and produces a conflict-free merge plan + any cross-cutting fixes.

```bash
cat > scripts/agents/agent9-validator.txt << 'EOF'
You are a senior software architect validating a set of code patches produced by 8 independent agents for the ANAVI platform.

Read all 8 agent outputs below and:
1. Identify any conflicts (two agents patching the same line differently)
2. Identify any ordering dependencies (patch B must apply after patch A)
3. Identify any findings that one agent missed that another agent's findings imply
4. Produce a final consolidated list of patches, conflict-free, in optimal merge order

[INJECT ALL PHASE 1 OUTPUTS HERE]

Return JSON:
{
  "conflicts": [{"agents": ["agent1", "agent2"], "file": "path", "description": "conflict"}],
  "ordering": ["agent7", "agent2", "agent3", "agent4", "agent5", "agent8", "agent1+agent10"],
  "cross_cutting_fixes": [{"description": "fix", "file": "path", "patch": "code"}],
  "validation_summary": "human readable summary of all findings"
}
EOF
```

---

## Task 21: Write Phase 2 Agent 10 — Dashboard UI Upgrade

**Files:**
- Create: `scripts/agents/agent10-dashboard-upgrade.txt`

This is the most important agent. It writes the upgraded Dashboard.tsx.

```bash
cat > scripts/agents/agent10-dashboard-upgrade.txt << 'PROMPT_EOF'
You are a senior product designer and React engineer upgrading the ANAVI Dashboard to feel like "The Quiet Operating System That Serious Private Capital Plugs Into."

# VISION
"If Bloomberg runs public markets, ANAVI will run private ones."
- Institutional, trust-first
- Navy/blue palette, luxury aesthetic
- 6-module structure: Identity/KYC, Relationship Custody, Blind Matching, Deal Rooms, Compliance, Economics
- UX: simplicity + progressive disclosure
- Target: Family Offices, Institutional Investors, Deal Originators

# AGENT 1 FINDINGS (Dashboard Intelligence Audit)
[INJECT AGENT 1 OUTPUT]

# CURRENT DASHBOARD SOURCE
[INJECT DASHBOARD SOURCE]

# UPGRADE REQUIREMENTS

## Module 1: Identity/KYC — Trust Score
- Trust Score ring should be the visual HERO of the dashboard
- Tier badge (Basic/Enhanced/Institutional) should be prominently labeled
- KYB status should be visible
- The score should feel like a Bloomberg market indicator, not a progress ring

## Module 2: Relationship Custody
- Each relationship entry must show: custody hash (truncated), timestamp age, attribution status
- The custody hash should feel like a legal timestamp receipt
- A "Protect" button should be the primary CTA — not buried

## Module 3: Blind Matching
- Match cards must feel like "sealed intelligence briefs"
- Compatibility score prominent
- "SEALED — [AssetClass]" language instead of generic titles
- Consent button is the unlock mechanism — make it feel weighty

## Module 4: Deal Rooms
- Escrow progress bar should feel institutional (not just a bar)
- NDA status, stage, and audit event count should be scannable
- "Enter Deal Room" is a high-trust action — style accordingly

## Module 5: Compliance
- Pending verification actions should feel urgent but calm
- Compliance passport concept should be visible
- Trust tier gates should be legible

## Module 6: Economics Engine
- Payouts should show originator share % and attribution chain
- "Lifetime Attribution" framing — this isn't just a transaction
- Trajectory/compound value should be implied

## data-tour Attributes
Ensure ALL existing data-tour attributes are preserved and correct:
- data-tour="trust-score" — Trust Score hero section
- data-tour="relationships" — Relationship Custody button/section
- data-tour="match-card" — First match card
- data-tour="deal-room" — First deal room card
- data-tour="verification" — Verification/compliance section
- data-tour="payout" — Payouts section (NOTE: "payout" not "payouts")
- data-tour="apply" — Request Access CTA
- data-tour="dashboard" — Page header
- data-tour="activity-feed" — Notifications section
- data-tour="deal-matching" — Deal matching section

## Constraints
- Keep all existing import names
- Keep useDemoFixtures() hook usage
- Keep MaybeLink component usage
- Keep enabled: !demo on all tRPC queries
- Keep all data-tour attributes (do NOT remove any)
- Use existing Tailwind classes and shadcn components
- Do NOT add new dependencies

Write the complete upgraded Dashboard.tsx file.
PROMPT_EOF
```

---

## Task 22: Run Phase 2 Agents

**Step 1: Inject Phase 1 outputs into Agent 9 prompt**

```bash
python3 - << 'EOF'
import json, os

# Read all phase 1 outputs
outputs = {}
files = {
    1: 'dashboard-intelligence', 2: 'navigation', 3: 'tour-integrity',
    4: 'demo-data', 5: 'copy-audit', 6: 'page-inventory',
    7: 'typescript', 8: 'onboarding'
}
for n, name in files.items():
    path = f'scripts/outputs/agent{n}-{name}.json'
    if os.path.exists(path):
        with open(path) as f:
            outputs[f'agent{n}_{name}'] = json.load(f)

combined = json.dumps(outputs, indent=2)

with open('scripts/agents/agent9-validator.txt') as f:
    prompt = f.read()

prompt = prompt.replace('[INJECT ALL PHASE 1 OUTPUTS HERE]', combined)

with open('scripts/agents/agent9-validator.txt', 'w') as f:
    f.write(prompt)

print("Agent 9 prompt built")
EOF
```

**Step 2: Run Agent 9**

```bash
./scripts/gemini-agent.sh \
  scripts/agents/agent9-validator.txt \
  scripts/outputs/agent9-validator.json
cat scripts/outputs/agent9-validator.json | python3 -m json.tool
```

**Step 3: Inject Agent 1 output + Dashboard source into Agent 10**

```bash
python3 - << 'EOF'
with open('scripts/outputs/agent1-dashboard-intelligence.json') as f:
    a1 = f.read()
with open('anavi/client/src/pages/Dashboard.tsx') as f:
    dashboard = f.read()
with open('scripts/agents/agent10-dashboard-upgrade.txt') as f:
    prompt = f.read()

prompt = prompt.replace('[INJECT AGENT 1 OUTPUT]', a1)
prompt = prompt.replace('[INJECT DASHBOARD SOURCE]', dashboard)

with open('scripts/agents/agent10-dashboard-upgrade.txt', 'w') as f:
    f.write(prompt)
print("Agent 10 prompt built")
EOF
```

**Step 4: Run Agent 10**

```bash
./scripts/gemini-agent.sh \
  scripts/agents/agent10-dashboard-upgrade.txt \
  scripts/outputs/agent10-dashboard-upgrade.json
```

Note: Agent 10 may return the full Dashboard.tsx as a string field in JSON. Extract it:
```bash
python3 - << 'EOF'
import json
with open('scripts/outputs/agent10-dashboard-upgrade.json') as f:
    data = json.load(f)
# Agent 10 should return {"upgraded_dashboard_tsx": "...", "changes_summary": "..."}
dashboard_code = data.get('upgraded_dashboard_tsx') or data.get('code') or data.get('content')
if dashboard_code:
    with open('scripts/outputs/dashboard-upgraded.tsx', 'w') as f:
        f.write(dashboard_code)
    print("Saved upgraded Dashboard.tsx to scripts/outputs/dashboard-upgraded.tsx")
else:
    print("Keys in output:", list(data.keys()))
EOF
```

---

## Task 23: Apply Dashboard Upgrade

**Step 1: Review the upgraded Dashboard**

```bash
# Diff old vs new
diff anavi/client/src/pages/Dashboard.tsx scripts/outputs/dashboard-upgraded.tsx | head -100
```

**Step 2: Review carefully — verify all data-tour attributes are preserved, no new deps added**

Manual review checklist:
- [ ] All data-tour attributes present
- [ ] useDemoFixtures() hook used
- [ ] enabled: !demo on all tRPC queries
- [ ] MaybeLink used for navigation in demo
- [ ] No new import statements for uninstalled packages
- [ ] TypeScript compiles (check mentally for obvious errors)

**Step 3: Apply the upgrade**

```bash
cp anavi/client/src/pages/Dashboard.tsx anavi/client/src/pages/Dashboard.tsx.backup
cp scripts/outputs/dashboard-upgraded.tsx anavi/client/src/pages/Dashboard.tsx
```

**Step 4: Verify**

```bash
cd anavi && pnpm check && pnpm test
```

If errors: restore backup and apply changes manually guided by Agent 10's findings.

**Step 5: Commit**

```bash
git add anavi/client/src/pages/Dashboard.tsx
git commit -m "feat: upgrade Dashboard to institutional 6-module operating system layout"
```

---

## Task 24: Final Integration Verification

**Step 1: Full check + test**

```bash
cd anavi && pnpm check && pnpm test
```

Expected: `0 errors, 37 tests passing`

**Step 2: Build verification**

```bash
cd anavi && pnpm build
```

Expected: Build succeeds

**Step 3: Visual review checklist**

```
cd anavi && pnpm dev
```

Then manually verify:
- [ ] Dashboard shows 6-module structure with correct visual hierarchy
- [ ] Trust Score ring is the hero element
- [ ] Relationship Custody section shows hash + timestamp feel
- [ ] Blind match cards feel "sealed"
- [ ] Navigation sidebar reflects 6-module journey
- [ ] Demo mode works for all 3 personas
- [ ] Guided tour steps resolve to correct DOM elements
- [ ] All whitepaper terminology is consistent

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: ANAVI UI wiring complete — 6-module dashboard, nav architecture, tour integrity, demo fidelity, whitepaper copy alignment"
```

---

## Appendix: Agent Output Reference

All agent outputs saved to `scripts/outputs/`:

| File | Agent | Contents |
|---|---|---|
| `agent1-dashboard-intelligence.json` | Agent 1 | Dashboard module audit + upgrade spec |
| `agent2-navigation.json` | Agent 2 | Nav reorganization + route fixes |
| `agent3-tour-integrity.json` | Agent 3 | Tour selector fixes + dead code |
| `agent4-demo-data.json` | Agent 4 | Fixture shape alignment |
| `agent5-copy-audit.json` | Agent 5 | Copy token gaps + label fixes |
| `agent6-page-inventory.json` | Agent 6 | Full page inventory by module |
| `agent7-typescript.json` | Agent 7 | TS error fixes |
| `agent8-onboarding.json` | Agent 8 | Onboarding value prop patches |
| `agent9-validator.json` | Agent 9 | Cross-patch validation + merge order |
| `agent10-dashboard-upgrade.json` | Agent 10 | Full upgraded Dashboard.tsx |

---

*Plan written: 2026-02-27*
*Design doc: docs/plans/2026-02-27-ui-wiring-dashboard-upgrade-design.md*
