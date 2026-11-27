/** Konteks setiap method service (CODING-GUIDELINES §6.3). */
export type ServiceCtx = { userId: string; bookId: string }

/** Konteks untuk operasi milik pengguna yang belum terikat buku (daftar buku, profil). */
export type UserCtx = { userId: string }

/** Respons daftar dengan cursor (CODING-GUIDELINES §6.7). */
export type Page<T> = { data: T[]; nextCursor: string | null }
