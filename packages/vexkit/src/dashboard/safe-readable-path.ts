import { stat } from "node:fs/promises";
import { tryCatchAsync } from "@vex-app/lib";
import {
  joinUnderRoot,
  isPathUnderRoot,
  rootRealAndPrefix,
  segmentsInvalid,
  splitPathSegments,
} from "./assistant-repo-path.js";

type SafeReadableResult = { absolutePath: string; kind: "ok" } | { kind: "error"; message: string };

export async function resolveReadablePathUnderRoot(input: {
  rawRelativePath: string;
  rootAbs: string;
}): Promise<SafeReadableResult> {
  const segments = splitPathSegments(input.rawRelativePath);
  if (segments.length === 0) {
    return { kind: "error", message: "Invalid path." };
  }
  if (segmentsInvalid(segments)) {
    return { kind: "error", message: "Invalid path." };
  }
  if (segments[0] === ".vexkit") {
    return { kind: "error", message: "Path is not allowed." };
  }
  const fileAbs = joinUnderRoot(input.rootAbs, segments);
  const { rootReal, rootWithSeparator } = await rootRealAndPrefix(input.rootAbs);
  const under = await isPathUnderRoot({ absPath: fileAbs, rootReal, rootWithSeparator });
  if (!under) {
    return { kind: "error", message: "Path escapes project root." };
  }
  const [st, stErr] = await tryCatchAsync(async () => stat(fileAbs));
  if (stErr != null) {
    return { kind: "error", message: "File not found." };
  }
  if (!st.isFile()) {
    return { kind: "error", message: "File not found." };
  }
  return { absolutePath: fileAbs, kind: "ok" };
}
