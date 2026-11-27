import { type Executor, goalContributions, savingsGoals } from "@vynance/db"
import { and, asc, eq, gte, isNull, sql, sum } from "drizzle-orm"

type GoalRow = {
  id: string
  name: string
  icon: string
  targetAmount: bigint
  initialAmount: bigint
  targetDate: string | null
  note: string | null
  createdAt: Date
}

const cols = {
  id: savingsGoals.id,
  name: savingsGoals.name,
  icon: savingsGoals.icon,
  targetAmount: savingsGoals.targetAmount,
  initialAmount: savingsGoals.initialAmount,
  targetDate: savingsGoals.targetDate,
  note: savingsGoals.note,
  createdAt: savingsGoals.createdAt,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class GoalsRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<GoalRow[]> {
    return this.db
      .select(cols)
      .from(savingsGoals)
      .where(and(eq(savingsGoals.bookId, bookId), isNull(savingsGoals.deletedAt)))
      .orderBy(asc(savingsGoals.createdAt), asc(savingsGoals.id))
  }

  async findById(bookId: string, id: string): Promise<GoalRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(savingsGoals)
      .where(and(eq(savingsGoals.bookId, bookId), eq(savingsGoals.id, id), isNull(savingsGoals.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: {
    id: string
    bookId: string
    name: string
    icon: string
    targetAmount: bigint
    initialAmount: bigint
    targetDate: string | null
    note: string | null
    createdBy: string
  }): Promise<void> {
    await this.db.insert(savingsGoals).values(v)
  }

  async update(
    bookId: string,
    id: string,
    v: Partial<{
      name: string
      icon: string
      targetAmount: bigint
      initialAmount: bigint
      targetDate: string | null
      note: string | null
    }>,
  ): Promise<void> {
    if (Object.keys(v).length === 0) return
    await this.db
      .update(savingsGoals)
      .set(v)
      .where(and(eq(savingsGoals.bookId, bookId), eq(savingsGoals.id, id), isNull(savingsGoals.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(savingsGoals)
      .set({ deletedAt: at })
      .where(and(eq(savingsGoals.bookId, bookId), eq(savingsGoals.id, id)))
  }

  /** Σ setoran per target (semua waktu). */
  async contributionTotals(bookId: string, goalId?: string): Promise<Map<string, bigint>> {
    const base = and(eq(goalContributions.bookId, bookId), isNull(goalContributions.deletedAt))
    const rows = await this.db
      .select({ goalId: goalContributions.goalId, total: sum(goalContributions.amount) })
      .from(goalContributions)
      .where(goalId ? and(base, eq(goalContributions.goalId, goalId)) : base)
      .groupBy(goalContributions.goalId)
    return new Map(rows.map((r) => [r.goalId, BigInt(r.total ?? "0")]))
  }

  /** Σ setoran per target per bulan sejak `from` (YYYY-MM-DD), untuk laju BR-21. */
  async monthlyContributions(
    bookId: string,
    from: string,
    goalId?: string,
  ): Promise<{ goalId: string; month: string; amount: bigint }[]> {
    const month = sql<string>`date_format(${goalContributions.contributedOn}, '%Y-%m')`
    const base = and(
      eq(goalContributions.bookId, bookId),
      isNull(goalContributions.deletedAt),
      gte(goalContributions.contributedOn, from),
    )
    const rows = await this.db
      .select({ goalId: goalContributions.goalId, month, total: sum(goalContributions.amount) })
      .from(goalContributions)
      .where(goalId ? and(base, eq(goalContributions.goalId, goalId)) : base)
      .groupBy(goalContributions.goalId, month)
    return rows.map((r) => ({ goalId: r.goalId, month: r.month, amount: BigInt(r.total ?? "0") }))
  }

  async insertContribution(v: {
    id: string
    bookId: string
    goalId: string
    amount: bigint
    contributedOn: string
    createdBy: string
  }): Promise<void> {
    await this.db.insert(goalContributions).values(v)
  }
}
