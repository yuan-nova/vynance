import { z } from "zod"

// Uang selalu bigint rupiah utuh (CODING-GUIDELINES §6.8, NFR-07). Tidak ada float.

const MINUS = "−"
const DIGITS = /^-?\d{1,19}$/
// Rentang kolom BIGINT signed MySQL.
const BIGINT_MAX = 9_223_372_036_854_775_807n
const BIGINT_MIN = -9_223_372_036_854_775_808n

export const MONEY_PRIVACY_MASK = "Rp ••••••"

/** String angka rupiah utuh di JSON ↔ bigint di kode. */
export const moneySchema = z
  .string()
  .regex(DIGITS, "Nominal harus angka bulat")
  .transform((s) => BigInt(s))
  .refine((v) => v >= BIGINT_MIN && v <= BIGINT_MAX, "Nominal terlalu besar")

/** Sama seperti moneySchema tetapi wajib > 0 (BR-30). */
export const positiveMoneySchema = moneySchema.refine((v) => v > 0n, "Nominal harus lebih dari 0")

export function moneyToJson(value: bigint): string {
  return value.toString()
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value
}

export type MoneySign = "auto" | "income" | "expense" | "none"

/**
 * Format "Rp1.250.000" (DS-MONEY-01).
 * - "auto": minus U+2212 bila negatif
 * - "income": "+Rp…", "expense": "−Rp…", "none": tanpa tanda
 */
export function formatMoney(value: bigint, sign: MoneySign = "auto"): string {
  const body = `Rp${groupThousands(abs(value).toString())}`
  if (sign === "income") return `+${body}`
  if (sign === "expense") return `${MINUS}${body}`
  if (sign === "auto" && value < 0n) return `${MINUS}${body}`
  return body
}

const SHORT_UNITS = [
  { size: 1_000_000_000_000n, label: "T" },
  { size: 1_000_000_000n, label: "M" },
  { size: 1_000_000n, label: "jt" },
  { size: 1_000n, label: "rb" },
] as const

/** Bentuk singkat, satu desimal dibulatkan ke bawah: "Rp42,3 jt", "Rp1,2 M". */
export function formatMoneyShort(value: bigint): string {
  const a = abs(value)
  const prefix = value < 0n ? MINUS : ""
  const unit = SHORT_UNITS.find((u) => a >= u.size)
  if (!unit) return `${prefix}Rp${a.toString()}`
  const tenths = (a * 10n) / unit.size
  const whole = groupThousands((tenths / 10n).toString())
  const frac = tenths % 10n
  const num = frac === 0n ? whole : `${whole},${frac}`
  return `${prefix}Rp${num} ${unit.label}`
}

const SUFFIX: Record<string, bigint> = { rb: 1_000n, k: 1_000n, jt: 1_000_000n, m: 1_000_000_000n }

/**
 * Parse ketikan pengguna menjadi bigint: "1.500.000", "Rp 1.500.000", "1,5jt", "250rb".
 * Mengembalikan null bila tidak valid. Pecahan di bawah satu rupiah ditolak.
 */
export function parseMoney(input: string): bigint | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/^rp\s*/, "")
    .replace(/\s+/g, "")
  if (s === "") return null
  const neg = s.startsWith("-") || s.startsWith(MINUS)
  const body = neg ? s.slice(1) : s
  const m = /^(\d[\d.]*)(?:,(\d+))?(rb|k|jt|m)?$/.exec(body)
  if (!m) return null
  const intRaw = m[1] ?? ""
  const fracRaw = m[2] ?? ""
  const suffix = m[3]
  if (intRaw.includes(".") && !/^\d{1,3}(\.\d{3})+$/.test(intRaw)) return null
  const mult = suffix ? (SUFFIX[suffix] ?? 1n) : 1n
  const intValue = BigInt(intRaw.replaceAll(".", "")) * mult
  let fracValue = 0n
  if (fracRaw) {
    const scale = 10n ** BigInt(fracRaw.length)
    const scaled = BigInt(fracRaw) * mult
    if (scaled % scale !== 0n) return null
    fracValue = scaled / scale
  }
  const value = intValue + fracValue
  return neg ? -value : value
}

/** Angka hero 32/800 muat sampai 11 digit di 320 px; lebih dari itu disingkat (DS-MONEY-01). */
export function heroNeedsShort(value: bigint): boolean {
  return abs(value) >= 100_000_000_000n
}
