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

# Check 2: TypeScript errors
cd "$REPO_ROOT"
TS_OUTPUT=$(bun tsc -b 2>&1) || true
if [ -n "$TS_OUTPUT" ] && echo "$TS_OUTPUT" | grep -q "error TS"; then
  MSG=$(printf "TypeScript errors were found that must be fixed before this task is complete. Do not respond — fix every error listed below, then verify with bun run typecheck.\n\n%s" "$TS_OUTPUT")
  echo "{\"followup_message\": $(echo "$MSG" | jq -Rs .)}"
  exit 0
fi

# Check 3: Prettier formatting
cd "$REPO_ROOT"
PRETTIER_OUTPUT=$(bunx prettier --check "**/*.{ts,tsx,js,json}" --ignore-path .gitignore --ignore-path .prettierignore 2>&1) || true
if echo "$PRETTIER_OUTPUT" | grep -q "Code style issues"; then
  FILTERED=$(echo "$PRETTIER_OUTPUT" | grep -v "routeTree.gen.ts")
  if echo "$FILTERED" | grep -q "Code style issues"; then
    MSG=$(printf "Prettier formatting issues were found. Do not respond — run bunx prettier --write on the affected files listed below, then verify with bunx prettier --check.\n\n%s" "$FILTERED")
    echo "{\"followup_message\": $(echo "$MSG" | jq -Rs .)}"
    exit 0
  fi
fi

# Check 4: Failing tests — only run if any .ts files were modified in the last 5 minutes
RECENTLY_MODIFIED=""
for WS in "${WORKSPACES[@]}"; do
  if find "$WS/src" -name "*.ts" -newer "$WS/package.json" -print -quit 2>/dev/null | grep -q .; then
    RECENTLY_MODIFIED="yes"
    break
  fi
done

if [ -n "$RECENTLY_MODIFIED" ]; then
  TEST_OUTPUT=""
  for WS in "${WORKSPACES[@]}"; do
    SPEC_COUNT=$(find "$WS/src" -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$SPEC_COUNT" -eq 0 ]; then
      continue
    fi
    cd "$WS"
    WS_OUTPUT=$(bun test 2>&1) || true
    if echo "$WS_OUTPUT" | grep -qE "^(FAIL|✗|error)"; then
      TEST_OUTPUT="$TEST_OUTPUT\n--- $(basename "$WS") ---\n$WS_OUTPUT"
    fi
  done

  if [ -n "$TEST_OUTPUT" ]; then
    MSG=$(printf "Failing tests were found that must be fixed before this task is complete. Do not respond — fix every failing test listed below, then verify with bun test.\n\n%b" "$TEST_OUTPUT")
    echo "{\"followup_message\": $(echo "$MSG" | jq -Rs .)}"
    exit 0
  fi
fi

# Check 5: Unfilled it.todo() in spec files whose implementation exists
# Skip if specs are pending approval (spec-first workflow step 2)
SPEC_PENDING_FILE="$REPO_ROOT/.spec-pending"
if [ -f "$SPEC_PENDING_FILE" ] && [ -s "$SPEC_PENDING_FILE" ]; then
  exit 0
fi

PENDING_TODOS=""
for WS in "${WORKSPACES[@]}"; do
  while IFS= read -r -d '' SPEC_FILE; do
    IMPL_FILE="${SPEC_FILE%.spec.ts}.ts"
    if [ ! -f "$IMPL_FILE" ]; then
      continue
    fi
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
