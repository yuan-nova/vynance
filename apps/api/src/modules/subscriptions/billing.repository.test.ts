import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { categories, subscriptions, transactions } from "@vynance/db"
import { and, eq } from "drizzle-orm"
import { cleanupUsers, createTestBook, createTestUser, testDb } from "../../db/test-fixtures"
import { newId } from "../../lib/id"
import { WalletsRepository } from "../wallets/wallets.repository"
import { BillingRepository } from "./billing.repository"
import { BillingService } from "./billing.service"

// PB-05, BR-41, TSD §9: transaksi otomatis sekali per periode; tahunan hanya di bulannya; pengingat H-3 sekali.
const U = "01JTESTBILLINGAAAAAAAAAAAA"
const mails: { to: string; subject: string }[] = []
const svc = new BillingService({
  billing: new BillingRepository(testDb),
  newId: () => newId(),
  sendMail: async (to, subject) => {
    mails.push({ to, subject })
  },
})
// 27 Nov 2026 10.00 WIB
const NOW = new Date("2026-11-27T03:00:00Z")
let bookId = ""
let wallet = ""
const ids = { monthly: newId(), yearlyOff: newId(), paused: newId(), soon: newId() }

describe("langganan otomatis", () => {
  beforeAll(async () => {
    await cleanupUsers([U])
    await createTestUser(U, "u-billing@contoh.id")
    bookId = await createTestBook(U)
    wallet = (await new WalletsRepository(testDb).list(bookId))[1]?.id ?? ""
    const base = {
      bookId,
      currency: "IDR",
      walletId: wallet,
      startDate: "2026-01-01",
      createdBy: U,
      cycle: "monthly" as const,
      billingMonth: null,
    }
    await testDb.insert(subscriptions).values([
      { ...base, id: ids.monthly, name: "Netflix", originalAmount: "186000", amountIdr: 186_000n, billingDay: 25 },
      {
        ...base,
        id: ids.yearlyOff,
        name: "Asuransi",
        originalAmount: "5400000",
        amountIdr: 5_400_000n,
        billingDay: 1,
        cycle: "yearly",
        billingMonth: 2,
      },
      {
        ...base,
        id: ids.paused,
        name: "Gym",
        originalAmount: "300000",
        amountIdr: 300_000n,
        billingDay: 5,
        pausedAt: NOW,
      },
      { ...base, id: ids.soon, name: "IndiHome", originalAmount: "385000", amountIdr: 385_000n, billingDay: 30 },
    ])
  })
  afterAll(() => cleanupUsers([U]))

  test("tiga kali (dua bersamaan) tetap satu transaksi; tahunan & dijeda tidak ditagih", async () => {
    const [a, b] = await Promise.all([svc.chargeDue(NOW), svc.chargeDue(NOW)])
    const c = await svc.chargeDue(NOW)
    const rows = await testDb.select().from(transactions).where(eq(transactions.bookId, bookId))
    expect(rows).toHaveLength(1)
    expect(a + b + c).toBeGreaterThanOrEqual(1)
    const tx = rows[0]
    expect(tx).toMatchObject({
      type: "expense",
      amount: 186_000n,
      txDate: "2026-11-25",
      source: "subscription",
      subscriptionId: ids.monthly,
      subscriptionPeriod: "2026-11",
      note: "Tagihan Otomatis: Netflix",
    })
    const [cat] = await testDb
      .select({ name: categories.name })
      .from(categories)
      .where(and(eq(categories.bookId, bookId), eq(categories.id, tx?.categoryId ?? "")))
    expect(cat?.name).toBe("Langganan")
  })

  test("pengingat H-3 ke anggota, sekali per periode", async () => {
    expect(await svc.remindUpcoming(NOW)).toBe(1)
    expect(await svc.remindUpcoming(NOW)).toBe(0)
    expect(mails.map((m) => m.subject)).toEqual(["Tagihan IndiHome 3 hari lagi"])
    expect(mails[0]?.to).toBe("u-billing@contoh.id")
  })
})
