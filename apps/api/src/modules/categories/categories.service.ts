import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  ReorderCategoriesInput,
  ServiceCtx,
  UpdateCategoryInput,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { BusinessError, NotFound } from "../../lib/errors"
import type { ActivityRepository } from "../activity/activity.repository"
import type { CategoriesRepository } from "./categories.repository"

type Repos = { categories: CategoriesRepository; activity: ActivityRepository }
type Deps = {
  categories: Pick<CategoriesRepository, "list" | "findById">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  now: () => Date
}

export class CategoriesService {
  constructor(private readonly d: Deps) {}

  list(ctx: ServiceCtx, q: CategoryListQuery): Promise<Category[]> {
    return this.d.categories.list(ctx.bookId, q)
  }

  async create(ctx: ServiceCtx, input: CreateCategoryInput): Promise<Category> {
    const id = this.d.newId()
    await this.d.uow.withTransaction(async (r) => {
      await r.categories.insert({
        id,
        bookId: ctx.bookId,
        name: input.name,
        kind: input.kind,
        budgetGroup: input.kind === "expense" ? (input.budgetGroup ?? "needs") : null,
        icon: input.icon,
        monthlyBudget: input.monthlyBudget ?? null,
        sortOrder: await r.categories.nextSortOrder(ctx.bookId, input.kind),
        createdBy: ctx.userId,
      })
      await this.log(r, ctx, "category.created", id, input.name)
    })
    return this.mustGet(ctx, id)
  }

  /** BR-36: relasi lewat ID, jadi ganti nama tidak menyentuh transaksi/anggaran. */
  async update(ctx: ServiceCtx, id: string, input: UpdateCategoryInput): Promise<Category> {
    const current = await this.mustGet(ctx, id)
    if (current.kind === "income" && input.budgetGroup != null) {
      throw new BusinessError("CATEGORY_GROUP_EXPENSE_ONLY", "budgetGroup")
    }
    await this.d.uow.withTransaction(async (r) => {
      await r.categories.update(ctx.bookId, id, input)
      await this.log(r, ctx, "category.updated", id, input.name ?? current.name)
    })
    return this.mustGet(ctx, id)
  }

  /** Dipakai transaksi → diarsipkan; belum dipakai → dihapus lunak. Keduanya bisa diurungkan (DS-ACTION-03). */
  async remove(ctx: ServiceCtx, id: string): Promise<{ result: "archived" | "deleted" }> {
    const current = await this.mustGet(ctx, id)
    const now = this.d.now()
    return this.d.uow.withTransaction(async (r) => {
      const used = await r.categories.isUsed(ctx.bookId, id)
      await r.categories.update(ctx.bookId, id, used ? { archivedAt: now } : { deletedAt: now })
      await this.log(r, ctx, used ? "category.archived" : "category.deleted", id, current.name)
      return { result: used ? "archived" : "deleted" }
    })
  }

  /** Urungkan hapus/arsip: kembali aktif di urutan terakhir. */
  async restore(ctx: ServiceCtx, id: string): Promise<Category> {
    await this.d.uow.withTransaction(async (r) => {
      const c = await r.categories.findAny(ctx.bookId, id)
      if (!c) throw new NotFound("CATEGORY_NOT_FOUND")
      const sortOrder = await r.categories.nextSortOrder(ctx.bookId, c.kind)
      await r.categories.update(ctx.bookId, id, { archivedAt: null, deletedAt: null, sortOrder })
      await this.log(r, ctx, "category.restored", id, c.name)
    })
    return this.mustGet(ctx, id)
  }

  /** Urutan baru harus memuat tepat semua kategori aktif jenis itu. */
  async reorder(ctx: ServiceCtx, input: ReorderCategoriesInput): Promise<Category[]> {
    await this.d.uow.withTransaction(async (r) => {
      const active = await r.categories.activeIds(ctx.bookId, input.kind)
      const same = active.length === input.ids.length && new Set(input.ids).size === input.ids.length
      if (!same || !input.ids.every((x) => active.includes(x)))
        throw new BusinessError("CATEGORY_ORDER_MISMATCH", "ids")
      for (const [i, cid] of input.ids.entries()) await r.categories.update(ctx.bookId, cid, { sortOrder: i })
    })
    return this.d.categories.list(ctx.bookId, { kind: input.kind })
  }

  private async mustGet(ctx: ServiceCtx, id: string): Promise<Category> {
    const c = await this.d.categories.findById(ctx.bookId, id)
    if (!c) throw new NotFound("CATEGORY_NOT_FOUND")
    return c
  }

  private log(r: Repos, ctx: ServiceCtx, action: string, id: string, name: string): Promise<void> {
    return r.activity.record({
      id: this.d.newId(),
      bookId: ctx.bookId,
      actorId: ctx.userId,
      action,
      entityType: "category",
      entityId: id,
      summary: { name },
    })
  }
}
