import { bookSettings, type Executor, incomeSources } from "@vynance/db"
import { and, asc, eq, isNull } from "drizzle-orm"

type SourceRow = {
  id: string
  name: string
  kind: "active" | "passive"
  monthlyAmount: bigint
  isRecurring: boolean
}

const cols = {
  id: incomeSources.id,
  name: incomeSources.name,
  kind: incomeSources.kind,
  monthlyAmount: incomeSources.monthlyAmount,
  isRecurring: incomeSources.isRecurring,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class IncomesRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<SourceRow[]> {
    return this.db
      .select(cols)
      .from(incomeSources)
      .where(and(eq(incomeSources.bookId, bookId), isNull(incomeSources.deletedAt)))
      .orderBy(asc(incomeSources.kind), asc(incomeSources.createdAt), asc(incomeSources.id))
  }

  async findById(bookId: string, id: string): Promise<SourceRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(incomeSources)
      .where(and(eq(incomeSources.bookId, bookId), eq(incomeSources.id, id), isNull(incomeSources.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: {
    id: string
    bookId: string
    name: string
    kind: "active" | "passive"
    monthlyAmount: bigint
    isRecurring: boolean
    createdBy: string
  }): Promise<void> {
    await this.db.insert(incomeSources).values(v)
  }

  async update(
    bookId: string,
    id: string,
    v: Partial<{ name: string; kind: "active" | "passive"; monthlyAmount: bigint; isRecurring: boolean }>,
  ): Promise<void> {
    const set = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined))
    if (Object.keys(set).length === 0) return
    await this.db
      .update(incomeSources)
      .set(set)
      .where(and(eq(incomeSources.bookId, bookId), eq(incomeSources.id, id), isNull(incomeSources.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(incomeSources)
      .set({ deletedAt: at })
      .where(and(eq(incomeSources.bookId, bookId), eq(incomeSources.id, id)))
  }

  async targetBp(bookId: string): Promise<number | null> {
    const [row] = await this.db
      .select({ bp: bookSettings.passiveIncomeTargetBp })
      .from(bookSettings)
      .where(eq(bookSettings.bookId, bookId))
      .limit(1)
    return row?.bp ?? null
  }

  async setTargetBp(bookId: string, bp: number): Promise<void> {
    await this.db.update(bookSettings).set({ passiveIncomeTargetBp: bp }).where(eq(bookSettings.bookId, bookId))
  }
}
