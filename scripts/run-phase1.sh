#!/bin/bash
# Runs all 8 Phase 1 agents in parallel

ROOT="/home/ariel/Documents/anavi-main"
AGENTS="$ROOT/scripts/agents"
OUTPUTS="$ROOT/scripts/outputs"
mkdir -p "$OUTPUTS"

echo "=== ANAVI UI Wiring Swarm — Phase 1 (8 agents parallel) ==="
echo "Started: $(date)"

run_agent() {
  local n=$1
  local name=$2
  local start=$(date +%s)
  echo "[Agent $n: $name] Starting..."

  bash "$ROOT/scripts/gemini-agent.sh" \
    "$AGENTS/agent${n}-${name}.txt" \
    "$OUTPUTS/agent${n}-${name}.json"

  local exit_code=$?
  local end=$(date +%s)
  local elapsed=$((end - start))

  if [ $exit_code -eq 0 ]; then
    echo "[Agent $n: $name] DONE in ${elapsed}s"
  else
    echo "[Agent $n: $name] FAILED (exit $exit_code) in ${elapsed}s"
  fi
  return $exit_code
}

# Launch all 8 in parallel
run_agent 1 "dashboard-intelligence" &
PID1=$!
run_agent 2 "navigation" &
PID2=$!
run_agent 3 "tour-integrity" &
PID3=$!
run_agent 4 "demo-data" &
PID4=$!
run_agent 5 "copy-audit" &
PID5=$!
run_agent 6 "page-inventory" &
PID6=$!
run_agent 7 "typescript" &
PID7=$!
run_agent 8 "onboarding" &
PID8=$!

echo "All 8 agents launched. Waiting for completion..."

# Wait and collect exit codes
wait $PID1; E1=$?
wait $PID2; E2=$?
wait $PID3; E3=$?
wait $PID4; E4=$?
wait $PID5; E5=$?
wait $PID6; E6=$?
wait $PID7; E7=$?
wait $PID8; E8=$?

echo ""
echo "=== Phase 1 Complete: $(date) ==="
echo ""

# Summary
agents=(
  "1:dashboard-intelligence:$E1"
  "2:navigation:$E2"
  "3:tour-integrity:$E3"
  "4:demo-data:$E4"
  "5:copy-audit:$E5"
  "6:page-inventory:$E6"
  "7:typescript:$E7"
  "8:onboarding:$E8"
)

all_ok=true
for entry in "${agents[@]}"; do
  IFS=':' read -r n name code <<< "$entry"
  if [ "$code" -eq 0 ]; then
    size=$(wc -c < "$OUTPUTS/agent${n}-${name}.json" 2>/dev/null || echo "0")
    echo "  ✓ Agent $n ($name): OK — ${size} bytes"
  else
    echo "  ✗ Agent $n ($name): FAILED (exit $code)"
    all_ok=false
  fi
done

echo ""
echo "Outputs in: $OUTPUTS/"
ls -la "$OUTPUTS/"

if $all_ok; then
  echo ""
  echo "All agents succeeded. Ready for Phase 2."
  exit 0
else
  echo ""
  echo "Some agents failed. Check outputs above."
  exit 1
fi
