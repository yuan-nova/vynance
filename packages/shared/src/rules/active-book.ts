// Buku aktif (DS-NAV-04, BR-54): buku terakhir bila masih anggota; selain itu buku pertama; tanpa buku → null.
export function pickActiveBook<T extends { id: string }>(books: readonly T[], lastBookId: string | null): T | null {
  return books.find((b) => b.id === lastBookId) ?? books[0] ?? null
}
