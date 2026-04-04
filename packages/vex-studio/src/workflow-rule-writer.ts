import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const RULE_FILENAME = ".cursor/rules/vex-workflow.mdc";

function rulePath(workspaceRoot: string): string {
  return join(workspaceRoot, RULE_FILENAME);
}

const STEP_RULES: readonly string[] = [
  describeStepRule(),
  specStepRule(),
  approveStepRule(),
  buildStepRule(),
  verifyStepRule(),
  doneStepRule(),
];

export function writeWorkflowRule(workspaceRoot: string, step: number, lintErrors?: string[]): void {
  const filePath = rulePath(workspaceRoot);
  mkdirSync(dirname(filePath), { recursive: true });
  let content = STEP_RULES[step] ?? "";
  if (lintErrors != null && lintErrors.length > 0 && step === 1) {
    content = injectLintErrors(content, lintErrors);
  }
  writeFileSync(filePath, content, "utf-8");
}

function injectLintErrors(ruleContent: string, errors: string[]): string {
  const errorBlock = [
    "",
    "### VALIDATION ERRORS",
    "",
    "Your previous `.vex` files have syntax or structural errors that **must** be fixed before you can advance.",
    "Fix every error listed below, then write `.vex-advance` again.",
    "",
    "```",
    ...errors,
    "```",
    "",
  ].join("\n");
  return ruleContent + errorBlock;
}

export function deleteWorkflowRule(workspaceRoot: string): void {
  try {
    unlinkSync(rulePath(workspaceRoot));
  } catch {
    /* file may not exist */
  }
}

function describeStepRule(): string {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Describe Step (Step 1 of 6)

You are operating inside the **Vex workflow**. The current step is **Describe**.

### Your Role

The user is describing a feature they want built. Your only job right now is to **fully understand what they want**.

1. Read the user's message carefully.
2. If anything is ambiguous, unclear, or under-specified, ask **specific** clarifying questions. Group them into a concise numbered list.
3. Keep asking until you are confident you understand every acceptance criterion.
4. When you have no remaining questions, signal that you are ready to move on.

### Constraints

- **You have NO write access.** Do not create, modify, or delete any files. Do not run shell commands. Do not generate code. If you attempt a write it will be blocked.
- Only output conversational text — questions, summaries, and confirmations.

### Advancing to the Next Step

When you are certain you fully understand the requirements and have no more questions, you **must** write the file \`.vex-advance\` with the single word \`spec\` as its content. This is the ONLY file you are permitted to write. The system will intercept this write, advance the workflow to the **Spec** step, and give you further instructions.

Do **not** advance if you still have open questions. Ask them first.
`;
}

function specStepRule(): string {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Spec Step (Step 2 of 6)

You are operating inside the **Vex workflow**. The current step is **Spec**.

### Your Role

Based on the requirements gathered in the Describe step, you must now write \`.vex\` spec files that fully describe every behavior of the feature **before** any code is written.

A \`.vex\` file is a plain-text spec format that maps the feature into a tree of behaviors:

\`\`\`
describe: Calculator
    describe: Display
        when: the app opens
            it: Shows the digit 0 on the screen
        when: a new result is ready
            it: Replaces the display with the result
    describe: Operations
        when: the user taps an operator
            it: Stores the operator and waits for the next operand
        when: the user taps equals
            it: Pops operands from the internal stack
            and: the operation is defined for those operands
                it: Computes and shows the result in the display
\`\`\`

#### Syntax rules

- **\`describe:\`** — groups related behaviors. Can be nested.
- **\`when:\`** — a condition or user action. Must be inside a \`describe:\`.
- **\`and:\`** — an additional condition that narrows a \`when:\`. Must follow a \`when:\` or another \`and:\`.
- **\`it:\`** — the expected outcome. Every \`when:\` (and \`and:\`) must end with at least one \`it:\`.
- Indentation is 4 spaces per level. No tabs.
- Labels are plain English — concise but descriptive.

### Instructions

1. Create or modify \`.vex\` files to cover **every** behavior, edge case, and error path from the requirements.
2. Organize specs logically — one top-level \`describe:\` per major feature area.
3. Be thorough. Every user-facing flow, validation rule, and error state should have a \`when:\`/\`it:\` pair.
4. Place spec files in a sensible location (project root or a \`specs/\` directory).

### Constraints

- **You may ONLY write \`.vex\` files.** All other file writes, deletes, and shell commands will be blocked.
- Do not write any implementation code, tests, or configuration — only \`.vex\` specs.

### Advancing to the Next Step

When you have finished writing all spec files and are confident every requirement is covered, write the file \`.vex-advance\` with the single word \`approve\` as its content. The system will intercept this write, advance the workflow to the **Approve** step, and you must then **stop immediately** — do not take any further actions after advancing.
`;
}

function approveStepRule(): string {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Approve Step (Step 3 of 6)

You are operating inside the **Vex workflow**. The current step is **Approve**.

### STOP

The spec phase is complete. **Do not take any actions.** Do not write, modify, or delete any files. Do not run commands.

The user is reviewing the \`.vex\` spec files you wrote. Wait for them to either:

- **Approve** — they will advance the workflow to the Build step.
- **Request changes** — they will ask you to revise specific specs, at which point the workflow will return to the Spec step.

You have **no write access** during this step. Simply acknowledge that specs are ready for review and wait.
`;
}

function buildStepRule(): string {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Build Step (Step 4 of 6)

You are operating inside the **Vex workflow**. The current step is **Build**.

_Build step instructions are not yet implemented._
`;
}

function verifyStepRule(): string {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Verify Step (Step 5 of 6)

You are operating inside the **Vex workflow**. The current step is **Verify**.

_Verify step instructions are not yet implemented._
`;
}

function doneStepRule(): string {
  return `---
description: "Vex Workflow — active step instructions (auto-managed by Vex Studio extension)"
alwaysApply: true
---

## Vex Workflow — Done (Step 6 of 6)

You are operating inside the **Vex workflow**. The current step is **Done**.

The workflow is complete. No further actions are needed.
`;
}
