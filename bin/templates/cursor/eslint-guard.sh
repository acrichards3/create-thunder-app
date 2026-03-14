#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Matches eslint config files and custom rule files in any workspace
if [[ "$FILE" == */eslint.config.js || "$FILE" == */eslint.config.ts || "$FILE" == */eslint-rules/*.js || "$FILE" == */eslint-rules/*.ts ]]; then
  BASENAME=$(basename "$FILE")
  echo "{\"permission\": \"ask\", \"user_message\": \"The agent wants to modify an ESLint file: \`$BASENAME\`. Approve only if you explicitly asked for ESLint changes.\"}"
  exit 0
fi

echo '{"permission": "allow"}'
