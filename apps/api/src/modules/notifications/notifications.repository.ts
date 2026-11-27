import { bookMembers, bookSettings, budgetAlerts, type Executor, notifications } from "@vynance/db"
import { and, count, desc, eq, isNull } from "drizzle-orm"

// Notifikasi per anggota (PB-12 langkah 6). Semua query difilter bookId (+ userId untuk milik pengguna).
export class NotificationsRepository {
  constructor(private readonly db: Executor) {}

  /** Klaim satu peringatan (UNIQUE). false = sudah pernah dikirim untuk kategori/bulan/ambang ini. */
  async claimAlert(v: { id: string; bookId: string; categoryId: string; month: string; thresholdBp: number }) {
    try {
      await this.db.insert(budgetAlerts).values(v)
      return true
    } catch (e: unknown) {
      const cause = e instanceof Error && "cause" in e ? e.cause : e
      if (cause instanceof Error && "errno" in cause && cause.errno === 1062) return false
      throw e
    }
  }

  async activeMemberIds(bookId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: bookMembers.userId })
      .from(bookMembers)
      .where(and(eq(bookMembers.bookId, bookId), isNull(bookMembers.leftAt), isNull(bookMembers.deletedAt)))
    return rows.map((r) => r.userId)
  }

  async insertMany(rows: { id: string; bookId: string; userId: string; kind: string; data: Record<string, string> }[]) {
    if (rows.length) await this.db.insert(notifications).values(rows)
  }

  list(bookId: string, userId: string, limit: number) {
    return this.db
      .select({
        id: notifications.id,
        kind: notifications.kind,
        data: notifications.data,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(eq(notifications.bookId, bookId), eq(notifications.userId, userId)))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit)
  }

  async unreadCount(bookId: string, userId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count(notifications.id) })
      .from(notifications)
      .where(and(eq(notifications.bookId, bookId), eq(notifications.userId, userId), isNull(notifications.readAt)))
    return Number(row?.n ?? 0)
  }

  async markAllRead(bookId: string, userId: string, at: Date): Promise<void> {
    await this.db
      .update(notifications)
      .set({ readAt: at })
      .where(and(eq(notifications.bookId, bookId), eq(notifications.userId, userId), isNull(notifications.readAt)))
  }

  async alertsEnabled(bookId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ on: bookSettings.budgetAlertEnabled })
      .from(bookSettings)
      .where(eq(bookSettings.bookId, bookId))
      .limit(1)
    return row?.on ?? true
  }

  async setAlertsEnabled(bookId: string, on: boolean): Promise<void> {
    await this.db.update(bookSettings).set({ budgetAlertEnabled: on }).where(eq(bookSettings.bookId, bookId))
  }
}
