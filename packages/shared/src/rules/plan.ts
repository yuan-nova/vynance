import type { AllocationMode } from "../schemas/plan"

// Rencana bulanan (PB-04, BR-13). Semua bigint rupiah utuh; persen dalam basis poin.

type Alloc = {
  kind: "expense" | "investment"
  mode: AllocationMode
  amount: bigint
  percentBp: number
  carriedOver?: bigint
}

/** Nominal alokasi: persen pengeluaran dari plafon, persen investasi dari total penghasilan (PB-04 langkah 4). */
export function allocationAmount(a: Alloc, spendingCap: bigint, totalIncome: bigint): bigint {
  const base = a.kind === "expense" ? spendingCap : totalIncome
  const planned = a.mode === "percent" ? (base * BigInt(a.percentBp)) / 10_000n : a.amount
  return planned + (a.carriedOver ?? 0n)
}

export type PlanTotals = {
  totalIncome: bigint
  expenseAllocated: bigint
  investmentAllocated: bigint
  /** BR-13: total penghasilan − (alokasi pengeluaran + alokasi investasi). Bisa negatif (kelebihan alokasi). */
  unallocated: bigint
}

/** BR-13. Total penghasilan = Σ penghasilan rencana (bukan + pemasukan tercatat; temuan BRD §9 no. 8). */
export function planTotals(
  incomes: readonly { amount: bigint }[],
  spendingCap: bigint | null,
  allocations: readonly Alloc[],
): PlanTotals {
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0n)
  const cap = spendingCap ?? 0n
  let expenseAllocated = 0n
  let investmentAllocated = 0n
  for (const a of allocations) {
    const v = allocationAmount(a, cap, totalIncome)
    if (a.kind === "expense") expenseAllocated += v
    else investmentAllocated += v
  }
  return {
    totalIncome,
    expenseAllocated,
    investmentAllocated,
    unallocated: totalIncome - (expenseAllocated + investmentAllocated),
  }
}

/** BR-14: sisa yang dibawa = max(alokasi − realisasi, 0). */
export function carryOverAmount(allocated: bigint, spent: bigint): bigint {
  return allocated > spent ? allocated - spent : 0n
}
