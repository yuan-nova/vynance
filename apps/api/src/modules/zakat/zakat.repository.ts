import { bookSettings, type Executor, referenceRates } from "@vynance/db"
import { and, desc, eq } from "drizzle-orm"

/** Harga emas (reference_rates, tabel global) dan mulai haul per buku (book_settings). */
export class ZakatRepository {
  constructor(private readonly db: Executor) {}

  async latestGold(): Promise<{ value: string; fetchedAt: Date } | null> {
    const [row] = await this.db
      .select({ value: referenceRates.value, fetchedAt: referenceRates.fetchedAt })
      .from(referenceRates)
      .where(and(eq(referenceRates.kind, "gold_gram"), eq(referenceRates.currency, "IDR")))
      .orderBy(desc(referenceRates.fetchedAt))
      .limit(1)
    return row ?? null
  }

  async insertGold(v: { id: string; value: bigint; fetchedAt: Date }): Promise<void> {
    await this.db
      .insert(referenceRates)
      .values({ id: v.id, kind: "gold_gram", currency: "IDR", value: v.value.toString(), fetchedAt: v.fetchedAt })
  }

  async haulStart(bookId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ start: bookSettings.zakatHaulStart })
      .from(bookSettings)
      .where(eq(bookSettings.bookId, bookId))
      .limit(1)
    return row?.start ?? null
  }

  async setHaulStart(bookId: string, start: string | null): Promise<void> {
    await this.db.update(bookSettings).set({ zakatHaulStart: start }).where(eq(bookSettings.bookId, bookId))
  }
}
