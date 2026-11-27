import type { Db } from "@vynance/db"
import { sql } from "drizzle-orm"

export class HealthRepository {
  constructor(private readonly db: Db) {}

  async ping(): Promise<boolean> {
    try {
      await this.db.execute(sql`select 1`)
      return true
    } catch {
      return false
    }
  }
}
