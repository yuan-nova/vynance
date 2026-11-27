import { type Executor, transactions, wallets } from "@vynance/db"
import type { TxSum, TxType, WalletType } from "@vynance/shared"
import { and, asc, eq, isNotNull, isNull, sql, sum } from "drizzle-orm"

/** Rekening tanpa saldo; saldo dihitung di service dari TxSum (BR-01). */
type WalletRow = {
  id: string
  name: string
  type: WalletType
  icon: string
  openingBalance: bigint
  creditLimit: bigint | null
  archivedAt: Date | null
}

const cols = {
  id: wallets.id,
  name: wallets.name,
  type: wallets.type,
  icon: wallets.icon,
  openingBalance: wallets.openingBalance,
  creditLimit: wallets.creditLimit,
  archivedAt: wallets.archivedAt,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class WalletsRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<WalletRow[]> {
    return this.db
      .select(cols)
      .from(wallets)
      .where(and(eq(wallets.bookId, bookId), isNull(wallets.deletedAt)))
      .orderBy(asc(wallets.createdAt), asc(wallets.id))
  }

  async findById(bookId: string, id: string): Promise<WalletRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(wallets)
      .where(and(eq(wallets.bookId, bookId), eq(wallets.id, id), isNull(wallets.deletedAt)))
      .limit(1)
    return row ?? null
  }

  /** Σ jumlah transaksi per rekening per tipe, untuk sumber (wallet_id) dan tujuan transfer (to_wallet_id). */
  async txSums(bookId: string, walletId?: string): Promise<TxSum[]> {
    const base = and(eq(transactions.bookId, bookId), isNull(transactions.deletedAt))
    const from = await this.db
      .select({ walletId: transactions.walletId, type: transactions.type, total: sum(transactions.amount) })
      .from(transactions)
      .where(walletId ? and(base, eq(transactions.walletId, walletId)) : base)
      .groupBy(transactions.walletId, transactions.type)
    const to = await this.db
      .select({ walletId: sql<string>`${transactions.toWalletId}`, total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          base,
          eq(transactions.type, "transfer"),
          walletId ? eq(transactions.toWalletId, walletId) : isNotNull(transactions.toWalletId),
        ),
      )
      .groupBy(transactions.toWalletId)
    return [
      ...from.map((r) => ({
        walletId: r.walletId,
        type: r.type as TxType,
        direction: "from" as const,
        total: BigInt(r.total ?? "0"),
      })),
      ...to.map((r) => ({
        walletId: r.walletId,
        type: "transfer" as const,
        direction: "to" as const,
        total: BigInt(r.total ?? "0"),
      })),
    ]
  }

  async hasTransactions(bookId: string, walletId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.bookId, bookId),
          isNull(transactions.deletedAt),
          sql`(${transactions.walletId} = ${walletId} OR ${transactions.toWalletId} = ${walletId})`,
        ),
      )
      .limit(1)
    return Boolean(row)
  }

  async insert(v: {
    id: string
    bookId: string
    name: string
    type: WalletType
    icon: string
    openingBalance: bigint
    creditLimit: bigint | null
    createdBy: string
  }): Promise<void> {
    await this.db.insert(wallets).values(v)
  }

  async update(
    bookId: string,
    id: string,
    patch: Partial<{
      name: string
      type: WalletType
      icon: string
      openingBalance: bigint
      creditLimit: bigint | null
    }>,
  ): Promise<void> {
    await this.db
      .update(wallets)
      .set(patch)
      .where(and(eq(wallets.bookId, bookId), eq(wallets.id, id), isNull(wallets.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(wallets)
      .set({ deletedAt: at })
      .where(and(eq(wallets.bookId, bookId), eq(wallets.id, id), isNull(wallets.deletedAt)))
  }
}
