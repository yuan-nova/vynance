import { describe, expect, test } from "bun:test"
import { allocationAmount, planTotals } from "./plan"

describe("BR-13 sisa belum dialokasikan", () => {
  // Contoh design/07-budget.svg: penghasilan Rp24,5 jt, pengeluaran Rp17 jt, investasi Rp5 jt → belum diatur Rp2,5 jt.
  test("contoh desain 07", () => {
    const t = planTotals([{ amount: 18_500_000n }, { amount: 6_000_000n }], 17_000_000n, [
      { kind: "expense", mode: "amount", amount: 12_000_000n, percentBp: 0 },
      { kind: "expense", mode: "percent", amount: 0n, percentBp: 2941 }, // ±29,41% × 17 jt
      { kind: "investment", mode: "percent", amount: 0n, percentBp: 2040 }, // 20,4% × 24,5 jt = 4.998.000
      { kind: "investment", mode: "amount", amount: 2_000n, percentBp: 0 },
    ])
    expect(t.totalIncome).toBe(24_500_000n)
    expect(t.expenseAllocated).toBe(12_000_000n + 4_999_700n)
    expect(t.investmentAllocated).toBe(5_000_000n)
    expect(t.unallocated).toBe(24_500_000n - (16_999_700n + 5_000_000n))
  })

  test("kelebihan alokasi → negatif", () => {
    const t = planTotals([{ amount: 1_000n }], 1_000n, [
      { kind: "expense", mode: "amount", amount: 1_500n, percentBp: 0 },
    ])
    expect(t.unallocated).toBe(-500n)
  })

  test("tanpa plafon: persen pengeluaran = 0", () => {
    expect(allocationAmount({ kind: "expense", mode: "percent", amount: 0n, percentBp: 5000 }, 0n, 10_000n)).toBe(0n)
  })

  test("carry-over ikut menambah alokasi (BR-14)", () => {
    expect(
      allocationAmount({ kind: "expense", mode: "amount", amount: 1_000n, percentBp: 0, carriedOver: 250n }, 0n, 0n),
    ).toBe(1_250n)
  })
})
