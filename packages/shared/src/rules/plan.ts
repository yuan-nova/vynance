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

type PlanJson = {
  spendingCap: string | null
  incomes: readonly { amount: string }[]
  allocations: readonly {
    kind: "expense" | "investment"
    categoryId: string | null
    mode: AllocationMode
    amount: string
    percentBp: number
    carriedOver: string
  }[]
}

/** Pagu per kategori pengeluaran dari rencana bulanan JSON (PB-14). */
export function planBudgets(plan: PlanJson): Map<string, bigint> {
  const cap = BigInt(plan.spendingCap ?? "0")
  const income = plan.incomes.reduce((s, i) => s + BigInt(i.amount), 0n)
  const out = new Map<string, bigint>()
  for (const a of plan.allocations) {
    if (a.kind !== "expense" || !a.categoryId) continue
    const v = allocationAmount(
      {
        kind: a.kind,
        mode: a.mode,
        amount: BigInt(a.amount),
        percentBp: a.percentBp,
        carriedOver: BigInt(a.carriedOver),
      },
      cap,
      income,
    )
    if (v > 0n) out.set(a.categoryId, v)
  }
  return out
}
