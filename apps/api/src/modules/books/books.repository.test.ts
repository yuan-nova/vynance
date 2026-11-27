import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { activityLogs, bookMembers, bookSettings, books, createDb, users } from "@vynance/db"
import { inArray } from "drizzle-orm"
import { UnitOfWork } from "../../db/unit-of-work"
import { generateBookCode } from "../../lib/book-code"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { BooksRepository } from "./books.repository"
import { BooksService } from "./books.service"

// Integrasi ke MySQL dev: isolasi buku, 404 bukan anggota, kode tidak bisa diubah.
const db = createDb(Bun.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance")
const ALICE = "01JTESTBOOKAAAAAAAAAAAAAAA"
const BOB = "01JTESTBOOKBBBBBBBBBBBBBBB"

function service(newCode: () => string = generateBookCode) {
  return new BooksService({
    books: new BooksRepository(db),
    uow: new UnitOfWork(db, (exec) => ({ books: new BooksRepository(exec), activity: new ActivityRepository(exec) })),
    newId: () => newId(),
    newCode,
  })
}

function app(userId: string) {
  return testApp(userId, { booksService: service() })
}

async function cleanup(): Promise<void> {
  const ids = (
    await db
      .select({ id: books.id })
      .from(books)
      .where(inArray(books.createdBy, [ALICE, BOB]))
  ).map((r) => r.id)
  if (ids.length) {
    await db.delete(activityLogs).where(inArray(activityLogs.bookId, ids))
    await db.delete(bookSettings).where(inArray(bookSettings.bookId, ids))
    await db.delete(bookMembers).where(inArray(bookMembers.bookId, ids))
    await db.delete(books).where(inArray(books.id, ids))
  }
  await db.delete(users).where(inArray(users.id, [ALICE, BOB]))
}

describe("buku", () => {
  beforeAll(async () => {
    await cleanup()
    await db.insert(users).values([
      { id: ALICE, name: "Alice", email: "alice-books-test@contoh.id" },
      { id: BOB, name: "Bob", email: "bob-books-test@contoh.id" },
    ])
  })
  afterAll(async () => {
    await cleanup()
    await db.$client.end()
  })

  test("dua buku bernama sama punya kode berbeda (BR-47, BR-48)", async () => {
    const svc = service()
    const a = await svc.create({ userId: ALICE }, { name: "Keluarga" })
    const b = await svc.create({ userId: ALICE }, { name: "Keluarga" })
    expect(a.code).not.toBe(b.code)
    expect(a.memberCount).toBe(1)
    const list = await svc.list({ userId: ALICE })
    expect(list.map((x) => x.id)).toEqual(expect.arrayContaining([a.id, b.id]))
  })

  test("data buku A tidak terbaca dari pengguna lain", async () => {
    const svc = service()
    const a = await svc.create({ userId: ALICE }, { name: "Rahasia" })
    expect((await svc.list({ userId: BOB })).some((x) => x.id === a.id)).toBe(false)
    expect(await new BooksRepository(db).findForMember(a.id, BOB)).toBeNull()
  })

  test("kode bentrok → diulang dengan kode baru", async () => {
    const first = await service().create({ userId: ALICE }, { name: "Asli" })
    const queue = [first.code, first.code, "ZZZZ2222"]
    const svc = service(() => queue.shift() ?? "ZZZZ3333")
    await db.delete(books).where(inArray(books.code, ["ZZZZ2222", "ZZZZ3333"]))
    const b = await svc.create({ userId: BOB }, { name: "Baru" })
    expect(b.code).toBe("ZZZZ2222")
  })

  test("GET /books/:bookId milik orang lain → 404; milik sendiri → 200", async () => {
    const a = await service().create({ userId: ALICE }, { name: "Milik Alice" })
    expect((await app(BOB).request(`/api/v1/books/${a.id}`)).status).toBe(404)
    expect((await app(ALICE).request(`/api/v1/books/${a.id}`)).status).toBe(200)
    expect((await app(ALICE).request("/api/v1/books/bukan-id")).status).toBe(404)
  })

  test("PATCH mengubah nama; kode tidak bisa diubah", async () => {
    const a = await service().create({ userId: ALICE }, { name: "Lama" })
    const res = await app(ALICE).request(`/api/v1/books/${a.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Baru", code: "AAAA0000" }),
    })
    expect(res.status).toBe(422)
    const ok = await app(ALICE).request(`/api/v1/books/${a.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Baru" }),
    })
    const body = (await ok.json()) as { data: { name: string; code: string } }
    expect(body.data).toMatchObject({ name: "Baru", code: a.code })
  })

  test("POST /books nama kosong → 422 field name", async () => {
    const res = await app(ALICE).request("/api/v1/books", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    })
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { field: string } }).error.field).toBe("name")
  })
})
