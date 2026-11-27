import { accounts, type Db, rateLimits, sessions, users, verifications } from "@vynance/db"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { createEmailThrottle } from "../lib/email-throttle"
import { newId } from "../lib/id"
import { logger } from "../lib/logger"

// Konfigurasi Better Auth (TSD §5.1). Dirakit di container.ts.

type AuthConfig = {
  secret: string
  appUrl: string
  isProduction: boolean
  google?: { clientId: string; clientSecret: string }
  sendOtp: (email: string, otp: string) => Promise<void>
  /** PB-01: buat buku Pribadi + data bawaan untuk akun baru. */
  onUserCreated: (userId: string) => Promise<void>
}

export function createAuth(db: Db, cfg: AuthConfig) {
  // 5 kode per email per 15 menit, dari IP mana pun.
  const perEmail = createEmailThrottle(5, 15 * 60 * 1000)
  return betterAuth({
    appName: "Vynance",
    baseURL: cfg.appUrl,
    basePath: "/api/v1/auth",
    secret: cfg.secret,
    trustedOrigins: [cfg.appUrl],
    database: drizzleAdapter(db, {
      provider: "mysql",
      usePlural: true,
      schema: { users, sessions, accounts, verifications, rateLimits },
    }),
    user: {
      additionalFields: {
        locale: { type: "string", required: false, defaultValue: "id", input: false },
        theme: { type: "string", required: false, defaultValue: "system", input: false },
        privacyMode: { type: "boolean", required: false, defaultValue: false, input: false },
        lastBookId: { type: "string", required: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Gagal membuat buku tidak menggagalkan login: pengguna diarahkan membuat buku (BR-54).
            await cfg.onUserCreated(user.id).catch((e: unknown) => {
              logger.error("buku pertama gagal dibuat", { err: e instanceof Error ? e.name : "unknown" })
            })
          },
        },
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    socialProviders: cfg.google ? { google: cfg.google } : {},
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 300,
        allowedAttempts: 5,
        storeOTP: "hashed",
        sendVerificationOTP: async ({ email, otp }) => {
          // Respons tetap sukses supaya tidak membocorkan batas; email hanya tidak dikirim.
          if (!perEmail.allow(email)) {
            logger.warn("otp dibatasi per email")
            return
          }
          await cfg.sendOtp(email, otp)
        },
      }),
    ],
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/email-otp/send-verification-otp": { window: 60, max: 3 },
        "/sign-in/email-otp": { window: 300, max: 10 },
      },
    },
    advanced: {
      cookiePrefix: "vynance",
      useSecureCookies: cfg.isProduction,
      defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
      ipAddress: { ipAddressHeaders: ["x-real-ip", "x-forwarded-for"] },
      database: { generateId: () => newId() },
    },
  })
}
