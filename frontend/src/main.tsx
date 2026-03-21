import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { EnvError } from "./components/EnvError";
import { envIssues } from "./env/validate";
import { raise } from "@vex-app/lib";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./api/queryClient";

const router = createRouter({ context: { queryClient }, routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root") ?? raise("Root element not found"));

if (envIssues.length > 0) {
  root.render(
    <React.StrictMode>
      <EnvError issues={envIssues} />
    </React.StrictMode>,
  );
} else {
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}
