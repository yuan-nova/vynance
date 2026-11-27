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
import { BookEvents } from "../../lib/book-events"
import { newId } from "../../lib/id"
import { testApp } from "../../testing/test-app"
import { ActivityRepository } from "../activity/activity.repository"
import { GoalsRepository } from "../goals/goals.repository"
import { GoalsService } from "../goals/goals.service"

// TSD §8.1: tulis berhasil → event invalidate ke koneksi buku itu saja; SSE lewat bookAccess.
const U = "01JTESTEVENTSAAAAAAAAAAAAA"
const V = "01JTESTEVENTSBBBBBBBBBBBBB"
const bus = new BookEvents()
const goalsService = new GoalsService({
  goals: new GoalsRepository(testDb),
  uow: new UnitOfWork(testDb, (exec) => ({ goals: new GoalsRepository(exec), activity: new ActivityRepository(exec) })),
  newId: () => newId(),
  now: () => new Date(),
})
const app = (u: string) => testApp(u, { booksService: testBooksService, goalsService, bookEvents: bus })
let bookId = ""
let otherBook = ""

describe("realtime SSE", () => {
  beforeAll(async () => {
    await cleanupUsers([U, V])
    await createTestUser(U, "u-events@contoh.id")
    await createTestUser(V, "v-events@contoh.id")
    bookId = await createTestBook(U)
    otherBook = await createTestBook(V)
  })
  afterAll(() => cleanupUsers([U, V]))

  test("tulis berhasil menerbitkan invalidate ke buku itu saja; baca dan gagal tidak", async () => {
    const mine: unknown[] = []
    const other: unknown[] = []
    const off1 = bus.subscribe(bookId, (e) => mine.push(e))
    const off2 = bus.subscribe(otherBook, (e) => other.push(e))
    const ok = await app(U).request(
      `/api/v1/books/${bookId}/goals`,
      jsonRequest("POST", { name: "Darurat", targetAmount: "1000000" }),
    )
    expect(ok.status).toBe(201)
    await app(U).request(`/api/v1/books/${bookId}/goals`)
    const bad = await app(U).request(`/api/v1/books/${bookId}/goals`, jsonRequest("POST", { name: "" }))
    expect(bad.status).toBe(422)
    off1()
    off2()
    expect(mine).toEqual([{ type: "invalidate", keys: ["goals"], actorId: U }])
    expect(other).toHaveLength(0)
  })

  test("stream SSE: event ready, lalu invalidate; bukan anggota 404; putus → berhenti berlangganan", async () => {
    expect((await app(V).request(`/api/v1/books/${bookId}/events`)).status).toBe(404)
    const ac = new AbortController()
    const res = await app(U).request(`/api/v1/books/${bookId}/events`, { signal: ac.signal })
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/event-stream")
    const reader = (res.body as ReadableStream<Uint8Array>).getReader()
    const dec = new TextDecoder()
    let text = dec.decode((await reader.read()).value)
    expect(text).toContain("event: ready")
    expect(bus.count(bookId)).toBe(1)
    bus.publish(bookId, { type: "invalidate", keys: ["transactions"], actorId: V })
    text = dec.decode((await reader.read()).value)
    expect(text).toContain("event: invalidate")
    expect(text).toContain('"keys":["transactions"]')
    await reader.cancel()
    ac.abort()
    await new Promise((r) => setTimeout(r, 50))
    expect(bus.count(bookId)).toBe(0)
  })
})
