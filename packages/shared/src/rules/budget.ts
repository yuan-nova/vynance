import type { PillTone } from "../types"

// Anggaran per kategori (BR-10 s.d. BR-12). Rupiah utuh bigint.

export type BudgetStatus = "unset" | "over" | "exact" | "safe"

/** BR-10: realisasi = Σ pengeluaran kategori itu dalam bulan. */
export function categoryRealization(expenses: readonly { amount: bigint }[]): bigint {
  return expenses.reduce((s, e) => s + e.amount, 0n)
}

/** BR-12: alokasi 0 → Belum diatur; realisasi > alokasi → Melebihi; sama → Pas; selain itu Aman. */
export function budgetStatus(allocated: bigint, spent: bigint): BudgetStatus {
  if (allocated <= 0n) return "unset"
  if (spent > allocated) return "over"
  if (spent === allocated) return "exact"
  return "safe"
}

/** Rasio realisasi/alokasi dalam basis poin (10.000 = 100%). Alokasi 0 → 0. */
export function usageBp(allocated: bigint, spent: bigint): number {
  if (allocated <= 0n) return 0
  return Number((spent * 10_000n) / allocated)
}

/** BR-11: peringatan saat ≥ 90%, merah saat > 100%. */
export function budgetTone(allocated: bigint, spent: bigint): "inc" | "warn" | "exp" {
  const bp = usageBp(allocated, spent)
  if (allocated > 0n && spent > allocated) return "exp"
  if (bp >= 9_000) return "warn"
  return "inc"
}

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  unset: "Belum diatur",
  over: "Melebihi",
  exact: "Pas",
  safe: "Aman",
}

export const BUDGET_STATUS_TONE: Record<BudgetStatus, PillTone> = {
  unset: "neutral",
  over: "exp",
  exact: "warn",
  safe: "inc",
}

/** Anggaran teratas Beranda: yang sudah diatur, urut pemakaian tertinggi lalu realisasi terbesar. */
export function topBudgets<T extends { allocated: bigint; spent: bigint }>(items: readonly T[], n: number): T[] {
  return items
    .filter((i) => i.allocated > 0n)
    .sort((a, b) => usageBp(b.allocated, b.spent) - usageBp(a.allocated, a.spent) || Number(b.spent - a.spent))
    .slice(0, n)
}
