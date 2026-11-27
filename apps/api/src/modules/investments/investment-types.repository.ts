import { type Executor, investmentTypes } from "@vynance/db"
import type { InvestmentType } from "@vynance/shared"
import { and, asc, eq, inArray, isNull } from "drizzle-orm"

// Jenis investasi (TSD §6.2). Daftar dan CRUD lengkap di #31; di sini insert untuk data bawaan.
export class InvestmentTypesRepository {
  constructor(private readonly db: Executor) {}

  async list(bookId: string): Promise<InvestmentType[]> {
    const rows = await this.db
      .select()
      .from(investmentTypes)
      .where(and(eq(investmentTypes.bookId, bookId), isNull(investmentTypes.deletedAt)))
      .orderBy(asc(investmentTypes.sortOrder), asc(investmentTypes.id))
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      targetValue: r.targetValue === null ? null : r.targetValue.toString(),
      sortOrder: r.sortOrder,
    }))
  }

  /** ID yang ada di buku ini (validasi FK lintas buku, TSD §6.3). */
  async existing(bookId: string, ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) return []
    const rows = await this.db
      .select({ id: investmentTypes.id })
      .from(investmentTypes)
      .where(
        and(
          eq(investmentTypes.bookId, bookId),
          inArray(investmentTypes.id, [...ids]),
          isNull(investmentTypes.deletedAt),
        ),
      )
    return rows.map((r) => r.id)
  }

  async insertMany(
    rows: { id: string; bookId: string; name: string; icon: string; sortOrder: number; createdBy: string }[],
  ): Promise<void> {
    if (rows.length) await this.db.insert(investmentTypes).values(rows)
  }
}
