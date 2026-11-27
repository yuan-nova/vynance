import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { bookInvitations, books, transactions, wallets } from "@vynance/db"
import { eq, getTableName } from "drizzle-orm"
import { cleanupUsers, createTestBook, createTestUser, testDb } from "../../db/test-fixtures"
import { UnitOfWork } from "../../db/unit-of-work"
import { newId } from "../../lib/id"
import { BOOK_TABLES, MaintenanceRepository } from "./maintenance.repository"
import { MaintenanceService } from "./maintenance.service"

// TSD §9: hapus permanen buku (BR-52), bersihkan undangan (BR-50), aman dijalankan ganda.
const U = "01JTESTMAINTAAAAAAAAAAAAAA"
const repo = new MaintenanceRepository(testDb)
const svc = new MaintenanceService({
  maintenance: repo,
  uow: new UnitOfWork(testDb, (exec) => ({ maintenance: new MaintenanceRepository(exec) })),
})
let expired = ""
let recent = ""

describe("worker maintenance", () => {
  beforeAll(async () => {
    await cleanupUsers([U])
    await createTestUser(U, "u-maint@contoh.id")
    expired = await createTestBook(U, "Lama")
    recent = await createTestBook(U, "Baru dihapus")
    const wallet = (await testDb.select({ id: wallets.id }).from(wallets).where(eq(wallets.bookId, expired)))[0]?.id
    await testDb.insert(transactions).values({
      id: newId(),
      bookId: expired,
      type: "expense",
      amount: 5_000n,
      txDate: "2026-10-01",
      walletId: wallet ?? "",
      createdBy: U,
    })
    const past = new Date(Date.now() - 31 * 86_400_000)
    await testDb
      .update(books)
      .set({ deletedAt: past, purgeAfter: new Date(Date.now() - 86_400_000) })
      .where(eq(books.id, expired))
    await testDb
      .update(books)
      .set({ deletedAt: new Date(), purgeAfter: new Date(Date.now() + 29 * 86_400_000) })
      .where(eq(books.id, recent))
    await testDb.insert(bookInvitations).values([
      {
        id: newId(),
        bookId: recent,
        tokenHash: "a".repeat(64),
        expiresAt: new Date(Date.now() - 8 * 86_400_000),
        createdBy: U,
      },
      {
        id: newId(),
        bookId: recent,
        tokenHash: "b".repeat(64),
        expiresAt: new Date(Date.now() - 86_400_000),
        createdBy: U,
      },
    ])
  })
  afterAll(() => cleanupUsers([U]))

  test("BOOK_TABLES mencakup semua tabel ber-book_id di DB", async () => {
    const listed = new Set<string>(BOOK_TABLES.map((t) => getTableName(t)))
    const missing = (await repo.tablesWithBookId()).filter((t) => !listed.has(t))
    expect(missing).toEqual([])
  })

  test("hapus permanen hanya buku yang lewat masa pulih; dua kali bersamaan aman", async () => {
    const now = new Date()
    const [a, b] = await Promise.all([svc.purgeDeletedBooks(now), svc.purgeDeletedBooks(now)])
    expect(a + b).toBeGreaterThanOrEqual(1)
    expect(await testDb.select().from(books).where(eq(books.id, expired))).toHaveLength(0)
    expect(await testDb.select().from(transactions).where(eq(transactions.bookId, expired))).toHaveLength(0)
    expect(await testDb.select().from(wallets).where(eq(wallets.bookId, expired))).toHaveLength(0)
    expect(await testDb.select().from(books).where(eq(books.id, recent))).toHaveLength(1)
    expect(await svc.purgeDeletedBooks(now)).toBe(0)
  })

  test("undangan kedaluwarsa > 7 hari dibersihkan, yang baru kedaluwarsa disimpan", async () => {
    expect(await svc.cleanInvitations(new Date())).toBeGreaterThanOrEqual(1)
    const left = await testDb.select().from(bookInvitations).where(eq(bookInvitations.bookId, recent))
    expect(left.map((i) => i.tokenHash)).toEqual(["b".repeat(64)])
    expect(await svc.cleanInvitations(new Date())).toBe(0)
  })
})
