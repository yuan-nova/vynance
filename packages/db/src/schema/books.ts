import { sql } from "drizzle-orm"
import { boolean, char, index, json, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core"
import { users } from "./auth"
import { audit, basisPoints, id, ref, timestamp, timestamps } from "./columns"

// Buku = tenant (TSD §5.2). Tabel global: books, book_members, book_invitations.

export const books = mysqlTable(
  "books",
  {
    id: id().primaryKey(),
    code: char("code", { length: 8 }).notNull(),
    name: varchar("name", { length: 40 }).notNull(),
    purgeAfter: timestamp("purge_after"),
    ...audit,
  },
  (t) => [uniqueIndex("books_code_uq").on(t.code)],
)

export const bookMembers = mysqlTable(
  "book_members",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    userId: ref("user_id")
      .notNull()
      .references(() => users.id),
    joinedAt: timestamp("joined_at").notNull().default(sql`(CURRENT_TIMESTAMP(3))`),
    leftAt: timestamp("left_at"),
    ...audit,
  },
  (t) => [
    uniqueIndex("book_members_book_user_uq").on(t.bookId, t.userId),
    index("book_members_user_left_idx").on(t.userId, t.leftAt),
  ],
)

export const bookSettings = mysqlTable("book_settings", {
  bookId: ref("book_id")
    .primaryKey()
    .references(() => books.id),
  passiveIncomeTargetBp: basisPoints("passive_income_target_bp").notNull().default(3000),
  educationInflationBp: basisPoints("education_inflation_bp").notNull().default(1200),
  budgetAlertEnabled: boolean("budget_alert_enabled").notNull().default(true),
  ...audit,
})

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    actorId: ref("actor_id")
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 40 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: ref("entity_id"),
    summary: json("summary").$type<Record<string, string>>(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("activity_logs_book_created_idx").on(t.bookId, t.createdAt)],
)
