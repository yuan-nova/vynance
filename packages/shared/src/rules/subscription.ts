import { type DateOnly, daysInMonth, type Month, monthOfDate } from "../date"

// Langganan (PB-05, BR-40, BR-41). Rupiah utuh bigint; nominal asing berupa string desimal.

export const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "MYR", "JPY", "AUD"] as const
export type Currency = (typeof CURRENCIES)[number]

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  IDR: "Rp",
  USD: "US$",
  SGD: "S$",
  EUR: "€",
  MYR: "RM",
  JPY: "¥",
  AUD: "A$",
}

/** Kurs cadangan (IDR per 1 unit) bila `reference_rates` kosong dan pengguna tidak mengisi manual. */
export const FALLBACK_FX: Record<Exclude<Currency, "IDR">, string> = {
  USD: "15900",
  SGD: "11800",
  EUR: "17200",
  MYR: "3400",
  JPY: "105",
  AUD: "10400",
}

export type SubscriptionCycle = "monthly" | "yearly"

/** BR-40: biaya per bulan; tahunan dibagi 12 (dibulatkan ke rupiah terdekat). */
export function monthlyCost(s: { cycle: SubscriptionCycle; amountIdr: bigint }): bigint {
  return s.cycle === "monthly" ? s.amountIdr : (s.amountIdr + 6n) / 12n
}

export function monthlyTotal(subs: readonly { cycle: SubscriptionCycle; amountIdr: bigint }[]): bigint {
  return subs.reduce((sum, s) => sum + monthlyCost(s), 0n)
}

/** PB-05 langkah 3: tanggal bayar 31 di bulan pendek menjadi tanggal terakhir bulan itu. */
export function billingDate(month: Month, billingDay: number): DateOnly {
  const [y = 0, m = 1] = month.split("-").map(Number)
  const day = Math.min(billingDay, daysInMonth(y, m))
  return `${month}-${String(day).padStart(2, "0")}`
}

/** Langganan tahunan hanya ditagih di bulan tagihannya. */
export function isBilledInMonth(s: { cycle: SubscriptionCycle; billingMonth: number | null }, month: Month): boolean {
  if (s.cycle === "monthly") return true
  return Number(month.slice(5, 7)) === s.billingMonth
}

/** Tanggal tagihan berikutnya ≥ hari ini (maksimal 13 bulan ke depan). */
export function nextBillingDate(
  s: { cycle: SubscriptionCycle; billingDay: number; billingMonth: number | null },
  today: DateOnly,
): DateOnly {
  let month = monthOfDate(today)
  for (let i = 0; i < 14; i++) {
    if (isBilledInMonth(s, month)) {
      const d = billingDate(month, s.billingDay)
      if (d >= today) return d
    }
    const [y = 0, m = 1] = month.split("-").map(Number)
    month = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`
  }
  return billingDate(month, s.billingDay)
}

/** BR-41 + PB-05 langkah 2: jatuh tempo bulan ini, tanggalnya sudah lewat/hari ini, dan sudah mulai. */
export function isDueToday(
  s: { cycle: SubscriptionCycle; billingDay: number; billingMonth: number | null; startDate: DateOnly },
  today: DateOnly,
): boolean {
  const month = monthOfDate(today)
  if (!isBilledInMonth(s, month)) return false
  const due = billingDate(month, s.billingDay)
  return due <= today && due >= s.startDate
}

function decimalToScaled(v: string, scale: number): bigint {
  const [i = "0", f = ""] = v.trim().split(".")
  return BigInt(i) * 10n ** BigInt(scale) + BigInt((f + "0".repeat(scale)).slice(0, scale) || "0")
}

/** Konversi ke rupiah: round(nominal × kurs). `amount` ≤ 2 desimal, `rate` ≤ 6 desimal. */
export function toIdr(amount: string, rate: string): bigint {
  const a = decimalToScaled(amount, 2)
  const r = decimalToScaled(rate, 6)
  const scale = 100_000_000n
  return (a * r + scale / 2n) / scale
}
