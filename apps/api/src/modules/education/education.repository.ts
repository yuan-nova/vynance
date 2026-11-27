import { bookSettings, children, type Executor } from "@vynance/db"
import { and, asc, eq, isNull } from "drizzle-orm"

type ChildRow = { id: string; name: string; birthYear: number; educationSavings: bigint }

const cols = {
  id: children.id,
  name: children.name,
  birthYear: children.birthYear,
  educationSavings: children.educationSavings,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class EducationRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<ChildRow[]> {
    return this.db
      .select(cols)
      .from(children)
      .where(and(eq(children.bookId, bookId), isNull(children.deletedAt)))
      .orderBy(asc(children.birthYear), asc(children.id))
  }

  async findById(bookId: string, id: string): Promise<ChildRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(children)
      .where(and(eq(children.bookId, bookId), eq(children.id, id), isNull(children.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: {
    id: string
    bookId: string
    name: string
    birthYear: number
    educationSavings: bigint
    createdBy: string
  }): Promise<void> {
    await this.db.insert(children).values(v)
  }

  async update(
    bookId: string,
    id: string,
    v: Partial<{ name: string; birthYear: number; educationSavings: bigint }>,
  ): Promise<void> {
    const set = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined))
    if (Object.keys(set).length === 0) return
    await this.db
      .update(children)
      .set(set)
      .where(and(eq(children.bookId, bookId), eq(children.id, id), isNull(children.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(children)
      .set({ deletedAt: at })
      .where(and(eq(children.bookId, bookId), eq(children.id, id)))
  }

  async inflationBp(bookId: string): Promise<number | null> {
    const [row] = await this.db
      .select({ bp: bookSettings.educationInflationBp })
      .from(bookSettings)
      .where(eq(bookSettings.bookId, bookId))
      .limit(1)
    return row?.bp ?? null
  }

  async setInflationBp(bookId: string, bp: number): Promise<void> {
    await this.db.update(bookSettings).set({ educationInflationBp: bp }).where(eq(bookSettings.bookId, bookId))
  }
}
