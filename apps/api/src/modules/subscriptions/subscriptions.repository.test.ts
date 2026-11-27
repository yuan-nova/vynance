import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Subscription, SubscriptionList } from "@vynance/shared"
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
import { SubscriptionsRepository } from "./subscriptions.repository"
import { SubscriptionsService } from "./subscriptions.service"

const U = "01JTESTSUBSCRAAAAAAAAAAAAA"
const V = "01JTESTSUBSCRBBBBBBBBBBBBB"
const svc = new SubscriptionsService({
  subscriptions: new SubscriptionsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    subscriptions: new SubscriptionsRepository(exec),
    wallets: new WalletsRepository(exec),
    categories: new CategoriesRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date("2026-11-27T03:00:00Z"),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, subscriptionsService: svc })
let bookId = ""
let otherBook = ""
let wallet = ""
let foreignWallet = ""
const url = (p = "") => `/api/v1/books/${bookId}/subscriptions${p}`

describe("langganan (PB-05)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-subs@contoh.id")
    await createTestUser(V, "v-subs@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
    wallet = (await new WalletsRepository(testDb).list(bookId))[1]?.id ?? ""
    foreignWallet = (await new WalletsRepository(testDb).list(otherBook))[1]?.id ?? ""
  })
  afterAll(() => cleanupUsers([U, V]))

  test("IDR bulanan, USD kurs manual, tahunan; total BR-40", async () => {
    const base = { walletId: wallet, startDate: "2026-01-01" }
    const a = await app(U).request(
      url(),
      jsonRequest("POST", { ...base, name: "Spotify Family", originalAmount: "86900", billingDay: 3 }),
    )
    expect(a.status).toBe(201)
    const spotify = await dataOf<Subscription>(a)
    expect(spotify.serviceKey).toBe("spotify")
    expect(spotify.nextBillingDate).toBe("2026-12-03")

    const b = await dataOf<Subscription>(
      await app(U).request(
        url(),
        jsonRequest("POST", {
          ...base,
          name: "ChatGPT Plus",
          currency: "USD",
          originalAmount: "20",
          fxRate: "15900",
          billingDay: 14,
        }),
      ),
    )
    expect(b.amountIdr).toBe("318000")

    const c = await dataOf<Subscription>(
      await app(U).request(
        url(),
        jsonRequest("POST", {
          ...base,
          name: "Asuransi Mobil",
          originalAmount: "5400000",
          cycle: "yearly",
          billingDay: 31,
          billingMonth: 2,
        }),
      ),
    )
    expect(c.monthlyIdr).toBe("450000")
    expect(c.nextBillingDate).toBe("2027-02-28")

    const list = await dataOf<SubscriptionList>(await app(U).request(url()))
    expect(list.monthlyTotal).toBe(String(86_900 + 318_000 + 450_000))
    expect(list.subscriptions[0]?.name).toBe("Spotify Family")
  })

  test("tahunan wajib bulan tagihan; rekening buku lain ditolak; buku lain 404", async () => {
    const noMonth = await app(U).request(
      url(),
      jsonRequest("POST", {
        name: "X",
        originalAmount: "1000",
        cycle: "yearly",
        billingDay: 1,
        walletId: wallet,
        startDate: "2026-01-01",
      }),
    )
    expect(noMonth.status).toBe(422)
    const foreign = await app(U).request(
      url(),
      jsonRequest("POST", {
        name: "X",
        originalAmount: "1000",
        billingDay: 1,
        walletId: foreignWallet,
        startDate: "2026-01-01",
      }),
    )
    expect(foreign.status).toBe(422)
    expect((await app(V).request(url())).status).toBe(404)
  })

  test("jeda mengeluarkan dari total; hapus", async () => {
    const list = await dataOf<SubscriptionList>(await app(U).request(url()))
    const s = list.subscriptions.find((x) => x.name === "Asuransi Mobil")
    const body = {
      name: s?.name,
      originalAmount: s?.originalAmount.replace(/\.0+$/, ""),
      cycle: "yearly",
      billingDay: 31,
      billingMonth: 2,
      walletId: wallet,
      startDate: "2026-01-01",
      paused: true,
    }
    const upd = await app(U).request(url(`/${s?.id}`), jsonRequest("PUT", body))
    expect(upd.status).toBe(200)
    expect((await dataOf<Subscription>(upd)).paused).toBe(true)
    const after = await dataOf<SubscriptionList>(await app(U).request(url()))
    expect(after.monthlyTotal).toBe(String(86_900 + 318_000))
    expect((await app(U).request(url(`/${s?.id}`), jsonRequest("DELETE"))).status).toBe(204)
  })
})
