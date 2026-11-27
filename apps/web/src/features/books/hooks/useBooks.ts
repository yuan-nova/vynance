import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type Book, type CreateBookInput, type Me, pickActiveBook, type UpdateBookInput } from "@vynance/shared"
import { useMe } from "@/features/auth"
import { qk } from "@/lib/query-keys"
import { createBook, fetchBooks, renameBook, saveActiveBook } from "../services/books.service"

export const booksQueryOptions = () => queryOptions({ queryKey: qk.books(), queryFn: fetchBooks })

export function useBooks(): UseQueryResult<Book[]> {
  return useQuery(booksQueryOptions())
}

/** Buku aktif dari daftar buku + `me.lastBookId` (DS-NAV-04). */
export function useActiveBook(): Book | null {
  const books = useBooks()
  const me = useMe()
  return pickActiveBook(books.data ?? [], me.data?.lastBookId ?? null)
}

/** Ganti buku aktif: simpan ke profil, buang semua cache buku lama (DS-NAV-04). */
export function useSwitchBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { to: string; from: string | null }) => {
      await saveActiveBook(v.to)
      return v
    },
    onSuccess: ({ to, from }) => {
      if (from) qc.removeQueries({ queryKey: qk.book(from) })
      qc.setQueryData<Me | null>(qk.me(), (me) => (me ? { ...me, lastBookId: to } : me))
    },
  })
}

export function useCreateBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBookInput) => {
      const book = await createBook(input)
      await saveActiveBook(book.id)
      return book
    },
    onSuccess: (book) => {
      qc.setQueryData<Me | null>(qk.me(), (me) => (me ? { ...me, lastBookId: book.id } : me))
      // Isi cache langsung: guard route membaca daftar ini sebelum refetch selesai (BR-54).
      qc.setQueryData<Book[]>(qk.books(), (list) => [...(list ?? []).filter((b) => b.id !== book.id), book])
      void qc.invalidateQueries({ queryKey: qk.books() })
    },
  })
}

export function useRenameBook(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateBookInput) => renameBook(bookId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.books() })
      void qc.invalidateQueries({ queryKey: qk.bookDetail(bookId) })
    },
  })
}
