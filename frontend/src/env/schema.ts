import { z } from "zod";

export const envSchema = z.object({
  VITE_BACKEND_URL: z.url(),
  VITE_PORT: z.coerce.number().default(5173),
} satisfies Record<`VITE_${string}`, z.ZodType<unknown>>);
