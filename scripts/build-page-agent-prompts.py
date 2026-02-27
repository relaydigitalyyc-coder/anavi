#!/usr/bin/env python3
"""
Build Gemini agent prompts for page wiring + vision conformance (round 2).
Run from repo root: python3 scripts/build-page-agent-prompts.py
Outputs prompt files to scripts/agents/page-agent{N}-{name}.txt
"""
import pathlib

ROOT   = pathlib.Path(__file__).parent.parent / "anavi"
OUT    = pathlib.Path(__file__).parent / "agents"
OUT.mkdir(exist_ok=True)

def read(rel: str) -> str:
    return (ROOT / rel).read_text()

def read_lines(rel: str, start: int, end: int) -> str:
    lines = (ROOT / rel).read_text().splitlines()
    return "\n".join(lines[start - 1 : end])

COPY_TS           = read("client/src/lib/copy.ts")
DASHBOARD_IMPORTS = read_lines("client/src/pages/Dashboard.tsx", 1, 60)

SHARED_CONTEXT = f"""
=== ANAVI WHITEPAPER CONTEXT ===

ANAVI is "The Private Market Operating System" ("If Bloomberg runs public markets, ANAVI will run private ones").

Six core modules:
1. TRUST & IDENTITY — Trust Score (0-100), composite of KYB depth, transaction history,
   dispute outcomes, peer attestations. Three tiers: Basic / Enhanced / Institutional.
   Compliance Passport travels with every transaction.
2. RELATIONSHIP CUSTODY — Timestamped, cryptographically signed introductions.
   "Custodied" = protected with hash proof. "Open" = visible but unprotected.
3. BLIND MATCHING — Intents expressed anonymously. Counterparty identity sealed until
   mutual consent. Match cards: "Sealed -- [AssetClass]", compatibility score, deal size.
   "Blind Intent" = anonymous intent. "Blind Match" = sealed result brief.
4. DEAL ROOMS — NDA-gated workspaces. Immutable audit trail. Workflow:
   NDA Pending -> Active -> Diligence -> Closing -> Completed.
5. COMPLIANCE / ESCROW — KYB verified, OFAC clean, AML passed. Escrow milestones trigger automatically.
6. ECONOMICS ENGINE — Lifetime attribution. Originators earn 40-60% of fees. Follow-on deals
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
{
  "upgraded_tsx": "<complete upgraded TypeScript/TSX file content>",
  "changes_summary": ["change 1", "change 2"],
  "whitepaper_terms_added": ["term 1", "term 2"],
  "copy_tokens_used": ["DASHBOARD.xxx", "TOUR.xxx"]
}

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
        "module": "BLIND MATCHING -- Intent Submission",
        "task": """
Your task: upgrade Intents.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. Individual intent cards are not labeled as "Blind Intents" -- add a "Blind Intent" badge
   to each intent card (small rounded-full badge, navy background).
2. The page imports nothing from @/lib/copy -- import TOUR and use TOUR.blindMatch.title
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
        "module": "BLIND MATCHING -- Sealed Match Results",
        "task": """
Your task: upgrade Matches.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. Page heading "AI Matches" -> "Blind Matches". Stat card label "Total Matches" -> "Blind Matches".
2. Each match card should have the sealed-brief aesthetic from the upgraded Dashboard:
   - Add a subtle dark gradient overlay (bg-gradient-to-br from-[#0A1628]/5 to-transparent)
   - Add a "SEALED -- [assetClass]" badge (gold) at top-left of each card
   - Add a Lock icon (from lucide-react) at top-right
   - Import Lock from lucide-react if not already imported
3. Fix: const isUser1 = true; (hardcoded). Instead derive it:
   - Import useAuth from @/_core/hooks/useAuth
   - const { user } = useAuth();
   - const isUser1 = match.user1Id === user?.id;
   Note: check the exact field name on the match object (may be user1Id, userId1, etc.)
   -- if the field does not exist, add a comment // TODO: derive from match.user1Id and
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
1. Page heading "Relationships" -> "Relationship Custody".
   Add a subtitle: "Timestamped introductions with cryptographic proof of custody."
2. The filter options for verification/visibility status:
   - "Protected" -> "Custodied"
   - "Visible" -> "Open"
   Update both the filter option labels and any status badges on relationship cards.
3. Where the custody hash is shown, label it "Custody Proof" (not just "Hash" or unlabeled).
   Use font-data-mono class for the hash value.
4. In the "Protect a Relationship" modal step 5 (the confirmation screen), import
   CUSTODY_RECEIPT from @/lib/copy and use CUSTODY_RECEIPT.title and CUSTODY_RECEIPT.body
   as the confirmation text.
5. In the 4-stat cards, "Total Relationships" can become "Custodied Relationships".

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
1. The radar chart has a duplicate dimension label -- "verification" appears twice.
   Fix the DIMENSIONS array so all 6 names are unique. Rename them to match whitepaper:
   "KYB Depth", "Transaction History", "Dispute Outcomes", "Peer Attestations",
   "Platform Tenure", "Identity Verification" (these are the 6 components of Trust Score).
2. The hardcoded string "12 institutional partners" -- replace with a variable:
   const PARTNER_COUNT = 12; // TODO: source from live data
   and reference {PARTNER_COUNT} institutional partners in the JSX.
3. Mark the SCORE_HISTORY array as a placeholder:
   Add comment // TODO: replace with live trpc.user.getTrustScoreHistory data
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
   import { DASHBOARD } from "@/lib/copy";
   Then use:
   - DASHBOARD.payouts.lifetimeAttribution as the label for the "Lifetime Attribution" stat card header
   - DASHBOARD.payouts.originationShare as the label for originator share percentage display
2. Before the deal timeline accordion, add a section heading:
   "Attribution Chain"
   with a subtitle: "Every credit in this chain is cryptographically linked to your origination event."
   Style it as: <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
3. The ANAVI Economics Model bar chart (Originator 40-60%, Contributors 20-30%, Platform 10-20%)
   is well-aligned; no changes needed there.
4. In payout type display, originator_fee renders as "Originator Fee" via .replace -- ensure capitalized.

DO NOT CHANGE: All trpc.payout.* queries, the 4-stat cards, the period picker, the statement
modal, the bar chart, the attribution history filters, the deal timeline accordion.
""",
    },
    {
        "id": 6,
        "name": "dealrooms",
        "file": "client/src/pages/DealRooms.tsx",
        "module": "DEAL ROOMS -- Embedded Deal Infrastructure",
        "task": """
Your task: upgrade DealRooms.tsx for whitepaper vision conformance.

SPECIFIC ISSUES TO FIX:
1. The status filter buttons include "Diligence" and "Closing" but the filter logic
   never matches them. The schema statuses are: "active", "closed", "archived".
   Update the filter mapping:
   - "Active" -> status === "active"
   - "Diligence" -> REMOVE this filter button (dead code, schema has no diligence status)
   - "Closing" -> REMOVE this filter button (dead code, schema has no closing status)
   - "Completed" -> status === "closed"
   - "Declined" -> status === "archived"
   Keep: All, NDA Pending, Active, Completed, Declined filters.
2. The "Total Value" stat card uses stats.total * 2.5 -- this is fake data.
   Replace with: show stats.total as a count, rename stat card to "Total Rooms".
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


def build_prompt(page: dict) -> str:
    source = read(page["file"])
    return f"""=== TASK: Upgrade {page['file']} for ANAVI whitepaper vision conformance ===
Module: {page['module']}

{SHARED_CONTEXT}

=== SOURCE FILE: {page['file']} ===
{source}

=== INSTRUCTIONS ===
{page['task']}

{OUTPUT_SCHEMA}""".strip()


if __name__ == "__main__":
    print("Building page agent prompts...")
    for page in PAGES:
        prompt = build_prompt(page)
        out_file = OUT / f"page-agent{page['id']}-{page['name']}.txt"
        out_file.write_text(prompt)
        size_kb = len(prompt) // 1024
        print(f"  Agent {page['id']} ({page['name']}): {size_kb}KB -> {out_file.name}")
    print("Done. Run: bash scripts/run-page-agents.sh")
