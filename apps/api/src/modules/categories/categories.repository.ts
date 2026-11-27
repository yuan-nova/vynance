import { categories, type Executor, transactions } from "@vynance/db"
import type { BudgetGroup, Category, CategoryKind, CategoryListQuery } from "@vynance/shared"
import { and, asc, eq, inArray, isNotNull, isNull, max } from "drizzle-orm"

type Row = typeof categories.$inferSelect

// Setiap query difilter bookId dan deleted_at IS NULL (CODING-GUIDELINES §6.4).
export class CategoriesRepository {
  constructor(private readonly db: Executor) {}

  async list(bookId: string, q: CategoryListQuery = {}): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.bookId, bookId),
          isNull(categories.deletedAt),
          q.kind ? eq(categories.kind, q.kind) : undefined,
          q.archived === "only"
            ? isNotNull(categories.archivedAt)
            : q.archived === "include"
              ? undefined
              : isNull(categories.archivedAt),
        ),
      )
      .orderBy(asc(categories.kind), asc(categories.sortOrder), asc(categories.id))
    return rows.map(toCategory)
  }

  /** Termasuk yang diarsipkan (untuk ubah/pulihkan). Tidak termasuk yang dihapus. */
  async findById(bookId: string, id: string): Promise<Category | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.bookId, bookId), eq(categories.id, id), isNull(categories.deletedAt)))
      .limit(1)
    return row ? toCategory(row) : null
  }

  /** Termasuk yang dihapus lunak, untuk Urungkan. */
  async findAny(bookId: string, id: string): Promise<(Category & { deleted: boolean }) | null> {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.bookId, bookId), eq(categories.id, id)))
      .limit(1)
    return row ? { ...toCategory(row), deleted: row.deletedAt !== null } : null
  }

  async nextSortOrder(bookId: string, kind: CategoryKind): Promise<number> {
    const [row] = await this.db
      .select({ m: max(categories.sortOrder) })
      .from(categories)
      .where(and(eq(categories.bookId, bookId), eq(categories.kind, kind), isNull(categories.deletedAt)))
    return (row?.m ?? -1) + 1
  }

  async isUsed(bookId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.bookId, bookId), eq(transactions.categoryId, id), isNull(transactions.deletedAt)))
      .limit(1)
    return Boolean(row)
  }

  async insert(v: {
    id: string
    bookId: string
    name: string
    kind: CategoryKind
    budgetGroup: BudgetGroup | null
    icon: string
    monthlyBudget: bigint | null
    sortOrder: number
    createdBy: string
  }): Promise<void> {
    await this.db.insert(categories).values(v)
  }

  async update(
    bookId: string,
    id: string,
    patch: Partial<{
      name: string
      budgetGroup: BudgetGroup | null
      icon: string
      monthlyBudget: bigint | null
      sortOrder: number
      archivedAt: Date | null
      deletedAt: Date | null
    }>,
  ): Promise<void> {
    await this.db
      .update(categories)
      .set(patch)
      .where(and(eq(categories.bookId, bookId), eq(categories.id, id)))
  }

  /** ID kategori aktif satu jenis di buku ini, untuk memvalidasi urutan baru. */
  async activeIds(bookId: string, kind: CategoryKind): Promise<string[]> {
    const rows = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.bookId, bookId),
          eq(categories.kind, kind),
          isNull(categories.deletedAt),
          isNull(categories.archivedAt),
        ),
      )
    return rows.map((r) => r.id)
  }

  /** Ada di buku ini dan aktif (untuk validasi FK lintas buku, TSD §6.3). */
  async existActive(bookId: string, ids: readonly string[]): Promise<Category[]> {
    if (ids.length === 0) return []
    const rows = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.bookId, bookId),
          inArray(categories.id, [...ids]),
          isNull(categories.deletedAt),
          isNull(categories.archivedAt),
        ),
      )
    return rows.map(toCategory)
  }
}

function toCategory(r: Row): Category {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    budgetGroup: r.budgetGroup,
    icon: r.icon,
    monthlyBudget: r.monthlyBudget === null ? null : r.monthlyBudget.toString(),
    sortOrder: r.sortOrder,
    archivedAt: r.archivedAt?.toISOString() ?? null,
  }
}
