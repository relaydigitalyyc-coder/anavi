#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/codex-mcp-fanout.sh --goal "your objective" [--servers s1,s2,s3] [--model MODEL] [--reasoning LEVEL]

Description:
  Fan-out/fan-in orchestration for Codex + MCP:
  1) Spawns parallel Codex workers (one per MCP focus/server)
  2) Collects each worker's report
  3) Runs a synthesis Codex pass that merges all reports

Options:
  --goal      Required. The shared objective for all workers.
  --servers   Optional comma-separated server names.
              Default: all enabled MCP servers from `codex mcp list`.
  --model     Optional model name passed to `codex exec --model` (default: gpt-5).
  --reasoning Optional reasoning effort passed via `-c model_reasoning_effort=...`
              (default: high).
  --help      Show this help.

Example:
  bash scripts/codex-mcp-fanout.sh \
    --goal "Audit deployment risk, architecture drift, and docs gaps" \
    --servers "github,context7,pencil"
EOF
}

GOAL=""
SERVERS_CSV=""
MODEL="gpt-5"
REASONING_EFFORT="high"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --goal)
      GOAL="${2:-}"
      shift 2
      ;;
    --servers)
      SERVERS_CSV="${2:-}"
      shift 2
      ;;
    --model)
      MODEL="${2:-}"
      shift 2
      ;;
    --reasoning)
      REASONING_EFFORT="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$GOAL" ]]; then
  echo "Error: --goal is required." >&2
  usage
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/scripts/outputs/codex-mcp-fanout-$RUN_ID"
mkdir -p "$OUT_DIR"

if [[ -n "$SERVERS_CSV" ]]; then
  IFS=',' read -r -a SERVERS <<<"$SERVERS_CSV"
else
  mapfile -t SERVERS < <(
    codex mcp list \
      | awk 'NR>1 && $6=="enabled" {print $1}'
  )
fi

if [[ "${#SERVERS[@]}" -eq 0 ]]; then
  echo "No enabled MCP servers found. Check: codex mcp list" >&2
  exit 1
fi

COMMON_ARGS=(exec --sandbox read-only --skip-git-repo-check --cd "$ROOT_DIR")
if [[ -n "$MODEL" ]]; then
  COMMON_ARGS+=(--model "$MODEL")
fi
if [[ -n "$REASONING_EFFORT" ]]; then
  COMMON_ARGS+=(-c "model_reasoning_effort=\"$REASONING_EFFORT\"")
fi

echo "Run directory: $OUT_DIR"
echo "Goal: $GOAL"
echo "Servers: ${SERVERS[*]}"
echo ""
echo "Launching parallel Codex workers..."

PIDS=()
WORKER_FILES=()

for server in "${SERVERS[@]}"; do
  server_trimmed="$(echo "$server" | xargs)"
  [[ -z "$server_trimmed" ]] && continue

  prompt_file="$OUT_DIR/prompt-$server_trimmed.txt"
  output_file="$OUT_DIR/worker-$server_trimmed.md"

  cat > "$prompt_file" <<EOF
You are a focused Codex worker.

Objective:
$GOAL

MCP focus:
$server_trimmed

Constraints:
- Prioritize MCP tools from "$server_trimmed".
- Read-only analysis only. Do not edit files or run destructive commands.
- Keep output concise and high-signal.

Return EXACTLY this markdown structure:

## Server
$server_trimmed

## Findings
- 5 to 8 concrete findings

## Risks
- 0 to 3 key risks

## Actions
- 3 to 5 recommended actions

## Confidence
- One number 0.00 to 1.00 with one short sentence.
EOF

  codex "${COMMON_ARGS[@]}" -o "$output_file" "$(cat "$prompt_file")" >"$OUT_DIR/log-$server_trimmed.txt" 2>&1 &
  PIDS+=("$!")
  WORKER_FILES+=("$output_file")
  echo "  launched: $server_trimmed (pid ${PIDS[-1]})"
done

echo ""
echo "Waiting for workers..."
FAILED=0
for i in "${!PIDS[@]}"; do
  pid="${PIDS[$i]}"
  worker_file="${WORKER_FILES[$i]}"
  server_name="$(basename "$worker_file" | sed -E 's/^worker-(.*)\.md/\1/')"
  if wait "$pid"; then
    echo "  ok: $server_name"
  else
    echo "  failed: $server_name (see $OUT_DIR/log-$server_name.txt)" >&2
    FAILED=1
  fi
done

if [[ "$FAILED" -ne 0 ]]; then
  echo ""
  echo "One or more workers failed. Inspect logs in:"
  echo "  $OUT_DIR"
  exit 1
fi

echo ""
echo "Building synthesis prompt..."
SYNTH_PROMPT="$OUT_DIR/prompt-synthesis.txt"
SYNTH_OUTPUT="$OUT_DIR/synthesis.md"

{
  cat <<EOF
You are the synthesis pass for parallel Codex MCP workers.

Global objective:
$GOAL

Merge the worker reports below into a single actionable output.

Requirements:
- De-duplicate overlapping findings.
- Resolve contradictions explicitly.
- Produce one prioritized action list with owners.
- Highlight cross-MCP insights (where one server's signal confirms/challenges another).

Return EXACTLY this markdown structure:

## Unified Findings
- 8 to 12 bullets

## Cross-Checks
- 3 to 6 bullets explaining confirmation/contradiction between sources

## Priority Plan
- 1. ...
- 2. ...
- 3. ...

## Fast Wins (24h)
- 3 to 5 bullets

## Deep Work (7d)
- 3 to 5 bullets

---
Worker reports:
EOF
  echo ""
  for file in "${WORKER_FILES[@]}"; do
    echo "### $(basename "$file")"
    cat "$file"
    echo ""
  done
} > "$SYNTH_PROMPT"

echo "Running synthesis worker..."
codex "${COMMON_ARGS[@]}" -o "$SYNTH_OUTPUT" "$(cat "$SYNTH_PROMPT")" >"$OUT_DIR/log-synthesis.txt" 2>&1

echo ""
echo "Done."
echo "Worker outputs:"
for file in "${WORKER_FILES[@]}"; do
  echo "  $file"
done
echo "Synthesis:"
echo "  $SYNTH_OUTPUT"
