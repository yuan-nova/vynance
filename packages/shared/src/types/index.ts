/** Konteks setiap method service (CODING-GUIDELINES §6.3). */
export type ServiceCtx = { userId: string; bookId: string }

/** Konteks untuk operasi milik pengguna yang belum terikat buku (daftar buku, profil). */
export type UserCtx = { userId: string }

/** Respons daftar dengan cursor (CODING-GUIDELINES §6.7). */
export type Page<T> = { data: T[]; nextCursor: string | null }

/** Tone pill status (DS-STATE-02). */
export type PillTone = "inc" | "warn" | "exp" | "pri" | "neutral" | "auto"

/** Item snackbar (DS-STATE-03). */
export type SnackbarItem = {
  id: number
  message: string
  tone: "default" | "error"
  actionLabel?: string
  onAction?: () => void
  durationMs: number
}

/** Item antrean tulis offline (NFR-04). `input` sudah berbentuk JSON (amount string). */
export type OutboxItem = {
  key: string
  bookId: string
  input: Record<string, unknown>
  queuedAt: string
}

/** Hasil kirim item antrean: `sent`/`rejected` dibuang dari antrean, `retry` dicoba lagi nanti. */
export type OutboxSendResult = "sent" | "rejected" | "retry"

/** Transaksi mode demo, disimpan hanya di perangkat (FR-151). Amount berupa string rupiah utuh. */
export type DemoTransaction = {
  id: string
  type: "income" | "expense"
  amount: string
  txDate: string
  categoryName: string
  note: string | null
}
