#!/usr/bin/env python3
"""
DeepSeek coding agent with tool loop.
Usage:
  python3 ds-agent.py "your task here"
  echo "your task" | python3 ds-agent.py
  python3 ds-agent.py --file task.txt

Set DEEPSEEK_API_KEY env var or pass --key flag.
Working directory defaults to the anavi project root.
"""

import sys
import os
import json
import subprocess
import glob as glob_module
import re
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any

# ── Config ──────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.parent / "anavi"
API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"          # swap to "deepseek-reasoner" for hard tasks
MAX_TURNS = 30
MAX_OUTPUT_CHARS = 8000          # truncate long bash output

SYSTEM_PROMPT = """You are an expert full-stack TypeScript engineer working on ANAVI, a B2B relationship intelligence platform.

Stack: React 19, Vite, wouter, tRPC v11, Express, Drizzle ORM (MySQL/TiDB), shadcn/ui, Tailwind 4.

Project root: {root}

Key conventions:
- All commands run from `anavi/` subdirectory
- `pnpm check` = TypeScript check, `pnpm test` = vitest
- Routes in client/src/App.tsx (39 routes), ShellRoute wraps all main pages
- DB modules in server/db/*.ts, routers in server/routers/*.ts
- Shared types in shared/types.ts, schema in drizzle/schema.ts

Work methodically: read before editing, make minimal changes, verify with pnpm check after.
""".format(root=PROJECT_ROOT)

# ── Tool definitions ─────────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a file's contents. Returns file content with line numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute or project-relative path"},
                    "offset": {"type": "integer", "description": "Start line (1-indexed, optional)"},
                    "limit": {"type": "integer", "description": "Max lines to read (optional)"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write (overwrite) a file with new content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Replace an exact string in a file. old_string must be unique in the file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "old_string": {"type": "string", "description": "Exact text to find and replace"},
                    "new_string": {"type": "string", "description": "Replacement text"},
                },
                "required": ["path", "old_string", "new_string"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": "Run a shell command. cwd defaults to project root (anavi/).",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string"},
                    "cwd": {"type": "string", "description": "Working directory (optional)"},
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "glob",
            "description": "Find files matching a glob pattern.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "Glob pattern e.g. 'client/src/**/*.tsx'"},
                    "root": {"type": "string", "description": "Search root (optional, defaults to project root)"},
                },
                "required": ["pattern"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "grep",
            "description": "Search file contents with a regex pattern.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "Regex pattern"},
                    "path": {"type": "string", "description": "File or directory to search"},
                    "file_glob": {"type": "string", "description": "File filter e.g. '*.tsx' (optional)"},
                    "context": {"type": "integer", "description": "Lines of context around match (optional)"},
                },
                "required": ["pattern", "path"],
            },
        },
    },
]

# ── Tool execution ────────────────────────────────────────────────────────────

def resolve_path(path: str) -> Path:
    p = Path(path)
    if p.is_absolute():
        return p
    return PROJECT_ROOT / path


def tool_read_file(path: str, offset: int = None, limit: int = None) -> str:
    try:
        p = resolve_path(path)
        lines = p.read_text(encoding="utf-8").splitlines()
        start = (offset - 1) if offset else 0
        end = (start + limit) if limit else len(lines)
        chunk = lines[start:end]
        return "\n".join(f"{start+i+1}\t{line}" for i, line in enumerate(chunk))
    except Exception as e:
        return f"ERROR: {e}"


def tool_write_file(path: str, content: str) -> str:
    try:
        p = resolve_path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return f"Written {len(content)} chars to {p}"
    except Exception as e:
        return f"ERROR: {e}"


def tool_edit_file(path: str, old_string: str, new_string: str) -> str:
    try:
        p = resolve_path(path)
        content = p.read_text(encoding="utf-8")
        count = content.count(old_string)
        if count == 0:
            return "ERROR: old_string not found in file"
        if count > 1:
            return f"ERROR: old_string found {count} times — must be unique. Add more context."
        p.write_text(content.replace(old_string, new_string, 1), encoding="utf-8")
        return f"Replaced 1 occurrence in {p}"
    except Exception as e:
        return f"ERROR: {e}"


def tool_bash(command: str, cwd: str = None) -> str:
    try:
        wd = resolve_path(cwd) if cwd else PROJECT_ROOT
        result = subprocess.run(
            command, shell=True, cwd=wd,
            capture_output=True, text=True, timeout=60
        )
        out = result.stdout + result.stderr
        if len(out) > MAX_OUTPUT_CHARS:
            out = out[:MAX_OUTPUT_CHARS] + f"\n... [truncated, {len(out)} total chars]"
        return out or "(no output)"
    except subprocess.TimeoutExpired:
        return "ERROR: command timed out (60s)"
    except Exception as e:
        return f"ERROR: {e}"


def tool_glob(pattern: str, root: str = None) -> str:
    try:
        base = resolve_path(root) if root else PROJECT_ROOT
        matches = sorted(glob_module.glob(str(base / pattern), recursive=True))
        if not matches:
            return "(no matches)"
        return "\n".join(str(Path(m).relative_to(PROJECT_ROOT)) for m in matches[:200])
    except Exception as e:
        return f"ERROR: {e}"


def tool_grep(pattern: str, path: str, file_glob: str = None, context: int = 0) -> str:
    try:
        cmd = ["grep", "-rn", "--color=never"]
        if context:
            cmd += [f"-C{context}"]
        if file_glob:
            cmd += ["--include", file_glob]
        cmd += [pattern, str(resolve_path(path))]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        out = result.stdout
        if len(out) > MAX_OUTPUT_CHARS:
            out = out[:MAX_OUTPUT_CHARS] + "\n... [truncated]"
        return out or "(no matches)"
    except Exception as e:
        return f"ERROR: {e}"


TOOL_FN_MAP = {
    "read_file": tool_read_file,
    "write_file": tool_write_file,
    "edit_file": tool_edit_file,
    "bash": tool_bash,
    "glob": tool_glob,
    "grep": tool_grep,
}


def execute_tool(name: str, args: dict) -> str:
    fn = TOOL_FN_MAP.get(name)
    if not fn:
        return f"ERROR: unknown tool {name}"
    return fn(**args)

# ── DeepSeek API ──────────────────────────────────────────────────────────────

def chat(messages: list, api_key: str) -> dict:
    payload = json.dumps({
        "model": MODEL,
        "messages": messages,
        "tools": TOOLS,
        "tool_choice": "auto",
        "max_tokens": 4096,
    }).encode()
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"HTTP {e.code}: {body}")

# ── Agent loop ────────────────────────────────────────────────────────────────

def run_agent(task: str, api_key: str, verbose: bool = True) -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": task},
    ]

    if verbose:
        print(f"\n{'='*60}", flush=True)
        print(f"TASK: {task[:200]}", flush=True)
        print('='*60, flush=True)

    for turn in range(MAX_TURNS):
        if verbose:
            print(f"\n[turn {turn+1}] calling DeepSeek...", flush=True)

        response = chat(messages, api_key)
        choice = response["choices"][0]
        msg = choice["message"]
        messages.append(msg)

        # Extract text content if any
        content = msg.get("content") or ""
        if content and verbose:
            print(f"\n[assistant] {content[:500]}", flush=True)

        # Check for tool calls
        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            # Done
            if verbose:
                print(f"\n{'='*60}", flush=True)
                print("DONE", flush=True)
            return content

        # Execute each tool call
        for tc in tool_calls:
            fn_name = tc["function"]["name"]
            fn_args = json.loads(tc["function"]["arguments"])
            if verbose:
                print(f"\n  → {fn_name}({json.dumps(fn_args)[:120]})", flush=True)
            result = execute_tool(fn_name, fn_args)
            if verbose:
                preview = result[:300].replace("\n", "\\n")
                print(f"    ← {preview}", flush=True)
            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": result,
            })

    return "ERROR: max turns reached"

# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="DeepSeek coding agent")
    parser.add_argument("task", nargs="?", help="Task description")
    parser.add_argument("--file", "-f", help="Read task from file")
    parser.add_argument("--key", "-k", help="DeepSeek API key (or set DEEPSEEK_API_KEY)")
    parser.add_argument("--quiet", "-q", action="store_true", help="Only print final result")
    parser.add_argument("--model", "-m", default=MODEL, help=f"Model name (default: {MODEL})")
    args = parser.parse_args()

    # Resolve API key
    api_key = args.key or os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        # Check ~/.deepseek
        key_file = Path.home() / ".deepseek"
        if key_file.exists():
            api_key = key_file.read_text().strip()
    if not api_key:
        print("ERROR: No API key. Set DEEPSEEK_API_KEY, use --key, or put key in ~/.deepseek", file=sys.stderr)
        sys.exit(1)

    # Resolve task
    if args.file:
        task = Path(args.file).read_text().strip()
    elif args.task:
        task = args.task
    elif not sys.stdin.isatty():
        task = sys.stdin.read().strip()
    else:
        print("ERROR: provide a task via argument, --file, or stdin", file=sys.stderr)
        sys.exit(1)

    global MODEL
    MODEL = args.model

    result = run_agent(task, api_key, verbose=not args.quiet)
    if args.quiet:
        print(result)


if __name__ == "__main__":
    main()
