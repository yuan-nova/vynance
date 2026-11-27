import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { transactions } from "@vynance/db"
import type { Plan } from "@vynance/shared"
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
import { InvestmentTypesRepository } from "../investments/investment-types.repository"
import { TransactionsRepository } from "../transactions/transactions.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { PlansRepository } from "./plans.repository"
import { PlansService } from "./plans.service"

const U = "01JTESTPLANVSERAAAAAAAAAAA"
const V = "01JTESTPLANVSERBBBBBBBBBBB"
const svc = new PlansService({
  plans: new PlansRepository(testDb),
  transactions: new TransactionsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    plans: new PlansRepository(exec),
    categories: new CategoriesRepository(exec),
    investmentTypes: new InvestmentTypesRepository(exec),
    wallets: new WalletsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, plansService: svc })
let bookId = ""
let otherBook = ""
let makan = ""
let gaji = ""
let emas = ""
let foreignCat = ""
let bank = ""
const url = (m = "2026-11") => `/api/v1/books/${bookId}/plans/${m}`

describe("rencana bulanan (PB-04)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-plan-test@contoh.id")
    await createTestUser(V, "v-plan-test@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
    const cats = await new CategoriesRepository(testDb).list(bookId)
    makan = cats.find((c) => c.kind === "expense")?.id ?? ""
    gaji = cats.find((c) => c.kind === "income")?.id ?? ""
    emas = (await new InvestmentTypesRepository(testDb).list(bookId))[0]?.id ?? ""
    foreignCat = (await new CategoriesRepository(testDb).list(otherBook, { kind: "expense" }))[0]?.id ?? ""
    bank = (await new WalletsRepository(testDb).list(bookId))[1]?.id ?? ""
    await testDb.insert(transactions).values({
      id: newId(),
      bookId,
      type: "income",
      amount: 18_000_000n,
      txDate: "2026-11-25",
      walletId: bank,
      categoryId: gaji,
      createdBy: U,
    })
  })
  afterAll(() => cleanupUsers([U, V]))

  const body = (version: number) => ({
    version,
    spendingCap: "17000000",
    defaultWalletId: bank,
    incomes: [{ name: "Gaji", amount: "24500000" }],
    allocations: [
      { kind: "expense", categoryId: makan, mode: "amount", amount: "1500000" },
      { kind: "investment", investmentTypeId: emas, mode: "percent", percentBp: 2000 },
    ],
  })

  test("belum ada → versi 0; pemasukan tercatat terpisah dari rencana", async () => {
    const p = await dataOf<Plan>(await app(U).request(url()))
    expect(p).toMatchObject({ version: 0, incomes: [], recordedIncome: "18000000" })
  })

  test("simpan lalu baca; versi naik", async () => {
    const saved = await dataOf<Plan>(await app(U).request(url(), jsonRequest("PUT", body(0))))
    expect(saved.version).toBe(1)
    expect(saved.incomes).toEqual([{ name: "Gaji", amount: "24500000" }])
    expect(saved.allocations).toHaveLength(2)
    const again = await dataOf<Plan>(
      await app(U).request(url(), jsonRequest("PUT", { ...body(1), spendingCap: "16000000" })),
    )
    expect(again).toMatchObject({ version: 2, spendingCap: "16000000", updatedByName: "AAAA" })
  })

  test("dua anggota: versi lama → 409 PLAN_CONFLICT, data terbaru tidak tertimpa", async () => {
    const res = await app(U).request(url(), jsonRequest("PUT", { ...body(1), spendingCap: "1" }))
    expect(res.status).toBe(409)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("PLAN_CONFLICT")
    expect((await dataOf<Plan>(await app(U).request(url()))).spendingCap).toBe("16000000")
  })

  test("kategori buku lain ditolak", async () => {
    const res = await app(U).request(
      url("2026-12"),
      jsonRequest("PUT", {
        ...body(0),
        allocations: [{ kind: "expense", categoryId: foreignCat, mode: "amount", amount: "1" }],
      }),
    )
    expect(res.status).toBe(422)
    expect((await dataOf<Plan>(await app(U).request(url("2026-12")))).version).toBe(0)
  })

  test("buku lain tidak bisa membaca rencana", async () => {
    expect((await app(V).request(url())).status).toBe(404)
  })
})
