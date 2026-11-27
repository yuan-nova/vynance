import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createDb, type Executor } from "@vynance/db"
import { sql } from "drizzle-orm"
import { UnitOfWork } from "./unit-of-work"

// Test ini butuh MySQL dev (docker compose) di localhost:12306.
const db = createDb(Bun.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance")

const repos = (exec: Executor) => ({
  insert: (v: number) => exec.execute(sql`insert into _uow_test (v) values (${v})`),
})

describe("withTransaction", () => {
  beforeAll(async () => {
    await db.execute(sql`create table if not exists _uow_test (v int not null)`)
    await db.execute(sql`delete from _uow_test`)
  })
  afterAll(async () => {
    await db.execute(sql`drop table if exists _uow_test`)
    await db.$client.end()
  })

  test("langkah kedua gagal → langkah pertama di-rollback", async () => {
    const uow = new UnitOfWork(db, repos)
    const run = uow.withTransaction(async (r) => {
      await r.insert(1)
      throw new Error("gagal")
    })
    await expect(run).rejects.toThrow("gagal")
    const [rows] = await db.execute(sql`select count(*) as n from _uow_test`)
    expect(Number((rows as unknown as { n: unknown }[])[0]?.n)).toBe(0)
  })

  test("sukses → ter-commit", async () => {
    const uow = new UnitOfWork(db, repos)
    await uow.withTransaction(async (r) => {
      await r.insert(1)
      await r.insert(2)
    })
    const [rows] = await db.execute(sql`select count(*) as n from _uow_test`)
    expect(Number((rows as unknown as { n: unknown }[])[0]?.n)).toBe(2)
  })
})
