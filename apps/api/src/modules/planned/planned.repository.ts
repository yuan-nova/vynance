import { type Executor, incomeSources, plannedRecords, subscriptions, transactions } from "@vynance/db"
import {
  dateOnlyOf,
  monthOfDate,
  type PlannedIncomeSource,
  type PlannedRecord,
  type PlannedSource,
  type PlannedSubscription,
} from "@vynance/shared"
import { and, eq, isNull } from "drizzle-orm"

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class PlannedRepository {
  constructor(private readonly db: Executor) {}

  async incomeSources(bookId: string): Promise<PlannedIncomeSource[]> {
    const rows = await this.db
      .select({
        id: incomeSources.id,
        name: incomeSources.name,
        monthlyAmount: incomeSources.monthlyAmount,
        categoryId: incomeSources.categoryId,
        createdAt: incomeSources.createdAt,
      })
      .from(incomeSources)
      .where(
        and(eq(incomeSources.bookId, bookId), eq(incomeSources.isRecurring, true), isNull(incomeSources.deletedAt)),
      )
    return rows.map(({ createdAt, ...r }) => ({ ...r, createdMonth: monthOfDate(dateOnlyOf(createdAt)) }))
  }

  /** Langganan aktif (tidak dijeda). */
  subscriptions(bookId: string): Promise<PlannedSubscription[]> {
    return this.db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        amountIdr: subscriptions.amountIdr,
        cycle: subscriptions.cycle,
        billingDay: subscriptions.billingDay,
        billingMonth: subscriptions.billingMonth,
        startDate: subscriptions.startDate,
        walletId: subscriptions.walletId,
        categoryId: subscriptions.categoryId,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.bookId, bookId), isNull(subscriptions.deletedAt), isNull(subscriptions.pausedAt)))
  }

  async records(bookId: string, period: string): Promise<(PlannedRecord & { attempt: number })[]> {
    const rows = await this.db
      .select({
        sourceType: plannedRecords.sourceType,
        sourceId: plannedRecords.sourceId,
        status: plannedRecords.status,
        transactionId: plannedRecords.transactionId,
        attempt: plannedRecords.attempt,
        txId: transactions.id,
      })
      .from(plannedRecords)
      .leftJoin(
        transactions,
        and(
          eq(transactions.id, plannedRecords.transactionId),
          eq(transactions.bookId, plannedRecords.bookId),
          isNull(transactions.deletedAt),
        ),
      )
      .where(
        and(eq(plannedRecords.bookId, bookId), eq(plannedRecords.period, period), isNull(plannedRecords.deletedAt)),
      )
    return rows.map(({ txId, ...r }) => ({ ...r, transactionAlive: txId !== null }))
  }

  /** Satu baris per (buku, sumber, bulan) lewat planned_records_uq; menulis ulang status bila sudah ada. */
  async upsert(v: {
    id: string
    bookId: string
    sourceType: PlannedSource
    sourceId: string
    period: string
    status: "realized" | "skipped"
    transactionId: string | null
    attempt: number
    createdBy: string
  }): Promise<void> {
    await this.db
      .insert(plannedRecords)
      .values(v)
      .onDuplicateKeyUpdate({
        set: { status: v.status, transactionId: v.transactionId, attempt: v.attempt, deletedAt: null },
      })
  }
}
