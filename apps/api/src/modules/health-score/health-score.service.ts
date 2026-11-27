import {
  allocationAmount,
  budgetTone,
  formatMoney,
  HEALTH_LEVEL_LABEL,
  type HealthPillar,
  type HealthScoreResponse,
  healthAssessedNote,
  healthScore,
  limitUsageBp,
  monthDateRange,
  PILLAR_LABEL,
  planTotals,
  type ServiceCtx,
  wealthSummary,
} from "@vynance/shared"
import type { CategoriesService } from "../categories/categories.service"
import type { PlansService } from "../plans/plans.service"
import type { TransactionsService } from "../transactions/transactions.service"
import type { WalletsService } from "../wallets/wallets.service"

type Deps = {
  wallets: Pick<WalletsService, "list">
  plans: Pick<PlansService, "get">
  transactions: Pick<TransactionsService, "summary" | "getHealthInputs">
  categories: Pick<CategoriesService, "list">
}

/** Rincian angka mentah per pilar untuk layar rincian (FR-51). Pilar belum dinilai menyebut alasannya. */
function pillarDetail(key: HealthPillar["key"], ctx: DetailCtx): string {
  const bp = ctx.pillar?.valueBp ?? 0
  switch (key) {
    case "savings":
      if (ctx.income <= 0n) return "Belum ada uang masuk bulan ini"
      return `${formatMoney(ctx.income)} masuk, ${formatMoney(ctx.expense)} keluar (${formatPercent(bp)} dari uang masuk)`
    case "budget": {
      const total = ctx.budgetedCategories ?? 0
      if (total === 0) return "Belum ada kategori yang dianggarkan bulan ini"
      return `${ctx.withinBudgetCategories} dari ${total} kategori dalam anggaran`
    }
    case "debt":
      return ctx.debtUsageBp === null ? "Tidak ada kartu kredit atau PayLater" : `Pemakaian limit ${formatPercent(bp)}`
    case "investment":
      if (ctx.cash + ctx.investments <= 0n) return "Belum ada kas atau investasi yang tercatat"
      return `${formatMoney(ctx.investments)} investasi dari ${formatMoney(ctx.cash + ctx.investments)} kas + investasi`
  }
}

function formatPercent(bp: number): string {
  const abs = Math.abs(bp) / 100
  const text = abs % 1 === 0 ? abs.toString() : abs.toFixed(1).replace(".", ",")
  return `${bp < 0 ? "−" : ""}${text}%`
}

type DetailCtx = {
  income: bigint
  expense: bigint
  budgetedCategories: number | null
  withinBudgetCategories: number
  debtUsageBp: number | null
  cash: bigint
  investments: bigint
  pillar?: HealthPillar
}

/** Skor kesehatan keuangan (BRD §8.2, FR-51): memakai service Rekening, Rencana, dan Transaksi agar angka identik. */
export class HealthScoreService {
  constructor(private readonly d: Deps) {}

  async get(ctx: ServiceCtx, month: string): Promise<HealthScoreResponse> {
    const { from, to } = monthDateRange(month)
    const [wallets, plan, summary, cats, sums] = await Promise.all([
      this.d.wallets.list(ctx),
      this.d.plans.get(ctx, month),
      this.d.transactions.summary(ctx, from, to),
      this.d.categories.list(ctx, { kind: "expense" }),
      this.d.transactions.getHealthInputs(ctx, to),
    ])
    const active = wallets.wallets.filter((x) => x.archivedAt === null)
    const w = wealthSummary(
      active.map((x) => ({ type: x.type, balance: BigInt(x.balance) })),
      0n,
    )
    // Skor utang memakai pemakaian limit tertinggi di antara kartu kredit dan PayLater (BR-05).
    const debtUsageBp = active
      .map((x) => limitUsageBp(BigInt(x.balance), x.creditLimit === null ? null : BigInt(x.creditLimit)))
      .filter((v): v is number => v !== null)
      .reduce<number | null>((max, v) => (max === null || v > max ? v : max), null)

    const cap = plan.spendingCap === null ? 0n : BigInt(plan.spendingCap)
    const { totalIncome } = planTotals(
      plan.incomes.map((i) => ({ amount: BigInt(i.amount) })),
      plan.spendingCap === null ? null : BigInt(plan.spendingCap),
      [],
    )
    const catById = new Map(cats.map((c) => [c.id, c]))
    const budgets = plan.allocations.flatMap((a) => {
      const c = a.categoryId ? catById.get(a.categoryId) : undefined
      if (a.kind !== "expense" || !c) return []
      const allocated = allocationAmount(
        {
          kind: "expense",
          mode: a.mode,
          amount: BigInt(a.amount),
          percentBp: a.percentBp,
          carriedOver: BigInt(a.carriedOver),
        },
        cap,
        totalIncome,
      )
      return [{ allocated, spent: BigInt(plan.spentByCategory[c.id] ?? "0") }]
    })
    const withinBudgetCategories = budgets.filter((b) => budgetTone(b.allocated, b.spent) !== "exp").length

    const income = BigInt(summary.income)
    const expense = BigInt(summary.expense)
    const investments = sums.investments
    const raw = {
      income,
      expense,
      budgetedCategories: budgets.length ? budgets.length : null,
      withinBudgetCategories,
      debtUsageBp,
      cash: w.cash,
      investments,
    }
    const result = healthScore(raw)
    return {
      month,
      score: result.score,
      level: result.level,
      levelLabel: HEALTH_LEVEL_LABEL[result.level],
      assessedCount: result.assessedCount,
      note: healthAssessedNote(result),
      pillars: result.pillars.map((p) => ({
        key: p.key,
        label: PILLAR_LABEL[p.key],
        status: p.status,
        points: Math.round(p.points * 100) / 100,
        valueBp: p.valueBp,
        detail: pillarDetail(p.key, { ...raw, pillar: p }),
      })),
    }
  }
}
