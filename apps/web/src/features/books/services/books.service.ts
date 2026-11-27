import {
  type Book,
  type BookDeletionInfo,
  bookDeletionInfoSchema,
  bookSchema,
  type CreateBookInput,
  type DeletedBook,
  deletedBookSchema,
  type UpdateBookInput,
} from "@vynance/shared"
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

export async function fetchDeletionInfo(bookId: string): Promise<BookDeletionInfo> {
  const res = await api.books[":bookId"]["deletion-info"].$get({ param: { bookId } })
  await ensureOk(res)
  return bookDeletionInfoSchema.parse((await res.json()).data)
}

export async function deleteBook(bookId: string, confirmName: string): Promise<void> {
  const res = await api.books[":bookId"].$delete({ param: { bookId }, json: { confirmName } })
  await ensureOk(res)
}

export async function fetchDeletedBooks(): Promise<DeletedBook[]> {
  const res = await api.books.deleted.$get()
  await ensureOk(res)
  return z.array(deletedBookSchema).parse((await res.json()).data)
}

export async function restoreBook(bookId: string): Promise<Book> {
  const res = await api.books[":bookId"].restore.$post({ param: { bookId } })
  await ensureOk(res)
  return bookSchema.parse((await res.json()).data)
}
