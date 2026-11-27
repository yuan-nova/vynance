import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createDb, users } from "@vynance/db"
import { inArray } from "drizzle-orm"
import { MeRepository } from "./me.repository"

// Butuh MySQL dev dengan migrasi terbaru (bun run db:migrate).
const db = createDb(Bun.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance")
const A = "01JTESTMEAAAAAAAAAAAAAAAAA"
const B = "01JTESTMEBBBBBBBBBBBBBBBBB"

describe("MeRepository", () => {
  beforeAll(async () => {
    await db.delete(users).where(inArray(users.id, [A, B]))
    await db.insert(users).values([
      { id: A, name: "A", email: "a-me-test@contoh.id" },
      { id: B, name: "B", email: "b-me-test@contoh.id" },
    ])
  })
  afterAll(async () => {
    await db.delete(users).where(inArray(users.id, [A, B]))
    await db.$client.end()
  })

  test("update hanya mengubah pengguna itu", async () => {
    const repo = new MeRepository(db)
    await repo.update(A, { privacyMode: true, locale: "en" })
    expect((await repo.findById(A))?.privacyMode).toBe(true)
    expect((await repo.findById(A))?.locale).toBe("en")
    expect((await repo.findById(B))?.privacyMode).toBe(false)
  })

  test("pengguna tidak ada → null", async () => {
    expect(await new MeRepository(db).findById("01JTESTMEZZZZZZZZZZZZZZZZZ")).toBeNull()
  })
})
