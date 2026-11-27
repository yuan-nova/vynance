import type { RuleResult } from "../errors"

// Kode buku (BR-48, TSD §5.3): 8 karakter Crockford Base32 tanpa I, L, O, U.

export const BOOK_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
export const BOOK_CODE_LENGTH = 8

const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{8}$/

/** Bentuk simpan (tanpa tanda hubung, huruf besar) dari ketikan "k7qm-3xpa". */
export function normalizeBookCode(input: string): string {
  return input.replaceAll("-", "").replaceAll(" ", "").toUpperCase()
}

// BR-48
export function checkBookCode(code: string): RuleResult {
  return CODE_RE.test(normalizeBookCode(code)) ? { ok: true } : { ok: false, code: "VALIDATION", field: "code" }
}

/** Tampilan "XXXX-XXXX". */
export function formatBookCode(code: string): string {
  const c = normalizeBookCode(code)
  return `${c.slice(0, 4)}-${c.slice(4)}`
}

/** Kode dari 8 byte acak (dikirim sebagai parameter supaya fungsi tetap deterministik). */
export function bookCodeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < BOOK_CODE_LENGTH) throw new Error("butuh 8 byte")
  let out = ""
  for (let i = 0; i < BOOK_CODE_LENGTH; i++) out += BOOK_CODE_ALPHABET.charAt((bytes[i] ?? 0) % 32)
  return out
}
