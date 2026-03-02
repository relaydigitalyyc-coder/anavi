#!/usr/bin/env python3
"""
Run multiple DeepSeek agents in parallel.

Usage:
  python3 ds-swarm.py tasks.json
  python3 ds-swarm.py --tasks '["Fix X", "Fix Y", "Fix Z"]'

tasks.json format:
  [
    {"name": "fix-ts-errors", "task": "Fix TS errors in CustodyRegister.tsx..."},
    {"name": "fix-funnel",    "task": "Audit the core funnel..."},
    {"name": "fix-demo",      "task": "Fix demo mode links..."}
  ]

  OR a plain array of strings:
  ["Fix X in foo.ts", "Fix Y in bar.ts"]

Results are written to /tmp/ds-swarm-<name>.txt
"""

import sys
import os
import json
import threading
import time
import argparse
from pathlib import Path

# Import agent runner from same directory
sys.path.insert(0, str(Path(__file__).parent))
from ds_agent import run_agent  # ds-agent.py imported as ds_agent


def run_one(name: str, task: str, api_key: str, results: dict, lock: threading.Lock):
    out_file = Path(f"/tmp/ds-swarm-{name}.txt")
    start = time.time()
    try:
        print(f"[{name}] starting...", flush=True)
        result = run_agent(task, api_key, verbose=False)
        elapsed = time.time() - start
        out_file.write_text(f"=== {name} ({elapsed:.1f}s) ===\n\n{result}\n")
        with lock:
            results[name] = {"status": "ok", "elapsed": elapsed, "file": str(out_file)}
        print(f"[{name}] done in {elapsed:.1f}s → {out_file}", flush=True)
    except Exception as e:
        elapsed = time.time() - start
        msg = f"ERROR: {e}"
        out_file.write_text(f"=== {name} FAILED ({elapsed:.1f}s) ===\n\n{msg}\n")
        with lock:
            results[name] = {"status": "error", "error": str(e), "file": str(out_file)}
        print(f"[{name}] FAILED in {elapsed:.1f}s: {e}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Parallel DeepSeek agent swarm")
    parser.add_argument("tasks_file", nargs="?", help="JSON file with tasks array")
    parser.add_argument("--tasks", "-t", help="Inline JSON tasks array")
    parser.add_argument("--key", "-k", help="DeepSeek API key")
    parser.add_argument("--model", "-m", default="deepseek-chat")
    args = parser.parse_args()

    # Resolve API key
    api_key = args.key or os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        key_file = Path.home() / ".deepseek"
        if key_file.exists():
            api_key = key_file.read_text().strip()
    if not api_key:
        print("ERROR: No API key. Set DEEPSEEK_API_KEY, use --key, or put key in ~/.deepseek")
        sys.exit(1)

    # Set model
    import ds_agent as da
    da.MODEL = args.model

    # Load tasks
    raw = None
    if args.tasks:
        raw = json.loads(args.tasks)
    elif args.tasks_file:
        raw = json.loads(Path(args.tasks_file).read_text())
    else:
        print("ERROR: provide tasks via file or --tasks")
        sys.exit(1)

    # Normalize to list of {name, task}
    tasks = []
    for i, item in enumerate(raw):
        if isinstance(item, str):
            tasks.append({"name": f"agent-{i+1}", "task": item})
        else:
            tasks.append(item)

    print(f"\nDispatching {len(tasks)} agents in parallel...\n")

    results = {}
    lock = threading.Lock()
    threads = []

    for t in tasks:
        th = threading.Thread(
            target=run_one,
            args=(t["name"], t["task"], api_key, results, lock),
            daemon=True,
        )
        threads.append(th)
        th.start()

    for th in threads:
        th.join()

    print("\n" + "="*60)
    print("SWARM COMPLETE")
    print("="*60)
    for name, r in results.items():
        status = "✓" if r["status"] == "ok" else "✗"
        print(f"  {status} {name}: {r.get('elapsed', 0):.1f}s → {r['file']}")
    print()


if __name__ == "__main__":
    main()
