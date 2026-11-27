import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import {
  cleanupUsers,
  createTestBook,
  createTestUser,
  jsonRequest,
  testBooksService,
  testDb,
} from "../../db/test-fixtures"
import { UnitOfWork } from "../../db/unit-of-work"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { MeRepository } from "../me/me.repository"
import { WalletsRepository } from "../wallets/wallets.repository"
import { OnboardingService } from "./onboarding.service"

const U = "01JTEST0NB0ARDVSERAAAAAAAA"
const V = "01JTEST0NB0ARDVSERBBBBBBBB"
const svc = new OnboardingService({
  uow: new UnitOfWork(testDb, (exec) => ({
    wallets: new WalletsRepository(exec),
    me: new MeRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, onboardingService: svc })
let bookId = ""
let otherBook = ""

describe("onboarding saldo awal (PB-01)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-onb-test@contoh.id")
    await createTestUser(V, "v-onb-test@contoh.id")
    bookId = await createTestBook(U, "Pribadi")
    otherBook = await createTestBook(V, "Lain")
  })
  afterAll(() => cleanupUsers([U, V]))

  test("saldo awal tersimpan dan pengguna ditandai selesai onboarding", async () => {
    const [tunai, bank] = await new WalletsRepository(testDb).list(bookId)
    const res = await app(U).request(
      `/api/v1/books/${bookId}/onboarding/opening-balances`,
      jsonRequest("POST", {
        balances: [
          { walletId: tunai?.id, openingBalance: "850000" },
          { walletId: bank?.id, openingBalance: "28640000" },
        ],
      }),
    )
    expect(res.status).toBe(204)
    expect((await new WalletsRepository(testDb).findById(bookId, bank?.id ?? ""))?.openingBalance).toBe(28_640_000n)
    expect((await new MeRepository(testDb).findById(U))?.onboardedAt).not.toBeNull()
  })

  test("rekening buku lain → 404 dan tidak ada perubahan sebagian", async () => {
    const [mine] = await new WalletsRepository(testDb).list(bookId)
    const [foreign] = await new WalletsRepository(testDb).list(otherBook)
    const res = await app(U).request(
      `/api/v1/books/${bookId}/onboarding/opening-balances`,
      jsonRequest("POST", {
        balances: [
          { walletId: mine?.id, openingBalance: "1" },
          { walletId: foreign?.id, openingBalance: "999" },
        ],
      }),
    )
    expect(res.status).toBe(404)
    expect((await new WalletsRepository(testDb).findById(bookId, mine?.id ?? ""))?.openingBalance).toBe(850_000n)
    expect((await new WalletsRepository(testDb).findById(otherBook, foreign?.id ?? ""))?.openingBalance).toBe(0n)
  })
})
