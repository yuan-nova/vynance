import { isDebtWallet, type TxType, type WalletType } from "../enums/wallet"

// Rumus saldo dan kekayaan (BR-01 s.d. BR-05). Semua bigint rupiah utuh.

/** Jumlah transaksi per (rekening, tipe, arah), hasil agregat dari DB. */
export type TxSum = { walletId: string; type: TxType; direction: "from" | "to"; total: bigint }

/** Efek satu jumlah transaksi ke rekening (PB-02). `to` hanya untuk rekening tujuan transfer. */
export function txEffect(type: TxType, direction: "from" | "to", amount: bigint): bigint {
  if (direction === "to") return type === "transfer" ? amount : 0n
  switch (type) {
    case "income":
    case "asset_sell":
      return amount
    case "expense":
    case "asset_buy":
    case "transfer":
      return -amount
  }
}

// BR-01
export function walletBalances(
  wallets: readonly { id: string; openingBalance: bigint }[],
  sums: readonly TxSum[],
): Map<string, bigint> {
  const out = new Map<string, bigint>()
  for (const w of wallets) out.set(w.id, w.openingBalance)
  for (const s of sums) {
    const current = out.get(s.walletId)
    if (current === undefined) continue
    out.set(s.walletId, current + txEffect(s.type, s.direction, s.total))
  }
  return out
}

export type WealthSummary = { cash: bigint; debt: bigint; investments: bigint; netWorth: bigint }

/**
 * BR-02: kas = Σ saldo rekening non-utang.
 * BR-03: utang = Σ saldo kartu kredit + PayLater (biasanya negatif).
 * BR-04: kekayaan bersih = kas + investasi − |utang| (utang negatif dijumlahkan langsung).
 */
export function wealthSummary(
  wallets: readonly { type: WalletType; balance: bigint }[],
  investmentsValue: bigint = 0n,
): WealthSummary {
  let cash = 0n
  let debt = 0n
  for (const w of wallets) {
    if (isDebtWallet(w.type)) debt += w.balance
    else cash += w.balance
  }
  return { cash, debt, investments: investmentsValue, netWorth: cash + investmentsValue + debt }
}

/** BR-05: pemakaian limit dalam basis poin (4100 = 41%). Saldo positif (lebih bayar) = 0. Tanpa limit = null. */
export function limitUsageBp(balance: bigint, limit: bigint | null): number | null {
  if (!limit || limit <= 0n) return null
  if (balance >= 0n) return 0
  return Number((-balance * 10_000n) / limit)
}
