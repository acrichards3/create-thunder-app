/**
 * You probably won't need to touch this file. Edit schema.ts to add or change env variables.
 */
import { envSchema } from "./schema";

export type EnvIssue = { message: string; path: string };

const getEnvSource = (): Record<string, unknown> => {
  if (typeof window !== "undefined") {
    return import.meta.env;
  }

  try {
    if (typeof process !== "undefined") {
      return process.env;
    }
  } catch {
    return import.meta.env;
  }

  return import.meta.env;
};

const result = envSchema.safeParse(getEnvSource());

export const envIssues: EnvIssue[] = result.success
  ? []
  : result.error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.join("."),
    }));
