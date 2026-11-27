// Zakat maal (PB-08, BR-42). Deterministik; nilai uang bigint rupiah.

export const NISAB_GRAMS = 85
/** 2,5% dalam basis poin. */
export const ZAKAT_RATE_BP = 250
/** Satu tahun hijriah ≈ 354 hari (haul). */
export const HAUL_DAYS = 354
/** Harga emas bawaan per gram bila belum ada data live/cache (PB-08 langkah 1). */
export const DEFAULT_GOLD_PRICE_PER_GRAM = 1_580_000n

export type ZakatInput = {
  /** Saldo rekening non-utang (bisa negatif bila rekening minus). */
  cash: bigint
  investments: bigint
  /** Utang jatuh tempo sebagai angka positif. */
  debtDue: bigint
  goldPricePerGram: bigint
}

export type ZakatResult = { wealth: bigint; nisab: bigint; obligatory: boolean; zakat: bigint }

/** BR-42: zakat = 2,5% × harta jika harta ≥ 85 g × harga emas. Harta = kas + investasi − utang jatuh tempo. */
export function computeZakat(i: ZakatInput): ZakatResult {
  const wealth = i.cash + i.investments - (i.debtDue < 0n ? -i.debtDue : i.debtDue)
  const nisab = BigInt(NISAB_GRAMS) * i.goldPricePerGram
  const obligatory = wealth > 0n && wealth >= nisab
  return { wealth, nisab, obligatory, zakat: obligatory ? (wealth * BigInt(ZAKAT_RATE_BP)) / 10_000n : 0n }
}

/** Tanggal haul tercapai = mulai haul + 354 hari (YYYY-MM-DD, kalender UTC). */
export function haulDate(start: string): string {
  const d = new Date(`${start}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + HAUL_DAYS)
  return d.toISOString().slice(0, 10)
}
