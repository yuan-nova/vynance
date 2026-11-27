import { describe, expect, test } from "bun:test"
import { budgetStatus, budgetTone, categoryRealization, usageBp } from "./budget"

describe("anggaran BR-10..BR-12", () => {
  test("BR-10 realisasi = jumlah pengeluaran", () => {
    expect(categoryRealization([{ amount: 100n }, { amount: 250n }])).toBe(350n)
    expect(categoryRealization([])).toBe(0n)
  })

  test("BR-12 status (contoh design/07)", () => {
    expect(budgetStatus(0n, 50_000n)).toBe("unset")
    expect(budgetStatus(1_000_000n, 1_200_000n)).toBe("over") // 120%
    expect(budgetStatus(1_000_000n, 1_000_000n)).toBe("exact")
    expect(budgetStatus(1_000_000n, 200_000n)).toBe("safe") // 20%
  })

  test("BR-11 peringatan 90% dan merah > 100%", () => {
    expect(budgetTone(1_000n, 899n)).toBe("inc")
    expect(budgetTone(1_000n, 900n)).toBe("warn")
    expect(budgetTone(1_000n, 1_000n)).toBe("warn")
    expect(budgetTone(1_000n, 1_001n)).toBe("exp")
    expect(usageBp(1_000n, 1_600n)).toBe(16_000)
    expect(usageBp(0n, 5n)).toBe(0)
  })
})
