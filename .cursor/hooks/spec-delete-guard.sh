#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[[ "$FILE" != *.spec.ts ]] && { echo '{"permission": "allow"}'; exit 0; }

BASENAME=$(basename "$FILE")
echo "{\"permission\": \"ask\", \"user_message\": \"The agent wants to delete a spec file: \`$BASENAME\`. Approve only if you intentionally want this file removed.\"}"
