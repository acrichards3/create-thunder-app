# Testing

Vex App uses [Bun's built-in test runner](https://bun.com/docs/test) — no Jest, Vitest, or any other framework needed. Tests are written with `describe` and `it` from `bun:test` and run with a single command.

If you opted into the AI settings during project setup, your AI agent will automatically follow these testing conventions — including the WHEN/AND structure, `.spec.ts` file naming, and all the rules below. The Cursor rules and ESLint overrides enforce these patterns so the agent writes tests the same way you would.

## Running Tests

```bash
bun run test
```

Run tests for a specific workspace:

```bash
bun run test:backend
bun run test:frontend
bun run test:lib
```

## Test File Convention

Test files use `.spec.ts` (not `.test.ts`) and are co-located next to the source file they test:

```
features/
  users/
    users.controller.ts
    users.controller.spec.ts
    users.actions.ts
    users.actions.spec.ts
    users.service.ts
    users.service.spec.ts
```

## Test Structure — WHEN / AND / it

Tests are structured as a decision tree that mirrors the code paths of the function being tested. Every branch in the source code maps to a branch in the test.

### The Pattern

1. **Top-level `describe`** — the function or endpoint being tested
2. **`describe("WHEN ...")`** — a condition or input scenario
3. **`describe("AND ...")`** — a deeper branch when paths diverge further
4. **`it("does X")`** — the leaf assertion, only at the end of a path

Continue nesting `AND` blocks until every code path has been covered.

### Example

Given this action that applies a discount to an order:

```typescript
const applyDiscount = (order: Order, code: string): Order => {
  const discount = findDiscount(code);

  if (!discount) {
    throw new Error("Invalid discount code");
  }

  if (discount.expiresAt < new Date()) {
    throw new Error("Discount code has expired");
  }

  if (order.total < discount.minimumSpend) {
    throw new Error("Order does not meet minimum spend");
  }

  return {
    ...order,
    discount: discount.amount,
    total: order.total - discount.amount,
  };
};
```

The test maps every branch:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";

describe("applyDiscount", () => {
  describe("WHEN the discount code does not exist", () => {
    it("throws an invalid discount code error", () => {});
  });

  describe("WHEN the discount code exists", () => {
    describe("AND the code has expired", () => {
      it("throws a discount expired error", () => {});
    });

    describe("AND the code has not expired", () => {
      describe("AND the order total is below the minimum spend", () => {
        it("throws a minimum spend error", () => {});
      });

      describe("AND the order total meets the minimum spend", () => {
        it("returns the order with the discount applied", () => {});

        it("reduces the total by the discount amount", () => {});
      });
    });
  });
});
```

Each path through the source code gets a `WHEN` or `AND`, and each leaf gets an `it`. When a test fails, the full describe path reads like a sentence: `applyDiscount > WHEN the discount code exists > AND the code has not expired > AND the order total is below the minimum spend > throws a minimum spend error`.

## Rules

### One assertion per `it`

Each `it` block should verify exactly one behavior. If a test needs multiple assertions, split them into separate `it` blocks. This way, when a test fails, the name tells you exactly what broke.

### `it` descriptions start with a verb

Use "returns", "throws", "creates", "updates", "deletes", etc. Avoid vague names like "works correctly" or "handles edge case".

### No logic in `it` blocks

No `if/else`, loops, or try/catch inside `it`. If a test needs branching, it should be separate `it` blocks under different `WHEN`/`AND` describes.

### Setup goes in `beforeEach`

All test setup belongs in `beforeEach` blocks. `it` blocks should only execute the action being tested and assert the result. Teardown goes in `afterEach`.

### No shared mutable state

Each test must be independent. `beforeEach` should reset everything. No test should depend on another test having run first.

### Test real behavior

Do not mock your own code just to make tests pass. If you can run it, run it for real. Mocks are only acceptable when:

- The dependency is an external API or third-party service you cannot control
- The real thing has side effects that cannot run in tests (sending emails, processing payments)
- You need to simulate a specific failure condition (network timeout, DB connection refused)

## Spec-First Workflow

If you opted into the spec-first workflow during setup, the AI agent is required to follow a three-step process for every new feature:

1. **Write the specs** — Creates `.spec.ts` files for every logical layer (controller, actions, service) with empty `it` blocks mapping all code paths in the WHEN/AND/it structure. No implementation code is written.
2. **Stop and ask** — Presents the test structure and waits for you to approve, modify, or add paths before continuing.
3. **Implement** — Only after you explicitly approve does the AI write the implementation files, fill in the test bodies, and run `bun test`.

This gives you control over what gets built. You define the behavior through test paths, and the AI builds to match.

### How enforcement works

The workflow is enforced mechanically through two hooks, not just through rules that can be forgotten:

- **`spec-marker.sh`** (`postToolUse`) — fires every time a `.spec.ts` file is written. It appends the spec path to a file called `.spec-pending` at the repo root.
- **`spec-check.sh`** (`preToolUse`) — fires before every implementation write. If `.spec-pending` has content, it returns `permission: deny` and blocks the write. The AI literally cannot write a controller, actions, or service file while specs are awaiting approval.

When you approve ("looks good", "proceed", "build it"), the AI clears `.spec-pending` by writing an empty string to it, which unblocks the implementation writes.

### The `.spec-pending` file

`.spec-pending` lives at the repo root and is git-ignored. It's a single permanent file that gets reused for every feature:

- **Empty** → no specs are pending, implementation writes are allowed
- **Has content** → specs are written and awaiting your approval, implementation is blocked

It's seeded empty by the CLI at scaffold time. If a turn is cancelled mid-way and the file is left with stale content, write an empty string to it to reset the lock manually. That's the only time you should ever need to touch it.
