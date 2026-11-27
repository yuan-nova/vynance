import {
  activityLogs,
  bookInvitations,
  bookMembers,
  bookSettings,
  books,
  categories,
  type Executor,
  goalContributions,
  investmentTypes,
  monthlyPlans,
  planAllocations,
  planIncomes,
  savingsGoals,
  transactions,
  users,
  wallets,
} from "@vynance/db"
import { and, asc, eq, isNotNull, lt, sql } from "drizzle-orm"

/**
 * Tabel ber-`book_id`, urut anak → induk mengikuti FK. Tabel baru WAJIB ditambahkan di sini;
 * test `maintenance.repository.test.ts` gagal bila ada tabel ber-book_id yang belum tercantum.
 */
export const BOOK_TABLES = [
  goalContributions,
  savingsGoals,
  planAllocations,
  planIncomes,
  monthlyPlans,
  transactions,
  categories,
  investmentTypes,
  wallets,
  bookInvitations,
  activityLogs,
  bookSettings,
  bookMembers,
] as const

// Job latar lintas buku (TSD §9). Hanya dipanggil worker, bukan request pengguna.
export class MaintenanceRepository {
  constructor(private readonly db: Executor) {}

  /** Buku terhapus yang masa pulihnya lewat (BR-52). */
  async expiredBooks(now: Date, limit: number): Promise<string[]> {
    const rows = await this.db
      .select({ id: books.id })
      .from(books)
      .where(and(isNotNull(books.deletedAt), lt(books.purgeAfter, now)))
      .orderBy(asc(books.purgeAfter))
      .limit(limit)
    return rows.map((r) => r.id)
  }

  /** Hapus permanen satu buku beserta semua baris ber-book_id. Idempoten: dijalankan dua kali aman. */
  async purgeBook(bookId: string): Promise<void> {
    await this.db.update(users).set({ lastBookId: null }).where(eq(users.lastBookId, bookId))
    for (const t of BOOK_TABLES) {
      await this.db.delete(t).where(eq(t.bookId, bookId))
    }
    await this.db.delete(books).where(and(eq(books.id, bookId), isNotNull(books.deletedAt)))
  }

  /** Undangan yang kedaluwarsa sebelum `before` (aktif, dipakai, atau dibatalkan). */
  async deleteInvitationsExpiredBefore(before: Date): Promise<number> {
    const [res] = await this.db.delete(bookInvitations).where(lt(bookInvitations.expiresAt, before))
    return res.affectedRows
  }

  /** Nama tabel yang punya kolom book_id di skema DB aktif (untuk test kelengkapan BOOK_TABLES). */
  async tablesWithBookId(): Promise<string[]> {
    const [rows] = (await this.db.execute(
      sql`select table_name as t from information_schema.columns where table_schema = database() and column_name = 'book_id'`,
    )) as unknown as [{ t: string }[]]
    return rows.map((r) => r.t)
  }
}
