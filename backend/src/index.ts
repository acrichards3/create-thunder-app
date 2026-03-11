import Google from "@auth/core/providers/google";
import { accounts, sessions, verificationTokens } from "./db/schema/auth";
import { cors } from "hono/cors";
import { createSecureAdapter } from "./security/secureAdapter";
import { csrf } from "hono/csrf";
import { db } from "./db/index";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { env } from "./env/env";
import { Hono } from "hono";
import { authHandler, initAuthConfig, verifyAuth } from "@hono/auth-js";
import { rateLimit } from "./security/rateLimit";
import { secureHeaders } from "hono/secure-headers";
import { tryCatchAsync } from "@vex-app/lib";
import { users } from "./db/schema/users";

const app = new Hono<{ Variables: { db: typeof db } }>();

const resolveOrigin = (origin: string): string | null => {
  if (env.ENVIRONMENT !== "development") {
    return origin === env.FRONTEND_URL ? origin : null;
  }
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) ? origin : null;
};

app.use(
  "*",
  cors({
    allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    origin: resolveOrigin,
  }),
);

app.use("*", secureHeaders());
app.use("*", csrf());

app.use(
  "/api/auth/*",
  rateLimit({
    keyGenerator: undefined,
    limit: 10,
    windowMs: 60_000,
  }),
);

app.use("*", async (c, next): Promise<void> => {
  c.set("db", db);
  await next();
});

app.use(
  "*",
  initAuthConfig((_c) => ({
    adapter: createSecureAdapter(
      DrizzleAdapter(db, {
        accountsTable: accounts,
        sessionsTable: sessions,
        usersTable: users,
        verificationTokensTable: verificationTokens,
      }),
      { oauthEncryptionKey: env.OAUTH_TOKEN_ENCRYPTION_KEY },
    ),
    basePath: "/api/auth",
    callbacks: {
      redirect({ baseUrl, url }): string {
        const frontendUrl = env.FRONTEND_URL;
        const frontendOrigin = new URL(frontendUrl).origin;
        const backendOrigin = new URL(baseUrl).origin;
        if (url.startsWith("/")) {
          return `${frontendUrl}${url}`;
        }
        const urlObj = new URL(url);
        if (urlObj.origin === backendOrigin) {
          return frontendUrl;
        }
        if (urlObj.origin === frontendOrigin) {
          return url;
        }
        return frontendUrl;
      },
    },
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    secret: env.AUTH_SECRET,
    session: { strategy: "database" },
    trustHost: env.ENVIRONMENT === "development",
  })),
);

app.use("/api/auth/*", authHandler());
app.use("/api/protected/*", verifyAuth());

app.get("/", (c) => {
  return c.json({ message: "Hello from Hono!" });
});

const isPortTaken = async (port: number): Promise<boolean> => {
  const [socket] = await tryCatchAsync(() =>
    Bun.connect({
      hostname: "localhost",
      port,
      socket: {
        close: () => {},
        data: () => {},
        error: () => {},
        open: (s) => {
          s.end();
        },
      },
    }),
  );
  return socket !== null;
};

const findFreePort = async (port: number): Promise<number> => {
  const taken = await isPortTaken(port);
  return taken ? findFreePort(port + 1) : port;
};

const port = await findFreePort(env.PORT);

if (port !== env.PORT) {
  process.stdout.write(`Port ${String(env.PORT)} is in use, using port ${String(port)}\n`);
}

process.stdout.write(`Listening on port ${String(port)}\n`);

export default {
  fetch: app.fetch,
  port,
};
