import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Transaction, TransactionSummary, WalletList } from "@vynance/shared"
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
import { InvestmentTypesRepository } from "../investments/investment-types.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { WalletsService } from "../wallets/wallets.service"
import { TransactionsRepository } from "./transactions.repository"
import { TransactionsService } from "./transactions.service"

// PB-06, BR-32…BR-34, TSD §7.3: beli/jual aset mengubah rekening dan aset dalam satu transaksi DB.
const U = "01JTESTASSETTRADEAAAAAAAAA"
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
})
const walletsService = new WalletsService({
  wallets: new WalletsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    wallets: new WalletsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = () => testApp(U, { booksService: testBooksService, transactionsService, walletsService })
const assetsRepo = new AssetsRepository(testDb)
let bookId = ""
let wallet = ""
let assetId = ""
const url = (p: string) => `/api/v1/books/${bookId}${p}`
const asset = async () => assetsRepo.findById(bookId, assetId)
const balance = async () =>
  (await dataOf<WalletList>(await app().request(url("/wallets")))).wallets.find((w) => w.id === wallet)?.balance

describe("beli/jual aset", () => {
  beforeAll(async () => {
    await cleanupUsers([U])
    await createTestUser(U, "u-assettrade@contoh.id")
    bookId = await createTestBook(U)
    wallet = (await new WalletsRepository(testDb).list(bookId))[1]?.id ?? ""
    const type = (await new InvestmentTypesRepository(testDb).list(bookId))[0]?.id ?? ""
    assetId = newId()
    await assetsRepo.insert({
      id: assetId,
      bookId,
      investmentTypeId: type,
      name: "Emas Antam",
      units: "10",
      costBasis: 10_000_000n,
      currentValue: 12_000_000n,
      valueUpdatedAt: new Date(),
      createdBy: U,
    })
  })
  afterAll(() => cleanupUsers([U]))

  test("beli: saldo turun, modal & nilai naik; tidak dihitung pengeluaran", async () => {
    const before = await balance()
    const res = await app().request(
      url("/transactions"),
      jsonRequest("POST", { type: "asset_buy", amount: "2000000", txDate: "2026-11-20", walletId: wallet, assetId }),
    )
    expect(res.status).toBe(201)
    expect(BigInt(before ?? "0") - BigInt((await balance()) ?? "0")).toBe(2_000_000n)
    expect(await asset()).toMatchObject({ costBasis: 12_000_000n, currentValue: 14_000_000n })
    const sum = await dataOf<TransactionSummary>(
      await app().request(url("/transactions/summary?from=2026-11-01&to=2026-11-30")),
    )
    expect(sum.expense).toBe("0")
  })

  test("BR-32 aset wajib; BR-33 jual melebihi modal/nilai ditolak", async () => {
    const noAsset = await app().request(
      url("/transactions"),
      jsonRequest("POST", { type: "asset_sell", amount: "1000", txDate: "2026-11-21", walletId: wallet }),
    )
    expect(noAsset.status).toBe(422)
    const tooMuch = await app().request(
      url("/transactions"),
      jsonRequest("POST", { type: "asset_sell", amount: "13000000", txDate: "2026-11-21", walletId: wallet, assetId }),
    )
    expect(tooMuch.status).toBe(422)
    expect(((await tooMuch.json()) as { error: { code: string } }).error.code).toBe("ASSET_SELL_EXCEEDS")
  })

  test("BR-34: ubah dan hapus membalik dampak lama ke aset", async () => {
    const sell = await dataOf<Transaction>(
      await app().request(
        url("/transactions"),
        jsonRequest("POST", { type: "asset_sell", amount: "3000000", txDate: "2026-11-22", walletId: wallet, assetId }),
      ),
    )
    expect(await asset()).toMatchObject({ costBasis: 9_000_000n, currentValue: 11_000_000n })

    const edited = await app().request(
      url(`/transactions/${sell.id}`),
      jsonRequest("PATCH", { type: "asset_sell", amount: "1000000", txDate: "2026-11-22", walletId: wallet, assetId }),
    )
    expect(edited.status).toBe(200)
    expect(await asset()).toMatchObject({ costBasis: 11_000_000n, currentValue: 13_000_000n })

    expect((await app().request(url(`/transactions/${sell.id}`), jsonRequest("DELETE"))).status).toBe(204)
    expect(await asset()).toMatchObject({ costBasis: 12_000_000n, currentValue: 14_000_000n })

    // Urungkan hapus menerapkan lagi dampaknya.
    expect((await app().request(url(`/transactions/${sell.id}/restore`), jsonRequest("POST"))).status).toBe(200)
    expect(await asset()).toMatchObject({ costBasis: 11_000_000n, currentValue: 13_000_000n })
  })

  test("hapus transaksi beli mengembalikan modal dan nilai aset", async () => {
    const buy = await dataOf<Transaction>(
      await app().request(
        url("/transactions"),
        jsonRequest("POST", { type: "asset_buy", amount: "500000", txDate: "2026-11-23", walletId: wallet, assetId }),
      ),
    )
    const before = await asset()
    expect((await app().request(url(`/transactions/${buy.id}`), jsonRequest("DELETE"))).status).toBe(204)
    const after = await asset()
    expect((before?.costBasis ?? 0n) - (after?.costBasis ?? 0n)).toBe(500_000n)
    expect((before?.currentValue ?? 0n) - (after?.currentValue ?? 0n)).toBe(500_000n)
  })
})
