import { categories, type Executor, transactions } from "@vynance/db"
import type { CategoryKind, CategoryUsage, Transaction, TxSource, TxType } from "@vynance/shared"
import { and, count, desc, eq, gte, isNotNull, isNull } from "drizzle-orm"

type Row = typeof transactions.$inferSelect

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class TransactionsRepository {
  constructor(private readonly db: Executor) {}

  async findById(bookId: string, id: string): Promise<Transaction | null> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.bookId, bookId), eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1)
    return row ? toTransaction(row) : null
  }

  /** Untuk Idempotency-Key: termasuk yang sudah dihapus supaya kunci lama tidak membuat ulang. */
  async findByIdempotencyKey(bookId: string, key: string): Promise<Transaction | null> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.bookId, bookId), eq(transactions.idempotencyKey, key)))
      .limit(1)
    return row ? toTransaction(row) : null
  }

  /** Insert. Mengembalikan "duplicate_key" bila Idempotency-Key bentrok (indeks unik tx_book_idem_uq). */
  async insert(v: {
    id: string
    bookId: string
    type: TxType
    amount: bigint
    txDate: string
    walletId: string
    toWalletId: string | null
    categoryId: string | null
    note: string | null
    source: TxSource
    idempotencyKey: string | null
    createdBy: string
  }): Promise<"ok" | "duplicate_key"> {
    try {
      await this.db.insert(transactions).values(v)
      return "ok"
    } catch (e: unknown) {
      if (isDuplicate(e, "tx_book_idem_uq")) return "duplicate_key"
      throw e
    }
  }

  /** Kategori paling sering dipakai sejak tanggal tertentu (chip "sering dipakai"). */
  async categoryUsage(bookId: string, kind: CategoryKind, since: string): Promise<CategoryUsage> {
    const rows = await this.db
      .select({ categoryId: transactions.categoryId, count: count(transactions.id) })
      .from(transactions)
      .innerJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.bookId, bookId)))
      .where(
        and(
          eq(transactions.bookId, bookId),
          isNull(transactions.deletedAt),
          isNotNull(transactions.categoryId),
          eq(categories.kind, kind),
          gte(transactions.txDate, since),
        ),
      )
      .groupBy(transactions.categoryId)
      .orderBy(desc(count(transactions.id)))
      .limit(20)
    return rows.flatMap((r) => (r.categoryId ? [{ categoryId: r.categoryId, count: Number(r.count) }] : []))
  }
}

export function toTransaction(r: Row): Transaction {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount.toString(),
    txDate: r.txDate,
    walletId: r.walletId,
    toWalletId: r.toWalletId,
    categoryId: r.categoryId,
    assetId: r.assetId,
    note: r.note,
    source: r.source,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
  }
}

function isDuplicate(e: unknown, index: string): boolean {
  const cause = e instanceof Error && "cause" in e ? e.cause : e
  if (!(cause instanceof Error)) return false
  const errno = "errno" in cause ? cause.errno : undefined
  return errno === 1062 && cause.message.includes(index)
}
