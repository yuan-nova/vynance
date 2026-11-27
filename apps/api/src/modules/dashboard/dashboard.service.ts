import {
  allocationAmount,
  type Dashboard,
  monthDateRange,
  planTotals,
  type ServiceCtx,
  topBudgets,
  usageBp,
  wealthSummary,
} from "@vynance/shared"
import type { CategoriesService } from "../categories/categories.service"
import type { HealthScoreService } from "../health-score/health-score.service"
import type { PlansService } from "../plans/plans.service"
import type { TransactionsService } from "../transactions/transactions.service"
import type { WalletsService } from "../wallets/wallets.service"

type Deps = {
  wallets: Pick<WalletsService, "list">
  plans: Pick<PlansService, "get">
  transactions: Pick<TransactionsService, "list" | "summary" | "getHealthInputs">
  categories: Pick<CategoriesService, "list">
  healthScore: Pick<HealthScoreService, "get">
}

const TOP_BUDGETS = 3
const RECENT = 5

/** Agregat Beranda (FR-50, FR-53): memakai service yang sama dengan layar Rekening dan Anggaran agar angkanya identik. */
export class DashboardService {
  constructor(private readonly d: Deps) {}

  async get(ctx: ServiceCtx, month: string): Promise<Dashboard> {
    const { from, to } = monthDateRange(month)
    const [wallets, plan, summary, recent, cats, score, assets] = await Promise.all([
      this.d.wallets.list(ctx),
      this.d.plans.get(ctx, month),
      this.d.transactions.summary(ctx, from, to),
      this.d.transactions.list(ctx, { limit: RECENT }),
      this.d.categories.list(ctx, { kind: "expense" }),
      this.d.healthScore.get(ctx, month),
      this.d.transactions.getHealthInputs(ctx, to),
    ])
    // Nilai investasi dari transaksi aset; aset (#31) menggantikan angka ini saat dirilis.
    const w = wealthSummary(
      wallets.wallets.map((x) => ({ type: x.type, balance: BigInt(x.balance) })),
      assets.investments,
    )
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
      return [{ c, allocated, spent: BigInt(plan.spentByCategory[c.id] ?? "0") }]
    })
    return {
      month,
      wealth: {
        netWorth: w.netWorth.toString(),
        cash: w.cash.toString(),
        investments: w.investments.toString(),
        debt: w.debt.toString(),
      },
      monthSummary: summary,
      healthScore: { score: score.score, level: score.level, levelLabel: score.levelLabel },
      topBudgets: topBudgets(budgets, TOP_BUDGETS).map((b) => ({
        categoryId: b.c.id,
        name: b.c.name,
        icon: b.c.icon,
        allocated: b.allocated.toString(),
        spent: b.spent.toString(),
        usageBp: usageBp(b.allocated, b.spent),
      })),
      recent: recent.data,
    }
  }
}
