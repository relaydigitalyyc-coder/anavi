#!/usr/bin/env python3
import os
import sys
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor

# High-IQ Autonomous Evolution Engine for ANAVI
# Powered by Gemini CLI Subagents

PROJECT_ROOT = "/home/ariel/Documents/anavi-main/anavi"
DOCS_DIR = os.path.join(PROJECT_ROOT, "docs")
OPS_DIR = os.path.join(DOCS_DIR, "ops")
TODO_BOARD = os.path.join(OPS_DIR, "TODO_BOARD.md")
CODEX_HISTORY = os.path.expanduser("~/.codex/history.jsonl")
CLAUDE_HISTORY = os.path.expanduser("~/.claude/history.jsonl")

def read_file_safe(file_path, tail_lines=None):
    if not os.path.exists(file_path):
        return ""
    try:
        if tail_lines:
            with open(file_path, "r") as f:
                lines = f.readlines()
                return "".join(lines[-tail_lines:])
        else:
            with open(file_path, "r") as f:
                return f.read()
    except Exception as e:
        return f"[Error reading {file_path}: {e}]"

def call_gemini_orchestrator(prompt):
    """Uses Gemini CLI headlessly to generate the next wave of tasks."""
    print("\n🧠 [Orchestrator] Consulting Gemini for next-gen architecture wave...")
    cmd = [
        "gemini", 
        prompt, 
        "--output-format", "json", 
        "--approval-mode", "yolo"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
        if result.returncode != 0:
            print(f"❌ [Orchestrator] Gemini CLI failed:\n{result.stderr}")
            return None
            
        # Parse output format
        out_data = json.loads(result.stdout)
        response_text = out_data.get("response", "")
        
        # Extract JSON from the response text
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()
            
        tasks = json.loads(json_str)
        # Handle wrapping
        if isinstance(tasks, dict) and "tasks" in tasks:
            return tasks["tasks"]
        elif isinstance(tasks, dict):
            for k, v in tasks.items():
                if isinstance(v, list):
                    return v
        return tasks
    except Exception as e:
        print(f"❌ [Orchestrator] Error parsing Gemini response: {e}")
        return None

def execute_agent_task(args):
    """Executes a single agent task using Gemini CLI."""
    task, all_tasks = args
    name = task.get("name", "agent-unknown")
    instruction = task.get("task", "")
    
    # Generate peer awareness string
    peer_tasks = [t for t in all_tasks if t.get("name") != name]
    peer_context = "\n".join([f"- {t.get('name')}: {t.get('task')}" for t in peer_tasks])
    
    print(f"🚀 [{name}] Launching Gemini subagent for task: {instruction[:60]}...")
    
    # We prefix the prompt to ensure the agent acts autonomously and knows its boundaries
    full_prompt = (
        f"You are {name}, a specialized 160-IQ autonomous engineering subagent working on the ANAVI project. "
        f"Context: Project is in {PROJECT_ROOT}. "
        f"Task: {instruction}\n"
        "--- SWARM AWARENESS ---\n"
        "Your peer agents are currently working on the following tasks concurrently. "
        "DO NOT modify the same files or step on their logic:\n"
        f"{peer_context}\n"
        "-----------------------\n"
        "Rules:\n"
        "1. Prioritize codebase intelligence (use codebase_investigator if needed).\n"
        "2. Make surgical, robust edits.\n"
        "3. Run 'pnpm check' and 'pnpm test' to verify your specific changes if applicable.\n"
        "4. Do NOT commit changes to git. The orchestrator will handle commits."
    )
    
    cmd = [
        "gemini", 
        full_prompt, 
        "--approval-mode", "yolo",
        "--output-format", "json"
    ]
    
    try:
        # We run it synchronously within this thread. The ThreadPoolExecutor handles parallelism.
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
        
        log_path = f"/tmp/{name}_execution.log"
        with open(log_path, "w") as f:
            f.write("STDOUT:\n" + result.stdout + "\nSTDERR:\n" + result.stderr)
            
        if result.returncode == 0:
            print(f"✅ [{name}] Completed successfully. Log: {log_path}")
            return True
        else:
            print(f"⚠️ [{name}] Encountered errors. Log: {log_path}")
            return False
    except Exception as e:
        print(f"❌ [{name}] Execution failed: {e}")
        return False

def generate_wave():
    todo = read_file_safe(TODO_BOARD)
    whitepaper = read_file_safe(os.path.join(PROJECT_ROOT, "whitepaper_analysis.md"), tail_lines=150)
    codex_mem = read_file_safe(CODEX_HISTORY, tail_lines=30)
    claude_mem = read_file_safe(CLAUDE_HISTORY, tail_lines=30)
    
    prompt = f"""
    You are the Master Architect of the ANAVI project. You possess a 160 IQ and deep systems engineering expertise.
    Your objective is to drive the project to production readiness by aggressively clearing the TODO_BOARD and implementing core whitepaper features.
    
    TODO BOARD:
    {todo}
    
    RECENT AGENT MEMORY (CODEX/CLAUDE):
    {codex_mem}
    {claude_mem}
    
    Analyze the current state. We need to parallelize work across 4 independent Gemini subagents.
    Generate exactly 4 non-overlapping, highly specific tasks.
    Focus on: R8 Project Logic Integrity, DocuSign integrations, Remotion Asset distribution, or Backend telemetry.
    Prevent git conflicts by assigning completely different files/directories to each agent.
    
    Output ONLY a valid JSON array of 4 objects. 
    Format:
    [
      {{"name": "agent-r8-dashboard", "task": "Update X and Y to enforce... Ensure you test with pnpm..."}},
      ...
    ]
    """
    
    return call_gemini_orchestrator(prompt)

def verify_and_commit():
    print("\n🧪 [CI] Running verification suite...")
    check = subprocess.run(["pnpm", "check"], cwd=PROJECT_ROOT, capture_output=True, text=True)
    
    if check.returncode == 0:
        print("✅ [CI] Type check passed. Committing changes...")
        subprocess.run(["git", "add", "."], cwd=os.path.dirname(PROJECT_ROOT))
        subprocess.run(["git", "commit", "-m", "feat(auto): autonomous gemini swarm wave completed (160 IQ)"], cwd=os.path.dirname(PROJECT_ROOT))
    else:
        print("❌ [CI] Type check failed. Committing broken state for the next wave to fix.")
        subprocess.run(["git", "add", "."], cwd=os.path.dirname(PROJECT_ROOT))
        subprocess.run(["git", "commit", "-m", "chore(auto): gemini swarm wave resulted in failing types (needs fix)"], cwd=os.path.dirname(PROJECT_ROOT))

def main():
    print("🌌 Starting ANAVI High-IQ Continuous Evolution Engine (Gemini Subagents)")
    
    iteration = 1
    while True:
        print(f"\n{'='*60}")
        print(f"🚀 EVOLUTION ITERATION {iteration} - NO SLEEP, PURE PROPAGATION")
        print(f"{'='*60}")
        
        tasks = generate_wave()
        if not tasks or not isinstance(tasks, list):
            print("⚠️ Failed to generate valid tasks. Retrying immediately...")
            continue
            
        print(f"🌊 Dispatching {len(tasks)} parallel Gemini subagents...")
        
        # Run the Gemini agents concurrently
        task_args = [(t, tasks) for t in tasks]
        with ThreadPoolExecutor(max_workers=len(tasks)) as executor:
            results = list(executor.map(execute_agent_task, task_args))
            
        success_count = sum(1 for r in results if r)
        print(f"🏁 Swarm completed: {success_count}/{len(tasks)} agents reported success.")
        
        verify_and_commit()
        iteration += 1

if __name__ == "__main__":
    main()
