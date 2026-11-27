import { describe, expect, test } from "bun:test"
import { createTransactionSchema } from "../schemas/transaction"
import { checkCategoryKind, checkTransferWallets, countsAsExpense, countsAsIncome } from "./transaction"

describe("BR-31 transfer", () => {
  test("sumber = tujuan ditolak", () =>
    expect(checkTransferWallets("a", "a")).toEqual({ ok: false, code: "TRANSFER_SAME_WALLET", field: "toWalletId" }))
  test("tanpa tujuan ditolak", () => expect(checkTransferWallets("a", null).ok).toBe(false))
  test("beda rekening boleh", () => expect(checkTransferWallets("a", "b").ok).toBe(true))
})

describe("kategori sesuai jenis", () => {
  test("keluar + kategori masuk ditolak", () => expect(checkCategoryKind("expense", "income").ok).toBe(false))
  test("masuk + kategori masuk boleh", () => expect(checkCategoryKind("income", "income").ok).toBe(true))
})

describe("transfer tidak dihitung masuk/keluar (PB-02)", () => {
  test("transfer", () => {
    expect(countsAsIncome("transfer")).toBe(false)
    expect(countsAsExpense("transfer")).toBe(false)
  })
})

describe("BR-30 skema", () => {
  const base = { walletId: "01JAAAAAAAAAAAAAAAAAAAAAAA", txDate: "2026-11-26" }
  test("jumlah 0 ditolak", () =>
    expect(
      createTransactionSchema.safeParse({ ...base, type: "expense", amount: "0", categoryId: base.walletId }).success,
    ).toBe(false))
  test("transfer ke rekening sama ditolak", () =>
    expect(
      createTransactionSchema.safeParse({ ...base, type: "transfer", amount: "1", toWalletId: base.walletId }).success,
    ).toBe(false))
  test("keluar valid", () =>
    expect(
      createTransactionSchema.safeParse({ ...base, type: "expense", amount: "287500", categoryId: base.walletId })
        .success,
    ).toBe(true))
})
