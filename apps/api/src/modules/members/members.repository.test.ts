import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { transactions } from "@vynance/db"
import type { Activity, Member } from "@vynance/shared"
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
import { UnitOfWork } from "../../db/unit-of-work"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { BooksRepository } from "../books/books.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { MembersRepository } from "./members.repository"
import { MembersService } from "./members.service"

// BR-49 (hak sama), BR-51 (anggota terakhir), BR-53 (keluar → akses hilang, catatan tetap).
const A = "01JTESTMEMBERAAAAAAAAAAAAA"
const B = "01JTESTMEMBERBBBBBBBBBBBBB"
const C = "01JTESTMEMBERCCCCCCCCCCCCC"
const membersService = new MembersService({
  members: new MembersRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    members: new MembersRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, membersService })
let bookId = ""
const url = (p: string) => `/api/v1/books/${bookId}${p}`

describe("anggota buku", () => {
  beforeAll(async () => {
    await cleanupUsers([A, B, C])
    await createTestUser(A, "a-member@contoh.id")
    await createTestUser(B, "b-member@contoh.id")
    await createTestUser(C, "c-member@contoh.id")
    bookId = await createTestBook(A, "Keluarga Anggota")
    const books = new BooksRepository(testDb)
    await books.addMember({ id: newId(), bookId, userId: B, createdBy: A })
    await books.addMember({ id: newId(), bookId, userId: C, createdBy: A })
    const wallet = (await new WalletsRepository(testDb).list(bookId))[0]?.id ?? ""
    await testDb.insert(transactions).values({
      id: newId(),
      bookId,
      type: "expense",
      amount: 24_000n,
      txDate: "2026-11-27",
      walletId: wallet,
      note: "GoRide",
      createdBy: B,
    })
  })
  afterAll(async () => {
    await testDb.delete(transactions).where(eq(transactions.bookId, bookId))
    await cleanupUsers([A, B, C])
  })

  test("daftar anggota tanpa peran, isMe untuk diri sendiri", async () => {
    const list = await dataOf<Member[]>(await app(B).request(url("/members")))
    expect(list.map((m) => m.userId)).toEqual([A, B, C])
    expect(list.find((m) => m.isMe)?.userId).toBe(B)
    expect(Object.keys(list[0] ?? {})).not.toContain("role")
  })

  test("anggota mana pun bisa mengeluarkan anggota lain; akses langsung hilang, catatannya tetap (BR-53)", async () => {
    expect((await app(C).request(url(`/members/${B}`), jsonRequest("DELETE"))).status).toBe(204)
    expect((await app(B).request(url("/members"))).status).toBe(404)
    const [tx] = await testDb.select().from(transactions).where(eq(transactions.bookId, bookId))
    expect(tx?.createdBy).toBe(B)
    expect((await app(A).request(url(`/members/${B}`), jsonRequest("DELETE"))).status).toBe(404)
  })

  test("keluar; anggota terakhir tidak bisa keluar (BR-51)", async () => {
    expect((await app(C).request(url("/leave"), jsonRequest("POST"))).status).toBe(204)
    expect((await app(C).request(url("/members"))).status).toBe(404)
    const last = await app(A).request(url("/leave"), jsonRequest("POST"))
    expect(last.status).toBe(409)
    expect(((await last.json()) as { error: { code: string } }).error.code).toBe("BOOK_LAST_MEMBER")
  })

  test("aktivitas terbaru memuat nama pelaku", async () => {
    const list = await dataOf<Activity[]>(await app(A).request(url("/activities?limit=5")))
    expect(list[0]?.action).toBe("member.left")
    expect(list.map((a) => a.action)).toContain("member.removed")
    expect(list.find((a) => a.action === "member.removed")?.actorName).toBe(C.slice(-4))
  })
})
