import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { books } from "@vynance/db"
import type { Book, BookDeletionInfo, DeletedBook } from "@vynance/shared"
import { eq } from "drizzle-orm"
import {
  cleanupUsers,
  createTestBook,
  createTestUser,
  dataOf,
  jsonRequest,
  testBooksService,
  testDb,
} from "../../db/test-fixtures"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { BooksRepository } from "./books.repository"

// BR-52, TSD §5.5: hapus buku (konfirmasi nama), 404 untuk semua anggota, pulihkan ≤ 30 hari.
const A = "01JTESTBOOKDELAAAAAAAAAAAA"
const B = "01JTESTBOOKDELBBBBBBBBBBBB"
const C = "01JTESTBOOKDELCCCCCCCCCCCC"
const app = (u: string) => testApp(u, { booksService: testBooksService })
let bookId = ""

describe("hapus dan pulihkan buku", () => {
  beforeAll(async () => {
    await cleanupUsers([A, B, C])
    await createTestUser(A, "a-bookdel@contoh.id")
    await createTestUser(B, "b-bookdel@contoh.id")
    await createTestUser(C, "c-bookdel@contoh.id")
    bookId = await createTestBook(A, "Keluarga Uji")
    await new BooksRepository(testDb).addMember({ id: newId(), bookId, userId: B, createdBy: A })
  })
  afterAll(() => cleanupUsers([A, B, C]))

  test("info hapus menyebut jumlah transaksi dan anggota", async () => {
    const info = await dataOf<BookDeletionInfo>(await app(A).request(`/api/v1/books/${bookId}/deletion-info`))
    expect(info).toEqual({ transactionCount: 0, memberCount: 2 })
  })

  test("nama konfirmasi salah ditolak", async () => {
    const res = await app(A).request(`/api/v1/books/${bookId}`, jsonRequest("DELETE", { confirmName: "Keluarga" }))
    expect(res.status).toBe(422)
  })

  test("hapus → 404 untuk semua anggota, muncul di daftar terhapus", async () => {
    const res = await app(A).request(`/api/v1/books/${bookId}`, jsonRequest("DELETE", { confirmName: "Keluarga Uji" }))
    expect(res.status).toBe(204)
    expect((await app(A).request(`/api/v1/books/${bookId}`)).status).toBe(404)
    expect((await app(B).request(`/api/v1/books/${bookId}/wallets`)).status).toBe(404)
    const list = await dataOf<Book[]>(await app(B).request("/api/v1/books"))
    expect(list.some((b) => b.id === bookId)).toBe(false)

    const deleted = await dataOf<DeletedBook[]>(await app(B).request("/api/v1/books/deleted"))
    expect(deleted.map((b) => b.id)).toEqual([bookId])
    const days = (Date.parse(deleted[0]?.purgeAfter ?? "") - Date.parse(deleted[0]?.deletedAt ?? "")) / 86_400_000
    expect(Math.round(days)).toBe(30)
    // Bukan anggota tidak melihat dan tidak bisa memulihkan.
    expect(await dataOf<DeletedBook[]>(await app(C).request("/api/v1/books/deleted"))).toHaveLength(0)
    expect((await app(C).request(`/api/v1/books/${bookId}/restore`, jsonRequest("POST"))).status).toBe(404)
  })

  test("anggota lain bisa memulihkan", async () => {
    const res = await app(B).request(`/api/v1/books/${bookId}/restore`, jsonRequest("POST"))
    expect(res.status).toBe(200)
    expect((await dataOf<Book>(res)).id).toBe(bookId)
    expect((await app(A).request(`/api/v1/books/${bookId}`)).status).toBe(200)
  })

  test("masa pulih lewat → tidak bisa dipulihkan", async () => {
    const past = new Date(Date.now() - 86_400_000)
    await testDb.update(books).set({ deletedAt: past, purgeAfter: past }).where(eq(books.id, bookId))
    expect(await dataOf<DeletedBook[]>(await app(A).request("/api/v1/books/deleted"))).toHaveLength(0)
    expect((await app(A).request(`/api/v1/books/${bookId}/restore`, jsonRequest("POST"))).status).toBe(404)
  })
})
