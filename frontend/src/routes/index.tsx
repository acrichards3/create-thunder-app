import { createFileRoute } from "@tanstack/react-router";
import { helloExample } from "../api/hello.example";
import { useQuery } from "@tanstack/react-query";
import { useSession, signIn, signOut } from "@hono/auth-js/react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function handleSignOut(): void {
  void signOut();
}

function handleSignIn(): void {
  void signIn("google");
}

function AuthSection(): ReactNode {
  const { data: session, status: sessionStatus } = useSession();

  if (sessionStatus === "loading") {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />;
  }

  if (session?.user != null) {
    return (
      <div className="flex flex-col items-center gap-4 bg-green-500/10 border border-green-500/50 rounded-lg p-6 max-w-md">
        <span className="text-green-400 text-2xl font-bold">Hello {session.user.name}!</span>
        <span className="text-green-300 text-sm">This is a secret message for authenticated users only!</span>
        <button
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 font-semibold transition-colors cursor-pointer"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 cursor-pointer"
      onClick={handleSignIn}
    >
      Sign in
    </button>
  );
}

function DataSection(): ReactNode {
  const { data, error, isLoading } = useQuery({
    queryFn: helloExample,
    queryKey: ["helloWorld"],
  });
  const { data: session } = useSession();

  if (isLoading) {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />;
  }

  if (error != null) {
    return (
      <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-2 max-w-md">
        <span className="text-red-400 font-semibold">Error loading data</span>
        <span className="text-red-300 p-2 text-sm">{error.message}</span>
      </div>
    );
  }

  if (data != null && session?.user == null) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
        <span className="text-white text-lg">{data.message}</span>
      </div>
    );
  }

  return null;
}

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
