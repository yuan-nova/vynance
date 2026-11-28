import {
  addMonths,
  allocationAmount,
  carryOverAmount,
  monthDateRange,
  type Plan,
  type PlannedIncomeSource,
  type PutPlanInput,
  planTotals,
  type ServiceCtx,
} from "@vynance/shared"
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
  realization?: Pick<PlansRepository, "investmentRealization">
  /** Sumber penghasilan rutin buku (PB-10); masuk otomatis ke penghasilan rencana (BR-62). */
  incomeSources?: (bookId: string) => Promise<PlannedIncomeSource[]>
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
}

export class PlansService {
  constructor(private readonly d: Deps) {}

  /** Rencana bulan (PB-04) + pemasukan tercatat sebagai realisasi terpisah. Belum ada → dokumen kosong versi 0. */
  async get(ctx: ServiceCtx, month: string): Promise<Plan> {
    const { from, to } = monthDateRange(month)
    const [p, sums, spent, sources] = await Promise.all([
      this.d.plans.findByMonth(ctx.bookId, month),
      this.d.transactions.sumIncomeExpense(ctx.bookId, from, to),
      this.d.transactions.sumExpenseByCategory(ctx.bookId, from, to),
      this.sourceIncomes(ctx.bookId, month),
    ])
    return {
      month,
      version: p?.version ?? 0,
      spendingCap: p?.spendingCap?.toString() ?? null,
      defaultWalletId: p?.defaultWalletId ?? null,
      method: p?.method ?? "custom",
      incomes: [
        ...sources.map((i) => ({ name: i.name, amount: i.amount.toString(), fromSource: true })),
        ...(p?.incomes ?? []).map((i) => ({ name: i.name, amount: i.amount.toString(), fromSource: false })),
      ],
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

  /** BR-62: sumber penghasilan rutin yang sudah ada di bulan itu. */
  private async sourceIncomes(bookId: string, month: string): Promise<{ name: string; amount: bigint }[]> {
    const rows = (await this.d.incomeSources?.(bookId)) ?? []
    return rows.filter((s) => s.createdMonth <= month).map((s) => ({ name: s.name, amount: s.monthlyAmount }))
  }

  /**
   * Salin rencana bulan lalu (PB-04 langkah 2, BR-63): plafon, rekening default, metode, penghasilan khusus,
   * dan alokasi beserta nominal/persennya. Sisa bawaan (carry-over) tidak ikut; pakai Bawa sisa terpisah.
   * Menimpa isi bulan ini; konfirmasi dilakukan di aplikasi sebelum memanggil.
   */
  async copyPrevious(ctx: ServiceCtx, month: string): Promise<Plan> {
    const prev = await this.d.plans.findByMonth(ctx.bookId, addMonths(month, -1))
    if (!prev) throw new BusinessError("PLAN_NO_PREVIOUS_TO_COPY")
    await this.d.uow.withTransaction(async (r) => {
      const current = await r.plans.findByMonth(ctx.bookId, month)
      let planId: string
      const fields = { spendingCap: prev.spendingCap, defaultWalletId: prev.defaultWalletId, method: prev.method }
      if (!current) {
        planId = this.d.newId()
        const res = await r.plans.insertPlan({
          id: planId,
          bookId: ctx.bookId,
          month,
          ...fields,
          createdBy: ctx.userId,
        })
        if (res === "conflict") throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      } else {
        planId = current.id
        const ok = await r.plans.updatePlan(ctx.bookId, planId, current.version, { ...fields, updatedBy: ctx.userId })
        if (!ok) throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      }
      await r.plans.replaceChildren(
        ctx.bookId,
        planId,
        ctx.userId,
        prev.incomes.map((i) => ({ id: this.d.newId(), name: i.name, amount: i.amount })),
        prev.allocations.flatMap((a): Parameters<PlansRepository["replaceChildren"]>[4] => {
          const base = { id: this.d.newId(), mode: a.mode, amount: a.amount, percentBp: a.percentBp, carriedOver: 0n }
          if (a.kind === "expense" && a.categoryId)
            return [{ ...base, kind: "expense" as const, categoryId: a.categoryId }]
          if (a.kind === "investment" && a.investmentTypeId)
            return [{ ...base, kind: "investment" as const, investmentTypeId: a.investmentTypeId }]
          return []
        }),
      )
      await r.activity.record({
        id: this.d.newId(),
        bookId: ctx.bookId,
        actorId: ctx.userId,
        action: "plan.copied",
        entityType: "plan",
        entityId: planId,
        summary: { month, from: addMonths(month, -1) },
      })
    })
    return this.get(ctx, month)
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

  /**
   * Bawa sisa bulan lalu (PB-04 langkah 7, BR-14). Sisa tiap kategori = max(alokasi − realisasi, 0), sisa
   * investasi = max(alokasi − beli aset jenis itu). Nilainya DITETAPKAN ke carried_over bulan ini (bukan
   * ditambah), jadi menekan dua kali tidak menggandakan.
   */
  async carryOver(ctx: ServiceCtx, month: string): Promise<Plan> {
    const prevMonth = addMonths(month, -1)
    const { from, to } = monthDateRange(prevMonth)
    const [prev, spent, invested] = await Promise.all([
      this.d.plans.findByMonth(ctx.bookId, prevMonth),
      this.d.transactions.sumExpenseByCategory(ctx.bookId, from, to),
      this.d.realization?.investmentRealization(ctx.bookId, from, to) ?? Promise.resolve(new Map<string, bigint>()),
    ])
    if (!prev) throw new BusinessError("PLAN_NO_PREVIOUS")
    const prevSources = await this.sourceIncomes(ctx.bookId, prevMonth)
    const prevIncome = planTotals([...prevSources, ...prev.incomes], prev.spendingCap, []).totalIncome
    const cap = prev.spendingCap ?? 0n
    const leftover = new Map<string, { kind: "expense" | "investment"; amount: bigint }>()
    for (const a of prev.allocations) {
      const target = a.categoryId ?? a.investmentTypeId
      if (!target) continue
      const allocated = allocationAmount(a, cap, prevIncome)
      const used = a.kind === "expense" ? (spent[target] ?? 0n) : (invested.get(target) ?? 0n)
      const amount = carryOverAmount(allocated, used)
      if (amount > 0n) leftover.set(target, { kind: a.kind, amount })
    }

    await this.d.uow.withTransaction(async (r) => {
      let current = await r.plans.findByMonth(ctx.bookId, month)
      if (!current) {
        const res = await r.plans.insertPlan({
          id: this.d.newId(),
          bookId: ctx.bookId,
          month,
          spendingCap: prev.spendingCap,
          defaultWalletId: prev.defaultWalletId,
          method: prev.method,
          createdBy: ctx.userId,
        })
        if (res === "conflict") throw new BusinessError("PLAN_CONFLICT", undefined, 409)
        current = await r.plans.findByMonth(ctx.bookId, month)
        if (!current) throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      } else if (
        !(await r.plans.updatePlan(ctx.bookId, current.id, current.version, {
          spendingCap: current.spendingCap,
          defaultWalletId: current.defaultWalletId,
          method: current.method,
          updatedBy: ctx.userId,
        }))
      ) {
        throw new BusinessError("PLAN_CONFLICT", undefined, 409)
      }
      const existing = new Set(current.allocations.map((a) => a.categoryId ?? a.investmentTypeId ?? ""))
      const allocations = [
        ...current.allocations.map((a) => {
          const target = a.categoryId ?? a.investmentTypeId ?? ""
          return {
            ...(a.kind === "expense"
              ? { kind: "expense" as const, categoryId: target }
              : { kind: "investment" as const, investmentTypeId: target }),
            mode: a.mode,
            amount: a.amount,
            percentBp: a.percentBp,
            id: this.d.newId(),
            carriedOver: leftover.get(target)?.amount ?? 0n,
          }
        }),
        ...[...leftover.entries()]
          .filter(([target]) => !existing.has(target))
          .map(([target, l]) => ({
            ...(l.kind === "expense"
              ? { kind: "expense" as const, categoryId: target }
              : { kind: "investment" as const, investmentTypeId: target }),
            mode: "amount" as const,
            amount: 0n,
            percentBp: 0,
            id: this.d.newId(),
            carriedOver: l.amount,
          })),
      ]
      await r.plans.replaceChildren(
        ctx.bookId,
        current.id,
        ctx.userId,
        current.incomes.map((i) => ({ id: this.d.newId(), ...i })),
        allocations,
      )
      await r.activity.record({
        id: this.d.newId(),
        bookId: ctx.bookId,
        actorId: ctx.userId,
        action: "plan.carried_over",
        entityType: "plan",
        entityId: current.id,
        summary: { month, from: prevMonth },
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
