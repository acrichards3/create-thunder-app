import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { SessionProvider } from "@hono/auth-js/react";
import { queryClient } from "~/api/queryClient";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

const RootLayout = (): ReactNode => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </QueryClientProvider>
  );
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});
