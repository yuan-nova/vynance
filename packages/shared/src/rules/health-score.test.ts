import { describe, expect, test } from "bun:test"
import {
  budgetPillar,
  debtPillar,
  healthAssessedNote,
  healthLevel,
  healthScore,
  investmentPillar,
  savingsPillar,
} from "./health-score"

describe("skor kesehatan BRD §8.2", () => {
  test("label ≥80 Sangat Baik, ≥60 Baik, ≥40 Cukup, <40 Perlu Perhatian", () => {
    expect(healthLevel(100)).toBe("excellent")
    expect(healthLevel(80)).toBe("excellent")
    expect(healthLevel(79)).toBe("good")
    expect(healthLevel(60)).toBe("good")
    expect(healthLevel(59)).toBe("fair")
    expect(healthLevel(40)).toBe("fair")
    expect(healthLevel(39)).toBe("poor")
    expect(healthLevel(0)).toBe("poor")
  })

  test("pilar tabungan: penuh di 20%, linear di bawahnya, minus = 0", () => {
    expect(savingsPillar(10_000n, 8_000n)).toMatchObject({ points: 25, status: "scored", valueBp: 2_000 })
    expect(savingsPillar(10_000n, 9_000n)).toMatchObject({ points: 12.5, valueBp: 1_000 })
    expect(savingsPillar(10_000n, 10_000n)).toMatchObject({ points: 0 })
    expect(savingsPillar(10_000n, 12_000n)).toMatchObject({ points: 0, valueBp: -2_000 })
  })

  test("pilar tabungan tanpa uang masuk bulan ini belum dinilai", () => {
    expect(savingsPillar(0n, 0n)).toMatchObject({ status: "not_assessed", points: 0, valueBp: null })
    expect(savingsPillar(0n, 5_000n)).toMatchObject({ status: "not_assessed" })
  })

  test("pilar anggaran proporsional terhadap kategori beranggaran", () => {
    expect(budgetPillar(4, 4)).toMatchObject({ points: 25, valueBp: 10_000 })
    expect(budgetPillar(4, 3)).toMatchObject({ points: 18.75, valueBp: 7_500 })
    expect(budgetPillar(4, 0)).toMatchObject({ points: 0, valueBp: 0 })
    // Data rusak tidak boleh melebihi 25.
    expect(budgetPillar(4, 9)).toMatchObject({ points: 25 })
  })

  test("pilar anggaran belum ada anggaran belum dinilai", () => {
    expect(budgetPillar(null, 0)).toMatchObject({ status: "not_assessed" })
    expect(budgetPillar(0, 0)).toMatchObject({ status: "not_assessed" })
  })

  test("pilar utang: ≤30% penuh, ≥90% nol, linear di antaranya", () => {
    expect(debtPillar(0)).toMatchObject({ points: 25, status: "scored" })
    expect(debtPillar(3_000)).toMatchObject({ points: 25 })
    expect(debtPillar(9_000)).toMatchObject({ points: 0 })
    expect(debtPillar(15_000)).toMatchObject({ points: 0 })
    // 60% tepat di tengah 30–90% → 12,5 poin.
    expect(debtPillar(6_000)).toMatchObject({ points: 12.5, valueBp: 6_000 })
  })

  test("akun tanpa kartu kredit dan PayLater tidak mendapat skor utang palsu", () => {
    expect(debtPillar(null)).toMatchObject({ status: "not_assessed", points: 0, valueBp: null })
  })

  test("pilar investasi: penuh di 20% dari kas + investasi", () => {
    expect(investmentPillar(8_000n, 2_000n)).toMatchObject({ points: 25, valueBp: 2_000 })
    expect(investmentPillar(9_000n, 1_000n)).toMatchObject({ points: 12.5 })
    expect(investmentPillar(10_000n, 0n)).toMatchObject({ points: 0 })
    expect(investmentPillar(0n, 0n)).toMatchObject({ status: "not_assessed" })
  })
})

describe("healthScore proporsional (temuan BRD §9 no. 7)", () => {
  const full = {
    income: 10_000n,
    expense: 8_000n,
    budgetedCategories: 4,
    withinBudgetCategories: 3,
    debtUsageBp: 6_000,
    cash: 8_000n,
    investments: 2_000n,
  }

  test("empat pilar dinilai dijumlahkan langsung", () => {
    const r = healthScore(full)
    // 25 + 18,75 + 12,5 + 25 = 81,25 → 81
    expect(r.assessedCount).toBe(4)
    expect(r.unassessedPoints).toBe(0)
    expect(r.score).toBe(81)
    expect(r.level).toBe("excellent")
    expect(healthAssessedNote(r)).toBe("Keempat pilar dinilai.")
  })

  test("dua pilar tanpa data diskalakan ke 100, bukan 25 poin gratis", () => {
    const r = healthScore({
      ...full,
      budgetedCategories: null,
      withinBudgetCategories: 0,
      debtUsageBp: null,
    })
    expect(r.assessedCount).toBe(2)
    expect(r.assessedPoints).toBe(50)
    expect(r.unassessedPoints).toBe(50)
    // (25 + 25) ÷ 50 × 100 = 100, bukan 75 seperti rumus lama.
    expect(r.score).toBe(100)
    expect(r.pillars.find((p) => p.key === "budget")?.status).toBe("not_assessed")
    expect(r.pillars.find((p) => p.key === "debt")?.status).toBe("not_assessed")
  })

  test("satu pilar saja tidak bisa membuat skor 100 kalau pilar itu setengah jalan", () => {
    const r = healthScore({
      income: 10_000n,
      expense: 9_000n,
      budgetedCategories: null,
      withinBudgetCategories: 0,
      debtUsageBp: null,
      cash: 0n,
      investments: 0n,
    })
    expect(r.assessedCount).toBe(1)
    expect(r.assessedPoints).toBe(12.5)
    expect(r.score).toBe(50)
    expect(r.level).toBe("fair")
  })

  test("tanpa satu pilar pun skor 0 dan semua belum dinilai", () => {
    const r = healthScore({
      income: 0n,
      expense: 0n,
      budgetedCategories: null,
      withinBudgetCategories: 0,
      debtUsageBp: null,
      cash: 0n,
      investments: 0n,
    })
    expect(r.score).toBe(0)
    expect(r.assessedCount).toBe(0)
    expect(r.unassessedPoints).toBe(100)
    expect(r.pillars.every((p) => p.status === "not_assessed")).toBe(true)
    expect(healthAssessedNote(r)).toBe("Belum ada data untuk menilai kesehatan keuangan.")
  })
})
