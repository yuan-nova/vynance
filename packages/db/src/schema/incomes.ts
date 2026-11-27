import { sql } from "drizzle-orm"
import { boolean, check, foreignKey, index, mysqlEnum, mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, money, ref } from "./columns"
import { categories } from "./money"

// Sumber penghasilan (TSD §6, PB-10). Target pasif ada di book_settings.passive_income_target_bp.
export const incomeSources = mysqlTable(
  "income_sources",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 60 }).notNull(),
    kind: mysqlEnum("kind", ["active", "passive"]).notNull(),
    categoryId: ref("category_id"),
    monthlyAmount: money("monthly_amount").notNull(),
    isRecurring: boolean("is_recurring").notNull().default(true),
    ...audit,
  },
  (t) => [
    index("income_sources_book_idx").on(t.bookId, t.deletedAt),
    foreignKey({ columns: [t.categoryId], foreignColumns: [categories.id], name: "income_sources_category_fk" }),
    check("income_sources_amount_pos", sql`${t.monthlyAmount} > 0`),
  ],
)
