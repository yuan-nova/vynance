import { sql } from "drizzle-orm"
import { check, index, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, money, month, ref } from "./columns"

// Slip gaji (TSD §6, PB-10). Hanya angka; file_key tetap null karena PDF tidak diunggah (NFR-02, ADR 0007).
export const payslips = mysqlTable(
  "payslips",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    period: month("period").notNull(),
    gross: money("gross").notNull(),
    deductions: money("deductions").notNull(),
    net: money("net").notNull(),
    fileKey: varchar("file_key", { length: 200 }),
    ...audit,
  },
  (t) => [
    index("payslips_book_period_idx").on(t.bookId, t.deletedAt, t.period),
    check("payslips_amounts_nonneg", sql`${t.gross} > 0 and ${t.deductions} >= 0 and ${t.net} > 0`),
  ],
)
