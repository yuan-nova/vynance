import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { transactions, wallets } from "@vynance/db"
import type { Category } from "@vynance/shared"
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
import { CategoriesRepository } from "./categories.repository"
import { CategoriesService } from "./categories.service"

const U = "01JTESTCATEG0RYUSERAAAAAAA"
const V = "01JTESTCATEG0RYUSERBBBBBBB"
const svc = new CategoriesService({
  categories: new CategoriesRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    categories: new CategoriesRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (userId: string) => testApp(userId, { booksService: testBooksService, categoriesService: svc })
let bookId = ""
let otherBook = ""
const base = () => `/api/v1/books/${bookId}/categories`

async function add(name: string, kind: "expense" | "income" = "expense"): Promise<Category> {
  return dataOf<Category>(await app(U).request(base(), jsonRequest("POST", { name, kind, icon: "food" })))
}

describe("kategori", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-cat-test@contoh.id")
    await createTestUser(V, "v-cat-test@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
  })
  afterAll(async () => {
    await cleanupUsers([U, V])
    await testDb.$client.end()
  })

  test("tambah: urutan bertambah, grup bawaan Kebutuhan, anggaran bulanan", async () => {
    const a = await add("Makan")
    const res = await app(U).request(
      base(),
      jsonRequest("POST", {
        name: "Hiburan",
        kind: "expense",
        icon: "heart",
        budgetGroup: "wants",
        monthlyBudget: "500000",
      }),
    )
    const b = await dataOf<Category>(res)
    expect(a.budgetGroup).toBe("needs")
    expect(b).toMatchObject({ budgetGroup: "wants", monthlyBudget: "500000" })
    expect(b.sortOrder).toBe(a.sortOrder + 1)
  })

  test("kategori uang masuk tidak boleh punya grup → 422", async () => {
    const res = await app(U).request(
      base(),
      jsonRequest("POST", { name: "Gaji", kind: "income", icon: "brief", budgetGroup: "needs" }),
    )
    expect(res.status).toBe(422)
  })

  test("kategori uang masuk tidak boleh diberi anggaran → 422 field monthlyBudget", async () => {
    const gaji = await add("Gaji", "income")
    const res = await app(U).request(`${base()}/${gaji.id}`, jsonRequest("PATCH", { monthlyBudget: "1000" }))
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { field: string } }).error.field).toBe("monthlyBudget")
  })

  test("BR-36: ganti nama mempertahankan ID yang dipakai transaksi", async () => {
    const c = await add("Transpor")
    const walletId = newId()
    await testDb.insert(wallets).values({ id: walletId, bookId, name: "W", type: "cash", icon: "cash", createdBy: U })
    const txId = newId()
    await testDb.insert(transactions).values({
      id: txId,
      bookId,
      type: "expense",
      amount: 10_000n,
      txDate: "2026-11-27",
      walletId,
      categoryId: c.id,
      createdBy: U,
    })
    const renamed = await dataOf<Category>(
      await app(U).request(`${base()}/${c.id}`, jsonRequest("PATCH", { name: "Transportasi" })),
    )
    expect(renamed).toMatchObject({ id: c.id, name: "Transportasi" })

    // Dipakai → diarsipkan, tidak muncul di daftar pilihan, bisa diurungkan.
    const del = await dataOf<{ result: string }>(await app(U).request(`${base()}/${c.id}`, jsonRequest("DELETE")))
    expect(del.result).toBe("archived")
    const list = await dataOf<Category[]>(await app(U).request(`${base()}?kind=expense`))
    expect(list.some((x) => x.id === c.id)).toBe(false)
    const restored = await dataOf<Category>(await app(U).request(`${base()}/${c.id}/restore`, jsonRequest("POST")))
    expect(restored.archivedAt).toBeNull()
  })

  test("belum dipakai → dihapus lunak; urungkan memulihkan", async () => {
    const c = await add("Sementara")
    const del = await dataOf<{ result: string }>(await app(U).request(`${base()}/${c.id}`, jsonRequest("DELETE")))
    expect(del.result).toBe("deleted")
    expect((await app(U).request(`${base()}/${c.id}`, jsonRequest("PATCH", { name: "X" }))).status).toBe(404)
    expect((await app(U).request(`${base()}/${c.id}/restore`, jsonRequest("POST"))).status).toBe(200)
  })

  test("urutan: harus semua kategori aktif; urutan baru tersimpan", async () => {
    const list = await dataOf<Category[]>(await app(U).request(`${base()}?kind=expense`))
    const ids = list.map((c) => c.id)
    expect(
      (await app(U).request(`${base()}/order`, jsonRequest("PUT", { kind: "expense", ids: ids.slice(1) }))).status,
    ).toBe(422)
    const reversed = [...ids].reverse()
    const after = await dataOf<Category[]>(
      await app(U).request(`${base()}/order`, jsonRequest("PUT", { kind: "expense", ids: reversed })),
    )
    expect(after.map((c) => c.id)).toEqual(reversed)
  })

  test("kategori buku lain tidak terbaca dan tidak bisa diubah", async () => {
    const mine = await add("Rahasia")
    expect((await new CategoriesRepository(testDb).list(otherBook)).some((c) => c.id === mine.id)).toBe(false)
    const res = await app(V).request(
      `/api/v1/books/${otherBook}/categories/${mine.id}`,
      jsonRequest("PATCH", { name: "Bobol" }),
    )
    expect(res.status).toBe(404)
  })
})
