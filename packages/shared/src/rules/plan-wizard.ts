// Wizard anggaran 5 langkah (PB-04, FR-41): Metode → Pendapatan → Alokasi → Kategori → Simpan.

export type WizardMethod = "50_30_20" | "60_20_20" | "70_10_20" | "custom" | "fixed"
export type GroupSplit = { needs: bigint; wants: bigint; savings: bigint }

/** Persen preset dalam basis poin (Kebutuhan, Keinginan, Tabungan). */
export const WIZARD_PRESETS: Record<"50_30_20" | "60_20_20" | "70_10_20", [number, number, number]> = {
  "50_30_20": [5000, 3000, 2000],
  "60_20_20": [6000, 2000, 2000],
  "70_10_20": [7000, 1000, 2000],
}

export const WIZARD_METHOD_LABEL: Record<WizardMethod, { title: string; sub: string }> = {
  "50_30_20": { title: "50/30/20 · Klasik", sub: "Kebutuhan 50 · Keinginan 30 · Tabungan 20" },
  "60_20_20": { title: "60/20/20 · Hemat", sub: "Kebutuhan 60 · Keinginan 20 · Tabungan 20" },
  "70_10_20": { title: "70/10/20 · Kebutuhan", sub: "Kebutuhan 70 · Keinginan 10 · Tabungan 20" },
  custom: { title: "Atur sendiri (persen)", sub: "Tentukan sendiri persen tiap kelompok" },
  fixed: { title: "Nominal tetap", sub: "Isi nominal tiap kelompok" },
}

/**
 * Bagi penghasilan ke tiga kelompok. Preset & kustom memakai persen (basis poin) dari total penghasilan;
 * sisa pembulatan masuk ke Tabungan supaya jumlahnya tepat sama dengan penghasilan.
 */
export function splitByPercent(totalIncome: bigint, bp: [number, number, number]): GroupSplit {
  const needs = (totalIncome * BigInt(bp[0])) / 10_000n
  const wants = (totalIncome * BigInt(bp[1])) / 10_000n
  const pctSum = bp[0] + bp[1] + bp[2]
  const savings = pctSum === 10_000 ? totalIncome - needs - wants : (totalIncome * BigInt(bp[2])) / 10_000n
  return { needs, wants, savings }
}

/** Plafon pengeluaran = Kebutuhan + Keinginan (PB-04 wizard). */
export function wizardSpendingCap(s: GroupSplit): bigint {
  return s.needs + s.wants
}

/**
 * Bagi rata `total` ke `n` kategori, dibulatkan ke bawah ke ribuan; sisanya ke kategori pertama
 * supaya jumlah akhirnya tepat `total`.
 */
export function distributeEvenly(total: bigint, n: number): bigint[] {
  if (n <= 0) return []
  const each = (total / BigInt(n) / 1000n) * 1000n
  const out = Array.from({ length: n }, () => each)
  out[0] = (out[0] ?? 0n) + (total - each * BigInt(n))
  return out
}
