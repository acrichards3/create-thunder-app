import { useSession, signIn, signOut } from "@hono/auth-js/react";
import type { ReactNode } from "react";

function handleSignOut(): void {
  void signOut();
}

function handleSignIn(): void {
  void signIn("google");
}

export function AuthSection(): ReactNode {
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
