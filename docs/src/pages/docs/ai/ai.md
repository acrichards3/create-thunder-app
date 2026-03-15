# AI Integration

Vex App is built for AI-assisted development. Every project ships with a strict ESLint config, Cursor rules, and hooks that work together to keep AI agents writing clean, compliant code.

## How It Works

When you run `bun create vex-app`, the CLI automatically sets up three systems:

1. **Strict ESLint configs** in `frontend/`, `backend/`, and `lib/` with plugins like `sonarjs`, `unicorn`, and `perfectionist`, along with rules covering complexity limits, immutability, explicit return types, and more.
2. **`.cursor/rules/`** with guidance files that tell the AI model how to structure components, handle types, use Tailwind, and follow project conventions.
3. **`.cursor/hooks/`** with shell scripts and a `hooks.json` config. Pre-write hooks run before every file write and can block it. A stop hook runs at the end of every agent turn to enforce quality gates.

## Strict ESLint

The strict config builds on top of `@typescript-eslint/recommended-type-checked` and adds rules that target the most common AI mistakes:

| Category           | What it enforces                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Complexity**     | Max 7 cyclomatic complexity, max 10 cognitive complexity, max 2 parameters. Frontend also enforces max 60 lines per function, max 200 lines per file.                                      |
| **Immutability**   | No `.push()`, `.pop()`, `.sort()`, `.reverse()`, `.splice()`, `.fill()`. No object mutation via property assignment. Use spread and immutable alternatives.                                |
| **Type safety**    | No `any`, no type assertions (`as`), no `@ts-ignore`. Explicit return types on all functions. Strict boolean expressions. All `no-unsafe-*` rules enabled.                                 |
| **Code style**     | Arrow functions only (`func-style`), no `for...in` or `for...of` loops, no `console.log`, no optional properties (`prop?: T` — use `prop: T \| undefined`), no `=== undefined` comparisons |
| **Error handling** | No raw `try/catch` blocks — use `tryCatch()` or `tryCatchAsync()` from the lib workspace. No `.then()` or `.catch()` on promises. Use `async`/`await` with the tuple utilities instead.    |
| **Sorting**        | Alphabetical sorting of object keys, interface properties, and object types via `perfectionist`                                                                                            |

Human developers benefit from the same guardrails — the strict config catches bugs early and keeps codebases maintainable.

## Cursor Rules

The `.cursor/rules/` directory contains `.mdc` files with YAML frontmatter that Cursor automatically injects into the AI model's context. These cover:

- **Linting** — Specific ESLint patterns to follow (immutability, return types, complexity), component file organization (one component per file, nested folders for parent components), Tailwind constraints (no margins, flex-only layout, no fixed dimensions), and verification steps.
- **Types** — Never use `any`, no type assertions, use `unknown` with Zod validation for type narrowing. Prefer `as const` and `satisfies`.
- **Shared utilities** — Use `tryCatch`/`tryCatchAsync` instead of raw try/catch blocks. Use `raise()` with `??`. Use typed object helpers. Use the `using` keyword for resource cleanup instead of `finally`.
- **React** — Always use `React.FC` for component typing. Never destructure React imports — use the `React.` namespace.
- **Backend architecture** — Controller → Actions → Service layered pattern. Each feature gets its own folder with strict dependency direction.
- **Zod** — Use Zod v4 syntax (`z.url()` instead of `z.string().url()`).
- **Bun** — Use Bun APIs and commands (`bun add`, `bunx`, `Bun.file()`) instead of Node equivalents.
- **Stack** — Allowed technologies, path aliases (`~/` not `@/`), config files not to modify.
- **Testing** — WHEN/AND/it test structure, `.spec.ts` file naming, Bun test runner conventions.
- **Verification** — Check linting, builds, and type checking after every change.

Rules use `alwaysApply: true` for general rules or `globs` for file-specific rules, so they're automatically included in the model's context without needing to be manually referenced.

### Testing Conventions

The AI settings also include testing rules that enforce a structured **WHEN / AND / it** test pattern using Bun's built-in test runner. When opted in, your AI agent will write `.spec.ts` files co-located with source code, structure tests as decision trees that mirror code paths, and follow strict rules around setup, assertions, and mocking. See the [Testing](/testing) page for the full convention guide.

### Spec-First Workflow

If you enable the spec-first workflow during setup ("Use AI spec-first workflow?"), the AI agent follows a strict three-step process for every new feature:

1. **Write the specs** — Creates `.spec.ts` files for every logical layer (controller, actions, service) with `it.todo()` blocks mapping all code paths using the WHEN/AND/it structure. No implementation code is written.
2. **Stop and ask** — Presents the test structure and asks you to approve, modify, or add paths before proceeding.
3. **Implement** — Only after you approve does the AI create the implementation files, replace the `it.todo()` blocks with real assertions, and run `bun test` to verify everything passes.

This workflow is enforced mechanically through two hooks and a `.spec-pending` marker file — not just through rules. See the [Testing](/testing) page for how it works in detail.

## Hooks

The hooks are the enforcement layer. Two types of hooks run at different points in the AI's workflow.

### Pre-Write Hooks (`preToolUse`)

These run before every file write and can block it entirely:

- **`spec-check.sh`** — If a `.spec-pending` file has content, blocks any implementation write. Also blocks writing markdown files as fake "specs" and enforces that a co-located `.spec.ts` file exists before any logical file (controller, actions, service) can be written.
- **`spec-lint.sh`** — Parses incoming spec file content and blocks the write if it contains multiple `it` or `it.todo` calls within a single `describe` block. Enforces one `it` per `describe` before the file is even saved.
- **`eslint-guard.sh`** — Blocks any write to ESLint config files or custom rule files without explicit user permission.
- **`tsconfig-guard.sh`** — Blocks any write or delete targeting `tsconfig*.json` files.
- **`spec-delete-guard.sh`** — Requires user confirmation before the AI is allowed to delete a `.spec.ts` file.

### Post-Write Hook (`postToolUse`)

- **`spec-marker.sh`** — After a `.spec.ts` file is written, appends the path to `.spec-pending` to signal that specs are awaiting approval.

### Stop Hook (`eslint-stop.sh`)

Runs at the end of every agent turn before the AI responds. It performs five sequential checks:

1. **ESLint** — Scans all workspaces for lint errors. If any are found, injects a follow-up message forcing the AI to fix them before considering the task done.
2. **TypeScript** — Runs `bun tsc -b` at the repo root. Blocks completion if type errors are present.
3. **Prettier** — Checks formatting across all files. Forces a `prettier --write` pass if any file is out of spec.
4. **Failing tests** — Runs `bun test` in any workspace that has spec files. Forces fixes if any tests are failing.
5. **Unfilled `it.todo()`** — Scans spec files whose implementation counterpart exists. If any `it.todo()` remain, forces the AI to replace them with real assertions before finishing.

### How Blocking Works

Pre-write hooks return a JSON response:

```json
{ "permission": "allow" }
```

or

```json
{ "permission": "deny", "agent_message": "...", "user_message": "..." }
```

When a hook returns `deny`, Cursor blocks the file write and feeds the error back to the AI agent. The stop hook injects a `followup_message` which re-queues the AI to fix the issue without requiring user input.

### Prerequisites

The hooks require `jq` to be installed for JSON processing:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

## Tips for Best Results

- **Keep prompts small** — Ask the AI to build one feature or one file at a time. Large multi-file requests produce more errors because the model loses track of constraints across files.
- **Let the template teach** — The existing code in the scaffolded project is the strongest signal the AI gets. It mimics patterns it sees, so keep the template code clean.
- **Don't fight the hooks** — If a hook blocks a write, let the AI retry. The feedback loop is the whole point. If a rule is genuinely wrong for your use case, update the ESLint config rather than disabling the hook.
- **Extend the rules** — Add your own `.cursor/rules/` files for project-specific conventions. The more specific the guidance, the fewer mistakes.
