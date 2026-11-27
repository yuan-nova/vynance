import { describe, expect, test } from "bun:test"
import { SEED_EXPENSE_CATEGORIES, SEED_INCOME_CATEGORIES, SEED_INVESTMENT_TYPES, SEED_WALLETS } from "./book-seed"

describe("data bawaan buku (PB-01, BR-46)", () => {
  test("3 rekening, 10 kategori keluar, 4 kategori masuk, 3 jenis investasi", () => {
    expect(SEED_WALLETS).toHaveLength(3)
    expect(SEED_EXPENSE_CATEGORIES).toHaveLength(10)
    expect(SEED_INCOME_CATEGORIES).toHaveLength(4)
    expect(SEED_INVESTMENT_TYPES).toHaveLength(3)
  })
  test("Kartu Kredit limit Rp10 jt", () => {
    expect(SEED_WALLETS.find((w) => w.type === "credit_card")?.creditLimit).toBe(10_000_000n)
  })
  test("kategori masuk tanpa grup; kategori keluar bergrup", () => {
    expect(SEED_INCOME_CATEGORIES.every((c) => c.budgetGroup === null)).toBe(true)
    expect(SEED_EXPENSE_CATEGORIES.every((c) => c.budgetGroup !== null)).toBe(true)
  })
})
