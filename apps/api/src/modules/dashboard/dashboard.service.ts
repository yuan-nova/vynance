import {
  addMonths,
  allocationAmount,
  changeBp,
  type Dashboard,
  type DashboardCharts,
  monthDateRange,
  planTotals,
  type ServiceCtx,
  topBudgets,
  topSlices,
  usageBp,
  wealthSummary,
} from "@vynance/shared"
import type { CategoriesService } from "../categories/categories.service"
import type { HealthScoreService } from "../health-score/health-score.service"
import type { InvestmentsService } from "../investments/investments.service"
import type { PlansService } from "../plans/plans.service"
import type { TransactionsService } from "../transactions/transactions.service"
import type { WalletsService } from "../wallets/wallets.service"

type Deps = {
  wallets: Pick<WalletsService, "list">
  plans: Pick<PlansService, "get">
  transactions: Pick<TransactionsService, "list" | "summary" | "expenseByCategory">
  investments: Pick<InvestmentsService, "totalValue">
  categories: Pick<CategoriesService, "list">
  healthScore: Pick<HealthScoreService, "get">
}

const TOP_BUDGETS = 3
const CASHFLOW_MONTHS = 6
const COMPARE_CATEGORIES = 5
const RECENT = 5

/** Agregat Beranda (FR-50, FR-53): memakai service yang sama dengan layar Rekening dan Anggaran agar angkanya identik. */
export class DashboardService {
  constructor(private readonly d: Deps) {}

  async get(ctx: ServiceCtx, month: string): Promise<Dashboard> {
    const { from, to } = monthDateRange(month)
    const [wallets, plan, summary, recent, cats, score, investments] = await Promise.all([
      this.d.wallets.list(ctx),
      this.d.plans.get(ctx, month),
      this.d.transactions.summary(ctx, from, to),
      this.d.transactions.list(ctx, { limit: RECENT }),
      this.d.categories.list(ctx, { kind: "expense" }),
      this.d.healthScore.get(ctx, month),
      this.d.investments.totalValue(ctx),
    ])
    // Investasi = Σ nilai kini aset (BR-04, PB-06).
    const w = wealthSummary(
      wallets.wallets.map((x) => ({ type: x.type, balance: BigInt(x.balance) })),
      investments,
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

  /** Grafik Beranda (FR-52). Dimuat terpisah dari angka utama supaya tidak memperlambat LCP. */
  async charts(ctx: ServiceCtx, month: string): Promise<DashboardCharts> {
    const months = Array.from({ length: CASHFLOW_MONTHS }, (_, i) => addMonths(month, i - CASHFLOW_MONTHS + 1))
    const prev = addMonths(month, -1)
    const cur = monthDateRange(month)
    const last = monthDateRange(prev)
    const [flows, byCur, byPrev, cats] = await Promise.all([
      Promise.all(months.map((m) => this.d.transactions.summary(ctx, monthDateRange(m).from, monthDateRange(m).to))),
      this.d.transactions.expenseByCategory(ctx, cur.from, cur.to),
      this.d.transactions.expenseByCategory(ctx, last.from, last.to),
      this.d.categories.list(ctx, { kind: "expense" }),
    ])
    const name = (id: string) => cats.find((c) => c.id === id)?.name ?? "Tanpa kategori"
    const slices = topSlices(Object.entries(byCur).map(([id, amount]) => ({ name: name(id), amount })))
    const sum = (r: Record<string, bigint>) => Object.values(r).reduce((a, b) => a + b, 0n)
    const current = sum(byCur)
    const previous = sum(byPrev)
    const ids = [...new Set([...Object.keys(byCur), ...Object.keys(byPrev)])]
      .map((id) => ({ id, current: byCur[id] ?? 0n, previous: byPrev[id] ?? 0n }))
      .sort((a, b) => Number(b.current + b.previous - (a.current + a.previous)))
      .slice(0, COMPARE_CATEGORIES)
    return {
      month,
      cashflow: months.map((m, i) => ({
        month: m,
        income: flows[i]?.income ?? "0",
        expense: flows[i]?.expense ?? "0",
      })),
      byCategory: slices.map((s) => ({ name: s.name, amount: s.amount.toString() })),
      compare: {
        current: current.toString(),
        previous: previous.toString(),
        changeBp: changeBp(current, previous),
        categories: ids.map((x) => ({
          name: name(x.id),
          current: x.current.toString(),
          previous: x.previous.toString(),
        })),
      },
    }
  }
}
