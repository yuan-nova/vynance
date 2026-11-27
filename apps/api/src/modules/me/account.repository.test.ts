import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { bookMembers, books, sessions, transactions, users } from "@vynance/db"
import type { DeletionPreview } from "@vynance/shared"
import { and, eq, isNull } from "drizzle-orm"
import {
  cleanupUsers,
  createTestBook,
  createTestUser,
  dataOf,
  jsonRequest,
  testBooksService,
  testDb,
} from "../../db/test-fixtures"
import { UnitOfWork } from "../../db/unit-of-work"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { BooksRepository } from "../books/books.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { AccountRepository } from "./account.repository"
import { AccountService } from "./account.service"
import { MeRepository } from "./me.repository"
import { MeService } from "./me.service"

const U = "01JTESTACCTDELAAAAAAAAAAAA"
const V = "01JTESTACCTDELBBBBBBBBBBBB"
const account = new AccountService({
  account: new AccountRepository(testDb),
  me: new MeRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({ account: new AccountRepository(exec), me: new MeRepository(exec) })),
  now: () => new Date(),
})
const app = (u: string) =>
  testApp(u, {
    booksService: testBooksService,
    accountService: account,
    meService: new MeService(new MeRepository(testDb), testBooksService),
  })
let solo = ""
let shared = ""

describe("ekspor dan hapus akun (NFR-08)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-acct-test@contoh.id")
    await createTestUser(V, "v-acct-test@contoh.id")
    solo = await createTestBook(U, "Pribadi U")
    shared = await createTestBook(V, "Keluarga")
    await new BooksRepository(testDb).addMember({ id: newId(), bookId: shared, userId: U, createdBy: V })
    const wallet = (await new WalletsRepository(testDb).list(shared))[0]?.id ?? ""
    await testDb.insert(transactions).values({
      id: newId(),
      bookId: shared,
      type: "expense",
      amount: 75_000n,
      txDate: "2026-11-20",
      walletId: wallet,
      note: '=HYPERLINK("x"), "kutip"',
      createdBy: U,
    })
    await testDb.insert(sessions).values({
      id: newId(),
      token: `tok-${U}`,
      userId: U,
      expiresAt: new Date(Date.now() + 86_400_000),
    })
  })
  afterAll(() => cleanupUsers([U, V]))

  test("ekspor JSON memuat semua buku anggota; CSV aman dari formula", async () => {
    const res = await app(U).request("/api/v1/me/export?format=json")
    expect(res.status).toBe(200)
    expect(res.headers.get("content-disposition")).toContain("attachment")
    const json = (await res.json()) as { books: { name: string; transactions: { amount: string }[] }[] }
    expect(json.books.map((b) => b.name).sort()).toEqual(["Keluarga", "Pribadi U"])
    expect(json.books.find((b) => b.name === "Keluarga")?.transactions[0]?.amount).toBe("75000")

    const csv = await (await app(U).request("/api/v1/me/export?format=csv")).text()
    expect(csv.split("\r\n")[0]).toContain("buku,kode_buku,tanggal")
    expect(csv).toContain(`"'=HYPERLINK(""x""), ""kutip"""`)
  })

  test("pratinjau: buku sendiri ikut terhapus, buku bersama tidak", async () => {
    const p = await dataOf<DeletionPreview>(await app(U).request("/api/v1/me/deletion-preview"))
    const byName = Object.fromEntries(p.books.map((b) => [b.name, b]))
    expect(byName["Pribadi U"]?.willBeDeleted).toBe(true)
    expect(byName.Keluarga?.willBeDeleted).toBe(false)
    expect(byName.Keluarga?.otherMembers).toBe(1)
    expect(byName.Keluarga?.transactionCount).toBe(1)
  })

  test("email konfirmasi salah ditolak", async () => {
    const res = await app(U).request("/api/v1/me", jsonRequest("DELETE", { confirmEmail: "salah@contoh.id" }))
    expect(res.status).toBe(422)
  })

  test("hapus akun: sesi dan identitas hilang, buku bersama tetap untuk anggota lain", async () => {
    const res = await app(U).request("/api/v1/me", jsonRequest("DELETE", { confirmEmail: "U-ACCT-test@contoh.id" }))
    expect(res.status).toBe(204)

    const [u] = await testDb.select().from(users).where(eq(users.id, U))
    expect(u?.email).not.toContain("u-acct-test")
    expect(u?.name).toBe("Pengguna terhapus")
    expect(await testDb.select().from(sessions).where(eq(sessions.userId, U))).toHaveLength(0)

    const [soloBook] = await testDb.select().from(books).where(eq(books.id, solo))
    expect(soloBook?.deletedAt).not.toBeNull()
    const [sharedBook] = await testDb.select().from(books).where(eq(books.id, shared))
    expect(sharedBook?.deletedAt).toBeNull()

    const active = await testDb
      .select({ userId: bookMembers.userId })
      .from(bookMembers)
      .where(and(eq(bookMembers.bookId, shared), isNull(bookMembers.leftAt)))
    expect(active.map((m) => m.userId)).toEqual([V])
    // Catatan lama tetap ada atas namanya (BR-53).
    expect(await testDb.select().from(transactions).where(eq(transactions.bookId, shared))).toHaveLength(1)
  })
})
