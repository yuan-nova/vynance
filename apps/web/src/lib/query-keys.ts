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
  goals: (bookId: string) => ["book", bookId, "goals"] as const,
  plan: (bookId: string, month: string) => ["book", bookId, "plans", month] as const,
  dashboard: (bookId: string, month: string) => ["book", bookId, "dashboard", month] as const,
  healthScore: (bookId: string, month: string) => ["book", bookId, "health-score", month] as const,
  investmentTypes: (bookId: string) => ["book", bookId, "investment-types"] as const,
  categoryUsage: (bookId: string, kind: string) => ["book", bookId, "category-usage", kind] as const,
  transactions: (bookId: string) => ["book", bookId, "transactions"] as const,
  transactionList: (bookId: string, filter: Record<string, string | undefined>) =>
    ["book", bookId, "transactions", "list", filter] as const,
  transactionDetail: (bookId: string, id: string) => ["book", bookId, "transactions", "detail", id] as const,
  transactionSummary: (bookId: string, from: string, to: string) =>
    ["book", bookId, "transactions", "summary", from, to] as const,
  categories: (bookId: string, kind?: string) =>
    kind ? (["book", bookId, "categories", kind] as const) : (["book", bookId, "categories"] as const),
}
