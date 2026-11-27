import { sql } from "drizzle-orm"
import { check, index, mysqlTable, smallint, varchar } from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, money, ref } from "./columns"

// Anak untuk dana pendidikan (TSD §6, PB-09). Inflasi ada di book_settings.education_inflation_bp (BR-43).
export const children = mysqlTable(
  "children",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    name: varchar("name", { length: 60 }).notNull(),
    birthYear: smallint("birth_year").notNull(),
    educationSavings: money("education_savings").notNull().default(sql`0`),
    ...audit,
  },
  (t) => [
    index("children_book_idx").on(t.bookId, t.deletedAt),
    check("children_savings_nonneg", sql`${t.educationSavings} >= 0`),
  ],
)
