import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { sql } from "drizzle-orm"
import { mysqlTable } from "drizzle-orm/mysql-core"
import { createDb } from "./client"
import { audit, id, money } from "./schema/columns"

// Butuh MySQL dev (docker compose) di localhost:12306.
const db = createDb(Bun.env.DATABASE_URL ?? "mysql://vynance:vynance_dev@localhost:12306/vynance")

const colTest = mysqlTable("_col_test", { id: id().primaryKey(), amount: money("amount").notNull(), ...audit })

describe("helper kolom", () => {
  beforeAll(async () => {
    await db.execute(sql`drop table if exists _col_test`)
    await db.execute(sql`create table _col_test (
      id char(26) primary key,
      amount bigint not null,
      created_by char(26) not null,
      created_at datetime(3) not null default (current_timestamp(3)),
      updated_at datetime(3) not null default (current_timestamp(3)),
      deleted_at datetime(3) null
    )`)
  })
  afterAll(async () => {
    await db.execute(sql`drop table if exists _col_test`)
    await db.$client.end()
  })

  test("money terbaca bigint, termasuk di atas Number.MAX_SAFE_INTEGER", async () => {
    const big = 9_007_199_254_740_993n
    await db
      .insert(colTest)
      .values({ id: "01JAAAAAAAAAAAAAAAAAAAAAAA", amount: big, createdBy: "01JBBBBBBBBBBBBBBBBBBBBBBB" })
    const [row] = await db.select().from(colTest)
    expect(typeof row?.amount).toBe("bigint")
    expect(row?.amount).toBe(big)
    expect(row?.createdAt).toBeInstanceOf(Date)
    expect(row?.deletedAt).toBeNull()
  })
})
