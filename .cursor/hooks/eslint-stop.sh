#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)

REPO_ROOT=$(echo "$INPUT" | jq -r '.workspace_roots[0] // empty')
[ -z "$REPO_ROOT" ] && exit 0

WORKSPACES=()
for ws in backend frontend lib; do
  if [ -f "$REPO_ROOT/$ws/eslint.config.js" ]; then
    WORKSPACES+=("$REPO_ROOT/$ws")
  fi
done

[ ${#WORKSPACES[@]} -eq 0 ] && exit 0

# Check 1: ESLint errors
ALL_ERRORS=""
for WS in "${WORKSPACES[@]}"; do
  cd "$WS"
  OUTPUT=$(bunx eslint --ext .ts,.tsx src 2>&1) || true
  if [ -n "$OUTPUT" ] && echo "$OUTPUT" | grep -q " error "; then
    ALL_ERRORS="$ALL_ERRORS\n--- $(basename "$WS") ---\n$OUTPUT"
  fi
done

if [ -n "$ALL_ERRORS" ]; then
  MSG=$(printf "ESLint errors were found that must be fixed before this task is complete. Do not respond — fix every error listed below, then verify with bun run lint.\n\n%b" "$ALL_ERRORS")
  echo "{\"followup_message\": $(echo "$MSG" | jq -Rs .)}"
  exit 0
fi

# Check 2: Unfilled it.todo() in spec files whose implementation file exists
# Only flags todos when the implementation has been written (spec-first phase is over)
PENDING_TODOS=""
for WS in "${WORKSPACES[@]}"; do
  while IFS= read -r -d '' SPEC_FILE; do
    # Derive the implementation file path (strip .spec.ts -> .ts)
    IMPL_FILE="${SPEC_FILE%.spec.ts}.ts"
    # Only flag if the implementation file exists (i.e. we are past step 1)
    if [ ! -f "$IMPL_FILE" ]; then
      continue
    fi
    # Check for any it.todo( calls remaining in the spec
    if grep -q "it\.todo(" "$SPEC_FILE"; then
      PENDING_TODOS="$PENDING_TODOS\n  $SPEC_FILE"
    fi
  done < <(find "$WS/src" -name "*.spec.ts" -print0 2>/dev/null)
done

if [ -n "$PENDING_TODOS" ]; then
  MSG=$(printf "Implementation is complete but the following spec files still contain it.todo() placeholders. Do not respond — replace every it.todo() with a real it() containing actual expect() assertions, then run bun test to verify all tests pass.\n\nSpec files with unfilled todos:%b" "$PENDING_TODOS")
  echo "{\"followup_message\": $(echo "$MSG" | jq -Rs .)}"
  exit 0
fi

exit 0
