import { bookMembers, books, categories, type Executor, subscriptions, transactions, users, wallets } from "@vynance/db"
import { and, eq, isNull, ne, or } from "drizzle-orm"

type Candidate = {
  id: string
  bookId: string
  name: string
  amountIdr: bigint
  cycle: "monthly" | "yearly"
  billingDay: number
  billingMonth: number | null
  startDate: string
  walletId: string
  walletArchived: boolean
  categoryId: string | null
  createdBy: string
}

// Job langganan lintas buku (TSD §9). Tiap tulis tetap membawa book_id langganan itu sendiri.
export class BillingRepository {
  constructor(private readonly db: Executor) {}

  /** Langganan aktif (tidak dijeda/dihapus) di buku yang belum dihapus. */
  async activeSubscriptions(): Promise<Candidate[]> {
    const rows = await this.db
      .select({
        id: subscriptions.id,
        bookId: subscriptions.bookId,
        name: subscriptions.name,
        amountIdr: subscriptions.amountIdr,
        cycle: subscriptions.cycle,
        billingDay: subscriptions.billingDay,
        billingMonth: subscriptions.billingMonth,
        startDate: subscriptions.startDate,
        walletId: subscriptions.walletId,
        walletArchivedAt: wallets.archivedAt,
        categoryId: subscriptions.categoryId,
        createdBy: subscriptions.createdBy,
      })
      .from(subscriptions)
      .innerJoin(books, and(eq(books.id, subscriptions.bookId), isNull(books.deletedAt)))
      .innerJoin(
        wallets,
        and(
          eq(wallets.id, subscriptions.walletId),
          eq(wallets.bookId, subscriptions.bookId),
          isNull(wallets.deletedAt),
        ),
      )
      .where(and(isNull(subscriptions.deletedAt), isNull(subscriptions.pausedAt)))
    return rows.map(({ walletArchivedAt, ...r }) => ({ ...r, walletArchived: walletArchivedAt !== null }))
  }

  /** Kategori pengeluaran "Langganan" bawaan buku (BR-46), bila masih ada. */
  async subscriptionCategory(bookId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.bookId, bookId),
          eq(categories.kind, "expense"),
          eq(categories.name, "Langganan"),
          isNull(categories.deletedAt),
          isNull(categories.archivedAt),
        ),
      )
      .limit(1)
    return row?.id ?? null
  }

  /** BR-41: UNIQUE(subscription_id, subscription_period) menolak transaksi kedua di bulan yang sama. */
  async insertCharge(v: {
    id: string
    bookId: string
    amount: bigint
    txDate: string
    walletId: string
    categoryId: string | null
    note: string
    subscriptionId: string
    subscriptionPeriod: string
    createdBy: string
  }): Promise<"created" | "duplicate"> {
    try {
      await this.db.insert(transactions).values({ ...v, type: "expense", source: "subscription" })
      return "created"
    } catch (e: unknown) {
      const cause = e instanceof Error && "cause" in e ? e.cause : e
      if (cause instanceof Error && "errno" in cause && cause.errno === 1062) return "duplicate"
      throw e
    }
  }

  /** Klaim pengingat untuk satu periode secara atomik; false bila sudah diklaim proses lain. */
  async claimReminder(bookId: string, id: string, period: string): Promise<boolean> {
    const [res] = await this.db
      .update(subscriptions)
      .set({ remindedPeriod: period })
      .where(
        and(
          eq(subscriptions.bookId, bookId),
          eq(subscriptions.id, id),
          or(isNull(subscriptions.remindedPeriod), ne(subscriptions.remindedPeriod, period)),
        ),
      )
    return res.affectedRows === 1
  }

  async memberEmails(bookId: string): Promise<string[]> {
    const rows = await this.db
      .select({ email: users.email })
      .from(bookMembers)
      .innerJoin(users, eq(users.id, bookMembers.userId))
      .where(and(eq(bookMembers.bookId, bookId), isNull(bookMembers.leftAt), isNull(bookMembers.deletedAt)))
    return rows.map((r) => r.email)
  }
}
