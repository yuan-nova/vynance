// Grafik Beranda (FR-52, DS-DATA-03). Deterministik.

export type Slice = { name: string; amount: bigint }

/** Donut: maksimal `max` irisan terbesar + "Lainnya" (DS-DATA-03). Nol dibuang. */
export function topSlices(items: Slice[], max = 5): Slice[] {
  const sorted = items
    .filter((i) => i.amount > 0n)
    .sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0))
  if (sorted.length <= max) return sorted
  const rest = sorted.slice(max).reduce((a, i) => a + i.amount, 0n)
  return [...sorted.slice(0, max), { name: "Lainnya", amount: rest }]
}

/** Perubahan dalam basis poin (bulan ini vs lalu). null bila bulan lalu nol. */
export function changeBp(current: bigint, previous: bigint): number | null {
  if (previous === 0n) return null
  return Number(((current - previous) * 10_000n) / previous)
}

/** Rasio 0..1 untuk tinggi batang terhadap nilai terbesar. */
export function ratio(value: bigint, max: bigint): number {
  if (max <= 0n || value <= 0n) return 0
  return Number((value * 10_000n) / max) / 10_000
}
