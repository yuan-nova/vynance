import { describe, expect, test } from "bun:test"
import { computeZakat, haulDate } from "./zakat"

const gold = 1_580_000n // nisab = 134.300.000

describe("zakat maal BR-42", () => {
  test("contoh desain: kas + investasi − utang di atas nisab", () => {
    const r = computeZakat({
      cash: 42_300_000n,
      investments: 152_600_000n,
      debtDue: 8_450_000n,
      goldPricePerGram: gold,
    })
    expect(r).toEqual({ wealth: 186_450_000n, nisab: 134_300_000n, obligatory: true, zakat: 4_661_250n })
  })

  test("tepat di nisab wajib, satu rupiah di bawah tidak", () => {
    expect(computeZakat({ cash: 134_300_000n, investments: 0n, debtDue: 0n, goldPricePerGram: gold })).toMatchObject({
      obligatory: true,
      zakat: 3_357_500n,
    })
    expect(computeZakat({ cash: 134_299_999n, investments: 0n, debtDue: 0n, goldPricePerGram: gold })).toMatchObject({
      obligatory: false,
      zakat: 0n,
    })
  })

  test("utang menurunkan harta di bawah nisab; tanda utang tidak berpengaruh", () => {
    const a = computeZakat({ cash: 140_000_000n, investments: 0n, debtDue: 10_000_000n, goldPricePerGram: gold })
    const b = computeZakat({ cash: 140_000_000n, investments: 0n, debtDue: -10_000_000n, goldPricePerGram: gold })
    expect(a.obligatory).toBe(false)
    expect(b).toEqual(a)
  })

  test("haul 354 hari", () => {
    expect(haulDate("2025-03-25")).toBe("2026-03-14")
  })
})
