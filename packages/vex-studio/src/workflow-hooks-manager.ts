import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HOOK_SCRIPT_PATH = ".cursor/hooks/vex-step-guard.sh";
const HOOKS_JSON_PATH = ".cursor/hooks.json";

const VEX_HOOK_ENTRIES = [
  { command: HOOK_SCRIPT_PATH, matcher: "Write" },
  { command: HOOK_SCRIPT_PATH, matcher: "Delete" },
  { command: HOOK_SCRIPT_PATH, matcher: "Shell" },
] as const;

type HookEntry = { command: string; matcher: string };
type HooksJson = {
  hooks: {
    postToolUse?: HookEntry[];
    preToolUse?: HookEntry[];
    stop?: HookEntry[];
  };
  version: number;
};

export function installHooks(workspaceRoot: string): void {
  writeHookScript(workspaceRoot);
  mergeHooksJson(workspaceRoot);
}

export function uninstallHooks(workspaceRoot: string): void {
  removeHookScript(workspaceRoot);
  unmergeHooksJson(workspaceRoot);
}

function writeHookScript(workspaceRoot: string): void {
  const filePath = join(workspaceRoot, HOOK_SCRIPT_PATH);
  mkdirSync(join(workspaceRoot, ".cursor", "hooks"), { recursive: true });
  writeFileSync(filePath, HOOK_SCRIPT_CONTENT, { mode: 0o755 });
}

function removeHookScript(workspaceRoot: string): void {
  const filePath = join(workspaceRoot, HOOK_SCRIPT_PATH);
  try {
    unlinkSync(filePath);
  } catch {
    /* may not exist */
  }
}

function readHooksJson(workspaceRoot: string): HooksJson {
  const filePath = join(workspaceRoot, HOOKS_JSON_PATH);
  if (!existsSync(filePath)) {
    return { hooks: { preToolUse: [] }, version: 1 };
  }
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as HooksJson;
}

function writeHooksJson(workspaceRoot: string, data: HooksJson): void {
  const filePath = join(workspaceRoot, HOOKS_JSON_PATH);
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function isVexEntry(entry: HookEntry): boolean {
  return entry.command === HOOK_SCRIPT_PATH;
}

function mergeHooksJson(workspaceRoot: string): void {
  const data = readHooksJson(workspaceRoot);
  const existing = data.hooks.preToolUse ?? [];
  const alreadyInstalled = existing.some(isVexEntry);
  if (alreadyInstalled) {
    return;
  }
  data.hooks.preToolUse = [...VEX_HOOK_ENTRIES, ...existing];
  writeHooksJson(workspaceRoot, data);
}

function unmergeHooksJson(workspaceRoot: string): void {
  const filePath = join(workspaceRoot, HOOKS_JSON_PATH);
  if (!existsSync(filePath)) {
    return;
  }
  const data = readHooksJson(workspaceRoot);
  const existing = data.hooks.preToolUse ?? [];
  data.hooks.preToolUse = existing.filter((e) => !isVexEntry(e));
  writeHooksJson(workspaceRoot, data);
}

const HOOK_SCRIPT_CONTENT = `#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)

REPO_ROOT=$(echo "$INPUT" | jq -r '.workspace_roots[0] // empty')
[ -z "$REPO_ROOT" ] && echo '{"permission": "allow"}' && exit 0

STATE_FILE="$REPO_ROOT/.vex-workflow"

if [ ! -f "$STATE_FILE" ]; then
  echo '{"permission": "allow"}'
  exit 0
fi

ENABLED=$(jq -r '.enabled // false' "$STATE_FILE" 2>/dev/null)
STEP=$(jq -r '.step // -1' "$STATE_FILE" 2>/dev/null)

if [ "$ENABLED" != "true" ]; then
  echo '{"permission": "allow"}'
  exit 0
fi

TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

BASENAME=$(basename "$FILE")

advance_step() {
  local NEXT_STEP="$1"
  local NEXT_NAME="$2"
  ACTIVE_ID=$(jq -r '.activeId // ""' "$STATE_FILE" 2>/dev/null)
  printf '{"step":%d,"enabled":true,"activeId":"%s"}' "$NEXT_STEP" "$ACTIVE_ID" > "$STATE_FILE"
  AGENT_MSG="The workflow has advanced to the **$NEXT_NAME** step. The .vex-advance file was intercepted — no file was created. You will receive updated instructions in your next context."
  echo "{\\"permission\\": \\"deny\\", \\"agent_message\\": $(echo "$AGENT_MSG" | jq -Rs .)}"
  exit 2
}

deny_with_msg() {
  local AGENT_MSG="$1"
  local USER_MSG="$2"
  echo "{\\"permission\\": \\"deny\\", \\"agent_message\\": $(echo "$AGENT_MSG" | jq -Rs .), \\"user_message\\": $(echo "$USER_MSG" | jq -Rs .)}"
  exit 2
}

# Describe step — block everything except the .vex-advance signal
if [ "$STEP" = "0" ]; then
  if [ "$TOOL" = "Write" ] && [ "$BASENAME" = ".vex-advance" ]; then
    advance_step 1 "Spec"
  fi
  deny_with_msg \
    "You are in the **Describe** step of the Vex workflow. You have NO write access. Focus on understanding the user's requirements and asking clarifying questions. When ready, write \\\`.vex-advance\\\` with the content \\\`spec\\\`." \
    "Blocked: agent attempted to use $TOOL during the Describe step (no write access)."
fi

# Spec step — allow .vex file writes only, block everything else
if [ "$STEP" = "1" ]; then
  if [ "$TOOL" = "Write" ] && [ "$BASENAME" = ".vex-advance" ]; then
    advance_step 2 "Approve"
  fi
  if [ "$TOOL" = "Write" ] && [[ "$FILE" == *.vex ]]; then
    echo '{"permission": "allow"}'
    exit 0
  fi
  deny_with_msg \
    "You are in the **Spec** step of the Vex workflow. You may ONLY write \`.vex\` files. All other writes, deletes, and shell commands are blocked. When all specs are complete, write \`.vex-advance\` with the content \`approve\`." \
    "Blocked: agent attempted to use $TOOL on a non-.vex file during the Spec step."
fi

# Approve step — block everything, user is reviewing
if [ "$STEP" = "2" ]; then
  deny_with_msg \
    "You are in the **Approve** step of the Vex workflow. STOP. Do not take any actions. The user is reviewing your specs. Wait for them to approve or request changes." \
    "Blocked: agent attempted to use $TOOL during the Approve step (waiting for user review)."
fi

echo '{"permission": "allow"}'
`;
