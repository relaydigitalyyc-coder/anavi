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

python3 - << 'PYEOF'
import json, pathlib

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
        upgraded[name] = tsx[:8000]
    except Exception as e:
        upgraded[name] = f'[error reading: {e}]'

copy_ts = (ANAVI_ROOT / 'client/src/lib/copy.ts').read_text()

sections = '\n\n'.join(
    f'=== {name}.tsx (first 8000 chars) ===\n{content}'
    for name, content in upgraded.items()
)

synthesis_task = """
You are Agent 7 - the synthesis and consistency checker.

You will receive the upgraded TSX content of 6 pages. Identify any remaining
cross-page inconsistencies and produce a list of small targeted corrections.

Do NOT rewrite any full file. Produce precise edits only:
each edit has a file, an old_string (exact, unique in the file), and a new_string.

Check for:
1. Terminology -- "Blind Match" not "AI Match"; "Custodied" not "Protected"; "Attribution Chain" consistent.
2. Color -- gold CTAs #C4972A, trust green #059669.
3. Empty states -- all pages handle empty tRPC gracefully.
4. Animation patterns -- FadeInView / StaggerContainer used consistently.

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
