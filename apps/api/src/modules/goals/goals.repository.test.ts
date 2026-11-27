import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Goal, GoalList } from "@vynance/shared"
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
import { GoalsRepository } from "./goals.repository"
import { GoalsService } from "./goals.service"

const U = "01JTESTGOALSERVAAAAAAAAAAA"
const V = "01JTESTGOALSERVBBBBBBBBBBB"
const svc = new GoalsService({
  goals: new GoalsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({
    goals: new GoalsRepository(exec),
    activity: new ActivityRepository(exec),
  })),
  newId: () => newId(),
  now: () => new Date("2026-11-27T10:00:00Z"),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, goalsService: svc })
let bookId = ""
const url = (p = "") => `/api/v1/books/${bookId}/goals${p}`

describe("target tabungan (PB-07)", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-goal-test@contoh.id")
    await createTestUser(V, "v-goal-test@contoh.id")
    bookId = await createTestBook(U)
    await createTestBook(V)
  })
  afterAll(() => cleanupUsers([U, V]))

  test("buat, setor, terkumpul = awal + setoran, ringkasan", async () => {
    const res = await app(U).request(
      url(),
      jsonRequest("POST", {
        name: "Dana Darurat",
        icon: "shield",
        targetAmount: "54000000",
        initialAmount: "28000000",
        targetDate: "2027-12-31",
      }),
    )
    expect(res.status).toBe(201)
    const g = await dataOf<Goal>(res)
    expect(g.collected).toBe("28000000")
    expect(g.status).toBe("onTrack") // baru dibuat bulan ini

    const c = await app(U).request(
      url(`/${g.id}/contributions`),
      jsonRequest("POST", { amount: "2000000", contributedOn: "2026-11-20" }),
    )
    expect(c.status).toBe(201)
    const after = await dataOf<Goal>(c)
    expect(after.collected).toBe("30000000")
    expect(after.monthlyNeeded).toBe("1846200")
    expect(after.pace).toBe("2000000")

    const list = await dataOf<GoalList>(await app(U).request(url()))
    expect(list.summary).toEqual({ collected: "30000000", target: "54000000", count: 1 })
  })

  test("nominal 0 dan target milik buku lain ditolak", async () => {
    const bad = await app(U).request(url(), jsonRequest("POST", { name: "X", targetAmount: "0" }))
    expect(bad.status).toBe(422)
    const g = (await dataOf<GoalList>(await app(U).request(url()))).goals[0]
    const foreign = await app(V).request(
      url(`/${g?.id}/contributions`),
      jsonRequest("POST", { amount: "1000", contributedOn: "2026-11-20" }),
    )
    expect(foreign.status).toBe(404)
  })

  test("ubah dan hapus (soft delete)", async () => {
    const g = (await dataOf<GoalList>(await app(U).request(url()))).goals[0]
    const upd = await app(U).request(url(`/${g?.id}`), jsonRequest("PATCH", { targetAmount: "30000000" }))
    expect((await dataOf<Goal>(upd)).status).toBe("achieved")
    expect((await app(U).request(url(`/${g?.id}`), jsonRequest("DELETE"))).status).toBe(204)
    expect((await dataOf<GoalList>(await app(U).request(url()))).goals).toHaveLength(0)
  })
})
