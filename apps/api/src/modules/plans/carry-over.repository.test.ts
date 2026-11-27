import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { assets, transactions } from "@vynance/db"
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

// PB-04 langkah 7, BR-14: sisa = max(alokasi − realisasi, 0), ditetapkan (tidak dobel saat ditekan dua kali).
const U = "01JTESTCARRYOVERAAAAAAAAAA"
const svc = new PlansService({
  plans: new PlansRepository(testDb),
  transactions: new TransactionsRepository(testDb),
  realization: new PlansRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    plans: new PlansRepository(exec),
    categories: new CategoriesRepository(exec),
    investmentTypes: new InvestmentTypesRepository(exec),
    wallets: new WalletsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
})
const app = () => testApp(U, { booksService: testBooksService, plansService: svc })
let bookId = ""
let makan = ""
let transport = ""
let emas = ""
const url = (m: string, p = "") => `/api/v1/books/${bookId}/plans/${m}${p}`

describe("bawa sisa bulan lalu", () => {
  beforeAll(async () => {
    await cleanupUsers([U])
    await createTestUser(U, "u-carry@contoh.id")
    bookId = await createTestBook(U)
    const cats = await new CategoriesRepository(testDb).list(bookId, { kind: "expense" })
    makan = cats[0]?.id ?? ""
    transport = cats[2]?.id ?? ""
    emas = (await new InvestmentTypesRepository(testDb).list(bookId))[0]?.id ?? ""
    const wallet = (await new WalletsRepository(testDb).list(bookId))[1]?.id ?? ""
    // Oktober: alokasi makan 1,5 jt (terpakai 1,2 jt), transport 500 rb (terpakai 800 rb), emas 2 jt (beli 500 rb).
    const put = await app().request(
      url("2026-10"),
      jsonRequest("PUT", {
        version: 0,
        spendingCap: "5000000",
        defaultWalletId: null,
        incomes: [{ name: "Gaji", amount: "10000000" }],
        allocations: [
          { kind: "expense", categoryId: makan, mode: "amount", amount: "1500000" },
          { kind: "expense", categoryId: transport, mode: "amount", amount: "500000" },
          { kind: "investment", investmentTypeId: emas, mode: "amount", amount: "2000000" },
        ],
      }),
    )
    expect(put.status).toBe(200)
    const assetId = newId()
    await testDb.insert(assets).values({
      id: assetId,
      bookId,
      investmentTypeId: emas,
      name: "Emas",
      costBasis: 0n,
      currentValue: 0n,
      createdBy: U,
    })
    const tx = (type: "expense" | "asset_buy", amount: bigint, extra: object) => ({
      id: newId(),
      bookId,
      type,
      amount,
      txDate: "2026-10-15",
      walletId: wallet,
      createdBy: U,
      ...extra,
    })
    await testDb
      .insert(transactions)
      .values([
        tx("expense", 1_200_000n, { categoryId: makan }),
        tx("expense", 800_000n, { categoryId: transport }),
        tx("asset_buy", 500_000n, { assetId }),
      ])
  })
  afterAll(() => cleanupUsers([U]))

  test("membuat rencana November dengan sisa per kategori dan investasi", async () => {
    const res = await app().request(url("2026-11", "/carry-over"), jsonRequest("POST"))
    expect(res.status).toBe(200)
    const p = await dataOf<Plan>(res)
    const of = (id: string) => p.allocations.find((a) => a.categoryId === id || a.investmentTypeId === id)
    expect(of(makan)?.carriedOver).toBe("300000")
    expect(of(transport)?.carriedOver ?? "0").toBe("0")
    expect(of(emas)?.carriedOver).toBe("1500000")
  })

  test("ditekan dua kali tidak menggandakan", async () => {
    const p = await dataOf<Plan>(await app().request(url("2026-11", "/carry-over"), jsonRequest("POST")))
    expect(p.allocations.find((a) => a.categoryId === makan)?.carriedOver).toBe("300000")
    expect(p.allocations.filter((a) => a.categoryId === makan)).toHaveLength(1)
  })

  test("tanpa rencana bulan lalu → 422 jelas", async () => {
    const res = await app().request(url("2026-06", "/carry-over"), jsonRequest("POST"))
    expect(res.status).toBe(422)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("PLAN_NO_PREVIOUS")
  })
})
