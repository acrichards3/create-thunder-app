#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path')

# Only act on .spec.ts files in backend or lib
[[ "$FILE" == *.spec.ts ]] || { echo '{"decision": "allow"}'; exit 0; }
[[ "$FILE" == */frontend/* ]] && { echo '{"decision": "allow"}'; exit 0; }
[[ "$FILE" == */node_modules/* ]] && { echo '{"decision": "allow"}'; exit 0; }

# Find repo root (where .gitignore lives)
DIR=$(dirname "$FILE")
REPO_ROOT=""
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/.gitignore" ]; then
    REPO_ROOT="$DIR"
    break
  fi
  DIR=$(dirname "$DIR")
done

[ -n "$REPO_ROOT" ] || { echo '{"decision": "allow"}'; exit 0; }

MARKER="$REPO_ROOT/.spec-pending"

# Append this spec file to the marker (overwrite to keep it current)
echo "$FILE" >> "$MARKER"

echo '{"decision": "allow"}'
