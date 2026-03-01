import { helloExample } from "../api/hello.example";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@hono/auth-js/react";
import type { ReactNode } from "react";

export function DataSection(): ReactNode {
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
