#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path')

# Only spec files that contain testable logic — not spec files themselves
[[ "$FILE" == *.spec.ts ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == */node_modules/* ]] && { echo '{"permission": "allow"}'; exit 0; }

# Frontend has no tests
[[ "$FILE" == */frontend/* ]] && { echo '{"permission": "allow"}'; exit 0; }

# Only enforce on the logical layers: controllers, actions, services, and lib utilities
REQUIRES_SPEC=false
[[ "$FILE" == *.controller.ts ]] && REQUIRES_SPEC=true
[[ "$FILE" == *.actions.ts ]] && REQUIRES_SPEC=true
[[ "$FILE" == *.service.ts ]] && REQUIRES_SPEC=true
[[ "$FILE" == */lib/src/* && "$FILE" == *.ts ]] && REQUIRES_SPEC=true

[ "$REQUIRES_SPEC" = true ] || { echo '{"permission": "allow"}'; exit 0; }

# Find repo root
REPO_ROOT=""
DIR=$(dirname "$FILE")
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/.gitignore" ]; then
    REPO_ROOT="$DIR"
    break
  fi
  DIR=$(dirname "$DIR")
done

# Check .spec-pending marker — blocks implementation if specs are awaiting user approval
if [ -n "$REPO_ROOT" ] && [ -f "$REPO_ROOT/.spec-pending" ] && [ -s "$REPO_ROOT/.spec-pending" ]; then
  PENDING=$(cat "$REPO_ROOT/.spec-pending")
  AGENT_MSG=$(printf "Specs are pending user approval. You cannot write implementation code until the user explicitly approves.\n\nPending specs:\n%s\n\nWait for the user to approve, then clear .spec-pending by writing an empty string to it before proceeding." "$PENDING")
  USER_MSG="Waiting for your approval of the spec branches before implementation can proceed."
  echo "{\"permission\": \"deny\", \"agent_message\": $(echo "$AGENT_MSG" | jq -Rs .), \"user_message\": $(echo "$USER_MSG" | jq -Rs .)}"
  exit 2
fi

DIR=$(dirname "$FILE")
BASE=$(basename "$FILE" .ts)
SPEC="$DIR/$BASE.spec.ts"

# No spec file at all — must write spec first
if [ ! -f "$SPEC" ]; then
  AGENT_MSG=$(printf "No spec file found for %s\n\nA co-located spec file is required at:\n  %s\n\nFollow testing.mdc: first write the .spec.ts file with WHEN/AND/it branches in plain English for all code paths. Stop and wait for user confirmation before writing the implementation." "$FILE" "$SPEC")
  USER_MSG="Spec file required before implementation can be written."
  echo "{\"permission\": \"deny\", \"agent_message\": $(echo "$AGENT_MSG" | jq -Rs .), \"user_message\": $(echo "$USER_MSG" | jq -Rs .)}"
  exit 2
fi

echo '{"permission": "allow"}'
