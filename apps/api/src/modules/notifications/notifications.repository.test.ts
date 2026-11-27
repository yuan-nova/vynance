import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { NotificationList } from "@vynance/shared"
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
import { CategoriesRepository } from "../categories/categories.repository"
import { CategoriesService } from "../categories/categories.service"
import { AssetsRepository } from "../investments/assets.repository"
import { InvestmentTypesRepository } from "../investments/investment-types.repository"
import { PlansRepository } from "../plans/plans.repository"
import { PlansService } from "../plans/plans.service"
import { TransactionsRepository } from "../transactions/transactions.repository"
import { TransactionsService } from "../transactions/transactions.service"
import { WalletsRepository } from "../wallets/wallets.repository"
import { NotificationsRepository } from "./notifications.repository"
import { NotificationsService } from "./notifications.service"

// BR-11, PB-12 langkah 6: satu peringatan per kategori/bulan/ambang ke semua anggota, tanpa dobel.
const A = "01JTESTNOTIFYAAAAAAAAAAAAA"
const B = "01JTESTNOTIFYBBBBBBBBBBBBB"
const plansService = new PlansService({
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
const categoriesService = new CategoriesService({
  categories: new CategoriesRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    categories: new CategoriesRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const notificationsService = new NotificationsService({
  notifications: new NotificationsRepository(testDb),
  plans: plansService,
  categories: categoriesService,
  newId: () => newId(),
  now: () => new Date(),
})
const transactionsService = new TransactionsService({
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
  afterExpense: (ctx, c, d) => notificationsService.checkBudgetSafely(ctx, c, d),
})
const app = (u: string) =>
  testApp(u, { booksService: testBooksService, transactionsService, plansService, notificationsService })
let bookId = ""
let makan = ""
let wallet = ""
const url = (p: string) => `/api/v1/books/${bookId}${p}`
const expense = (amount: string) =>
  jsonRequest("POST", { type: "expense", amount, txDate: "2026-11-20", walletId: wallet, categoryId: makan })

describe("peringatan anggaran 90%", () => {
  beforeAll(async () => {
    await cleanupUsers([A, B])
    await createTestUser(A, "a-notify@contoh.id")
    await createTestUser(B, "b-notify@contoh.id")
    bookId = await createTestBook(A)
    await new BooksRepository(testDb).addMember({ id: newId(), bookId, userId: B, createdBy: A })
    makan = (await new CategoriesRepository(testDb).list(bookId, { kind: "expense" }))[0]?.id ?? ""
    wallet = (await new WalletsRepository(testDb).list(bookId))[1]?.id ?? ""
    await app(A).request(
      url("/plans/2026-11"),
      jsonRequest("PUT", {
        version: 0,
        spendingCap: "1000000",
        defaultWalletId: null,
        incomes: [{ name: "Gaji", amount: "5000000" }],
        allocations: [{ kind: "expense", categoryId: makan, mode: "amount", amount: "1000000" }],
      }),
    )
  })
  afterAll(() => cleanupUsers([A, B]))

  test("di bawah 90% belum ada notifikasi", async () => {
    await app(A).request(url("/transactions"), expense("500000"))
    expect((await dataOf<NotificationList>(await app(A).request(url("/notifications")))).unread).toBe(0)
  })

  test("dua anggota mencatat bersamaan melewati 90% → satu notifikasi per anggota", async () => {
    await Promise.all([
      app(A).request(url("/transactions"), expense("250000")),
      app(B).request(url("/transactions"), expense("200000")),
    ])
    for (const u of [A, B]) {
      const list = await dataOf<NotificationList>(await app(u).request(url("/notifications")))
      expect(list.items.filter((n) => n.data.threshold === "9000")).toHaveLength(1)
      expect(JSON.stringify(list.items)).not.toMatch(/Rp|\d{6,}/)
    }
  })

  test("100% mengirim peringatan kedua; baca semua; pengaturan mati menghentikan peringatan", async () => {
    await app(A).request(url("/transactions"), expense("100000"))
    const list = await dataOf<NotificationList>(await app(B).request(url("/notifications")))
    expect(list.items.map((n) => n.data.threshold).sort()).toEqual(["10000", "9000"])
    expect((await app(B).request(url("/notifications/read-all"), jsonRequest("POST"))).status).toBe(204)
    expect((await dataOf<NotificationList>(await app(B).request(url("/notifications")))).unread).toBe(0)

    const off = await app(A).request(url("/settings"), jsonRequest("PATCH", { budgetAlertEnabled: false }))
    expect((await dataOf<{ budgetAlertEnabled: boolean }>(off)).budgetAlertEnabled).toBe(false)
    expect(await notificationsService.checkBudget({ userId: A, bookId }, makan, "2026-12-01")).toBe(0)
  })
})
