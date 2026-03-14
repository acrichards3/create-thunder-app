#!/usr/bin/env bash
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only applies to spec files
[[ "$FILE" != *.spec.ts ]] && { echo '{"permission": "allow"}'; exit 0; }

CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_content // .tool_input.content // empty')
[[ -z "$CONTENT" ]] && { echo '{"permission": "allow"}'; exit 0; }

# Parse the incoming spec content and enforce: max one it()/it.todo() per describe block.
VIOLATION=$(echo "$CONTENT" | node --input-type=module << 'EOF'
import { createInterface } from "readline";

const lines = [];
const rl = createInterface({ input: process.stdin });
rl.on("line", (l) => lines.push(l));
rl.on("close", () => {
  const stack = [];
  let braceDepth = 0;
  const itPattern = /^\s*(it\.todo|it)\s*\(/;
  const describePattern = /^\s*describe\s*\(/;
  let violation = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/\{/g) ?? []).length;
    const closeBraces = (line.match(/\}/g) ?? []).length;

    if (describePattern.test(line)) {
      const bodyDepth = braceDepth + openBraces;
      stack.push({ itCount: 0, bodyDepth, lineOpened: i + 1 });
    }

    braceDepth += openBraces - closeBraces;

    while (stack.length > 0 && braceDepth < stack[stack.length - 1].bodyDepth) {
      stack.pop();
    }

    if (itPattern.test(line) && stack.length > 0) {
      const frame = stack[stack.length - 1];
      frame.itCount += 1;
      if (frame.itCount > 1) {
        violation = `Line ${i + 1}: multiple it() calls in one describe block (opened line ${frame.lineOpened}).`;
        break;
      }
    }
  }

  if (violation) process.stdout.write(violation);
});
EOF
)

if [[ -n "$VIOLATION" ]]; then
  AGENT_MSG=$(printf "SPEC STRUCTURE ERROR — write blocked.\n\n%s\n\nEach describe() block must contain exactly ONE it.todo(). If a condition has multiple outcomes, nest them in separate describe(\"AND ...\") blocks:\n\n  describe(\"WHEN x\", () => {\n    describe(\"AND outcome A\", () => {\n      it.todo(\"does A\", () => {});\n    });\n    describe(\"AND outcome B\", () => {\n      it.todo(\"does B\", () => {});\n    });\n  });\n\nRewrite the spec with this structure and try again." "$VIOLATION")
  USER_MSG="Spec rejected: multiple it() calls in one describe. Each describe must have exactly one it.todo()."
  echo "{\"permission\": \"deny\", \"agent_message\": $(echo "$AGENT_MSG" | jq -Rs .), \"user_message\": $(echo "$USER_MSG" | jq -Rs .)}"
  exit 2
fi

echo '{"permission": "allow"}'
