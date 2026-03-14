#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path')

# Never require specs for spec files themselves
[[ "$FILE" == *.spec.ts ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == */node_modules/* ]] && { echo '{"permission": "allow"}'; exit 0; }

# Block ALL markdown files anywhere in the project — specs are .spec.ts files, not markdown documents
# Exception: docs/ directory is a documentation site, not a feature implementation
if [[ "$FILE" == *.md ]]; then
  if [[ "$FILE" == */docs/* ]]; then
    echo '{"permission": "allow"}'
    exit 0
  fi
  AGENT_MSG="You are trying to write a markdown file. This is not allowed when following the spec-first workflow. \"Spec\" means a TypeScript test file (.spec.ts), NOT a markdown planning document. Do not create API_SPECIFICATION.md, SPEC.md, or any other .md file as part of a feature. Follow spec-first.mdc: create .spec.ts files with WHEN/AND/it.todo() branches co-located next to the implementation files, then stop and wait for user approval."
  USER_MSG="Markdown files are not allowed as specs. Use co-located .spec.ts test files instead."
  echo "{\"permission\": \"deny\", \"agent_message\": $(echo "$AGENT_MSG" | jq -Rs .), \"user_message\": $(echo "$USER_MSG" | jq -Rs .)}"
  exit 2
fi

# Frontend has no tests
[[ "$FILE" == */frontend/* ]] && { echo '{"permission": "allow"}'; exit 0; }

# Only backend and lib contain testable logic
[[ "$FILE" != */backend/* && "$FILE" != */lib/src/* ]] && { echo '{"permission": "allow"}'; exit 0; }

# Non-.ts files never need specs
[[ "$FILE" != *.ts ]] && { echo '{"permission": "allow"}'; exit 0; }

# Pure declarations — no logic, no spec needed
[[ "$FILE" == *.schema.ts ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == *.table.ts ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == *.types.ts ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == *.config.ts ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == *.constants.ts ]] && { echo '{"permission": "allow"}'; exit 0; }

# Env validation files — just Zod schemas, no logic
[[ "$FILE" == */env/* ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == */env.ts ]] && { echo '{"permission": "allow"}'; exit 0; }

# Database schema definitions
[[ "$FILE" == */db/schema/* ]] && { echo '{"permission": "allow"}'; exit 0; }
[[ "$FILE" == */db/index.ts ]] && { echo '{"permission": "allow"}'; exit 0; }

# Barrel/index files — just re-exports
BASENAME=$(basename "$FILE")
[[ "$BASENAME" == "index.ts" ]] && { echo '{"permission": "allow"}'; exit 0; }

# Test infrastructure — preload and setup files
[[ "$BASENAME" == "test-setup.ts" ]] && { echo '{"permission": "allow"}'; exit 0; }

# Route/entry-point files — wiring only, not logic
[[ "$FILE" == */routes/* ]] && { echo '{"permission": "allow"}'; exit 0; }

# Everything else in backend or lib/src requires a spec

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
