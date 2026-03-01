import { raise } from "@thunder-app/lib";
import { envSchema } from "./schema";

const result = envSchema.safeParse(import.meta.env);

export const env = result.success ? result.data : raise("Environment validation failed");
