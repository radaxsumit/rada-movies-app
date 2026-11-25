import "server-only";
import { z } from "zod";

/**
 * Server-only environment, validated on first use so a missing key fails
 * with a clear message instead of a 401 from TMDB.
 */
const serverSchema = z.object({
  TMDB_READ_TOKEN: z
    .string()
    .min(1, "TMDB_READ_TOKEN is missing. Copy .env.example to .env.local and add your TMDB read access token."),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (!cached) cached = serverSchema.parse(process.env);
  return cached;
}
