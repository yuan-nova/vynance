import { type Executor, referenceRates, subscriptions, transactions, wallets } from "@vynance/db"
import { and, asc, desc, eq, isNull, max, sql } from "drizzle-orm"

type Row = {
  id: string
  name: string
  serviceKey: string | null
  currency: string
  originalAmount: string
  fxRate: string | null
  amountIdr: bigint
  cycle: "monthly" | "yearly"
  billingDay: number
  billingMonth: number | null
  walletId: string
  walletName: string
  categoryId: string | null
  startDate: string
  pausedAt: Date | null
}

type Values = {
  name: string
  serviceKey: string | null
  currency: string
  originalAmount: string
  fxRate: string | null
  amountIdr: bigint
  cycle: "monthly" | "yearly"
  billingDay: number
  billingMonth: number | null
  walletId: string
  categoryId: string | null
  startDate: string
}

const cols = {
  id: subscriptions.id,
  name: subscriptions.name,
  serviceKey: subscriptions.serviceKey,
  currency: subscriptions.currency,
  originalAmount: subscriptions.originalAmount,
  fxRate: subscriptions.fxRate,
  amountIdr: subscriptions.amountIdr,
  cycle: subscriptions.cycle,
  billingDay: subscriptions.billingDay,
  billingMonth: subscriptions.billingMonth,
  walletId: subscriptions.walletId,
  walletName: wallets.name,
  categoryId: subscriptions.categoryId,
  startDate: subscriptions.startDate,
  pausedAt: subscriptions.pausedAt,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class SubscriptionsRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<Row[]> {
    return this.db
      .select(cols)
      .from(subscriptions)
      .innerJoin(wallets, and(eq(wallets.id, subscriptions.walletId), eq(wallets.bookId, bookId)))
      .where(and(eq(subscriptions.bookId, bookId), isNull(subscriptions.deletedAt)))
      .orderBy(asc(subscriptions.billingDay), asc(subscriptions.id))
  }

  async findById(bookId: string, id: string): Promise<Row | null> {
    const [row] = await this.db
      .select(cols)
      .from(subscriptions)
      .innerJoin(wallets, and(eq(wallets.id, subscriptions.walletId), eq(wallets.bookId, bookId)))
      .where(and(eq(subscriptions.bookId, bookId), eq(subscriptions.id, id), isNull(subscriptions.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: Values & { id: string; bookId: string; createdBy: string }): Promise<void> {
    await this.db.insert(subscriptions).values(v)
  }

  async update(bookId: string, id: string, v: Values & { pausedAt: Date | null }): Promise<void> {
    await this.db
      .update(subscriptions)
      .set(v)
      .where(and(eq(subscriptions.bookId, bookId), eq(subscriptions.id, id), isNull(subscriptions.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(subscriptions)
      .set({ deletedAt: at })
      .where(and(eq(subscriptions.bookId, bookId), eq(subscriptions.id, id)))
  }

  /** Tanggal transaksi otomatis terakhir per langganan. */
  async lastCharges(bookId: string): Promise<Map<string, string>> {
    const rows = await this.db
      .select({ id: transactions.subscriptionId, last: max(transactions.txDate) })
      .from(transactions)
      .where(
        and(eq(transactions.bookId, bookId), eq(transactions.source, "subscription"), isNull(transactions.deletedAt)),
      )
      .groupBy(transactions.subscriptionId)
    return new Map(rows.flatMap((r) => (r.id && r.last ? [[r.id, String(r.last)] as const] : [])))
  }

  /** Kurs terbaru per mata uang dari reference_rates (tabel global). */
  async latestFx(): Promise<{ currency: string; value: string; fetchedAt: Date }[]> {
    const latest = this.db
      .select({ currency: referenceRates.currency, at: max(referenceRates.fetchedAt).as("at") })
      .from(referenceRates)
      .where(eq(referenceRates.kind, "fx"))
      .groupBy(referenceRates.currency)
      .as("latest")
    return this.db
      .select({ currency: referenceRates.currency, value: referenceRates.value, fetchedAt: referenceRates.fetchedAt })
      .from(referenceRates)
      .innerJoin(latest, and(eq(latest.currency, referenceRates.currency), eq(latest.at, referenceRates.fetchedAt)))
      .where(eq(referenceRates.kind, "fx"))
      .orderBy(desc(referenceRates.fetchedAt), sql`1`)
  }
}
