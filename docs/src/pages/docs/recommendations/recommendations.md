# Recommendations

Best practices and conventions for building with Vex App.

## Validate Everything at the Boundary

Use Zod to validate data at every boundary — API responses, environment variables, form inputs, and database results. Vex App already does this for environment variables in both frontend and backend. Extend this pattern to your own code:

```typescript
// frontend/src/api/users.ts
import { apiFetch } from "./client.util";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  id: z.string().uuid(),
  name: z.string(),
});

export const getUser = async (id: string) => {
  const data = await apiFetch(`/api/users/${id}`);
  return userSchema.parse(data);
};
```

This guarantees the shape of data flowing through your app, catches bugs early, and gives you full type inference without manual type annotations.

## Use the Lib Package for Shared Code

If you find yourself duplicating types, schemas, or utility functions between frontend and backend, move them to `lib/`. The `@vex-app/lib` import works in both packages and changes are picked up automatically during development.

Good candidates for the lib package:

- Shared Zod schemas (e.g., request/response schemas used by both API and client)
- Utility functions (`tryCatch`, `assertNever`, `raise`)
- Shared TypeScript types
- Constants and enums

## Keep Routes Small

Both frontend routes and backend handlers benefit from being thin. Extract business logic, data fetching, and validation into separate files:

```
frontend/src/
├── api/           # API call functions (apiFetch + Zod schemas)
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
└── routes/        # Route components (thin, compose from above)
```

```
backend/src/
├── db/            # Database schema and queries
├── env/           # Environment variable validation
├── security/      # Auth, rate limiting, crypto
└── index.ts       # Route definitions (thin handlers)
```

## Prefer `??` over `||`

The ESLint config enforces `??` (nullish coalescing) over `||` for defaulting values. This prevents bugs where falsy values like `0`, `""`, or `false` are accidentally replaced:

```typescript
// Bad — will use "default" when count is 0
const count = input || "default";

// Good — only uses "default" when input is null or undefined
const count = input ?? "default";
```

The `||` operator is allowed in boolean test contexts like `if` statements and conditionals.

## Use `import type` for Type-Only Imports

The ESLint config enforces `import type` when an import is only used as a type. This produces cleaner output and avoids importing runtime code that isn't needed:

```typescript
// Good
import type { User } from "@vex-app/lib";

// Will be flagged by ESLint
import { User } from "@vex-app/lib";
```

## Avoid `=== undefined` Checks

The ESLint rules discourage explicit `=== undefined` or `!== undefined` comparisons. Use nullish coalescing or optional chaining instead:

```typescript
// Avoid
if (value !== undefined) { ... }

// Prefer
if (value != null) { ... }
// or
const result = value ?? fallback;
```

## Sort Keys Consistently

Object keys, interface properties, and enum members are sorted alphabetically by the ESLint config. This makes diffs cleaner and prevents merge conflicts when multiple people add properties to the same object.

## Protect Sensitive Routes

Use the existing `/api/protected/*` prefix for any route that requires authentication. The `verifyAuth` middleware is already applied to this path:

```typescript
// This route requires a valid session
app.get("/api/protected/dashboard", async (c) => {
  const auth = c.get("authUser");
  return c.json({ user: auth.session.user });
});
```

For public API routes, add rate limiting to prevent abuse:

```typescript
app.use("/api/public/*", rateLimit({ limit: 30, windowMs: 60_000 }));
```

## Use `tryCatch` for Error Handling

The lib package provides `tryCatch` and `tryCatchAsync` utilities that return a tuple instead of throwing. This leads to explicit, readable error handling:

```typescript
import { tryCatchAsync } from "@vex-app/lib";

const [user, error] = await tryCatchAsync(() => getUser(id));

if (error) {
  return new Response("Failed to fetch user", { status: 500 });
}

return user;
```

## Run the Full Build Before Pushing

Get in the habit of running `bun run build` before pushing. This command runs the TypeScript compiler, ESLint, Prettier checks, and builds all three packages. It catches issues that individual `dev` mode might not surface:

```bash
bun run build
```
