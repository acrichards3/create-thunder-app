# TypeScript

Vex App is built with strict TypeScript from top to bottom. Every package — frontend, backend, and lib — shares a common base configuration with additional strictness rules enforced by ESLint.

## Configuration

### Root `tsconfig.json`

The root config defines shared compiler options and ties the three packages together using TypeScript project references:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "references": [{ "path": "./frontend" }, { "path": "./lib" }, { "path": "./backend" }]
}
```

Each package extends this base config and adds its own settings.

### Frontend

The frontend config adds DOM types, React JSX support, and path aliases:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "composite": true,
    "paths": {
      "@vex-app/lib": ["../lib/dist/index.d.ts"],
      "~/*": ["src/*"]
    }
  },
  "include": ["src", "vite.config.ts"],
  "references": [{ "path": "../lib" }]
}
```

You can import from `~/components/Button` as a shorthand for `src/components/Button`.

### Backend

The backend config adds Bun types and emits compiled JavaScript:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "types": ["bun-types", "node"],
    "paths": {
      "~/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../lib" }]
}
```

The backend also has a `tsconfig.build.json` that extends `tsconfig.json` and excludes `*.spec.ts` files from the compiled output:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["**/*.spec.ts"]
}
```

The `build` and `typecheck` scripts use `tsconfig.build.json` to keep test files out of `dist/`. The main `tsconfig.json` intentionally includes spec files so the IDE resolves `~/` path aliases inside them correctly.

### Lib

The lib config emits declarations and source maps so both frontend and backend get full type information:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "noEmit": false
  },
  "include": ["src/**/*"]
}
```

## Project References

TypeScript project references allow the compiler to understand the dependency graph between packages:

```
frontend ──references──▸ lib
backend  ──references──▸ lib
root     ──references──▸ frontend, lib, backend
```

When you run `bun run typecheck` from the root, TypeScript checks all three packages in dependency order. The `composite` flag in each package enables incremental builds so subsequent checks are faster.

## Strict Mode

The following strictness flags are enabled across all packages:

| Flag                               | Effect                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| `strict`                           | Enables all strict type-checking options                    |
| `noImplicitAny`                    | Errors on expressions with an implied `any` type            |
| `strictNullChecks`                 | Makes `null` and `undefined` distinct types                 |
| `noFallthroughCasesInSwitch`       | Errors on fallthrough cases in switch statements (frontend) |
| `forceConsistentCasingInFileNames` | Ensures imports match file casing exactly                   |
| `isolatedModules`                  | Ensures each file can be transpiled independently           |

These settings catch a large class of bugs at compile time. They may feel strict at first, but they make refactoring safer and reduce runtime errors significantly.

## Type Checking

Run a full type check across all packages:

```bash
bun run typecheck
```

This runs `tsc -b` (build mode) which follows project references and checks everything in the correct order. It also cleans the build cache first to avoid stale results.

## Path Aliases

Both frontend and backend support the `~/` alias, which maps to `src/`:

```typescript
// Instead of relative paths like this:
import { Button } from "../../../components/Button";

// Use the alias:
import { Button } from "~/components/Button";
```

The lib package is available everywhere via `@vex-app/lib`:

```typescript
import { tryCatch, raise } from "@vex-app/lib";
import type { User } from "@vex-app/lib";
```

## Adding Types to the Lib Package

To share types between frontend and backend:

1. Create or edit a file in `lib/src/types/`:

```typescript
// lib/src/types/post.ts
export type Post = {
  content: string;
  createdAt: Date;
  id: string;
  title: string;
};
```

2. Export it from `lib/src/index.ts`:

```typescript
export type { Post } from "./types/post";
```

3. Import it in either package:

```typescript
import type { Post } from "@vex-app/lib";
```

The lib runs in watch mode during development, so the type becomes available immediately.
