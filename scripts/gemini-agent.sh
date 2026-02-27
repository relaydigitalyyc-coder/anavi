#!/bin/bash
# Usage: ./scripts/gemini-agent.sh <prompt-file> <output-file>
# Calls Gemini 2.5 Flash with prompt, saves JSON response to output-file

PROMPT_FILE="$1"
OUTPUT_FILE="$2"
API_KEY="${GEMINI_API_KEY}"
if [ -z "$API_KEY" ]; then
  echo "Error: GEMINI_API_KEY env var not set"
  exit 1
fi

if [ -z "$PROMPT_FILE" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 <prompt-file> <output-file>"
  exit 1
fi

# Build JSON payload via Python (handles special chars safely)
# Use unique temp file per agent to avoid race conditions
PAYLOAD_FILE="/tmp/gemini_payload_$$.json"

python3 - "${PROMPT_FILE}" "${PAYLOAD_FILE}" << 'PYEOF'
import json, sys

prompt_file = sys.argv[1]
payload_file = sys.argv[2]

with open(prompt_file, 'r') as f:
    prompt_text = f.read()

payload = {
    "contents": [{"parts": [{"text": prompt_text}]}],
    "generationConfig": {
        "temperature": 0.2,
        "maxOutputTokens": 65536
    }
}

with open(payload_file, 'w') as f:
    json.dump(payload, f)

print(f"Payload built ({len(prompt_text):,} chars), calling API...")
PYEOF

# Call API
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "@${PAYLOAD_FILE}" \
  > "${OUTPUT_FILE}.raw"

# Clean up unique temp file
rm -f "${PAYLOAD_FILE}"

# Extract text from response
python3 - "${OUTPUT_FILE}" << 'PYEOF'
import json, sys, re

output_file = sys.argv[1]

with open(output_file + '.raw') as f:
    raw = f.read()

try:
    data = json.loads(raw)
except Exception as e:
    print(f"Failed to parse API response: {e}")
    print(raw[:500])
    sys.exit(1)

if 'error' in data:
    print(f"API error: {data['error']}")
    sys.exit(1)

try:
    text = data['candidates'][0]['content']['parts'][0]['text']
except Exception as e:
    print(f"Error extracting text: {e}")
    sys.exit(1)

# Try to extract JSON from the text (handles markdown code blocks)
json_text = text.strip()

# Remove markdown code blocks if present
if json_text.startswith('```'):
    # Extract content between ``` markers
    match = re.search(r'```(?:json)?\s*\n?(.*?)```', json_text, re.DOTALL)
    if match:
        json_text = match.group(1).strip()

# Try to parse as JSON
try:
    parsed = json.loads(json_text)
    with open(output_file, 'w') as out:
        json.dump(parsed, out, indent=2)
    print(f"SUCCESS: Valid JSON saved to {output_file}")
except json.JSONDecodeError as e:
    # Find the first { and last } to extract JSON
    start = json_text.find('{')
    end = json_text.rfind('}')
    if start != -1 and end != -1:
        candidate = json_text[start:end+1]
        try:
            parsed = json.loads(candidate)
            with open(output_file, 'w') as out:
                json.dump(parsed, out, indent=2)
            print(f"SUCCESS (extracted): Valid JSON saved to {output_file}")
        except:
            # Save raw text as fallback
            with open(output_file, 'w') as out:
                out.write(text)
            print(f"WARNING: Saved raw text to {output_file}")
    else:
        with open(output_file, 'w') as out:
            out.write(text)
        print(f"WARNING: No JSON found, saved raw text to {output_file}")
PYEOF
