#!/usr/bin/env python3
import os, sys, json, threading, subprocess

def run_agent(task, model):
    name = task.get("name", "unknown")
    instruction = task.get("task", "")
    output_file = f"/tmp/ds-swarm-{name}.txt"
    print(f"[{name}] Starting task: {instruction[:50]}...")
    
    cmd = [
        sys.executable, "scripts/ds-agent.py",
        "--model", model,
        "--name", name,
        instruction
    ]
    
    try:
        with open(output_file, "w") as out:
            subprocess.run(cmd, stdout=out, stderr=subprocess.STDOUT, check=True)
        print(f"[{name}] Completed successfully. Output in {output_file}")
    except subprocess.CalledProcessError:
        print(f"[{name}] FAILED. Check {output_file}")

def main():
    if len(sys.argv) < 2:
        print("Usage: ds-swarm.py <tasks.json> [--model <model>]")
        sys.exit(1)
        
    tasks_file = sys.argv[1]
    model = "deepseek-chat"
    if "--model" in sys.argv:
        idx = sys.argv.index("--model")
        model = sys.argv[idx+1]
        
    if tasks_file == "--tasks":
        tasks_json = sys.argv[2]
        tasks = json.loads(tasks_json)
    else:
        with open(tasks_file, "r") as f:
            tasks = json.load(f)
            
    threads = []
    for t in tasks:
        th = threading.Thread(target=run_agent, args=(t, model))
        threads.append(th)
        th.start()
        
    for th in threads:
        th.join()
        
    print("Swarm execution finished.")

if __name__ == "__main__":
    main()
