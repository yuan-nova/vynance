import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import * as schema from "./schema"

export function createDb(url: string) {
  const pool = mysql.createPool({
    uri: url,
    connectionLimit: 10,
    timezone: "Z",
    supportBigNumbers: true,
    bigNumberStrings: true,
  })
  return drizzle(pool, { schema, mode: "default" })
}

export type Db = ReturnType<typeof createDb>
