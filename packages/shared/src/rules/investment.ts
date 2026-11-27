// Investasi (PB-06, FR-70). Rupiah utuh bigint.

/** Untung/rugi aset: nilai kini − modal, dan persennya terhadap modal (basis poin, null bila modal 0). */
export function assetGain(costBasis: bigint, currentValue: bigint): { gain: bigint; gainBp: number | null } {
  const gain = currentValue - costBasis
  return { gain, gainBp: costBasis > 0n ? Number((gain * 10_000n) / costBasis) : null }
}

export type PortfolioTotals = { cost: bigint; value: bigint; gain: bigint; gainBp: number | null }

/** PB-06 langkah 4: total modal, total nilai, untung/rugi portofolio. */
export function portfolioTotals(assets: readonly { costBasis: bigint; currentValue: bigint }[]): PortfolioTotals {
  const cost = assets.reduce((s, a) => s + a.costBasis, 0n)
  const value = assets.reduce((s, a) => s + a.currentValue, 0n)
  return { cost, value, ...assetGain(cost, value) }
}

/** Progres nilai jenis terhadap targetnya (basis poin, dibatasi 10.000). null bila tanpa target. */
export function targetProgressBp(value: bigint, target: bigint | null): number | null {
  if (target === null || target <= 0n) return null
  const bp = Number((value * 10_000n) / target)
  return Math.max(0, Math.min(10_000, bp))
}

/** Satuan aset desimal (mis. 30 gram, 21430.5 unit) untuk tampilan id-ID. */
export function formatUnits(units: string): string {
  const n = Number(units)
  return Number.isFinite(n) ? n.toLocaleString("id-ID", { maximumFractionDigits: 6 }) : units
}
