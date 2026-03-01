import type { EnvIssue } from "../env/validate";
import type { ReactNode } from "react";
import { IssueRow } from "./IssueRow";

export function EnvError({ issues }: { issues: EnvIssue[] }): ReactNode {
  return (
    <div className="bg-zinc-900 text-neutral-200 flex flex-col font-mono text-sm gap-4 min-h-screen p-12">
      <h1 className="text-red-400 text-xl font-bold">Invalid Environment Variables</h1>
      <p className="text-neutral-400">
        The following environment variables are missing or invalid. Check your <code>frontend/.env</code> file.
      </p>
      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {issues.map((issue) => (
          <IssueRow issue={issue} key={issue.path} />
        ))}
      </ul>
    </div>
  );
}
