import { describe, expect, test } from "bun:test"
import { incomeSummary } from "./income"

describe("porsi penghasilan pasif PB-10", () => {
  test("pasif ÷ total", () => {
    const s = incomeSummary(
      [
        { kind: "active", monthlyAmount: 12_000_000n },
        { kind: "passive", monthlyAmount: 2_000_000n },
        { kind: "passive", monthlyAmount: 1_000_000n },
      ],
      3000,
    )
    expect(s.total).toBe(15_000_000n)
    expect(s.passive).toBe(3_000_000n)
    expect(s.passiveBp).toBe(2000)
    expect(s.metTarget).toBe(false)
  })

  test("mencapai target 30%", () => {
    const s = incomeSummary(
      [
        { kind: "active", monthlyAmount: 7_000_000n },
        { kind: "passive", monthlyAmount: 3_000_000n },
      ],
      3000,
    )
    expect(s.passiveBp).toBe(3000)
    expect(s.metTarget).toBe(true)
  })

  test("tanpa sumber: porsi 0 dan belum mencapai target", () => {
    const s = incomeSummary([], 3000)
    expect(s.passiveBp).toBe(0)
    expect(s.metTarget).toBe(false)
  })
})
