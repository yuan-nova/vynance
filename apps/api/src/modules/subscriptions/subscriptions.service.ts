import {
  type CreateSubscriptionInput,
  type Currency,
  dateOnlyOf,
  FALLBACK_FX,
  type FxRates,
  monthlyCost,
  nextBillingDate,
  recognizeService,
  type ServiceCtx,
  type Subscription,
  type SubscriptionList,
  toIdr,
  type UpdateSubscriptionInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { CategoriesRepository } from "../categories/categories.repository"
import type { WalletsRepository } from "../wallets/wallets.repository"
import type { SubscriptionsRepository } from "./subscriptions.repository"

type Repos = {
  subscriptions: SubscriptionsRepository
  wallets: WalletsRepository
  categories: CategoriesRepository
  activity: ActivityRepository
}
type Deps = {
  subscriptions: Pick<SubscriptionsRepository, "list" | "findById" | "lastCharges" | "latestFx">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}
type Row = NonNullable<Awaited<ReturnType<SubscriptionsRepository["findById"]>>>

/** Langganan (FR-80, PB-05). Nominal rupiah dihitung saat disimpan dari kurs manual atau kurs terbaru. */
export class SubscriptionsService {
  constructor(private readonly d: Deps) {}

  async rates(): Promise<FxRates> {
    const ref = new Map((await this.d.subscriptions.latestFx()).map((r) => [r.currency, r]))
    return (Object.keys(FALLBACK_FX) as Exclude<Currency, "IDR">[]).map((c) => {
      const r = ref.get(c)
      return r
        ? { currency: c, value: r.value, source: "reference" as const, fetchedAt: r.fetchedAt.toISOString() }
        : { currency: c, value: FALLBACK_FX[c], source: "fallback" as const, fetchedAt: null }
    })
  }

  async list(ctx: ServiceCtx): Promise<SubscriptionList> {
    const [rows, last] = await Promise.all([
      this.d.subscriptions.list(ctx.bookId),
      this.d.subscriptions.lastCharges(ctx.bookId),
    ])
    const today = dateOnlyOf(this.d.now())
    const items = rows.map((r) => this.toDto(r, today, last.get(r.id) ?? null))
    const active = rows.filter((r) => r.pausedAt === null)
    const monthly = active.reduce((s, r) => s + monthlyCost(r), 0n)
    return {
      subscriptions: items.sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate)),
      monthlyTotal: monthly.toString(),
      yearlyTotal: (monthly * 12n).toString(),
    }
  }

  async get(ctx: ServiceCtx, id: string): Promise<Subscription> {
    const row = await this.d.subscriptions.findById(ctx.bookId, id)
    if (!row) throw new NotFound("SUBSCRIPTION_NOT_FOUND")
    const last = await this.d.subscriptions.lastCharges(ctx.bookId)
    return this.toDto(row, dateOnlyOf(this.d.now()), last.get(id) ?? null)
  }

  async create(ctx: ServiceCtx, input: CreateSubscriptionInput): Promise<Subscription> {
    const id = this.d.newId()
    const values = await this.values(input)
    await this.d.uow.withTransaction(async (r) => {
      await this.assertRefs(r, ctx.bookId, input)
      await r.subscriptions.insert({ ...values, id, bookId: ctx.bookId, createdBy: ctx.userId })
      await this.log(r, ctx, "subscription.created", id, input.name)
    })
    return this.get(ctx, id)
  }

  async update(ctx: ServiceCtx, id: string, input: UpdateSubscriptionInput): Promise<Subscription> {
    const values = await this.values(input)
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.subscriptions.findById(ctx.bookId, id)
      if (!current) throw new NotFound("SUBSCRIPTION_NOT_FOUND")
      await this.assertRefs(r, ctx.bookId, input)
      const pausedAt = input.paused ? (current.pausedAt ?? this.d.now()) : null
      await r.subscriptions.update(ctx.bookId, id, { ...values, pausedAt })
      await this.log(r, ctx, "subscription.updated", id, input.name)
    })
    return this.get(ctx, id)
  }

  async remove(ctx: ServiceCtx, id: string): Promise<void> {
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.subscriptions.findById(ctx.bookId, id)
      if (!current) throw new NotFound("SUBSCRIPTION_NOT_FOUND")
      await r.subscriptions.softDelete(ctx.bookId, id, this.d.now())
      await this.log(r, ctx, "subscription.deleted", id, current.name)
    })
  }

  private async values(input: CreateSubscriptionInput) {
    const foreign = input.currency !== "IDR"
    let rate = "1"
    if (foreign) {
      rate = input.fxRate ?? (await this.rates()).find((r) => r.currency === input.currency)?.value ?? "1"
    }
    const amountIdr = toIdr(input.originalAmount, rate)
    if (amountIdr <= 0n) throw new BusinessError("VALIDATION", "originalAmount")
    return {
      name: input.name,
      serviceKey: recognizeService(input.name)?.key ?? null,
      currency: input.currency,
      originalAmount: input.originalAmount,
      fxRate: foreign ? input.fxRate : null,
      amountIdr,
      cycle: input.cycle,
      billingDay: input.billingDay,
      billingMonth: input.cycle === "yearly" ? input.billingMonth : null,
      walletId: input.walletId,
      categoryId: input.categoryId,
      startDate: input.startDate,
    }
  }

  private async assertRefs(r: Repos, bookId: string, input: CreateSubscriptionInput): Promise<void> {
    const w = await r.wallets.findById(bookId, input.walletId)
    if (!w) throw new BusinessError("WALLET_NOT_FOUND", "walletId")
    if (w.archivedAt) throw new BusinessError("WALLET_ARCHIVED", "walletId")
    if (input.categoryId) {
      const [c] = await r.categories.existActive(bookId, [input.categoryId])
      if (!c || c.kind !== "expense") throw new BusinessError("CATEGORY_NOT_FOUND", "categoryId")
    }
  }

  private toDto(r: Row, today: string, lastChargedOn: string | null): Subscription {
    return {
      id: r.id,
      name: r.name,
      serviceKey: r.serviceKey,
      currency: r.currency as Currency,
      originalAmount: r.originalAmount,
      fxRate: r.fxRate,
      amountIdr: r.amountIdr.toString(),
      monthlyIdr: monthlyCost(r).toString(),
      cycle: r.cycle,
      billingDay: r.billingDay,
      billingMonth: r.billingMonth,
      walletId: r.walletId,
      walletName: r.walletName,
      categoryId: r.categoryId,
      startDate: r.startDate,
      nextBillingDate: nextBillingDate(r, today < r.startDate ? r.startDate : today),
      paused: r.pausedAt !== null,
      lastChargedOn,
    }
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, name: string): Promise<void> {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "subscription",
      entityId: id,
      summary: { name },
    })
  }
}
