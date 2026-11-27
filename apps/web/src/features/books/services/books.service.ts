import { type Book, bookSchema, type CreateBookInput, type UpdateBookInput } from "@vynance/shared"
import { z } from "zod"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

export async function fetchBooks(): Promise<Book[]> {
  const res = await api.books.$get()
  await ensureOk(res)
  return z.array(bookSchema).parse((await res.json()).data)
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const res = await api.books.$post({ json: input })
  await ensureOk(res)
  return bookSchema.parse((await res.json()).data)
}

export async function renameBook(bookId: string, input: UpdateBookInput): Promise<Book> {
  const res = await api.books[":bookId"].$patch({ param: { bookId }, json: input })
  await ensureOk(res)
  return bookSchema.parse((await res.json()).data)
}

/** Simpan buku aktif di profil (`lastBookId`), supaya terbawa ke perangkat lain. */
export async function saveActiveBook(bookId: string): Promise<void> {
  const res = await api.me.$patch({ json: { lastBookId: bookId } })
  await ensureOk(res)
}
