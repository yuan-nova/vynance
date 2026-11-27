import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { transactions } from "@vynance/db"
import type { TransactionPage, TransactionSummary } from "@vynance/shared"
import { cleanupUsers, createTestBook, createTestUser, testBooksService, testDb } from "../../db/test-fixtures"
import { UnitOfWork } from "../../db/unit-of-work"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { CategoriesRepository } from "../categories/categories.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { TransactionsRepository } from "./transactions.repository"
import { TransactionsService } from "./transactions.service"

const U = "01JTESTTXLISTVSERAAAAAAAAA"
const V = "01JTESTTXLISTVSERBBBBBBBBB"
const svc = new TransactionsService({
  transactions: new TransactionsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    transactions: new TransactionsRepository(exec),
    wallets: new WalletsRepository(exec),
    categories: new CategoriesRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, transactionsService: svc })
let bookId = ""
let otherBook = ""
let bank = ""
let tunai = ""

async function get<T>(u: string, path: string): Promise<T> {
  return (await (await app(u).request(path)).json()) as T
}

describe("daftar transaksi (FR-21)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-txlist-test@contoh.id")
    await createTestUser(V, "v-txlist-test@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
    const ws = await new WalletsRepository(testDb).list(bookId)
    bank = ws.find((w) => w.type === "bank")?.id ?? ""
    tunai = ws.find((w) => w.type === "cash")?.id ?? ""
    const cat = (await new CategoriesRepository(testDb).list(bookId, { kind: "expense" }))[0]?.id ?? null
    const rows = Array.from({ length: 120 }, (_, i) => ({
      id: newId(Date.now() + i),
      bookId,
      type: i % 10 === 0 ? ("income" as const) : ("expense" as const),
      amount: BigInt(1000 + i),
      txDate: `2026-11-${String(1 + (i % 28)).padStart(2, "0")}`,
      walletId: i % 2 ? bank : tunai,
      categoryId: cat,
      note: i === 5 ? "diskon 50%_promo" : `catatan ${i}`,
      createdBy: U,
    }))
    await testDb.insert(transactions).values(rows)
    const otherWallet = (await new WalletsRepository(testDb).list(otherBook))[0]?.id ?? ""
    await testDb.insert(transactions).values({
      id: newId(),
      bookId: otherBook,
      type: "expense",
      amount: 1n,
      txDate: "2026-11-10",
      walletId: otherWallet,
      note: "milik buku lain",
      createdBy: V,
    })
  })
  afterAll(() => cleanupUsers([U, V]))

  test("cursor (tx_date, id): 50 + 50 + 20 tanpa duplikat, urut terbaru", async () => {
    const base = `/api/v1/books/${bookId}/transactions`
    const p1 = await get<TransactionPage>(U, base)
    const p2 = await get<TransactionPage>(U, `${base}?cursor=${p1.nextCursor}`)
    const p3 = await get<TransactionPage>(U, `${base}?cursor=${p2.nextCursor}`)
    const all = [...p1.data, ...p2.data, ...p3.data]
    expect([p1.data.length, p2.data.length, p3.data.length]).toEqual([50, 50, 20])
    expect(p3.nextCursor).toBeNull()
    expect(new Set(all.map((t) => t.id)).size).toBe(120)
    const keys = all.map((t) => `${t.txDate}.${t.id}`)
    expect([...keys].sort().reverse()).toEqual(keys)
    expect(p1.data[0]).toMatchObject({ walletName: expect.any(String), createdByName: "AAAA" })
  })

  test("filter tipe, rentang, rekening; cari memperlakukan % _ sebagai huruf", async () => {
    const base = `/api/v1/books/${bookId}/transactions`
    const inc = await get<TransactionPage>(U, `${base}?type=income&limit=100`)
    expect(inc.data.every((t) => t.type === "income")).toBe(true)
    expect(inc.data).toHaveLength(12)
    const range = await get<TransactionPage>(U, `${base}?from=2026-11-01&to=2026-11-01&limit=100`)
    expect(range.data.every((t) => t.txDate === "2026-11-01")).toBe(true)
    const w = await get<TransactionPage>(U, `${base}?walletId=${bank}&limit=100`)
    expect(w.data).toHaveLength(60)
    const q = await get<TransactionPage>(U, `${base}?q=${encodeURIComponent("50%_")}`)
    expect(q.data.map((t) => t.note)).toEqual(["diskon 50%_promo"])
    const pct = await get<TransactionPage>(U, `${base}?q=${encodeURIComponent("%")}`)
    expect(pct.data).toHaveLength(1)
  })

  test("ringkasan masuk/keluar dan isolasi buku", async () => {
    const s = await get<{ data: TransactionSummary }>(
      U,
      `/api/v1/books/${bookId}/transactions/summary?from=2026-11-01&to=2026-11-30`,
    )
    const income = Array.from({ length: 120 }, (_, i) => i)
      .filter((i) => i % 10 === 0)
      .reduce((a, i) => a + 1000 + i, 0)
    expect(s.data.income).toBe(String(income))
    const mine = await get<TransactionPage>(U, `/api/v1/books/${bookId}/transactions?q=milik`)
    expect(mine.data).toHaveLength(0)
  })
})
