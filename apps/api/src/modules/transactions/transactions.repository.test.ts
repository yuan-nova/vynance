import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Category, Transaction, WalletList } from "@vynance/shared"
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
import { CategoriesRepository } from "../categories/categories.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { WalletsService } from "../wallets/wallets.service"
import { TransactionsRepository } from "./transactions.repository"
import { TransactionsService } from "./transactions.service"

const U = "01JTESTTRANSACTVSERAAAAAAA"
const V = "01JTESTTRANSACTVSERBBBBBBB"
const txSvc = new TransactionsService({
  transactions: new TransactionsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    transactions: new TransactionsRepository(exec),
    wallets: new WalletsRepository(exec),
    categories: new CategoriesRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date("2026-11-27T03:00:00Z"),
})
const walletsSvc = new WalletsService({
  wallets: new WalletsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    wallets: new WalletsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (u: string) =>
  testApp(u, { booksService: testBooksService, transactionsService: txSvc, walletsService: walletsSvc })

let bookId = ""
let otherBook = ""
let tunai = ""
let bank = ""
let foreignWallet = ""
let makan = ""
let gaji = ""
let foreignCategory = ""

const post = (u: string, body: unknown, key?: string) =>
  app(u).request(`/api/v1/books/${bookId}/transactions`, {
    ...jsonRequest("POST", body),
    headers: { "content-type": "application/json", ...(key ? { "idempotency-key": key } : {}) },
  })

describe("catat transaksi", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-tx-test@contoh.id")
    await createTestUser(V, "v-tx-test@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
    const ws = await new WalletsRepository(testDb).list(bookId)
    tunai = ws.find((w) => w.type === "cash")?.id ?? ""
    bank = ws.find((w) => w.type === "bank")?.id ?? ""
    foreignWallet = (await new WalletsRepository(testDb).list(otherBook))[0]?.id ?? ""
    const cats: Category[] = await new CategoriesRepository(testDb).list(bookId)
    makan = cats.find((c) => c.name === "Makan & Minum")?.id ?? ""
    gaji = cats.find((c) => c.name === "Gaji")?.id ?? ""
    foreignCategory = (await new CategoriesRepository(testDb).list(otherBook))[0]?.id ?? ""
  })
  afterAll(() => cleanupUsers([U, V]))

  test("Idempotency-Key sama → satu transaksi", async () => {
    const body = {
      type: "expense",
      amount: "287500",
      txDate: "2026-11-26",
      walletId: bank,
      categoryId: makan,
      note: "Indomaret",
    }
    const a = await dataOf<Transaction>(await post(U, body, "kunci-uji-12345"))
    const b = await dataOf<Transaction>(await post(U, body, "kunci-uji-12345"))
    expect(a.id).toBe(b.id)
    expect(a).toMatchObject({ source: "manual", amount: "287500", note: "Indomaret" })
  })

  test("transfer mengubah saldo dua rekening tanpa jadi masuk/keluar", async () => {
    await post(U, { type: "income", amount: "1000000", txDate: "2026-11-26", walletId: bank, categoryId: gaji })
    const res = await post(U, {
      type: "transfer",
      amount: "200000",
      txDate: "2026-11-26",
      walletId: bank,
      toWalletId: tunai,
    })
    expect(res.status).toBe(201)
    const list = await dataOf<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))
    const bal = new Map(list.wallets.map((w) => [w.id, w.balance]))
    expect(bal.get(bank)).toBe(String(1_000_000 - 287_500 - 200_000))
    expect(bal.get(tunai)).toBe("200000")
    // Kas total tidak berubah oleh transfer.
    expect(list.summary.cash).toBe(String(1_000_000 - 287_500))
  })

  test("rekening dan kategori buku lain ditolak", async () => {
    const r1 = await post(U, {
      type: "expense",
      amount: "1",
      txDate: "2026-11-26",
      walletId: foreignWallet,
      categoryId: makan,
    })
    expect(r1.status).toBe(422)
    expect(((await r1.json()) as { error: { field: string } }).error.field).toBe("walletId")
    const r2 = await post(U, {
      type: "expense",
      amount: "1",
      txDate: "2026-11-26",
      walletId: bank,
      categoryId: foreignCategory,
    })
    expect(((await r2.json()) as { error: { field: string } }).error.field).toBe("categoryId")
    const r3 = await post(U, {
      type: "transfer",
      amount: "1",
      txDate: "2026-11-26",
      walletId: bank,
      toWalletId: foreignWallet,
    })
    expect(((await r3.json()) as { error: { field: string } }).error.field).toBe("toWalletId")
  })

  test("kategori uang masuk untuk transaksi keluar → CATEGORY_TYPE_MISMATCH", async () => {
    const res = await post(U, { type: "expense", amount: "1", txDate: "2026-11-26", walletId: bank, categoryId: gaji })
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("CATEGORY_TYPE_MISMATCH")
  })

  test("jumlah 0 dan transfer ke rekening sama ditolak (BR-30, BR-31)", async () => {
    expect(
      (await post(U, { type: "expense", amount: "0", txDate: "2026-11-26", walletId: bank, categoryId: makan })).status,
    ).toBe(422)
    expect(
      (await post(U, { type: "transfer", amount: "5", txDate: "2026-11-26", walletId: bank, toWalletId: bank })).status,
    ).toBe(422)
  })

  test("kategori sering dipakai", async () => {
    const usage = await dataOf<{ categoryId: string; count: number }[]>(
      await app(U).request(`/api/v1/books/${bookId}/transactions/category-usage?kind=expense`),
    )
    expect(usage[0]).toEqual({ categoryId: makan, count: 1 })
  })
})
