import { describe, expect, test } from "bun:test"
import { distributeEvenly, splitByPercent, WIZARD_PRESETS, wizardSpendingCap } from "./plan-wizard"

describe("wizard anggaran PB-04", () => {
  test("contoh design/08: 50/30/20 dari Rp24.500.000", () => {
    const s = splitByPercent(24_500_000n, WIZARD_PRESETS["50_30_20"])
    expect(s).toEqual({ needs: 12_250_000n, wants: 7_350_000n, savings: 4_900_000n })
    expect(wizardSpendingCap(s)).toBe(19_600_000n)
  })

  test("sisa pembulatan masuk tabungan; total tetap sama", () => {
    const s = splitByPercent(1_000_001n, WIZARD_PRESETS["70_10_20"])
    expect(s.needs + s.wants + s.savings).toBe(1_000_001n)
  })

  test("kustom < 100% tidak memaksa sisa ke tabungan", () => {
    const s = splitByPercent(10_000_000n, [4000, 3000, 1000])
    expect(s).toEqual({ needs: 4_000_000n, wants: 3_000_000n, savings: 1_000_000n })
  })

  test("bagi rata ke kategori: kelipatan ribuan, jumlah tepat", () => {
    const parts = distributeEvenly(12_250_000n, 6)
    expect(parts.slice(1).every((p) => p % 1000n === 0n)).toBe(true)
    expect(parts.reduce((a, b) => a + b, 0n)).toBe(12_250_000n)
    expect(distributeEvenly(1000n, 0)).toEqual([])
  })
})
