import { z } from "zod"

// Nilai kosong dari compose ("") dianggap tidak diisi.
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional())

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(12081),
    DATABASE_URL: z.url(),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
    APP_URL: z.url().default("http://localhost:12080"),
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    EMAIL_FROM: z.string().min(3).default("Vynance <noreply@vynance.local>"),
    EMAIL_API_KEY: optional,
    /** Kunci OpenRouter untuk AI advisor (ADR 0006). Kosong = fitur AI mati (503). */
    LLM_API_KEY: optional,
    /** Slug model OpenRouter, mis. `anthropic/claude-opus-5.5`. */
    LLM_MODEL: z.string().min(1).default("anthropic/claude-opus-5.5"),
    /** Langfuse (observabilitas LLM). Kosong = tidak dicatat. */
    LANGFUSE_PUBLIC_KEY: optional,
    LANGFUSE_SECRET_KEY: optional,
    LANGFUSE_BASE_URL: z.url().default("https://cloud.langfuse.com"),
    /** "1" = isi prompt dan jawaban ikut direkam. Bawaan mati karena berisi data keuangan pengguna. */
    LANGFUSE_CAPTURE_CONTENT: z.preprocess((v) => v === "1" || v === "true", z.boolean()),
    /** Sumber harga emas per gram (JSON berisi `price` dalam rupiah). Kosong = pakai cache/bawaan. */
    GOLD_PRICE_URL: optional,
  })
  .refine((e) => e.NODE_ENV !== "production" || e.EMAIL_API_KEY, {
    message: "EMAIL_API_KEY wajib di produksi",
    path: ["EMAIL_API_KEY"],
  })
  .refine((e) => Boolean(e.LANGFUSE_PUBLIC_KEY) === Boolean(e.LANGFUSE_SECRET_KEY), {
    message: "LANGFUSE_PUBLIC_KEY dan LANGFUSE_SECRET_KEY diisi bersama",
    path: ["LANGFUSE_PUBLIC_KEY"],
  })
  .refine((e) => Boolean(e.GOOGLE_CLIENT_ID) === Boolean(e.GOOGLE_CLIENT_SECRET), {
    message: "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET diisi bersama",
    path: ["GOOGLE_CLIENT_ID"],
  })

// Satu-satunya tempat membaca process.env (CODING-GUIDELINES §11).
export const env = envSchema.parse(process.env)
