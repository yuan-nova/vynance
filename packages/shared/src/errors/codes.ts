// Kode error dan pesan Bahasa Indonesia (CODING-GUIDELINES §6.6, DS-LANG-01).
// Modul fitur menambah kodenya di sini; service tidak menulis pesan sendiri.

export const ERROR_MESSAGES = {
  INTERNAL: "Terjadi kesalahan di server. Coba lagi sebentar lagi.",
  VALIDATION: "Data yang dikirim belum benar.",
  UNAUTHORIZED: "Silakan masuk terlebih dahulu.",
  FORBIDDEN: "Kamu tidak punya akses untuk tindakan ini.",
  NOT_FOUND: "Data tidak ditemukan.",
  CONFLICT: "Data sudah berubah. Muat ulang lalu coba lagi.",
  RATE_LIMITED: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES

export const ERROR_CODES = Object.keys(ERROR_MESSAGES) as ErrorCode[]

export function errorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code]
}

/** Bentuk body error API: `{ error: { code, message, field? } }`. */
export type ApiError = { error: { code: ErrorCode; message: string; field?: string } }

/** Hasil fungsi aturan bisnis (CODING-GUIDELINES §4.4). */
export type RuleResult = { ok: true } | { ok: false; code: ErrorCode; field?: string }
