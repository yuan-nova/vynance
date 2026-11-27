import { z } from "zod"

export const LOCALES = ["id", "en"] as const
export const localeSchema = z.enum(LOCALES)
export type Locale = z.infer<typeof localeSchema>

export const THEME_PREFS = ["system", "light", "dark"] as const
export const themePrefSchema = z.enum(THEME_PREFS)
export type ThemePref = z.infer<typeof themePrefSchema>

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "ID tidak valid")
export const idSchema = ulid

/** Profil pengguna yang sedang masuk (`GET /me`). */
export const meSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  locale: localeSchema,
  theme: themePrefSchema,
  privacyMode: z.boolean(),
  lastBookId: z.string().nullable(),
})
export type Me = z.infer<typeof meSchema>

/** Input `PATCH /me`. Semua field opsional, minimal satu. */
export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    locale: localeSchema.optional(),
    theme: themePrefSchema.optional(),
    privacyMode: z.boolean().optional(),
    lastBookId: ulid.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Tidak ada perubahan")
export type UpdateMeInput = z.infer<typeof updateMeSchema>

/** Input meminta kode OTP. */
export const requestOtpSchema = z.object({ email: z.email("Format email belum benar").max(254) })
export type RequestOtpInput = z.infer<typeof requestOtpSchema>

/** Input verifikasi OTP: 6 digit. */
export const verifyOtpSchema = z.object({
  email: z.email("Format email belum benar").max(254),
  otp: z.string().regex(/^\d{6}$/, "Kode terdiri dari 6 angka"),
})
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

/** Penyedia login yang aktif (`GET /auth/providers`). */
export const authProvidersSchema = z.object({ google: z.boolean(), emailOtp: z.boolean() })
export type AuthProviders = z.infer<typeof authProvidersSchema>
