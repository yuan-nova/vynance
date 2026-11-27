import { describe, expect, test } from "bun:test"
import { DashboardService } from "./dashboard.service"

const ctx = { userId: "u", bookId: "b", role: "owner" as const }
const alloc = (categoryId: string, amount: string) => ({
  kind: "expense" as const,
  categoryId,
  investmentTypeId: null,
  mode: "amount" as const,
  amount,
  percentBp: 0,
  carriedOver: "0",
})

describe("DashboardService", () => {
  test("kekayaan, ringkasan bulan dipilih, anggaran teratas, transaksi terakhir", async () => {
    let summaryRange: string[] = []
    const svc = new DashboardService({
      wallets: {
        list: async () => ({
          wallets: [
            { type: "bank", balance: "5000000", archivedAt: null },
            { type: "credit_card", balance: "-1000000", archivedAt: null },
            { type: "cash", balance: "999", archivedAt: "2026-01-01T00:00:00.000Z" },
          ],
          summary: {},
        }),
      } as never,
      plans: {
        get: async () => ({
          spendingCap: "3000000",
          incomes: [{ name: "Gaji", amount: "6000000" }],
          allocations: [alloc("c1", "1000000"), alloc("c2", "500000"), alloc("gone", "100")],
          spentByCategory: { c1: "200000", c2: "600000" },
        }),
      } as never,
      transactions: {
        summary: async (_c: unknown, from: string, to: string) => {
          summaryRange = [from, to]
          return { income: "6000000", expense: "800000" }
        },
        list: async () => ({ data: [{ id: "t1" }], nextCursor: null }),
      } as never,
      investments: { totalValue: async () => 0n } as never,
      healthScore: {
        get: async () => ({ score: 78, level: "good", levelLabel: "Baik" }),
      } as never,
      categories: {
        list: async () => [
          { id: "c1", name: "Makan", icon: "food" },
          { id: "c2", name: "Bensin", icon: "car" },
        ],
      } as never,
    })
    const d = await svc.get(ctx as never, "2026-11")
    expect(summaryRange).toEqual(["2026-11-01", "2026-11-30"])
    // Rekening arsip tetap dihitung (BR-35): kas 5.000.000 + 999.
    expect(d.wealth).toEqual({ netWorth: "4000999", cash: "5000999", investments: "0", debt: "-1000000" })
    expect(d.monthSummary).toEqual({ income: "6000000", expense: "800000" })
    expect(d.healthScore).toEqual({ score: 78, level: "good", levelLabel: "Baik" })
    expect(d.topBudgets.map((b) => b.categoryId)).toEqual(["c2", "c1"])
    expect(d.topBudgets.map((b) => b.usageBp)).toEqual([12_000, 2_000])
    expect(d.recent).toHaveLength(1)
  })

  test("grafik: arus kas 6 bulan berakhir di bulan dipilih, donut, bulan ini vs lalu (FR-52)", async () => {
    const ranges: string[] = []
    const svc = new DashboardService({
      wallets: {} as never,
      plans: {} as never,
      investments: {} as never,
      healthScore: {} as never,
      transactions: {
        summary: async (_c: unknown, from: string) => {
          ranges.push(from)
          return { income: "100", expense: "50" }
        },
        expenseByCategory: async (_c: unknown, from: string) =>
          from === "2026-11-01" ? { c1: 300n, c2: 100n } : { c1: 200n, c3: 50n },
      } as never,
      categories: {
        list: async () => [
          { id: "c1", name: "Makan" },
          { id: "c2", name: "Bensin" },
          { id: "c3", name: "Hiburan" },
        ],
      } as never,
    })
    const c = await svc.charts(ctx as never, "2026-11")
    expect(c.cashflow.map((x) => x.month)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"])
    expect(ranges).toHaveLength(6)
    expect(c.byCategory).toEqual([
      { name: "Makan", amount: "300" },
      { name: "Bensin", amount: "100" },
    ])
    expect(c.compare).toMatchObject({ current: "400", previous: "250", changeBp: 6000 })
    expect(c.compare.categories[0]).toEqual({ name: "Makan", current: "300", previous: "200" })
  })
})
