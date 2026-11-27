import type { TxType } from "../enums/wallet"
import type { RuleResult } from "../errors"
import type { CategoryKind } from "../schemas/category"

// BR-31: rekening sumber ≠ tujuan.
export function checkTransferWallets(from: string, to?: string | null): RuleResult {
  if (!to) return { ok: false, code: "TRANSFER_TARGET_REQUIRED", field: "toWalletId" }
  if (to === from) return { ok: false, code: "TRANSFER_SAME_WALLET", field: "toWalletId" }
  return { ok: true }
}

/** Kategori uang keluar hanya untuk transaksi keluar, kategori uang masuk hanya untuk masuk. */
export function checkCategoryKind(type: TxType, kind: CategoryKind): RuleResult {
  const expected: CategoryKind | null = type === "expense" ? "expense" : type === "income" ? "income" : null
  if (expected === null || expected === kind) return { ok: true }
  return { ok: false, code: "CATEGORY_TYPE_MISMATCH", field: "categoryId" }
}

/** Transfer, beli aset, jual aset tidak dihitung sebagai pemasukan/pengeluaran (PB-02). */
export function countsAsIncome(type: TxType): boolean {
  return type === "income"
}

export function countsAsExpense(type: TxType): boolean {
  return type === "expense"
}
