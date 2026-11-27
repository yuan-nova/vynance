import {
  allocationAmount,
  type BookSettings,
  monthOfDate,
  type NotificationList,
  planTotals,
  reachedThresholds,
  type ServiceCtx,
} from "@vynance/shared"
import { logger } from "../../lib/logger"
import type { CategoriesService } from "../categories/categories.service"
import type { PlansService } from "../plans/plans.service"
import type { NotificationsRepository } from "./notifications.repository"

type Deps = {
  notifications: Pick<
    NotificationsRepository,
    | "claimAlert"
    | "activeMemberIds"
    | "insertMany"
    | "list"
    | "unreadCount"
    | "markAllRead"
    | "alertsEnabled"
    | "setAlertsEnabled"
  >
  plans: Pick<PlansService, "get">
  categories: Pick<CategoriesService, "list">
  newId: () => string
  now: () => Date
}

/** Notifikasi anggaran 90%/100% ke semua anggota buku (PB-12 langkah 6, BR-11). */
export class NotificationsService {
  constructor(private readonly d: Deps) {}

  /**
   * Dipanggil setelah transaksi uang keluar tersimpan. Ambang yang tercapai diklaim lewat UNIQUE,
   * jadi dua anggota yang mencatat bersamaan tetap menghasilkan satu peringatan per anggota.
   */
  async checkBudget(ctx: ServiceCtx, categoryId: string, txDate: string): Promise<number> {
    if (!(await this.d.notifications.alertsEnabled(ctx.bookId))) return 0
    const month = monthOfDate(txDate)
    const plan = await this.d.plans.get(ctx, month)
    const alloc = plan.allocations.find((a) => a.kind === "expense" && a.categoryId === categoryId)
    if (!alloc) return 0
    const cap = plan.spendingCap === null ? 0n : BigInt(plan.spendingCap)
    const income = planTotals(
      plan.incomes.map((i) => ({ amount: BigInt(i.amount) })),
      plan.spendingCap === null ? null : BigInt(plan.spendingCap),
      [],
    ).totalIncome
    const allocated = allocationAmount(
      {
        kind: "expense",
        mode: alloc.mode,
        amount: BigInt(alloc.amount),
        percentBp: alloc.percentBp,
        carriedOver: BigInt(alloc.carriedOver),
      },
      cap,
      income,
    )
    const spent = BigInt(plan.spentByCategory[categoryId] ?? "0")
    const pct = allocated > 0n ? String(Number((spent * 100n) / allocated)) : "0"
    let sent = 0
    for (const threshold of reachedThresholds(allocated, spent)) {
      const claimed = await this.d.notifications.claimAlert({
        id: this.d.newId(),
        bookId: ctx.bookId,
        categoryId,
        month,
        thresholdBp: threshold,
      })
      if (!claimed) continue
      const members = await this.d.notifications.activeMemberIds(ctx.bookId)
      const category =
        (await this.d.categories.list(ctx, { kind: "expense" })).find((c) => c.id === categoryId)?.name ?? "Kategori"
      await this.d.notifications.insertMany(
        members.map((userId) => ({
          id: this.d.newId(),
          bookId: ctx.bookId,
          userId,
          kind: "budget_alert",
          data: { category, categoryId, month, threshold: String(threshold), pct },
        })),
      )
      sent += members.length
    }
    return sent
  }

  /** Versi aman dipanggil setelah commit: gagal tidak menggagalkan pencatatan transaksi. */
  async checkBudgetSafely(ctx: ServiceCtx, categoryId: string, txDate: string): Promise<void> {
    try {
      await this.checkBudget(ctx, categoryId, txDate)
    } catch (e) {
      logger.error("peringatan anggaran gagal", { err: e instanceof Error ? e.name : "unknown" })
    }
  }

  async list(ctx: ServiceCtx, limit = 30): Promise<NotificationList> {
    const [rows, unread] = await Promise.all([
      this.d.notifications.list(ctx.bookId, ctx.userId, limit),
      this.d.notifications.unreadCount(ctx.bookId, ctx.userId),
    ])
    return {
      items: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        data: r.data,
        readAt: r.readAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      unread,
    }
  }

  readAll(ctx: ServiceCtx): Promise<void> {
    return this.d.notifications.markAllRead(ctx.bookId, ctx.userId, this.d.now())
  }

  async settings(ctx: ServiceCtx): Promise<BookSettings> {
    return { budgetAlertEnabled: await this.d.notifications.alertsEnabled(ctx.bookId) }
  }

  async updateSettings(ctx: ServiceCtx, input: BookSettings): Promise<BookSettings> {
    await this.d.notifications.setAlertsEnabled(ctx.bookId, input.budgetAlertEnabled)
    return this.settings(ctx)
  }
}
