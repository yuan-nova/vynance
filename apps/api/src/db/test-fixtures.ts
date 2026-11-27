import {
  activityLogs,
  bookMembers,
  bookSettings,
  books,
  categories,
  createDb,
  transactions,
  users,
  wallets,
} from "@vynance/db"
import { inArray } from "drizzle-orm"
import { generateBookCode } from "../lib/book-code"
import { newId } from "../lib/id"
import { ActivityRepository } from "../modules/activity/activity.repository"
import { BooksRepository } from "../modules/books/books.repository"
import { BooksService } from "../modules/books/books.service"
import { UnitOfWork } from "./unit-of-work"

// Fixture test integrasi ke MySQL dev (docker compose, localhost:12306, migrasi terbaru).

export const testDb = createDb(Bun.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance")

export const testBooksService = new BooksService({
  books: new BooksRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({ books: new BooksRepository(exec), activity: new ActivityRepository(exec) })),
  newId: () => newId(),
  newCode: generateBookCode,
})

/** Buat pengguna uji (id 26 karakter) dan kembalikan id-nya. */
export async function createTestUser(id: string, email: string): Promise<string> {
  await testDb.insert(users).values({ id, name: id.slice(-4), email })
  return id
}

export async function createTestBook(userId: string, name = "Uji"): Promise<string> {
  return (await testBooksService.create({ userId }, { name })).id
}

/** Hapus semua data buku yang dibuat pengguna uji, lalu penggunanya. Urutan mengikuti FK. */
export async function cleanupUsers(userIds: string[]): Promise<void> {
  const ids = (await testDb.select({ id: books.id }).from(books).where(inArray(books.createdBy, userIds))).map(
    (r) => r.id,
  )
  if (ids.length) {
    await testDb.delete(transactions).where(inArray(transactions.bookId, ids))
    await testDb.delete(categories).where(inArray(categories.bookId, ids))
    await testDb.delete(wallets).where(inArray(wallets.bookId, ids))
    await testDb.delete(activityLogs).where(inArray(activityLogs.bookId, ids))
    await testDb.delete(bookSettings).where(inArray(bookSettings.bookId, ids))
    await testDb.delete(bookMembers).where(inArray(bookMembers.bookId, ids))
    await testDb.delete(books).where(inArray(books.id, ids))
  }
  await testDb.delete(users).where(inArray(users.id, userIds))
}

/** Request JSON ke app uji. */
export function jsonRequest(method: string, body?: unknown): RequestInit {
  return body === undefined
    ? { method }
    : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
}

export async function dataOf<T>(res: Response): Promise<T> {
  return ((await res.json()) as { data: T }).data
}
