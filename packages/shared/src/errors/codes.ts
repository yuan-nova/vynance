// Kode error dan pesan Bahasa Indonesia (CODING-GUIDELINES §6.6, DS-LANG-01).
// Modul fitur menambah kodenya di sini; service tidak menulis pesan sendiri.

export const ERROR_MESSAGES = {
  INTERNAL: "Terjadi kesalahan di server. Coba lagi sebentar lagi.",
  VALIDATION: "Data yang dikirim belum benar.",
  UNAUTHORIZED: "Silakan masuk terlebih dahulu.",
  FORBIDDEN: "Kamu tidak punya akses untuk tindakan ini.",
  AI_CONSENT_REQUIRED: "Setujui dulu pengiriman ringkasan data ke penyedia AI.",
  AI_UNAVAILABLE: "Asisten AI belum tersedia. Coba lagi nanti.",
  NOT_FOUND: "Data tidak ditemukan.",
  CONFLICT: "Data sudah berubah. Muat ulang lalu coba lagi.",
  RATE_LIMITED: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  BOOK_NOT_FOUND: "Buku tidak ditemukan atau kamu bukan anggotanya.",
  BOOK_CODE_EXHAUSTED: "Gagal membuat kode buku. Coba lagi.",
  BOOK_NAME_MISMATCH: "Nama yang diketik tidak sama dengan nama buku.",
  BOOK_LAST_MEMBER: "Kamu anggota terakhir buku ini, jadi tidak bisa keluar. Hapus bukunya bila tidak dipakai lagi.",
  MEMBER_NOT_FOUND: "Anggota tidak ditemukan di buku ini.",
  INVITATION_NOT_FOUND: "Tautan undangan tidak dikenali. Minta tautan baru ke anggota buku.",
  INVITATION_EXPIRED: "Tautan undangan sudah kedaluwarsa (lebih dari 7 hari). Minta tautan baru.",
  INVITATION_USED: "Tautan undangan ini sudah dipakai. Setiap tautan hanya berlaku sekali.",
  INVITATION_REVOKED: "Tautan undangan ini sudah dibatalkan oleh anggota buku.",
  INVITATION_ALREADY_MEMBER: "Kamu sudah menjadi anggota buku ini.",
  WALLET_NOT_FOUND: "Rekening tidak ditemukan.",
  WALLET_HAS_TRANSACTIONS: "Rekening ini sudah punya transaksi, jadi tidak bisa dihapus. Arsipkan saja.",
  WALLET_LIMIT_NOT_ALLOWED: "Limit hanya untuk kartu kredit dan PayLater.",
  CATEGORY_NOT_FOUND: "Kategori tidak ditemukan.",
  CATEGORY_GROUP_EXPENSE_ONLY: "Grup dan anggaran hanya untuk kategori uang keluar.",
  CATEGORY_ORDER_MISMATCH: "Daftar kategori sudah berubah. Muat ulang lalu coba lagi.",
  TRANSFER_SAME_WALLET: "Rekening tujuan harus beda dengan rekening sumber.",
  TRANSFER_TARGET_REQUIRED: "Pilih rekening tujuan transfer.",
  CATEGORY_TYPE_MISMATCH: "Kategori tidak sesuai jenis transaksi.",
  WALLET_ARCHIVED: "Rekening ini sudah diarsipkan. Pilih rekening lain.",
  TRANSACTION_NOT_FOUND: "Transaksi tidak ditemukan.",
  IDEMPOTENCY_KEY_INVALID: "Permintaan tidak valid. Muat ulang lalu coba lagi.",
  PLAN_NO_PREVIOUS: "Bulan lalu belum punya rencana, jadi belum ada sisa yang bisa dibawa.",
  PLAN_CONFLICT: "Rencana bulan ini baru diubah anggota lain. Data terbaru sudah dimuat.",
  INVESTMENT_TYPE_NOT_FOUND: "Jenis investasi tidak ditemukan.",
  INVESTMENT_TYPE_HAS_ASSETS: "Jenis ini masih punya aset. Pindahkan atau hapus asetnya dulu.",
  ASSET_NOT_FOUND: "Aset tidak ditemukan.",
  ASSET_SELL_EXCEEDS: "Jumlah jual melebihi nilai kini atau modal aset.",
  ASSET_HAS_TRANSACTIONS: "Aset ini sudah punya transaksi beli/jual, jadi tidak bisa dihapus.",
  GOAL_NOT_FOUND: "Target tabungan tidak ditemukan.",
  CHILD_NOT_FOUND: "Data anak tidak ditemukan.",
  INCOME_SOURCE_NOT_FOUND: "Sumber penghasilan tidak ditemukan.",
  PAYSLIP_NOT_FOUND: "Slip gaji tidak ditemukan.",
  SUBSCRIPTION_NOT_FOUND: "Langganan tidak ditemukan.",
  ACCOUNT_CONFIRM_MISMATCH: "Email tidak cocok dengan akun ini.",
  AUTH_FAILED: "Gagal masuk. Coba lagi sebentar lagi.",
  OTP_INVALID: "Kode salah. Periksa lagi email kamu.",
  OTP_EXPIRED: "Kode sudah kedaluwarsa. Minta kode baru.",
  OTP_TOO_MANY_ATTEMPTS: "Terlalu banyak kode salah. Minta kode baru.",
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
