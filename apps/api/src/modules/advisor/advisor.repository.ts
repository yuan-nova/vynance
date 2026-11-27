import { type Executor, users } from "@vynance/db"
import { eq } from "drizzle-orm"

/** Persetujuan AI per pengguna (PB-11). Tabel users difilter userId. */
export class AdvisorRepository {
  constructor(private readonly db: Executor) {}

  async consentAt(userId: string): Promise<Date | null> {
    const [row] = await this.db.select({ at: users.aiConsentAt }).from(users).where(eq(users.id, userId)).limit(1)
    return row?.at ?? null
  }

  async setConsent(userId: string, at: Date | null): Promise<void> {
    await this.db.update(users).set({ aiConsentAt: at }).where(eq(users.id, userId))
  }
}
