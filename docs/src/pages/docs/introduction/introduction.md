# Introduction

Welcome to Vex App — a modern full-stack monorepo template designed to help you build fast, type-safe applications. Think of it as your starting point for building scalable apps with Bun as the runtime, Vite and React for the frontend, Hono for the backend, and a shared TypeScript library to keep everything in sync.

## Motivation

There wasn't a great way to scaffold a Bun-first project that truly prioritized speed and developer experience. Setting this up manually each time a new side project came along was a pain — the goal was a way to get started quickly and jump straight into building.

Bun changes the equation. It's not just faster installs — it's a genuinely different runtime that makes the whole stack feel lighter. Vex App is built around that from the ground up: Bun as the runtime, package manager, test runner, and build tool. Everything is tuned to take full advantage of it.

The other half of the equation is AI. Modern development increasingly means working alongside AI agents, and most scaffolding tools weren't built with that in mind. Vex App ships with the guardrails — strict ESLint rules, Cursor rules, and post-write hooks — that keep AI agents writing production-quality code instead of generating plausible-looking slop. The template isn't just a starting point; it's an environment where AI can build correctly from the first file.

## Strictness

This project is opinionated. TypeScript is non-negotiable, and the TypeScript config and lint rules are as strict as possible. Strict rules keep your intentions crystal clear — they catch bugs early, improve code quality, and make refactoring feel safe instead of scary. It can feel overwhelming at first, but once you get used to it your codebase will be easier to maintain and more enjoyable to work with.

## AI First

Vex App is designed for AI-assisted development. When you select "Use Vex App recommended AI settings" during setup, the CLI configures your project with guardrails that keep AI agents producing clean, compliant code:

- **Strict ESLint config** — A hardened ruleset replaces the default config when AI settings are enabled. It enforces explicit return types, bans type assertions, prevents object and array mutation, limits function complexity, and more. Human developers get a lighter ruleset; AI agents get the strict one.
- **Cursor rules** — A set of `.cursor/rules/` files tell the AI model exactly how to write code for this stack — component organization, Tailwind conventions, type safety patterns, and which ESLint patterns to follow.
- **Post-write hooks** — Four shell scripts (`.cursor/hooks/`) run automatically every time the AI writes a file. They format with Prettier, lint with ESLint (auto-fixing what they can), type-check with `tsc`, and scan for duplicate code with `jscpd`. If any check fails, the write is blocked and the AI gets immediate feedback to fix it.
- **Spec-first workflow** (optional) — When enabled, a pre-write hook blocks the AI from writing any implementation code until a corresponding `.spec.ts` file exists and you've explicitly approved it. The AI writes the test spec first, stops and asks for approval, then implements. Enforcement is mechanical — the AI literally cannot skip the approval step.

The result: AI agents write code that passes the same quality bar as the rest of the codebase, without you having to manually review and fix every file.

See the [AI Integration](/ai) page for a deeper look at how this works and how to get the most out of it.

## Key Features

Here's what you get out of the box:

- **Monorepo Structure**: Everything lives in one place: frontend, backend, and shared lib are all managed with Bun workspaces.
- **Frontend**: React 19 with Vite 5, TanStack Router (file-based routing), Tailwind CSS v4, React Query for data fetching, and Auth.js integration.
- **Backend**: Hono v4 web framework, Drizzle ORM with PostgreSQL, Zod v4 for validation, and Auth.js for authentication.
- **Shared Lib**: Type-safe shared utilities and types between frontend and backend — no duplicating code across packages.
- **Code Quality**: ESLint, Prettier (configured via `.prettierrc`), and strict TypeScript across all packages.
- **Development Tools**: Scripts for dev, build, lint, format, typecheck, and database management — everything you need to get productive fast.

With Vex App, skip the setup headaches and jump straight into building the features that matter.
