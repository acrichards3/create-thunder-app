## Linting and Build Checks

Always check linting after making changes. Build and lint pipelines must always pass.

### Rules:

- **Fix ALL ESLint errors and warnings**: Treat every ESLint warning as an error. Never leave warnings unresolved.
- **Never use eslint-disable comments**: Do not suppress lint rules with `// eslint-disable`, `/* eslint-disable */`, or `// eslint-disable-next-line`. Fix the underlying issue instead.
- **Never modify ESLint configuration**: Do not change `.eslintrc.cjs` files, add overrides, or alter any ESLint rules or settings.
- **Check linting after changes**: Run `bun run lint` after making code changes.
- **Ensure builds pass**: Run `bun run build` to verify the code compiles.
- **Type checking**: Ensure TypeScript type checking passes with `bun run typecheck`.

### Component & File Organization:

- **One component per file** — never define multiple components in a single file.
- **Group related components in folders** — if a component has child or helper components, create a folder named after the parent and nest them inside. Folders can be nested within folders when the hierarchy calls for it.
  ```
  components/
    Dashboard/
      Dashboard.tsx
      DashboardHeader.tsx
      DashboardChart/
        DashboardChart.tsx
        ChartLegend.tsx
        ChartTooltip.tsx
      DashboardSidebar.tsx
  ```
- **Shared/generic components** that are used across unrelated features can live directly in `components/` without a folder.

### Strict Code Standards:

- Do not add comments to code — no JSDoc, no inline comments, no block comments. Existing comments that shipped with the template must be left in place.
- No `console.log`, `console.error`, or `console.warn`
- No type assertions (`as` keyword) — use proper type narrowing instead
- No mutation of arrays (`.push`, `.pop`, `.sort`, `.reverse`, `.splice`) — use immutable alternatives (`.concat`, `.toSorted`, `.toReversed`, `.toSpliced`)
- No mutation of objects via property assignment — use spread `{ ...obj, key: value }`
- No `for...in` or `for...of` loops — use `.map()`, `.filter()`, `.reduce()`, `.forEach()`
- No inline callbacks in JSX — extract to named functions
- No inline styles — use Tailwind classes
- All functions must have explicit return types
- Max 60 lines per function, max 200 lines per file, max 2 parameters
- Max cyclomatic complexity of 7, max cognitive complexity of 10

### Pipeline Requirements:

- All linting pipelines must pass
- All build pipelines must pass
- All type checking must pass
- Never commit code that would break CI/CD pipelines

If you make changes, always verify that:

1. The code builds successfully
2. Linting passes without errors or warnings
3. Type checking passes without errors
