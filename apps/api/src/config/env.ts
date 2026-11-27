import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(12081),
  DATABASE_URL: z.url(),
})

// Satu-satunya tempat membaca process.env (CODING-GUIDELINES §11).
export const env = envSchema.parse(process.env)
