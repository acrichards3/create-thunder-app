import { tryCatchAsync } from "@thunder-app/lib";
import { z } from "zod";
import { env } from "../env/env";

const errorResponseSchema = z.object({
  message: z.unknown().optional(),
});

const CSRF_COOKIE_NAMES = ["csrf-token", "XSRF-TOKEN", "_csrf", "csrfToken"];
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const getCookie = (name: string): string | undefined => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

const getCsrfToken = (): string | undefined => {
  const found = CSRF_COOKIE_NAMES.map(getCookie).find((v) => v != null);
  if (found == null) {
    return undefined;
  }
  return decodeURIComponent(found);
};

const buildHeaders = (init: RequestInit | undefined, method: string): Headers => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (MUTATION_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token != null && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", token);
    }
  }

  return headers;
};

const parseErrorMessage = async (response: Response, isJson: boolean): Promise<string> => {
  const [body] = isJson ? await tryCatchAsync<unknown>(() => response.json()) : [null];
  const parsed = errorResponseSchema.safeParse(body);
  if (parsed.success && parsed.data.message != null) {
    return String(parsed.data.message);
  }
  return response.statusText;
};

export const apiFetch = async (path: string, init?: RequestInit): Promise<unknown> => {
  const url = `${env.VITE_BACKEND_URL}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = buildHeaders(init, method);

  const response = await fetch(url, {
    credentials: "include",
    headers,
    ...init,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, isJson);
    throw new Error(`Request failed ${String(response.status)}: ${errorMessage}`);
  }

  if (!isJson) {
    return null;
  }

  return response.json();
};
