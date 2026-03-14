#!/usr/bin/env python3
import os, sys, json, subprocess, argparse, fnmatch
import urllib.request
import urllib.error

# Tool implementations
def read_file(path, offset=1, limit=None):
    try:
        with open(path, "r") as f:
            lines = f.readlines()
            start = max(0, offset - 1)
            end = len(lines) if limit is None else min(len(lines), start + limit)
            result = "".join(f"{i+1:4d} | {lines[i]}" for i in range(start, end))
            return result
    except Exception as e:
        return f"Error: {e}"

def write_file(path, content):
    try:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return "Success"
    except Exception as e:
        return f"Error: {e}"

def edit_file(path, old_string, new_string):
    try:
        with open(path, "r") as f:
            content = f.read()
        if content.count(old_string) == 0:
            return "Error: old_string not found."
        if content.count(old_string) > 1:
            return "Error: old_string is ambiguous (multiple matches)."
        content = content.replace(old_string, new_string)
        with open(path, "w") as f:
            f.write(content)
        return "Success"
    except Exception as e:
        return f"Error: {e}"

def bash(command, cwd="."):
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, text=True, capture_output=True, timeout=60)
        out = result.stdout + result.stderr
        if len(out) > 8000:
            out = out[:8000] + "\n... (truncated)"
        return out if out else "Success (no output)"
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 60 seconds"
    except Exception as e:
        return f"Error: {e}"

def glob_search(pattern, root="."):
    matches = []
    for dirpath, dirnames, filenames in os.walk(root):
        if ".git" in dirpath.split(os.sep) or "node_modules" in dirpath.split(os.sep):
            continue
        for filename in fnmatch.filter(filenames, pattern):
            matches.append(os.path.join(dirpath, filename))
    return "\n".join(matches) if matches else "No matches found"

def grep(pattern, path=".", file_glob="*", context=0):
    cmd = f"grep -rn -C {context} '{pattern}' {path} --include='{file_glob}'"
    return bash(cmd)

tools = {
    "read_file": read_file,
    "write_file": write_file,
    "edit_file": edit_file,
    "bash": bash,
    "glob": glob_search,
    "grep": grep
}

tool_definitions = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read file contents with line numbers",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "offset": {"type": "integer", "description": "1-based line number"},
                    "limit": {"type": "integer"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write new content to a file",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "Replace exact string in file. Must be unique match.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "old_string": {"type": "string"},
                    "new_string": {"type": "string"}
                },
                "required": ["path", "old_string", "new_string"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": "Run shell command",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string"},
                    "cwd": {"type": "string", "default": "."}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "glob",
            "description": "Search files by glob pattern",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string"},
                    "root": {"type": "string", "default": "."}
                },
                "required": ["pattern"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "grep",
            "description": "Search text in files",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string"},
                    "path": {"type": "string", "default": "."},
                    "file_glob": {"type": "string", "default": "*"},
                    "context": {"type": "integer", "default": 0}
                },
                "required": ["pattern"]
            }
        }
    }
]

def get_api_key(args):
    if args.key: return args.key
    if "DEEPSEEK_API_KEY" in os.environ: return os.environ["DEEPSEEK_API_KEY"]
    key_file = os.path.expanduser("~/.deepseek")
    if os.path.exists(key_file):
        with open(key_file, "r") as f:
            return f.read().strip()
    return None

def call_deepseek(messages, api_key, model):
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": model,
        "messages": messages,
        "tools": tool_definitions,
        "tool_choice": "auto"
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"API Error: {e.code} - {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("task", help="Instruction for the agent")
    parser.add_argument("--name", default="agent", help="Agent name")
    parser.add_argument("--model", default="deepseek-chat", help="Model to use")
    parser.add_argument("--key", help="DeepSeek API key")
    parser.add_argument("--quiet", action="store_true", help="Only print final result")
    args = parser.parse_args()

    api_key = get_api_key(args)
    if not api_key:
        print("Error: DeepSeek API key not found. Set DEEPSEEK_API_KEY or use ds-keystore.py", file=sys.stderr)
        sys.exit(1)

    system_prompt = (
        "You are an autonomous coding agent working on the ANAVI project. "
        "You have access to tools to read files, search, and edit code or run bash commands. "
        "Work iteratively: read necessary files, plan your changes, apply them, and verify with tools. "
        "When finished, summarize your changes and state that you are done."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": args.task}
    ]

    print(f"[{args.name}] Starting task...")
    
    turns = 0
    while turns < 30:
        turns += 1
        response = call_deepseek(messages, api_key, args.model)
        message = response["choices"][0]["message"]
        messages.append(message)
        
        if message.get("content"):
            if not args.quiet:
                print(f"[{args.name}] Assistant: {message['content']}")
        
        if "tool_calls" in message and message["tool_calls"]:
            for tool_call in message["tool_calls"]:
                func_name = tool_call["function"]["name"]
                try:
                    kwargs = json.loads(tool_call["function"]["arguments"])
                except:
                    kwargs = {}
                
                if not args.quiet:
                    print(f"[{args.name}] Calling {func_name}({kwargs})")
                
                if func_name in tools:
                    result = tools[func_name](**kwargs)
                else:
                    result = f"Error: Unknown tool {func_name}"
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": str(result)
                })
        else:
            print(f"[{args.name}] Finished.")
            break

    if turns >= 30:
        print(f"[{args.name}] Error: Reached maximum turns (30).")

if __name__ == "__main__":
    main()
