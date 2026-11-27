import { sql } from "drizzle-orm"
import { bigint, char, datetime, decimal, int } from "drizzle-orm/mysql-core"

// Helper kolom sesuai konvensi TSD §6.1. Semua tabel memakai helper ini, bukan tipe kolom mentah.

/** ID ULID CHAR(26), dibuat di aplikasi. */
export const id = (name = "id") => char(name, { length: 26 })

/** FK ke ID ULID. */
export const ref = (name: string) => char(name, { length: 26 })

/** Uang: BIGINT rupiah utuh, dibaca sebagai bigint di TypeScript. */
export const money = (name: string) => bigint(name, { mode: "bigint" })

/** Unit investasi dan gram emas: DECIMAL(18,6), dibaca sebagai string supaya presisi tidak hilang. */
export const units = (name: string) => decimal(name, { precision: 18, scale: 6 })

/** Persen dalam basis poin (2000 = 20%). */
export const basisPoints = (name: string) => int(name)

/** Bulan "YYYY-MM" zona Asia/Jakarta. */
export const month = (name: string) => char(name, { length: 7 })

/** Waktu UTC presisi milidetik. */
export const timestamp = (name: string) => datetime(name, { mode: "date", fsp: 3 })

/** created_at, updated_at, deleted_at (soft delete). */
export const timestamps = {
  createdAt: timestamp("created_at").notNull().default(sql`(CURRENT_TIMESTAMP(3))`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP(3))`)
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}

/** Kolom audit lengkap untuk tabel data: created_by + timestamps. */
export const audit = {
  createdBy: ref("created_by").notNull(),
  ...timestamps,
}
