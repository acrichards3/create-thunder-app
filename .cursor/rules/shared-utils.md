## Shared Utilities

The `lib/` workspace exports shared utilities. Before writing new helper functions, check if one already exists. Import them from `@<project-name>/lib`.

### Available Utilities

- **`tryCatch(fn)`** — Synchronous try/catch that returns a `[result, null] | [null, Error]` tuple instead of throwing. Use instead of manual try/catch blocks when you only need the result or error.
- **`tryCatchAsync(fn)`** — Async version of `tryCatch`. Wraps an async function and returns a `Promise<[result, null] | [null, Error]>` tuple. Use instead of try/catch with async/await when the tuple pattern fits.
- **`raise(message)`** — Throws an error. Use as an expression with `??` to throw on nullish values (e.g. `const name = data?.name ?? raise("Name is required")`).
- **`assertNever(x)`** — Exhaustive check for switch statements. Place in the `default` case to get a compile-time error if a case is unhandled.
- **`objectKeys(obj)`** — Type-safe `Object.keys()` that returns `(keyof T)[]` instead of `string[]`.
- **`objectEntries(obj)`** — Type-safe `Object.entries()` that preserves key and value types.
- **`objectFromEntries(entries)`** — Type-safe `Object.fromEntries()` that preserves the object type.
- **`isKey(obj, key)`** — Type guard that checks if a key exists on an object and narrows the type.

### Rules

- Always check `lib/src/utils/` before writing a new utility function. Do not duplicate existing functionality.
- If a new utility is generic enough to be shared, add it to `lib/src/utils/` and export it from `lib/src/index.ts`.
- Use `tryCatch` / `tryCatchAsync` instead of raw try/catch blocks when the tuple return pattern is appropriate.
- Use `raise()` with `??` instead of writing multi-line null-check-and-throw blocks.
- Use `assertNever()` in every switch statement's default case for exhaustive checking.
- Use the typed object helpers (`objectKeys`, `objectEntries`, `objectFromEntries`) instead of their untyped `Object.*` equivalents.
