import type { EnvIssue } from "../env/validate";
import type { ReactNode } from "react";

export function IssueRow({ issue }: { issue: EnvIssue }): ReactNode {
  return (
    <li className="flex gap-2">
      <span className="text-red-400">{issue.path}</span>
      <span className="text-neutral-500">&mdash;</span>
      <span className="text-neutral-400">{issue.message}</span>
    </li>
  );
}
