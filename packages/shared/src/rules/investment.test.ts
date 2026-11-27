import { describe, expect, test } from "bun:test"
import { assetGain, portfolioTotals, targetProgressBp } from "./investment"

describe("investasi PB-06", () => {
  test("untung/rugi = nilai kini − modal (contoh design/10 Emas Antam)", () => {
    const g = assetGain(42_820_000n, 48_000_000n)
    expect(g.gain).toBe(5_180_000n)
    expect(g.gainBp).toBe(1209) // +12,1%
    expect(assetGain(1_000n, 800n)).toEqual({ gain: -200n, gainBp: -2000 })
    expect(assetGain(0n, 500n).gainBp).toBeNull()
  })

  test("total portofolio", () => {
    const t = portfolioTotals([{ costBasis: 140_200_000n, currentValue: 152_600_000n }])
    expect(t).toEqual({ cost: 140_200_000n, value: 152_600_000n, gain: 12_400_000n, gainBp: 884 })
  })

  test("progres jenis terhadap target", () => {
    expect(targetProgressBp(48_000_000n, 100_000_000n)).toBe(4800)
    expect(targetProgressBp(150n, 100n)).toBe(10_000)
    expect(targetProgressBp(1n, null)).toBeNull()
  })
})
