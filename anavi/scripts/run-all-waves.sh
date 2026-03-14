#!/bin/bash
# Orchestration script for ANAVI Agent Swarm (4 Waves, 40 Agents)

set -e

echo "🌊 ANAVI Agent Swarm Orchestrator"
echo "================================="

# Ensure DeepSeek API Key is available
if [ -z "$DEEPSEEK_API_KEY" ]; then
  echo "⚠️  DEEPSEEK_API_KEY environment variable is not set."
  echo "Please set it before running this script: export DEEPSEEK_API_KEY=your_key"
  exit 1
fi

# Function to run a wave and check for errors
run_wave() {
  local wave_file=$1
  local wave_name=$(basename "$wave_file" .json)
  
  echo "🚀 Launching $wave_name (10 concurrent agents)..."
  python3 scripts/ds-swarm.py "$wave_file"
  
  echo "✅ $wave_name completed."
  echo "Checking for errors in /tmp/ds-swarm-*.txt..."
  if grep -l "ERROR\|FAILED" /tmp/ds-swarm-*.txt > /dev/null 2>&1; then
    echo "⚠️  Some agents reported errors. Please review /tmp/ds-swarm-*.txt"
    echo "Press Enter to continue to the next wave, or Ctrl+C to abort and fix."
    read -r
  else
    echo "🎉 All agents in $wave_name succeeded."
  fi
  
  echo "🧪 Running tests before proceeding..."
  pnpm check || { echo "❌ Type check failed after $wave_name"; exit 1; }
  pnpm test || { echo "❌ Tests failed after $wave_name"; exit 1; }
  
  echo "💾 Committing changes for $wave_name..."
  git add .
  git commit -m "feat: complete $wave_name implementation via agent swarm"
  
  echo "---------------------------------"
}

# Navigate to the correct directory
cd "$(dirname "$0")/.." || exit 1

# Execute waves sequentially
run_wave "scripts/swarm-wave-1.json"
run_wave "scripts/swarm-wave-2.json"
run_wave "scripts/swarm-wave-3.json"
run_wave "scripts/swarm-wave-4.json"

echo "🎯 All 4 agent waves (40 tasks) have been successfully orchestrated and deployed."
