import { categories, type Executor, transactions, users, wallets } from "@vynance/db"
import type {
  CategoryKind,
  CategoryUsage,
  Transaction,
  TransactionDetail,
  TransactionListItem,
  TransactionListQuery,
  TxSource,
  TxType,
} from "@vynance/shared"
import { and, count, desc, eq, gte, isNotNull, isNull, like, lt, lte, or, sql, sum } from "drizzle-orm"
import { alias } from "drizzle-orm/mysql-core"

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

  /** Daftar per tanggal terbaru, cursor (tx_date, id) (TSD §11). Mengambil limit+1 untuk tahu ada halaman berikut. */
  async list(bookId: string, q: TransactionListQuery): Promise<{ items: TransactionListItem[]; hasMore: boolean }> {
    const toWallet = alias(wallets, "to_wallet")
    const [cDate, cId] = q.cursor ? q.cursor.split(".") : []
    const rows = await this.db
      .select({
        tx: transactions,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        walletName: wallets.name,
        toWalletName: toWallet.name,
        createdByName: users.name,
      })
      .from(transactions)
      .innerJoin(wallets, and(eq(wallets.id, transactions.walletId), eq(wallets.bookId, bookId)))
      .leftJoin(toWallet, and(eq(toWallet.id, transactions.toWalletId), eq(toWallet.bookId, bookId)))
      .leftJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.bookId, bookId)))
      // leftJoin: transaksi tetap tampil walau akun pencatatnya sudah dihapus (BR-53, NFR-08).
      .leftJoin(users, eq(users.id, transactions.createdBy))
      .where(
        and(
          eq(transactions.bookId, bookId),
          isNull(transactions.deletedAt),
          q.type ? eq(transactions.type, q.type) : undefined,
          q.from ? gte(transactions.txDate, q.from) : undefined,
          q.to ? lte(transactions.txDate, q.to) : undefined,
          q.walletId ? or(eq(transactions.walletId, q.walletId), eq(transactions.toWalletId, q.walletId)) : undefined,
          q.q ? like(transactions.note, `%${escapeLike(q.q)}%`) : undefined,
          cDate && cId
            ? or(lt(transactions.txDate, cDate), and(eq(transactions.txDate, cDate), lt(transactions.id, cId)))
            : undefined,
        ),
      )
      .orderBy(desc(transactions.txDate), desc(transactions.id))
      .limit(q.limit + 1)
    const items = rows.slice(0, q.limit).map((r) => ({
      ...toTransaction(r.tx),
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      walletName: r.walletName,
      toWalletName: r.toWalletName,
      createdByName: r.createdByName ?? "",
    }))
    return { items, hasMore: rows.length > q.limit }
  }

  /** Detail + nama pengubah terakhir. Tidak termasuk yang dihapus. */
  async detail(bookId: string, id: string): Promise<TransactionDetail | null> {
    const toWallet = alias(wallets, "to_wallet")
    const updater = alias(users, "updater")
    const [r] = await this.db
      .select({
        tx: transactions,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        walletName: wallets.name,
        toWalletName: toWallet.name,
        createdByName: users.name,
        updatedByName: updater.name,
      })
      .from(transactions)
      .innerJoin(wallets, and(eq(wallets.id, transactions.walletId), eq(wallets.bookId, bookId)))
      .leftJoin(toWallet, and(eq(toWallet.id, transactions.toWalletId), eq(toWallet.bookId, bookId)))
      .leftJoin(categories, and(eq(categories.id, transactions.categoryId), eq(categories.bookId, bookId)))
      .leftJoin(users, eq(users.id, transactions.createdBy))
      .leftJoin(updater, eq(updater.id, transactions.updatedBy))
      .where(and(eq(transactions.bookId, bookId), eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1)
    if (!r) return null
    return {
      ...toTransaction(r.tx),
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      walletName: r.walletName,
      toWalletName: r.toWalletName,
      createdByName: r.createdByName ?? "",
      updatedByName: r.tx.updatedBy ? (r.updatedByName ?? "") : null,
      updatedAt: r.tx.updatedAt.toISOString(),
    }
  }

  /** Termasuk yang dihapus lunak (untuk Urungkan). */
  async findAny(bookId: string, id: string): Promise<(Transaction & { deleted: boolean }) | null> {
    const [row] = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.bookId, bookId), eq(transactions.id, id)))
      .limit(1)
    return row ? { ...toTransaction(row), deleted: row.deletedAt !== null } : null
  }

  async update(
    bookId: string,
    id: string,
    v: {
      type: TxType
      amount: bigint
      txDate: string
      walletId: string
      toWalletId: string | null
      categoryId: string | null
      note: string | null
      updatedBy: string
    },
  ): Promise<void> {
    await this.db
      .update(transactions)
      .set(v)
      .where(and(eq(transactions.bookId, bookId), eq(transactions.id, id), isNull(transactions.deletedAt)))
  }

  async setDeleted(bookId: string, id: string, at: Date | null, by: string): Promise<void> {
    await this.db
      .update(transactions)
      .set({ deletedAt: at, updatedBy: by })
      .where(and(eq(transactions.bookId, bookId), eq(transactions.id, id)))
  }

  /** Σ uang masuk dan keluar dalam rentang tanggal (transfer & aset tidak dihitung). */
  async sumIncomeExpense(bookId: string, from: string, to: string): Promise<{ income: bigint; expense: bigint }> {
    const rows = await this.db
      .select({ type: transactions.type, total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.bookId, bookId),
          isNull(transactions.deletedAt),
          gte(transactions.txDate, from),
          lte(transactions.txDate, to),
          sql`${transactions.type} in ('income', 'expense')`,
        ),
      )
      .groupBy(transactions.type)
    const get = (t: TxType) => BigInt(rows.find((r) => r.type === t)?.total ?? "0")
    return { income: get("income"), expense: get("expense") }
  }

  /** BR-10: Σ uang keluar per kategori dalam rentang tanggal. */
  async sumExpenseByCategory(bookId: string, from: string, to: string): Promise<Record<string, bigint>> {
    const rows = await this.db
      .select({ categoryId: transactions.categoryId, total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.bookId, bookId),
          isNull(transactions.deletedAt),
          eq(transactions.type, "expense"),
          isNotNull(transactions.categoryId),
          gte(transactions.txDate, from),
          lte(transactions.txDate, to),
        ),
      )
      .groupBy(transactions.categoryId)
    return Object.fromEntries(rows.map((r) => [r.categoryId ?? "", BigInt(r.total ?? "0")]))
  }

  /** Nilai aset dari transaksi beli/jual aset sejak awal sampai akhir rentang (pilar investasi §8.2, #31 mengisi aset). */
  async sumAssetNet(bookId: string, to: string): Promise<bigint> {
    const [row] = await this.db
      .select({
        bought: sql<string>`coalesce(sum(case when ${transactions.type} = 'asset_buy' then ${transactions.amount} else 0 end), 0)`,
        sold: sql<string>`coalesce(sum(case when ${transactions.type} = 'asset_sell' then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.bookId, bookId),
          isNull(transactions.deletedAt),
          lte(transactions.txDate, to),
          sql`${transactions.type} in ('asset_buy', 'asset_sell')`,
        ),
      )
    return BigInt(row?.bought ?? "0") - BigInt(row?.sold ?? "0")
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

/** % dan _ di kata cari diperlakukan sebagai huruf biasa. */
function escapeLike(v: string): string {
  return v.replace(/[\\%_]/g, (c) => `\\${c}`)
}

function isDuplicate(e: unknown, index: string): boolean {
  const cause = e instanceof Error && "cause" in e ? e.cause : e
  if (!(cause instanceof Error)) return false
  const errno = "errno" in cause ? cause.errno : undefined
  return errno === 1062 && cause.message.includes(index)
}
