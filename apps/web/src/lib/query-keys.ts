// Satu-satunya tempat membuat query key (CODING-GUIDELINES §7.2 butir 2).
export const qk = {
  health: () => ["health"] as const,
  me: () => ["me"] as const,
  authProviders: () => ["auth", "providers"] as const,
  books: () => ["books"] as const,
  /** Awalan semua data milik satu buku. Dibuang saat ganti buku (DS-NAV-04). */
  book: (bookId: string) => ["book", bookId] as const,
  bookDetail: (bookId: string) => ["book", bookId, "detail"] as const,
  wallets: (bookId: string) => ["book", bookId, "wallets"] as const,
}
