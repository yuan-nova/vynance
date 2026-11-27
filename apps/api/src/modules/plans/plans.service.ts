import { monthDateRange, type Plan, type PutPlanInput, type ServiceCtx } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { CategoriesRepository } from "../categories/categories.repository"
import type { InvestmentTypesRepository } from "../investments/investment-types.repository"
import type { TransactionsRepository } from "../transactions/transactions.repository"
import type { WalletsRepository } from "../wallets/wallets.repository"
import type { PlansRepository } from "./plans.repository"

type Repos = {
  plans: PlansRepository
  categories: CategoriesRepository
  investmentTypes: InvestmentTypesRepository
  wallets: WalletsRepository
  activity: ActivityRepository
}
type Deps = {
  plans: Pick<PlansRepository, "findByMonth">
  transactions: Pick<TransactionsRepository, "sumIncomeExpense" | "sumExpenseByCategory">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
}

export class PlansService {
  constructor(private readonly d: Deps) {}

  /** Rencana bulan (PB-04) + pemasukan tercatat sebagai realisasi terpisah. Belum ada → dokumen kosong versi 0. */
  async get(ctx: ServiceCtx, month: string): Promise<Plan> {
    const { from, to } = monthDateRange(month)
    const [p, sums, spent] = await Promise.all([
      this.d.plans.findByMonth(ctx.bookId, month),
      this.d.transactions.sumIncomeExpense(ctx.bookId, from, to),
      this.d.transactions.sumExpenseByCategory(ctx.bookId, from, to),
    ])
    return {
      month,
      version: p?.version ?? 0,
      spendingCap: p?.spendingCap?.toString() ?? null,
      defaultWalletId: p?.defaultWalletId ?? null,
      method: p?.method ?? "custom",
      incomes: (p?.incomes ?? []).map((i) => ({ name: i.name, amount: i.amount.toString() })),
      allocations: (p?.allocations ?? []).map((a) => ({
        kind: a.kind,
        categoryId: a.categoryId,
        investmentTypeId: a.investmentTypeId,
        mode: a.mode,
        amount: a.amount.toString(),
        percentBp: a.percentBp,
        carriedOver: a.carriedOver.toString(),
      })),
      recordedIncome: sums.income.toString(),
      spentByCategory: Object.fromEntries(Object.entries(spent).map(([k, v]) => [k, v.toString()])),
      updatedByName: p ? (p.updatedByName ?? "") : null,
      updatedAt: p?.updatedAt.toISOString() ?? null,
    }
  }

  /**
   * Simpan dokumen rencana utuh. Versi beda dengan DB → 409 PLAN_CONFLICT (tidak menimpa diam-diam).
   * Kategori, jenis investasi, dan rekening wajib milik buku ini (TSD §6.3).
   */
  async put(ctx: ServiceCtx, month: string, input: PutPlanInput): Promise<Plan> {
    await this.d.uow.withTransaction(async (r) => {
      await this.assertRefs(r, ctx.bookId, input)
      const current = await r.plans.findByMonth(ctx.bookId, month)
      if ((current?.version ?? 0) !== input.version) throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      let planId: string
      if (!current) {
        planId = this.d.newId()
        const res = await r.plans.insertPlan({
          id: planId,
          bookId: ctx.bookId,
          month,
          spendingCap: input.spendingCap,
          defaultWalletId: input.defaultWalletId,
          method: input.method,
          createdBy: ctx.userId,
        })
        if (res === "conflict") throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      } else {
        planId = current.id
        const ok = await r.plans.updatePlan(ctx.bookId, planId, input.version, {
          spendingCap: input.spendingCap,
          defaultWalletId: input.defaultWalletId,
          method: input.method,
          updatedBy: ctx.userId,
        })
        if (!ok) throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      }
      // carried_over dipertahankan per target (diisi oleh "Bawa sisa", #34).
      const carried = new Map(
        (current?.allocations ?? []).map((a) => [a.categoryId ?? a.investmentTypeId ?? "", a.carriedOver]),
      )
      await r.plans.replaceChildren(
        ctx.bookId,
        planId,
        ctx.userId,
        input.incomes.map((i) => ({ id: this.d.newId(), ...i })),
        input.allocations.map((a) => ({
          ...a,
          id: this.d.newId(),
          carriedOver: carried.get(a.kind === "expense" ? a.categoryId : a.investmentTypeId) ?? 0n,
        })),
      )
      await r.activity.record({
        id: this.d.newId(),
        bookId: ctx.bookId,
        actorId: ctx.userId,
        action: "plan.saved",
        entityType: "plan",
        entityId: planId,
        summary: { month },
      })
    })
    return this.get(ctx, month)
  }

  private async assertRefs(r: Repos, bookId: string, input: PutPlanInput): Promise<void> {
    const catIds = [...new Set(input.allocations.flatMap((a) => (a.kind === "expense" ? [a.categoryId] : [])))]
    const typeIds = [
      ...new Set(input.allocations.flatMap((a) => (a.kind === "investment" ? [a.investmentTypeId] : []))),
    ]
    const cats = await r.categories.existActive(bookId, catIds)
    if (cats.length !== catIds.length || cats.some((c) => c.kind !== "expense")) {
      throw new BusinessError("CATEGORY_NOT_FOUND", "allocations")
    }
    if ((await r.investmentTypes.existing(bookId, typeIds)).length !== typeIds.length) {
      throw new BusinessError("INVESTMENT_TYPE_NOT_FOUND", "allocations")
    }
    if (input.defaultWalletId && !(await r.wallets.findById(bookId, input.defaultWalletId))) {
      throw new BusinessError("WALLET_NOT_FOUND", "defaultWalletId")
    }
  }
}
