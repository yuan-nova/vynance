import { index, int, mysqlEnum, mysqlTable, uniqueIndex } from "drizzle-orm/mysql-core"
import { books } from "./books"
import { audit, id, month, ref } from "./columns"

/**
 * Status rencana transaksi (PB-13, BR-60). Rencana sendiri dihitung dari sumber penghasilan dan langganan;
 * tabel ini hanya mencatat yang sudah direalisasi atau dilewati. Tanpa baris = belum direalisasi.
 * `attempt` naik tiap realisasi supaya Idempotency-Key realisasi ulang (setelah transaksinya dihapus) berbeda.
 */
export const plannedRecords = mysqlTable(
  "planned_records",
  {
    id: id().primaryKey(),
    bookId: ref("book_id")
      .notNull()
      .references(() => books.id),
    sourceType: mysqlEnum("source_type", ["income", "subscription"]).notNull(),
    sourceId: ref("source_id").notNull(),
    period: month("period").notNull(),
    status: mysqlEnum("status", ["realized", "skipped"]).notNull(),
    transactionId: ref("transaction_id"),
    attempt: int("attempt").notNull().default(0),
    ...audit,
  },
  (t) => [
    uniqueIndex("planned_records_uq").on(t.bookId, t.sourceType, t.sourceId, t.period),
    index("planned_records_book_period_idx").on(t.bookId, t.period),
  ],
)
