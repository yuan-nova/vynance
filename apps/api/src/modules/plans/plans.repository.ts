import { assets, type Executor, monthlyPlans, planAllocations, planIncomes, transactions, users } from "@vynance/db"
import type { PlanAllocationInput, PlanMethod } from "@vynance/shared"
import { and, asc, eq, gte, isNull, lte, sum } from "drizzle-orm"

type PlanRow = {
  id: string
  month: string
  version: number
  spendingCap: bigint | null
  defaultWalletId: string | null
  method: PlanMethod
  updatedAt: Date
  updatedByName: string | null
  incomes: { name: string; amount: bigint }[]
  allocations: {
    kind: "expense" | "investment"
    categoryId: string | null
    investmentTypeId: string | null
    mode: "amount" | "percent"
    amount: bigint
    percentBp: number
    carriedOver: bigint
  }[]
}

// Setiap query difilter bookId (CODING-GUIDELINES §6.4).
export class PlansRepository {
  constructor(private readonly db: Executor) {}

  async findByMonth(bookId: string, month: string): Promise<PlanRow | null> {
    const [p] = await this.db
      .select({
        id: monthlyPlans.id,
        month: monthlyPlans.month,
        version: monthlyPlans.version,
        spendingCap: monthlyPlans.spendingCap,
        defaultWalletId: monthlyPlans.defaultWalletId,
        method: monthlyPlans.method,
        updatedAt: monthlyPlans.updatedAt,
        updatedByName: users.name,
      })
      .from(monthlyPlans)
      .leftJoin(users, eq(users.id, monthlyPlans.updatedBy))
      .where(and(eq(monthlyPlans.bookId, bookId), eq(monthlyPlans.month, month), isNull(monthlyPlans.deletedAt)))
      .limit(1)
    if (!p) return null
    const incomes = await this.db
      .select({ name: planIncomes.name, amount: planIncomes.amount })
      .from(planIncomes)
      .where(and(eq(planIncomes.bookId, bookId), eq(planIncomes.planId, p.id), isNull(planIncomes.deletedAt)))
      .orderBy(asc(planIncomes.sortOrder))
    const allocations = await this.db
      .select({
        kind: planAllocations.kind,
        categoryId: planAllocations.categoryId,
        investmentTypeId: planAllocations.investmentTypeId,
        mode: planAllocations.mode,
        amount: planAllocations.amount,
        percentBp: planAllocations.percentBp,
        carriedOver: planAllocations.carriedOver,
      })
      .from(planAllocations)
      .where(
        and(eq(planAllocations.bookId, bookId), eq(planAllocations.planId, p.id), isNull(planAllocations.deletedAt)),
      )
      .orderBy(asc(planAllocations.id))
    return { ...p, incomes, allocations }
  }

  async insertPlan(v: {
    id: string
    bookId: string
    month: string
    spendingCap: bigint | null
    defaultWalletId: string | null
    method: PlanMethod
    createdBy: string
  }): Promise<"ok" | "conflict"> {
    try {
      await this.db.insert(monthlyPlans).values({ ...v, version: 1, updatedBy: v.createdBy })
      return "ok"
    } catch (e: unknown) {
      const cause = e instanceof Error && "cause" in e ? e.cause : e
      if (cause instanceof Error && "errno" in cause && cause.errno === 1062) return "conflict"
      throw e
    }
  }

  /** Optimistic concurrency: berhasil hanya bila versi di DB = `expectedVersion`. */
  async updatePlan(
    bookId: string,
    planId: string,
    expectedVersion: number,
    v: { spendingCap: bigint | null; defaultWalletId: string | null; method: PlanMethod; updatedBy: string },
  ): Promise<boolean> {
    const [res] = await this.db
      .update(monthlyPlans)
      .set({ ...v, version: expectedVersion + 1 })
      .where(
        and(eq(monthlyPlans.bookId, bookId), eq(monthlyPlans.id, planId), eq(monthlyPlans.version, expectedVersion)),
      )
    return res.affectedRows === 1
  }

  /** Ganti seluruh penghasilan dan alokasi rencana (dokumen utuh). */
  async replaceChildren(
    bookId: string,
    planId: string,
    userId: string,
    incomes: { id: string; name: string; amount: bigint }[],
    allocations: (PlanAllocationInput & { id: string; carriedOver: bigint })[],
  ): Promise<void> {
    await this.db.delete(planIncomes).where(and(eq(planIncomes.bookId, bookId), eq(planIncomes.planId, planId)))
    await this.db
      .delete(planAllocations)
      .where(and(eq(planAllocations.bookId, bookId), eq(planAllocations.planId, planId)))
    if (incomes.length) {
      await this.db.insert(planIncomes).values(
        incomes.map((i, sortOrder) => ({
          id: i.id,
          bookId,
          planId,
          name: i.name,
          amount: i.amount,
          sortOrder,
          createdBy: userId,
        })),
      )
    }
    if (allocations.length) {
      await this.db.insert(planAllocations).values(
        allocations.map((a) => ({
          id: a.id,
          bookId,
          planId,
          kind: a.kind,
          categoryId: a.kind === "expense" ? a.categoryId : null,
          investmentTypeId: a.kind === "investment" ? a.investmentTypeId : null,
          mode: a.mode,
          amount: a.amount,
          percentBp: a.percentBp,
          carriedOver: a.carriedOver,
          createdBy: userId,
        })),
      )
    }
  }

  /** Realisasi alokasi investasi: Σ beli aset per jenis investasi dalam rentang (BR-14 sisa investasi). */
  async investmentRealization(bookId: string, from: string, to: string): Promise<Map<string, bigint>> {
    const rows = await this.db
      .select({ typeId: assets.investmentTypeId, total: sum(transactions.amount) })
      .from(transactions)
      .innerJoin(assets, and(eq(assets.id, transactions.assetId), eq(assets.bookId, bookId)))
      .where(
        and(
          eq(transactions.bookId, bookId),
          eq(transactions.type, "asset_buy"),
          isNull(transactions.deletedAt),
          gte(transactions.txDate, from),
          lte(transactions.txDate, to),
        ),
      )
      .groupBy(assets.investmentTypeId)
    return new Map(rows.map((r) => [r.typeId, BigInt(r.total ?? "0")]))
  }
}
