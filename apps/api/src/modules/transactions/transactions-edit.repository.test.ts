import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Transaction, TransactionDetail, WalletList } from "@vynance/shared"
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
import { AssetsRepository } from "../investments/assets.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { WalletsService } from "../wallets/wallets.service"
import { TransactionsRepository } from "./transactions.repository"
import { TransactionsService } from "./transactions.service"

const U = "01JTESTTXEDITVSERAAAAAAAAA"
const V = "01JTESTTXEDITVSERBBBBBBBBB"
const txSvc = new TransactionsService({
  transactions: new TransactionsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    transactions: new TransactionsRepository(exec),
    wallets: new WalletsRepository(exec),
    categories: new CategoriesRepository(exec),
    assets: new AssetsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
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
let bank = ""
let makan = ""
const base = () => `/api/v1/books/${bookId}/transactions`
const bankBalance = async () =>
  (await dataOf<WalletList>(await app(U).request(`/api/v1/books/${bookId}/wallets`))).wallets.find((w) => w.id === bank)
    ?.balance

describe("ubah, hapus, urungkan (FR-20, FR-24)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-txedit-test@contoh.id")
    await createTestUser(V, "v-txedit-test@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
    bank = (await new WalletsRepository(testDb).list(bookId)).find((w) => w.type === "bank")?.id ?? ""
    makan = (await new CategoriesRepository(testDb).list(bookId, { kind: "expense" }))[0]?.id ?? ""
  })
  afterAll(() => cleanupUsers([U, V]))

  test("ubah jumlah → saldo ikut; pengubah tercatat", async () => {
    const body = { type: "expense", amount: "100000", txDate: "2026-11-26", walletId: bank, categoryId: makan }
    const tx = await dataOf<Transaction>(await app(U).request(base(), jsonRequest("POST", body)))
    expect(await bankBalance()).toBe("-100000")
    const d = await dataOf<TransactionDetail>(
      await app(U).request(`${base()}/${tx.id}`, jsonRequest("PATCH", { ...body, amount: "250000", note: "Ubah" })),
    )
    expect(d).toMatchObject({ amount: "250000", note: "Ubah", updatedByName: "AAAA", createdByName: "AAAA" })
    expect(await bankBalance()).toBe("-250000")
  })

  test("hapus → saldo kembali; urungkan → transaksi dan saldo seperti semula", async () => {
    const list = await dataOf<{ id: string }[]>(await app(U).request(base()))
    const id = list[0]?.id ?? ""
    expect((await app(U).request(`${base()}/${id}`, jsonRequest("DELETE"))).status).toBe(204)
    expect(await bankBalance()).toBe("0")
    expect((await app(U).request(`${base()}/${id}`)).status).toBe(404)
    const restored = await dataOf<TransactionDetail>(
      await app(U).request(`${base()}/${id}/restore`, jsonRequest("POST")),
    )
    expect(restored.amount).toBe("250000")
    expect(await bankBalance()).toBe("-250000")
  })

  test("transaksi buku lain tidak bisa dibaca, diubah, atau dihapus", async () => {
    const list = await dataOf<{ id: string }[]>(await app(U).request(base()))
    const id = list[0]?.id ?? ""
    const foreign = `/api/v1/books/${otherBook}/transactions/${id}`
    expect((await app(V).request(foreign)).status).toBe(404)
    expect((await app(V).request(foreign, jsonRequest("DELETE"))).status).toBe(404)
    expect((await app(V).request(`${foreign}/restore`, jsonRequest("POST"))).status).toBe(404)
  })
})
