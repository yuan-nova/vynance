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
