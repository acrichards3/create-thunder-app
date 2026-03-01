import { apiFetch } from "./client.util";
import { z } from "zod";

const usersSchema = z.object({
  message: z.string(),
});

export const helloExample = async (): Promise<z.infer<typeof usersSchema>> => {
  const data = await apiFetch("/");
  const parsed = usersSchema.parse(data);
  return parsed;
};
