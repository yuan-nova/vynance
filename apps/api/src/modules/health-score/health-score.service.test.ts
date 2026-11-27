import { describe, expect, test } from "bun:test"
import { HealthScoreService } from "./health-score.service"

const ctx = { userId: "u", bookId: "b" }

const wallet = (
  type: string,
  balance: string,
  creditLimit: string | null = null,
  archivedAt: string | null = null,
) => ({
  type,
  balance,
  creditLimit,
  archivedAt,
})

const alloc = (categoryId: string, amount: string) => ({
  kind: "expense" as const,
  categoryId,
  investmentTypeId: null,
  mode: "amount" as const,
  amount,
  percentBp: 0,
  carriedOver: "0",
})

function build(over: {
  wallets?: ReturnType<typeof wallet>[]
  allocations?: ReturnType<typeof alloc>[]
  spent?: Record<string, string>
  income?: string
  expense?: string
  investments?: bigint
}) {
  return new HealthScoreService({
    wallets: {
      list: async () => ({ wallets: over.wallets ?? [], summary: {} }),
    } as never,
    plans: {
      get: async () => ({
        spendingCap: "5000000",
        incomes: [{ name: "Gaji", amount: "10000000" }],
        allocations: over.allocations ?? [],
        spentByCategory: over.spent ?? {},
      }),
    } as never,
    categories: {
      list: async () => [
        { id: "c1", name: "Makan", icon: "food" },
        { id: "c2", name: "Bensin", icon: "car" },
      ],
    } as never,
    transactions: {
      summary: async () => ({ income: over.income ?? "0", expense: over.expense ?? "0" }),
    } as never,
    investments: { totalValue: async () => over.investments ?? 0n } as never,
  })
}

describe("HealthScoreService", () => {
  test("akun tanpa kartu kredit tidak mendapat skor utang palsu (temuan no. 7)", async () => {
    const svc = build({ wallets: [wallet("bank", "10000000")] })
    const r = await svc.get(ctx, "2026-11")
    const debt = r.pillars.find((p) => p.key === "debt")
    expect(debt).toMatchObject({ status: "not_assessed", points: 0, valueBp: null })
    expect(debt?.detail).toBe("Tidak ada kartu kredit atau PayLater")
    expect(r.assessedCount).toBe(1)
  })

  test("hanya pilar yang punya data yang menghitung skor", async () => {
    const svc = build({
      wallets: [wallet("bank", "8000000")],
      investments: 2_000_000n,
      income: "10000000",
      expense: "8000000",
    })
    const r = await svc.get(ctx, "2026-11")
    // Tabungan 20% penuh, investasi 20% penuh; anggaran dan utang belum dinilai.
    expect(r.assessedCount).toBe(2)
    expect(r.score).toBe(100)
    expect(r.levelLabel).toBe("Sangat Baik")
    expect(r.note).toContain("2 pilar belum dinilai")
  })

  test("pilar anggaran dihitung dari kategori yang tidak melebihi alokasi (BR-11)", async () => {
    const svc = build({
      wallets: [wallet("bank", "1000")],
      allocations: [alloc("c1", "1000000"), alloc("c2", "1000000")],
      spent: { c1: "200000", c2: "1200000" },
    })
    const r = await svc.get(ctx, "2026-11")
    const budget = r.pillars.find((p) => p.key === "budget")
    expect(budget).toMatchObject({ status: "scored", points: 12.5, valueBp: 5_000 })
    expect(budget?.detail).toBe("1 dari 2 kategori dalam anggaran")
  })

  test("pilar utang memakai pemakaian limit tertinggi", async () => {
    const svc = build({
      wallets: [wallet("credit_card", "-1000000", "10000000"), wallet("paylater", "-9000000", "10000000")],
    })
    const r = await svc.get(ctx, "2026-11")
    const debt = r.pillars.find((p) => p.key === "debt")
    expect(debt).toMatchObject({ status: "scored", points: 0, valueBp: 9_000 })
    expect(debt?.detail).toBe("Pemakaian limit 90%")
  })

  test("rekening yang diarsipkan tidak ikut dinilai", async () => {
    const svc = build({
      wallets: [wallet("credit_card", "-9000000", "10000000", "2026-01-01T00:00:00.000Z")],
    })
    const r = await svc.get(ctx, "2026-11")
    expect(r.pillars.find((p) => p.key === "debt")?.status).toBe("not_assessed")
  })
})
