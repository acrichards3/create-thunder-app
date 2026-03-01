import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { SessionProvider } from "@hono/auth-js/react";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout(): ReactNode {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </QueryClientProvider>
  );
}
