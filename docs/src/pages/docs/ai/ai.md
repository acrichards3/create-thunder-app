# AI Integration

Vex App ships with an optional AI configuration layer that keeps AI agents writing clean, compliant code. When you select "Use Vex App recommended AI settings" during `bun create vex-app`, the CLI sets up three systems that work together: a strict ESLint config, Cursor rules, and hooks.

## How It Works

The AI settings are opt-in. If you say yes during setup, the CLI:

1. **Swaps the ESLint configs** in `frontend/`, `backend/`, and `lib/` for strict versions that add plugins like `sonarjs`, `unicorn`, and `perfectionist`, along with rules covering complexity limits, immutability, explicit return types, and more.
2. **Copies `.cursor/rules/`** with guidance files that tell the AI model how to structure components, handle types, use Tailwind, and follow project conventions.
3. **Copies `.cursor/hooks/`** with shell scripts and a `hooks.json` config. Pre-write hooks run before every file write and can block it. Post-write hooks run after every file write.

If you say no, you get the standard ESLint config without the extra plugins, and no `.cursor/` directory is created.

## Strict ESLint

The strict config builds on top of `@typescript-eslint/recommended-type-checked` and adds rules that target the most common AI mistakes:

| Category           | What it enforces                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Complexity**     | Max 7 cyclomatic complexity, max 10 cognitive complexity, max 60 lines per function, max 200 lines per file, max 2 parameters                                                              |
| **Immutability**   | No `.push()`, `.pop()`, `.sort()`, `.reverse()`, `.splice()`, `.fill()`. No object mutation via property assignment. Use spread and immutable alternatives.                                |
| **Type safety**    | No `any`, no type assertions (`as`), no `@ts-ignore`. Explicit return types on all functions. Strict boolean expressions. All `no-unsafe-*` rules enabled.                                 |
| **Code style**     | Arrow functions only (`func-style`), no `for...in` or `for...of` loops, no `console.log`, no optional properties (`prop?: T` — use `prop: T \| undefined`), no `=== undefined` comparisons |
| **Error handling** | No raw `try/catch` blocks — use `tryCatch()` or `tryCatchAsync()` from the lib workspace. No `.then()` or `.catch()` on promises. Use `async`/`await` with the tuple utilities instead.    |
| **Sorting**        | Alphabetical sorting of object keys, interface properties, and object types via `perfectionist`                                                                                            |

Human developers can use the lighter default config by opting out of AI settings during setup. The strict config is specifically tuned for AI agents that need hard guardrails rather than judgment calls.

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

1. **Write the specs** — Creates `.spec.ts` files for every logical layer (controller, actions, service) with empty `it` blocks mapping all code paths using the WHEN/AND/it structure. No implementation code is written.
2. **Stop and ask** — Presents the test structure and asks you to approve, modify, or add paths before proceeding.
3. **Implement** — Only after you approve does the AI create the implementation files, fill in the test assertions, and run `bun test` to verify everything passes.

This workflow is enforced mechanically through two hooks and a `.spec-pending` marker file — not just through rules. See the [Testing](/testing) page for how it works in detail.

## Post-Write Hooks

The post-write hooks are the per-file enforcement layer. Every time the AI agent writes a file, four scripts run in sequence:

### 1. Prettier (`prettier.sh`)

Formats the file with Prettier. Always allows the write — formatting is auto-fixed, not blocked.

### 2. ESLint (`eslint.sh`)

Runs two passes:

- **Pass 1**: Auto-fixes what it can (`--fix`)
- **Pass 2**: Reports remaining errors

If errors remain after auto-fix, the hook blocks the write and returns the errors to the AI agent so it can correct them.

### 3. TypeScript (`typecheck.sh`)

Runs `tsc --noEmit` against the relevant `tsconfig.json` and filters output to the specific file that was written. Blocks the write if type errors are found.

### 4. Duplicate Detection (`jscpd.sh`)

Runs `jscpd` to check if the written file contains duplicated code. Blocks the write if clones are found. Thresholds are configured in `.jscpd.json` at the project root.

### How Blocking Works

Each hook outputs a JSON response:

```json
{ "decision": "allow" }
```

or

```json
{ "decision": "deny", "reason": "error details here" }
```

When a hook returns `deny`, Cursor blocks the file write and feeds the error back to the AI agent, giving it a chance to fix the issue in its next attempt.

### Prerequisites

The hooks require `jq` to be installed on your system for JSON processing. Most macOS and Linux systems have it pre-installed. If not:

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
