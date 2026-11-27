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

/** Tanda nominal di daftar (DS-MONEY-01): masuk "+", keluar "−", lainnya tanpa tanda. */
export function txSign(type: TxType): "income" | "expense" | "none" {
  if (type === "income") return "income"
  if (type === "expense") return "expense"
  return "none"
}

/** Efek bersih transaksi terhadap total harian masuk/keluar (transfer & aset = 0). */
export function dailyNet(type: TxType, amount: bigint): bigint {
  if (type === "income") return amount
  if (type === "expense") return -amount
  return 0n
}

/** Grup per tanggal dengan total harian, urutan mengikuti input (DS-DATA-01). */
export function groupByDate<T extends { txDate: string; type: TxType; amount: string }>(
  rows: readonly T[],
): { date: string; total: bigint; items: T[] }[] {
  const out: { date: string; total: bigint; items: T[] }[] = []
  for (const r of rows) {
    let g = out[out.length - 1]
    if (!g || g.date !== r.txDate) {
      g = { date: r.txDate, total: 0n, items: [] }
      out.push(g)
    }
    g.items.push(r)
    g.total += dailyNet(r.type, BigInt(r.amount))
  }
  return out
}

/** Dampak beli/jual ke aset (PB-06, TSD §7.3): beli menambah modal & nilai, jual menguranginya. */
export function assetTradeDelta(type: TxType, amount: bigint): { cost: bigint; value: bigint } {
  if (type === "asset_buy") return { cost: amount, value: amount }
  if (type === "asset_sell") return { cost: -amount, value: -amount }
  return { cost: 0n, value: 0n }
}

/** BR-33: jual aset ≤ nilai kini dan ≤ modal aset. */
export function checkAssetSell(asset: { costBasis: bigint; currentValue: bigint }, amount: bigint): RuleResult {
  if (amount > asset.currentValue || amount > asset.costBasis) {
    return { ok: false, code: "ASSET_SELL_EXCEEDS", field: "amount" }
  }
  return { ok: true }
}
