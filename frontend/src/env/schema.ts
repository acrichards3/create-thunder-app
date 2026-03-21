import { z } from "zod";

/**
 * Add env variables here as needed. Note that VITE_ prefix is required for frontend variables.
 * Also remember that these variables are public!
 */
export const envSchema = z.object({
  VITE_BACKEND_URL: z.url(),
  VITE_PORT: z.coerce.number().default(5173),
} satisfies Record<`VITE_${string}`, z.ZodType<unknown>>);
