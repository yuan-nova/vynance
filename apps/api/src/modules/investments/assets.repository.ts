import { assets, type Executor, investmentTypes, transactions } from "@vynance/db"
import { and, asc, eq, isNull, sum } from "drizzle-orm"

type AssetRow = {
  id: string
  investmentTypeId: string
  typeName: string
  name: string
  units: string
  costBasis: bigint
  currentValue: bigint
  valueUpdatedAt: Date | null
}

const cols = {
  id: assets.id,
  investmentTypeId: assets.investmentTypeId,
  typeName: investmentTypes.name,
  name: assets.name,
  units: assets.units,
  costBasis: assets.costBasis,
  currentValue: assets.currentValue,
  valueUpdatedAt: assets.valueUpdatedAt,
}

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class AssetsRepository {
  constructor(private readonly db: Executor) {}

  list(bookId: string): Promise<AssetRow[]> {
    return this.db
      .select(cols)
      .from(assets)
      .innerJoin(
        investmentTypes,
        and(eq(investmentTypes.id, assets.investmentTypeId), eq(investmentTypes.bookId, bookId)),
      )
      .where(and(eq(assets.bookId, bookId), isNull(assets.deletedAt)))
      .orderBy(asc(investmentTypes.sortOrder), asc(assets.createdAt), asc(assets.id))
  }

  async findById(bookId: string, id: string): Promise<AssetRow | null> {
    const [row] = await this.db
      .select(cols)
      .from(assets)
      .innerJoin(
        investmentTypes,
        and(eq(investmentTypes.id, assets.investmentTypeId), eq(investmentTypes.bookId, bookId)),
      )
      .where(and(eq(assets.bookId, bookId), eq(assets.id, id), isNull(assets.deletedAt)))
      .limit(1)
    return row ?? null
  }

  async insert(v: {
    id: string
    bookId: string
    investmentTypeId: string
    name: string
    units: string
    costBasis: bigint
    currentValue: bigint
    valueUpdatedAt: Date
    createdBy: string
  }): Promise<void> {
    await this.db.insert(assets).values(v)
  }

  async update(
    bookId: string,
    id: string,
    v: Partial<{
      investmentTypeId: string
      name: string
      units: string
      costBasis: bigint
      currentValue: bigint
      valueUpdatedAt: Date
    }>,
  ): Promise<void> {
    if (Object.keys(v).length === 0) return
    await this.db
      .update(assets)
      .set(v)
      .where(and(eq(assets.bookId, bookId), eq(assets.id, id), isNull(assets.deletedAt)))
  }

  async softDelete(bookId: string, id: string, at: Date): Promise<void> {
    await this.db
      .update(assets)
      .set({ deletedAt: at })
      .where(and(eq(assets.bookId, bookId), eq(assets.id, id)))
  }

  async hasTransactions(bookId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.bookId, bookId), eq(transactions.assetId, id), isNull(transactions.deletedAt)))
      .limit(1)
    return Boolean(row)
  }

  /** Σ nilai kini semua aset (kekayaan bersih BR-04). */
  async totalValue(bookId: string): Promise<bigint> {
    const [row] = await this.db
      .select({ total: sum(assets.currentValue) })
      .from(assets)
      .where(and(eq(assets.bookId, bookId), isNull(assets.deletedAt)))
    return BigInt(row?.total ?? "0")
  }

  async countByType(bookId: string, typeId: string): Promise<number> {
    const rows = await this.db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.bookId, bookId), eq(assets.investmentTypeId, typeId), isNull(assets.deletedAt)))
    return rows.length
  }
}
