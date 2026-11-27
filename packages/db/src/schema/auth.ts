import { bigint, boolean, index, int, mysqlEnum, mysqlTable, text, uniqueIndex, varchar } from "drizzle-orm/mysql-core"
import { id, ref, timestamp, timestamps } from "./columns"

// Tabel Better Auth (TSD §5.1). Nama kolom snake_case; nama field mengikuti model Better Auth.

export const users = mysqlTable(
  "users",
  {
    id: id().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: varchar("image", { length: 2048 }),
    locale: mysqlEnum("locale", ["id", "en"]).notNull().default("id"),
    theme: mysqlEnum("theme", ["system", "light", "dark"]).notNull().default("system"),
    privacyMode: boolean("privacy_mode").notNull().default(false),
    lastBookId: ref("last_book_id"),
    onboardedAt: timestamp("onboarded_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
)

export const sessions = mysqlTable(
  "sessions",
  {
    id: id().primaryKey(),
    token: varchar("token", { length: 255 }).notNull(),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 512 }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.token), index("sessions_user_idx").on(t.userId)],
)

export const accounts = mysqlTable(
  "accounts",
  {
    id: id().primaryKey(),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 64 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: varchar("scope", { length: 512 }),
    password: varchar("password", { length: 255 }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [uniqueIndex("accounts_provider_uq").on(t.providerId, t.accountId), index("accounts_user_idx").on(t.userId)],
)

export const verifications = mysqlTable(
  "verifications",
  {
    id: id().primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
)

/** Penyimpanan rate limit Better Auth (batas percobaan OTP). */
export const rateLimits = mysqlTable(
  "rate_limits",
  {
    id: id().primaryKey(),
    key: varchar("key", { length: 255 }).notNull(),
    count: int("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("rate_limits_key_uq").on(t.key)],
)
