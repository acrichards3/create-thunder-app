# Introduction

Welcome to Thunder App — a modern full-stack monorepo template designed to help you build fast, type-safe applications. Think of it as your starting point for building scalable apps with Bun as the runtime, Vite and React for the frontend, Hono for the backend, and a shared TypeScript library to keep everything in sync.

## Motivation

There wasn't a great way to scaffold a Bun-first project that truly prioritized speed and developer experience. Setting this up manually each time a new side project came along was a pain — the goal was a way to get started quickly and jump straight into building. Speed and Bun were the main drivers. Thunder App takes full advantage of Bun's performance while giving you a modern, type-safe development experience.

This project takes a lot of inspiration from [create-t3-app](https://create.t3.gg/), which has done an amazing job making typesafe Next.js apps easy to set up. Thunder App follows similar principles but is built specifically for the Bun ecosystem, giving you a fast, modular approach to full-stack TypeScript development.

## Strictness

This project is opinionated. TypeScript is non-negotiable, and the TypeScript config and lint rules are as strict as possible. Strict rules keep your intentions crystal clear — they catch bugs early, improve code quality, and make refactoring feel safe instead of scary. It can feel overwhelming at first, but once you get used to it your codebase will be easier to maintain and more enjoyable to work with.

## Key Features

Here's what you get out of the box:

- **Monorepo Structure**: Everything lives in one place: frontend, backend, and shared lib are all managed with Bun workspaces.
- **Frontend**: React 19 with Vite 5, Tailwind CSS v4, React Query for data fetching, and Auth.js integration.
- **Backend**: Hono v4 web framework, Drizzle ORM with PostgreSQL, Zod v4 for validation, and Auth.js for authentication.
- **Shared Lib**: Type-safe shared utilities and types between frontend and backend — no duplicating code across packages.
- **Code Quality**: ESLint, Prettier (configured via `.prettierrc`), and strict TypeScript across all packages.
- **Development Tools**: Scripts for dev, build, lint, format, typecheck, and database management — everything you need to get productive fast.

With Thunder App, skip the setup headaches and jump straight into building the features that matter.
