# Vite

Thunder App uses [Vite 5](https://vite.dev) as the frontend build tool. Vite provides fast hot module replacement (HMR) during development and optimized production builds.

## Configuration

The Vite config lives at `frontend/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, ".env") });

const vitePort = process.env.VITE_PORT ? Number(process.env.VITE_PORT) : 5173;

export default defineConfig({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true,
      target: "react",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    cors: false,
    port: vitePort,
    proxy: {
      "/api/auth": {
        changeOrigin: true,
        target: process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
      },
    },
  },
});
```

## Plugins

### TanStack Router Plugin

The `@tanstack/router-plugin/vite` plugin enables file-based routing. It watches `frontend/src/routes/` and automatically generates `routeTree.gen.ts` whenever you add, remove, or rename route files. The `autoCodeSplitting` option ensures each route is lazy-loaded for better performance.

### React Plugin

The `@vitejs/plugin-react` plugin provides React Fast Refresh for instant feedback during development.

## Path Aliases

Two aliases are configured — `@` and `~` — both pointing to `frontend/src/`. The `~` alias is recommended because it is also configured in `tsconfig.json`, giving you full TypeScript support:

```typescript
import { Button } from "~/components/Button";
```

The `@` alias works at runtime (Vite resolves it) but is not in the TypeScript config, so it may cause type-checking errors. Stick with `~` for the best experience.

## Dev Server Proxy

The Vite dev server proxies `/api/auth` requests to the backend. This allows the frontend and backend to share the same origin during development, which is required for Auth.js session cookies to work correctly:

```typescript
proxy: {
  "/api/auth": {
    changeOrigin: true,
    target: process.env.VITE_BACKEND_URL ?? "http://localhost:3000",
  },
},
```

Without this proxy, the browser would treat the frontend and backend as separate origins and block cookies due to same-origin policy.

## Environment Variables

Vite exposes environment variables prefixed with `VITE_` to your application code via `import.meta.env`. Thunder App loads `.env` files using `dotenv` in the Vite config so variables are available at both config time (`process.env`) and runtime (`import.meta.env`).

The Zod schema in `frontend/src/env/schema.ts` defines and validates all frontend environment variables. See the [First Steps](/first-steps) guide for details on adding new variables.

**Important:** All `VITE_` prefixed variables are embedded into the built JavaScript and are visible to anyone using your app. Never put secrets in frontend environment variables.

## Production Build

Build the frontend for production:

```bash
bun run build:frontend
```

This runs TypeScript compilation followed by `vite build`, which outputs optimized assets to `frontend/dist/`. Vite automatically handles:

- Tree-shaking unused code
- Code splitting by route (via TanStack Router)
- CSS minification (Tailwind CSS)
- Asset hashing for cache busting

## Customization

### Changing the Dev Port

Set `VITE_PORT` in `frontend/.env`:

```
VITE_PORT=3001
```

### Adding Vite Plugins

Install the plugin and add it to the `plugins` array in `vite.config.ts`. Make sure to place it in the correct order — the TanStack Router plugin should come first, followed by the React plugin, then any additional plugins.
