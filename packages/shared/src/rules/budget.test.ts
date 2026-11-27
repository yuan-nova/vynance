import { describe, expect, test } from "bun:test"
import { budgetStatus, budgetTone, categoryRealization, topBudgets, usageBp } from "./budget"

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

test("topBudgets: urut pemakaian, buang yang belum diatur", () => {
  const r = topBudgets(
    [
      { id: "a", allocated: 1_000n, spent: 200n },
      { id: "b", allocated: 0n, spent: 900n },
      { id: "c", allocated: 1_000n, spent: 1_260n },
      { id: "d", allocated: 2_000n, spent: 1_700n },
    ],
    2,
  )
  expect(r.map((x) => x.id)).toEqual(["c", "d"])
})
