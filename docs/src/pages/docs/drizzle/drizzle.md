# Drizzle

Thunder App uses [Drizzle ORM](https://orm.drizzle.team) for type-safe database access with PostgreSQL. Drizzle provides a SQL-like query builder that gives you full TypeScript type safety without sacrificing control over your queries.

## Database Setup

### 1. Start PostgreSQL

Make sure PostgreSQL is running locally or via a cloud provider. If you don't have PostgreSQL installed, you can use Docker:

```bash
docker run -d --name postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=thunderapp \
  -p 5432:5432 \
  postgres:17
```

### 2. Configure the Connection

Set `DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/thunderapp
```

### 3. Push the Schema

Push the initial schema to your database:

```bash
bun run db:push
```

This creates all the tables defined in `backend/src/db/schema/`.

## Schema

Database schemas are defined in `backend/src/db/schema/` using Drizzle's table builder. Thunder App includes two schema files out of the box:

### Users

```typescript
// backend/src/db/schema/users.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  id: uuid("id").primaryKey().defaultRandom(),
  image: text("image"),
  name: text("name").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Auth Tables

```typescript
// backend/src/db/schema/auth.ts
```

The auth schema includes tables required by Auth.js:

| Table                      | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `auth_accounts`            | Links OAuth providers (e.g., Google) to user accounts |
| `auth_sessions`            | Stores active database sessions                       |
| `auth_verification_tokens` | For email verification or magic links                 |
| `auth_authenticators`      | For WebAuthn/passkeys (optional)                      |

These tables are managed by Auth.js and the Drizzle adapter — you generally don't need to query them directly.

## Adding a New Table

1. Create a new schema file in `backend/src/db/schema/`:

```typescript
// backend/src/db/schema/posts.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const posts = pgTable("posts", {
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

2. Push the changes to your database:

```bash
bun run db:push
```

## Querying

The Drizzle client is available in every Hono route handler via `c.get("db")`:

```typescript
import { posts } from "./db/schema/posts";
import { eq } from "drizzle-orm";

// Select all
app.get("/api/posts", async (c) => {
  const db = c.get("db");
  const allPosts = await db.select().from(posts);
  return c.json(allPosts);
});

// Select with filter
app.get("/api/posts/:id", async (c) => {
  const db = c.get("db");
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.id, c.req.param("id")));
  return c.json(post[0]);
});

// Insert
app.post("/api/posts", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  const newPost = await db.insert(posts).values(body).returning();
  return c.json(newPost[0], 201);
});

// Update
app.patch("/api/posts/:id", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  const updated = await db
    .update(posts)
    .set(body)
    .where(eq(posts.id, c.req.param("id")))
    .returning();
  return c.json(updated[0]);
});

// Delete
app.delete("/api/posts/:id", async (c) => {
  const db = c.get("db");
  await db.delete(posts).where(eq(posts.id, c.req.param("id")));
  return c.json({ success: true });
});
```

## Database Connection

The database client is initialized in `backend/src/db/index.ts` using Bun's built-in SQL driver:

```typescript
import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";

const client = new SQL(env.DATABASE_URL);
export const db = drizzle({ client });
```

The `db` instance is set as Hono middleware context so it's available in all route handlers without importing it directly.

## Drizzle Config

The Drizzle Kit configuration at `backend/drizzle.config.ts` tells the CLI tools where to find your schema and where to output migrations:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL ?? raise("DATABASE_URL is not set"),
  },
  dialect: "postgresql",
  out: "./src/db/migrations",
  schema: "./src/db/schema/*",
});
```

## Database Commands

| Command               | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `bun run db:push`     | Push schema changes directly to the database (development) |
| `bun run db:generate` | Generate a SQL migration file from schema changes          |
| `bun run db:migrate`  | Run pending migration files against the database           |
| `bun run db:studio`   | Open Drizzle Studio — a visual database browser            |

### Push vs Migrate

- **`db:push`** is ideal during development. It compares your schema files to the live database and applies changes directly. No migration files are generated.
- **`db:generate` + `db:migrate`** is recommended for production. It generates versioned SQL migration files that can be committed, reviewed, and applied in a controlled manner.

## Drizzle Studio

Run `bun run db:studio` to open a visual database browser in your browser. This is useful for inspecting data, running ad-hoc queries, and debugging during development.
