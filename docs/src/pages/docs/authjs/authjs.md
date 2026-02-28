# Auth.js

Thunder App uses [Auth.js](https://authjs.dev) (formerly NextAuth) for authentication, integrated with the Hono backend via `@hono/auth-js`. The setup includes database sessions, Google OAuth, and additional security features like session token hashing and optional OAuth token encryption.

## Setup

### 1. Create a Google OAuth Application

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google` for local development
4. Copy the Client ID and Client Secret

### 2. Configure Environment Variables

Add the following to `backend/.env`:

```
AUTH_SECRET="your-secret-here"          # openssl rand -base64 32
DATABASE_URL=postgresql://user:password@localhost:5432/thunderapp
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
FRONTEND_URL=http://localhost:5173
```

The `AUTH_SECRET` is used to sign session tokens. Generate a strong one:

```bash
openssl rand -base64 32
```

### 3. Push the Auth Schema

The auth tables (`auth_accounts`, `auth_sessions`, `auth_verification_tokens`, `auth_authenticators`) are already defined in `backend/src/db/schema/auth.ts`. Push them to your database:

```bash
bun run db:push
```

### 4. Sign In

Start the dev server (`bun run dev`) and click the **Sign in** button on the frontend. You'll be redirected to Google's OAuth consent screen. After authorizing, you'll be redirected back and signed in.

## How It Works

### Auth Flow

1. The frontend calls `/api/auth/signin/google` (proxied through Vite to the backend)
2. The backend redirects to Google's OAuth consent screen
3. After authorization, Google redirects back to `/api/auth/callback/google`
4. Auth.js creates a user record, links the OAuth account, and creates a database session
5. A session cookie is set and the user is redirected to the frontend

### Session Strategy

Thunder App uses **database sessions** (not JWTs). Sessions are stored in the `auth_sessions` table and looked up on each request. This means you can:

- Revoke sessions server-side
- See all active sessions for a user
- Enforce session limits

### Frontend Integration

The frontend uses `@hono/auth-js/react` to access session state:

```typescript
import { useSession, signIn, signOut } from "@hono/auth-js/react";

function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (session?.user) {
    return (
      <div>
        <p>Signed in as {session.user.name}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return <button onClick={() => signIn("google")}>Sign in</button>;
}
```

The `SessionProvider` is already set up in `frontend/src/routes/__root.tsx`, so `useSession` works in any route component.

### Auth Proxy

The Vite dev server proxies `/api/auth` requests to the backend so that auth cookies work during local development (same origin). This is configured in `frontend/vite.config.ts`:

```typescript
proxy: {
  "/api/auth": {
    changeOrigin: true,
    target: process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
  },
},
```

## Protected Routes

### Backend

Any route under `/api/protected/*` requires a valid session. The `verifyAuth` middleware is already applied:

```typescript
app.use("/api/protected/*", verifyAuth());

app.get("/api/protected/me", async (c) => {
  const auth = c.get("authUser");
  return c.json({
    email: auth.session.user.email,
    name: auth.session.user.name,
  });
});
```

If the user is not authenticated, the middleware returns a `401 Unauthorized` response.

### Frontend

On the frontend, use `useSession` to conditionally render content or redirect unauthenticated users:

```typescript
const { data: session, status } = useSession();

if (status === "loading") return <LoadingSpinner />;
if (!session?.user) return <Navigate to="/login" />;
```

## Security

Thunder App adds several security layers on top of Auth.js.

### Session Token Hashing

Session tokens are hashed with SHA-256 before being stored in the database. This means even if the database is compromised, session tokens cannot be stolen and replayed. The hashing is transparent — Auth.js sends the plain token to the client, and the `secureAdapter` hashes it when reading/writing to the database.

### OAuth Token Encryption

If you set `OAUTH_TOKEN_ENCRYPTION_KEY` in `backend/.env`, OAuth tokens (`access_token`, `refresh_token`, `id_token`) are encrypted with AES-256-GCM before being stored. This protects tokens at rest:

```
OAUTH_TOKEN_ENCRYPTION_KEY="your-encryption-key"  # openssl rand -base64 32
```

This is optional — if the key is not set, tokens are stored in plain text (which is the Auth.js default behavior).

### Rate Limiting

Auth endpoints (`/api/auth/*`) are rate-limited to 10 requests per 60 seconds per IP. This prevents brute-force attacks:

```typescript
app.use("/api/auth/*", rateLimit({ limit: 10, windowMs: 60_000 }));
```

### CSRF Protection

Hono's built-in CSRF middleware is enabled globally. The frontend's `apiFetch` utility automatically attaches CSRF tokens to mutating requests (POST, PUT, PATCH, DELETE).

### Secure Headers

Security headers are set on all responses via Hono's `secureHeaders` middleware, including `X-Content-Type-Options`, `X-Frame-Options`, and others.

## Adding a Provider

To add another OAuth provider (e.g., GitHub):

1. Install the provider (if not already available via `@auth/core`):

```bash
bun add @auth/core --filter @thunder-app/backend
```

2. Import and add it to the `providers` array in `backend/src/index.ts`:

```typescript
import GitHub from "@auth/core/providers/github";

providers: [
  Google({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }),
  GitHub({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }),
],
```

3. Add the new environment variables to `backend/src/env/env.ts` and `backend/.env`.

4. Update the frontend sign-in button:

```typescript
<button onClick={() => signIn("github")}>Sign in with GitHub</button>
```

## Redirect Behavior

After sign-in or sign-out, Auth.js redirects the user back to the frontend. The redirect callback in `backend/src/index.ts` ensures users always end up at the frontend URL, not the backend:

```typescript
callbacks: {
  async redirect({ baseUrl, url }) {
    const frontendUrl = env.FRONTEND_URL;
    if (url.startsWith("/")) return `${frontendUrl}${url}`;
    // ... always redirect to frontend
    return frontendUrl;
  },
},
```
