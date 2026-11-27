import { z } from "zod"

// BR-47: nama buku wajib, 1–40 karakter, boleh sama.
export const bookNameSchema = z
  .string()
  .trim()
  .min(1, "Nama buku wajib diisi")
  .max(40, "Nama buku maksimal 40 karakter")

/** Buku di daftar milik pengguna. Kode selalu ikut (DS-NAV-04). */
export const bookSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  memberCount: z.number().int(),
  createdAt: z.string(),
})
export type Book = z.infer<typeof bookSchema>

/** Kode tidak ada di input: dibuat server dan tidak bisa diubah (BR-48, CODING-GUIDELINES §5 butir 4). */
export const createBookSchema = z.object({ name: bookNameSchema }).strict()
export type CreateBookInput = z.infer<typeof createBookSchema>

export const updateBookSchema = z.object({ name: bookNameSchema }).strict()
export type UpdateBookInput = z.infer<typeof updateBookSchema>

/** BR-52: hapus buku dikonfirmasi dengan mengetik nama buku. */
export const deleteBookSchema = z.object({ confirmName: z.string().trim().min(1, "Ketik nama buku") }).strict()
export type DeleteBookInput = z.infer<typeof deleteBookSchema>

/** Akibat hapus buku, untuk sheet konfirmasi. */
export const bookDeletionInfoSchema = z.object({ transactionCount: z.number().int(), memberCount: z.number().int() })
export type BookDeletionInfo = z.infer<typeof bookDeletionInfoSchema>

/** Buku terhapus yang masih bisa dipulihkan (TSD §5.5). */
export const deletedBookSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  deletedAt: z.string(),
  purgeAfter: z.string(),
})
export type DeletedBook = z.infer<typeof deletedBookSchema>

/** Masa pulih buku terhapus (BR-52). */
export const BOOK_RESTORE_DAYS = 30
