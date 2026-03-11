<div align="center">
  <img src="https://www.vexapp.io/logos/vex-app-logo.png" alt="Vex App Logo" width="200" />
</div>

# Vex App Template

[![npm version](https://img.shields.io/npm/v/create-vex-app)](https://www.npmjs.com/package/create-vex-app)
[![CI](https://github.com/acrichards3/create-vex-app/actions/workflows/ci.yml/badge.svg)](https://github.com/acrichards3/create-vex-app/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/create-vex-app)](./LICENSE)

Stop wrestling with annoying AI slop. Vex App is a Bun-powered full-stack starter kit with Vite + React, Hono, and a shared TypeScript lib, built with strict guardrails that make AI agents write production-quality code from the first keystroke.

**[Documentation](https://www.vexapp.io)**

## 🚀 Quickstart

Create a new app in the current directory (you'll be prompted for a name):

```bash
bun create vex-app@latest
```

Or specify the name directly:

```bash
bun create vex-app@latest my-app
```

The generator will:

- Copy the template into `./my-app` (or the name you provide)
- Rename all package scopes to `@<your-app>/...`
- Seed env files with sensible defaults
- Optionally include GitHub CI/CD pipeline
- Optionally configure AI settings (strict ESLint, Cursor rules, post-write hooks)
- Optionally enable the spec-first workflow (AI writes test specs before implementing)
- Ask to run `bun install` (workspaces) and optionally build `lib`

## 📁 Project Structure

```
my-app/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── routes/          # File-based routes (TanStack Router)
│   │   │   ├── __root.tsx   # Root layout (providers, shared UI)
│   │   │   └── index.tsx    # Home page (/)
│   │   ├── api/             # API call utilities
│   │   ├── components/      # Reusable UI components
│   │   └── env/             # Environment variable validation
│   │       ├── schema.ts    # Zod schema (edit this to add vars)
│   │       ├── validate.ts  # Validation logic
│   │       └── env.ts       # Typed env object
│   └── vite.config.ts       # Vite config (plugins, proxy, aliases)
├── backend/                 # Hono API server
│   ├── src/
│   │   ├── index.ts         # Server entry (CORS, CSRF, auth, routes)
│   │   ├── db/schema/       # Drizzle ORM table definitions
│   │   ├── env/             # Environment variable validation
│   │   └── security/        # Rate limiting, token encryption, hashing
│   └── drizzle.config.ts    # Drizzle Kit config
├── lib/                     # Shared TypeScript utilities and types
│   └── src/
│       ├── utils/           # assertNever, raise, tryCatch, objectUtils
│       └── types/           # Shared types (User, etc.)
├── scripts/                 # Dev script (parallel service runner)
├── .cursor/rules/           # Cursor AI rules for project conventions
├── .cursor/hooks/           # Pre-write and post-write hooks (ESLint, Prettier, tsc, jscpd, spec enforcement)
├── .spec-pending            # Spec-first workflow lock file (git-ignored, only if spec-first enabled)
├── .jscpd.json              # Duplicate code detection config
├── .github/workflows/       # CI/CD pipeline
├── package.json             # Root workspace config & scripts
├── tsconfig.json            # TypeScript project references
├── .prettierrc              # Prettier config
└── .prettierignore          # Files excluded from Prettier
```

## 💻 Development Commands (run from repo root)

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `bun run dev`            | Start frontend, lib, and backend                 |
| `bun run dev:frontend`   | Start only the frontend (Vite, port 5173)        |
| `bun run dev:backend`    | Start only the backend (Hono, port 3000)         |
| `bun run dev:lib`        | Watch mode for lib package (rebuilds on changes) |
| `bun run build`          | Build all packages (includes typecheck & lint)   |
| `bun run build:all`      | Build all packages without typecheck/lint        |
| `bun run build:frontend` | Build only the frontend package                  |
| `bun run build:backend`  | Build only the backend package                   |
| `bun run build:lib`      | Build only the lib package                       |
| `bun run typecheck`      | Type check all packages                          |
| `bun run test`           | Run all tests across all packages                |
| `bun run test:frontend`  | Run tests in the frontend package only           |
| `bun run test:backend`   | Run tests in the backend package only            |
| `bun run test:lib`       | Run tests in the lib package only                |
| `bun run lint`           | Lint all packages (format check + ESLint)        |
| `bun run lint:fix`       | Auto-fix linting issues                          |
| `bun run format`         | Format all files with Prettier                   |
| `bun run format:check`   | Check formatting without fixing                  |

### Database Commands

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `bun run db:generate` | Generate database migrations    |
| `bun run db:migrate`  | Run database migrations         |
| `bun run db:push`     | Push schema changes to database |
| `bun run db:studio`   | Open Drizzle Studio             |

## 📦 Using the Shared Library Package

The `lib` package contains shared TypeScript utilities that can be imported in both the frontend and backend:

```typescript
import { raise, tryCatch, tryCatchAsync, assertNever } from "@your-project/lib";
import type { User } from "@your-project/lib";
```

**Important:** If you make changes to the `lib` package, you must rebuild it:

```bash
bun run build:lib
```

Or run it in watch mode during development (already included in `bun run dev`):

```bash
bun run dev:lib
```

## 🗄️ Database Setup

This template uses **Drizzle ORM** with **PostgreSQL**. The database schema is defined in `backend/src/db/schema/`.

### Setup Steps

1. **Set up your database** (local PostgreSQL or cloud provider)

2. **Configure environment variables** in `backend/.env` (see [Environment Variables](#-environment-variables) section)

3. **Create your schema** in `backend/src/db/schema/` (e.g., `users.ts`, `posts.ts`)

4. **Push schema to database:**

   ```bash
   bun run db:push
   ```

   Or generate and run migrations:

   ```bash
   bun run db:generate
   bun run db:migrate
   ```

5. **Open Drizzle Studio** to view/edit data:

   ```bash
   bun run db:studio
   ```

## 🔐 Authentication Setup

This template includes **Auth.js** (formerly NextAuth) integration with **Google OAuth** as the default provider. Authentication uses database sessions for secure, server-side session management.

### Backend Setup

1. **Set up Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret

2. **Configure backend environment variables** in `backend/.env`:

   ```bash
   AUTH_SECRET=your-auth-secret-here  # Generate with: openssl rand -base64 32
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   PORT=3000
   ```

3. **Push the auth schema to your database:**

   ```bash
   bun run db:push
   ```

### Frontend Setup

1. **Configure frontend environment variables** in `frontend/.env`:

   ```bash
   VITE_BACKEND_URL=http://localhost:3000
   VITE_PORT=5173
   ```

2. **The frontend is already configured** with `SessionProvider` (in `__root.tsx`) and auth hooks. The sign-in button and session management are ready to use.

3. **Vite proxy is configured** — Auth API requests (`/api/auth/*`) are automatically proxied to the backend via `vite.config.ts`. This allows the frontend to use relative URLs for auth endpoints.

### Adding More Providers

To add additional OAuth providers (GitHub, Discord, etc.):

1. **Add provider to backend** in `backend/src/index.ts`:

   ```typescript
   import GitHub from "@auth/core/providers/github";

   providers: [
     Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
     GitHub({ clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }),
   ],
   ```

2. **Add environment variables** to `backend/src/env/env.ts` (schema) and `backend/.env` (values)

3. **Update the frontend sign-in button:**

   ```typescript
   <button onClick={() => signIn("github")}>Sign in with GitHub</button>
   ```

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library
- **Vite 5** - Build tool and dev server
- **TypeScript 5.9** - Type safety
- **TanStack Router** - File-based routing with automatic code splitting
- **TanStack Query (React Query)** - Data fetching and caching
- **Tailwind CSS v4** - Styling
- **Zod v4** - Runtime type validation
- **@hono/auth-js/react** - Auth.js React client hooks

### Backend

- **Hono v4** - Fast web framework
- **TypeScript 5.9** - Type safety
- **Drizzle ORM** - Type-safe SQL ORM
- **PostgreSQL** - Database (via Bun's built-in SQL driver)
- **Zod v4** - Runtime type validation
- **Auth.js (@hono/auth-js)** - Authentication framework
- **@auth/drizzle-adapter** - Drizzle adapter for Auth.js

### Shared

- **Bun** - Runtime and package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🔒 Security Defaults

Out of the box, the backend enables several defenses:

- Secure headers via `hono/secure-headers`
- CSRF protection via `hono/csrf`; the frontend sends `X-CSRF-Token` on mutating requests
- CORS restricted to `FRONTEND_URL` with credentials and `X-CSRF-Token` allowed
- Rate limiting on `/api/auth/*` (10 requests / 60s per IP+path) to mitigate brute force and callback abuse
- Sessions and verification tokens are stored as SHA-256 hashes (no plaintext)
- OAuth tokens (access/refresh/id) can be encrypted at rest (AES-256-GCM) when you set `OAUTH_TOKEN_ENCRYPTION_KEY`

Recommended hardening for production (left to end users):

- Add a Content Security Policy (CSP) with nonces for scripts
- Consider an Origin/Referer check for POST/PUT/PATCH/DELETE as defense-in-depth
- Ensure cookies are `Secure`, `HttpOnly`, and `SameSite=Lax/Strict` behind HTTPS
- If deploying multiple instances, replace in-memory rate limiting with a shared store (e.g., Redis)

## 🔧 Environment Variables

### Backend (`backend/.env`)

```bash
# Authentication
AUTH_SECRET=               # Generate with: openssl rand -base64 32

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Environment
ENVIRONMENT=development    # development | production | testing

# Frontend URL (for CORS and auth redirects)
FRONTEND_URL=http://localhost:5173

# Google OAuth (required)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Token encryption (optional — encrypts OAuth tokens at rest)
OAUTH_TOKEN_ENCRYPTION_KEY=   # Generate with: openssl rand -base64 32

# Server
PORT=3000
```

**Required variables:**

- `AUTH_SECRET` - Secret for signing sessions (generate with `openssl rand -base64 32`)
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional variables:**

- `ENVIRONMENT` - Runtime environment (default: `development`)
- `FRONTEND_URL` - Frontend URL for redirects (default: `http://localhost:5173`)
- `OAUTH_TOKEN_ENCRYPTION_KEY` - Encrypts OAuth tokens at rest with AES-256-GCM
- `PORT` - Backend server port (default: `3000`)

### Frontend (`frontend/.env`)

```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_PORT=5173
```

- `VITE_BACKEND_URL` - Backend API URL (**required**)
- `VITE_PORT` - Frontend dev server port (default: `5173`)

Environment variables are validated at startup with Zod. The backend logs errors and exits; the frontend renders a friendly error page in the browser. Edit `frontend/src/env/schema.ts` to add new frontend variables.

**Note:** All `VITE_` variables are embedded in the client bundle and publicly visible. Never put secrets in frontend env vars. Restart the dev server after changing `.env` files.

## 📝 Code Quality

- **TypeScript** - Strict mode enabled across all packages
- **ESLint** - Type-aware linting across workspaces (TS project aware):
  - Prefer `??` over `||` for defaulting
  - Flag impossible conditions (`@typescript-eslint/no-unnecessary-condition`)
  - Enforce `import type` when symbols are used as types only
  - Alphabetical key sorting for cleaner diffs
- **Prettier** - Automatic code formatting (configured via `.prettierrc`)
- **Type checking** - Run `bun run typecheck` to verify all packages

## 🤖 AI Integration

When you select "Use Vex App recommended AI settings" during setup, the CLI configures your project for AI-assisted development:

- **Strict ESLint config** — Swaps in a hardened ruleset with `sonarjs`, `unicorn`, and `perfectionist` plugins. Enforces explicit return types, bans type assertions, prevents mutation, bans raw `try/catch` blocks (use `tryCatch`/`tryCatchAsync` utilities instead), limits complexity, and more. Designed to catch the mistakes AI models make most often.
- **Cursor rules** (`.cursor/rules/`) — `.mdc` files with frontmatter that Cursor automatically injects into the AI model's context. Cover component organization, Tailwind conventions, type safety patterns, Zod v4 usage, Bun APIs, backend architecture, and testing conventions.
- **Spec-first workflow** (optional) — When enabled, the AI writes empty test specs (WHEN/AND/it decision trees) for every logical layer before writing any implementation code, then stops and asks you to approve the paths before building. Enforcement is mechanical — a pre-write hook blocks all implementation writes until you approve, using a git-ignored `.spec-pending` marker file at the repo root.
- **Post-write hooks** (`.cursor/hooks/`) — Four shell scripts that run automatically after every AI file write:
  1. **Prettier** — Auto-formats the file
  2. **ESLint** — Auto-fixes what it can, blocks the write if errors remain
  3. **TypeScript** — Runs `tsc --noEmit`, blocks on type errors
  4. **jscpd** — Detects duplicate code, blocks if clones are found
- **Duplicate detection** (`.jscpd.json`) — Configures thresholds for copy-paste detection

If you opt out of AI settings, you get the standard ESLint config without extra plugins and no `.cursor/` directory.

> **Note:** The hooks require `jq` to be installed on your system. Most macOS and Linux systems have it pre-installed.

## 🔧 Publishing This Template (For Maintainers)

To publish this template to npm so others can use it:

1. **Make sure you're logged into npm:**

   ```bash
   npm login
   ```

2. **Bump the version and publish to npm:**

   ```bash
   npm version patch   # or minor/major as appropriate
   npm publish --access public
   git push --follow-tags
   ```

3. **Users can then create projects with:**
   ```bash
   bun create vex-app@latest
   ```

Note: The package name is `create-vex-app`, but users call it with `bun create vex-app` (Bun automatically prepends `create-`).
