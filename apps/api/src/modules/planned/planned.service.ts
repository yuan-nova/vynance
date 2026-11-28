import {
  type Month,
  type PlannedList,
  plannedIdempotencyKey,
  plannedItemsFor,
  type RealizePlannedInput,
  type ServiceCtx,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { TransactionsService } from "../transactions/transactions.service"
import type { PlannedRepository } from "./planned.repository"

type Repos = { planned: PlannedRepository; activity: ActivityRepository }
type Deps = {
  planned: Pick<PlannedRepository, "incomeSources" | "subscriptions" | "records">
  transactions: Pick<TransactionsService, "create">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
}

/**
 * Rencana transaksi dari penghasilan rutin dan langganan (PB-13, FR-160). Rencana tidak mengubah saldo
 * (BR-61); baru Realisasi yang membuat transaksi biasa lewat TransactionsService.
 */
export class PlannedService {
  constructor(private readonly d: Deps) {}

  async list(ctx: ServiceCtx, month: Month): Promise<PlannedList> {
    const [incomes, subscriptions, records] = await Promise.all([
      this.d.planned.incomeSources(ctx.bookId),
      this.d.planned.subscriptions(ctx.bookId),
      this.d.planned.records(ctx.bookId, month),
    ])
    return { items: plannedItemsFor(month, { incomes, subscriptions }, records) }
  }

  /**
   * Realisasi atau Lewati (nominal 0). Idempotency-Key dari (sumber, bulan, percobaan) membuat kirim ulang
   * atau dua anggota menekan bersamaan tetap menghasilkan satu transaksi (BR-60).
   */
  async realize(ctx: ServiceCtx, input: RealizePlannedInput): Promise<PlannedList> {
    const [{ items }, records] = await Promise.all([
      this.list(ctx, input.period),
      this.d.planned.records(ctx.bookId, input.period),
    ])
    const item = items.find((i) => i.sourceType === input.sourceType && i.sourceId === input.sourceId)
    if (!item) throw new NotFound("PLANNED_NOT_FOUND")
    if (item.status === "realized") throw new BusinessError("PLANNED_ALREADY_REALIZED", undefined, 409)
    const attempt =
      records.find((r) => r.sourceType === input.sourceType && r.sourceId === input.sourceId)?.attempt ?? 0
    const base = {
      bookId: ctx.bookId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      period: input.period,
      createdBy: ctx.userId,
    }

    if (input.amount === 0n) {
      await this.d.uow.withTransaction(async (r) => {
        await r.planned.upsert({ ...base, id: this.d.newId(), status: "skipped", transactionId: null, attempt })
        await r.activity.record({
          id: this.d.newId(),
          bookId: ctx.bookId,
          actorId: ctx.userId,
          action: "planned.skipped",
          entityType: input.sourceType,
          entityId: input.sourceId,
          summary: { name: item.name, period: input.period },
        })
      })
      return this.list(ctx, input.period)
    }

    const tx = await this.d.transactions.create(
      ctx,
      {
        type: input.sourceType === "income" ? "income" : "expense",
        amount: input.amount,
        txDate: input.txDate,
        walletId: input.walletId,
        categoryId: input.categoryId,
        note: input.note || item.name,
      },
      plannedIdempotencyKey(input.sourceType, input.sourceId, input.period, attempt),
    )
    await this.d.uow.withTransaction(async (r) => {
      await r.planned.upsert({
        ...base,
        id: this.d.newId(),
        status: "realized",
        transactionId: tx.id,
        attempt: attempt + 1,
      })
    })
    return this.list(ctx, input.period)
  }
}
