# Bun

Vex App uses [Bun](https://bun.sh) as both the JavaScript runtime and package manager. Bun's speed advantages apply across the entire development workflow — installing dependencies, running the dev server, executing TypeScript directly, and running the backend in production.

## Why Bun?

- **Fast installs** — Bun's package manager installs dependencies significantly faster than npm or yarn
- **Native TypeScript** — Bun executes `.ts` files directly without a compilation step
- **Built-in tooling** — Test runner, bundler, and SQLite driver are all included
- **npm compatible** — Full compatibility with the npm registry and `node_modules`

## Workspaces

Vex App is a monorepo managed with Bun workspaces. The root `package.json` declares the three packages:

```json
{
  "workspaces": ["frontend", "lib", "backend"]
}
```

This allows all packages to share a single `node_modules` tree and `bun.lock` file. Cross-package dependencies use the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@vex-app/lib": "workspace:*"
  }
}
```

## Installing Dependencies

Always install dependencies from the **root** of the monorepo:

```bash
bun install
```

To add a dependency to a specific package, use `--filter`:

```bash
# Add to frontend
bun add react-icons --filter @vex-app/frontend

# Add a dev dependency to backend
bun add -D @types/node --filter @vex-app/backend
```

## Running Scripts

Bun provides several ways to run scripts across the monorepo:

```bash
# Run a script from the root package.json
bun run dev

# Run a script in a specific package
bun run --filter @vex-app/frontend dev

# Run a script in all packages that have it
bun run --filter '*' lint
```

The root `package.json` provides convenience scripts that wrap the most common commands:

| Command             | What it does                             |
| ------------------- | ---------------------------------------- |
| `bun run dev`       | Starts all three dev servers in parallel |
| `bun run build`     | Full production build with checks        |
| `bun run lint`      | Prettier + ESLint across all packages    |
| `bun run test`      | Run all tests across all packages        |
| `bun run typecheck` | TypeScript check across all packages     |

## The Dev Script

The `bun run dev` command runs `scripts/dev.ts`, a custom script that starts all three services in parallel with color-coded, labeled output:

```
╔════════════════════════════════════════╗
║   Starting Development Servers         ║
╚════════════════════════════════════════╝

[⚛️ Frontend]  → http://localhost:5173
[🚀 Backend]  → http://localhost:3000
[📦 Lib]      → Watching for changes
```

Press `Ctrl+C` to stop all services at once.

## Backend Runtime

The backend runs directly on Bun's HTTP server. The entry point exports a `fetch` handler and port, which Bun picks up automatically:

```typescript
export default {
  fetch: app.fetch,
  port: env.PORT,
};
```

In development, `bun --hot src/index.ts` hot-reloads changed modules in-place without restarting the process — the TCP port stays open the entire time. In production, `bun run dist/index.js` runs the compiled output.

## Bun vs Node.js

Vex App uses Bun as the primary runtime, but Node.js (v22+) is still recommended as a prerequisite for some tooling that may not yet support Bun natively. The frontend build (Vite) and linting (ESLint) work with both runtimes.

## Key Bun Features Used

### Direct TypeScript Execution

Bun runs `.ts` files without a separate compile step. The dev script, backend server, and CLI are all TypeScript files executed directly:

```bash
bun scripts/dev.ts
bun --hot src/index.ts
```

### Bun SQL

The backend uses Bun's built-in `SQL` class (from the `bun` package) for PostgreSQL connections, which is then wrapped by Drizzle ORM:

```typescript
import { SQL } from "bun";
const client = new SQL(env.DATABASE_URL);
```

### Crypto

The backend's security module uses `Bun.CryptoHasher` for SHA-256 hashing of session tokens:

```typescript
new Bun.CryptoHasher("sha256").update(value).digest("hex");
```
