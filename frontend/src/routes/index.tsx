import { createFileRoute } from "@tanstack/react-router";
import { AuthSection } from "../components/AuthSection";
import { DataSection } from "../components/DataSection";
import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home(): ReactNode {
  return (
    <main className="flex flex-1 flex-col items-center gap-4 justify-center px-4 py-8">
      <img alt="Thunder App Logo" className="h-24 w-24 drop-shadow-lg" src="/thunder-app-logo.png" />
      <h1 className="text-7xl p-2 font-bold text-white drop-shadow-md">Welcome to Thunder App!</h1>
      <span className="text-gray-300 p-4 text-lg">Your modern full-stack application template</span>
      <AuthSection />
      <DataSection />
    </main>
  );
}
