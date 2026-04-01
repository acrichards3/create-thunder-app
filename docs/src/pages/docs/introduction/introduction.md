# Introduction

Welcome to Vex App — a modern full-stack monorepo template designed to help you build fast, type-safe applications. Think of it as your starting point for building scalable apps with Bun as the runtime, Vite and React for the frontend, Hono for the backend, and a shared TypeScript library to keep everything in sync.

## Motivation

There wasn't a great way to scaffold a Bun-first project that truly prioritized speed and developer experience. Setting this up manually each time a new side project came along was a pain — the goal was a way to get started quickly and jump straight into building.

Bun changes the equation. It's not just faster installs — it's a genuinely different runtime that makes the whole stack feel lighter. Vex App is built around that from the ground up: Bun as the runtime, package manager, test runner, and build tool. Everything is tuned to take full advantage of it.

The other half of the equation is AI. Modern development increasingly means working alongside AI agents, and most scaffolding tools weren't built with that in mind. Vex App ships with the guardrails — strict ESLint rules, Cursor rules, and post-write hooks — that keep AI agents writing production-quality code instead of generating plausible-looking slop. The template isn't just a starting point; it's an environment where AI can build correctly from the first file.

## Strictness

This project is opinionated. TypeScript is non-negotiable, and the TypeScript config and lint rules are as strict as possible. Strict rules keep your intentions crystal clear — they catch bugs early, improve code quality, and make refactoring feel safe instead of scary. It can feel overwhelming at first, but once you get used to it your codebase will be easier to maintain and more enjoyable to work with.

## AI First

Vex App is built for AI-assisted development. Every project ships with the guardrails that keep AI agents producing clean, compliant code. The generator does not ask you to opt in or out of ESLint strictness, Cursor rules, or hooks — those are always part of the template. The only optional AI workflow the CLI prompts for is **spec-first**.

- **Strict ESLint config** — A hardened flat config (`eslint.config.js` per workspace) with custom testing rules where applicable, complexity limits, immutability enforcement, type safety requirements, and more.
- **Cursor rules** — `.cursor/rules/` files tell the AI model how to write for this stack: component organization, Tailwind conventions, type safety patterns, backend architecture layers, and testing conventions.
- **Hooks** — `.cursor/hooks/` and `hooks.json` run pre-write checks, post-write format/lint/typecheck/jscpd, and a stop hook that surfaces ESLint, TypeScript, Prettier, failing tests, and unfilled `it.todo()` issues before the AI considers a turn complete.
- **Spec-first workflow** (optional) — If you enable it when running `bun create vex-app`, the AI is mechanically blocked from writing implementation code until you approve the test spec. The AI writes `it.todo()` branches first, stops and asks for approval, then implements. See the [Testing](/testing) page for how this works.

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
- **Vex spec (`.vex`)**: A small specification language (`describe` / `when` / `and` / `it`) with editor support and a parser in vexkit. See [Vex spec (.vex)](/vex-spec).

With Vex App, skip the setup headaches and jump straight into building the features that matter.
