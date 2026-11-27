// Sumber penghasilan aktif dan pasif (PB-10, FR-130).

export type IncomeKind = "active" | "passive"

/** Bawaan target porsi penghasilan pasif 30% (PB-10). */
export const DEFAULT_PASSIVE_TARGET_BP = 3000

export const INCOME_KIND_LABEL: Record<IncomeKind, string> = { active: "Aktif", passive: "Pasif" }

/** Porsi pasif = pasif ÷ total, dalam basis poin dibulatkan ke bawah. Total 0 → 0. */
export function incomeSummary(
  sources: readonly { kind: IncomeKind; monthlyAmount: bigint }[],
  targetBp: number,
): { active: bigint; passive: bigint; total: bigint; passiveBp: number; targetBp: number; metTarget: boolean } {
  let active = 0n
  let passive = 0n
  for (const s of sources) {
    if (s.kind === "active") active += s.monthlyAmount
    else passive += s.monthlyAmount
  }
  const total = active + passive
  const passiveBp = total > 0n ? Number((passive * 10_000n) / total) : 0
  return { active, passive, total, passiveBp, targetBp, metTarget: total > 0n && passiveBp >= targetBp }
}
