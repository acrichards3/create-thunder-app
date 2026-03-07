# First Steps

You've created your Thunder App project and run `bun run dev` — now what? This guide walks you through the most common tasks to start building your app.

## Understand the Monorepo

Thunder App is split into three packages managed by Bun workspaces:

| Package     | Purpose                                  |
| ----------- | ---------------------------------------- |
| `frontend/` | React SPA — UI, routing, data fetching   |
| `backend/`  | Hono API server — routes, database, auth |
| `lib/`      | Shared TypeScript utilities and types    |

Every package can import from `lib` via `@thunder-app/lib`. Changes to `lib` are picked up automatically during development thanks to TypeScript's `--watch` mode.

## Add Environment Variables

Both the frontend and backend validate environment variables at startup using Zod schemas. This means you get immediate, descriptive errors when a variable is missing or invalid.

### Backend

Edit `backend/src/env/env.ts` to add new variables to the `envSchema`:

```typescript
export const envSchema = z.object({
  // ... existing vars
  MY_API_KEY: z.string().min(1),
});
```

Then add the actual value to `backend/.env`. The backend will exit with a clear error message if any variable fails validation.

### Frontend

Edit `frontend/src/env/schema.ts` to add new variables. Remember that all frontend environment variables **must** start with `VITE_` and are publicly visible in the browser:

```typescript
export const envSchema = z.object({
  VITE_BACKEND_URL: z.url(),
  VITE_PORT: z.coerce.number().default(5173),
  VITE_MY_NEW_VAR: z.string().min(1),
} satisfies Record<`VITE_${string}`, z.ZodType<unknown>>);
```

Then add the value to `frontend/.env`. If validation fails, the frontend will render a friendly error page in the browser instead of crashing.

## Add a Frontend Route

Thunder App uses TanStack Router with file-based routing. To add a new page, create a file in `frontend/src/routes/`:

```typescript
// frontend/src/routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main>
      <h1>About</h1>
      <p>This is the about page.</p>
    </main>
  );
}
```

Save the file and TanStack Router's Vite plugin will automatically update the route tree. Navigate to `/about` in your browser — no manual route registration required.

### Nested Routes

Create folders for nested routes:

```
frontend/src/routes/
├── __root.tsx          # Root layout (providers, shared UI)
├── index.tsx           # /
├── about.tsx           # /about
└── settings/
    ├── index.tsx       # /settings
    └── profile.tsx     # /settings/profile
```

## Add a Backend Route

Backend routes are defined in `backend/src/index.ts` using Hono. Add a new route anywhere before the `export default`:

```typescript
app.get("/api/users", async (c) => {
  const db = c.get("db");
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});
```

Protected routes that require authentication go under the `/api/protected/` prefix, which already has the `verifyAuth` middleware applied:

```typescript
app.get("/api/protected/me", async (c) => {
  const auth = c.get("authUser");
  return c.json({ user: auth.session.user });
});
```

## Call the Backend from the Frontend

Use the `apiFetch` utility in `frontend/src/api/client.util.ts` to make type-safe API calls. It automatically handles the base URL, JSON parsing, CSRF tokens, and credentials.

Create a new file for your API call:

```typescript
// frontend/src/api/users.ts
import { apiFetch } from "./client.util";
import { z } from "zod";

const usersSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
);

export const getUsers = async () => {
  const data = await apiFetch("/api/users");
  return usersSchema.parse(data);
};
```

Then use it with React Query in your route component:

```typescript
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/users";

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.map((user) => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

## Share Code via the Lib Package

The `lib` package is the right place for types, utilities, and validation schemas used by both frontend and backend. It's already set up with TypeScript project references so both packages can import from it:

```typescript
import { tryCatchAsync, raise } from "@thunder-app/lib";
```

To add a new utility, create a file in `lib/src/utils/`, export it from `lib/src/index.ts`, and it becomes available in both frontend and backend immediately during development.

## Available Scripts

Run these from the root of the monorepo:

| Command                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `bun run dev`           | Start all dev servers (frontend, backend, lib)   |
| `bun run build`         | Build everything with typechecking and linting   |
| `bun run lint`          | Check Prettier formatting and run ESLint         |
| `bun run lint:fix`      | Auto-fix formatting and lint issues              |
| `bun run test`          | Run all tests across all packages                |
| `bun run test:frontend` | Run tests in the frontend package only           |
| `bun run test:backend`  | Run tests in the backend package only            |
| `bun run test:lib`      | Run tests in the lib package only                |
| `bun run typecheck`     | Run TypeScript type checking across all packages |
| `bun run format`        | Format all files with Prettier                   |
| `bun run db:push`       | Push schema changes to the database              |
| `bun run db:generate`   | Generate a Drizzle migration                     |
| `bun run db:migrate`    | Run pending database migrations                  |
| `bun run db:studio`     | Open Drizzle Studio for visual database browsing |
