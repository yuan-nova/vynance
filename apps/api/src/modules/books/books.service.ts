import {
  type Book,
  type CreateBookInput,
  DEFAULT_BOOK_NAME,
  SEED_EXPENSE_CATEGORIES,
  SEED_INCOME_CATEGORIES,
  SEED_INVESTMENT_TYPES,
  SEED_WALLETS,
  type ServiceCtx,
  type UpdateBookInput,
  type UserCtx,
} from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { AppError, NotFound } from "../../lib/errors"
import { logger } from "../../lib/logger"
import type { ActivityRepository } from "../activity/activity.repository"
import type { CategoriesRepository } from "../categories/categories.repository"
import type { InvestmentTypesRepository } from "../investments/investment-types.repository"
import type { WalletsRepository } from "../wallets/wallets.repository"
import type { BooksRepository } from "./books.repository"

type Repos = {
  books: BooksRepository
  activity: ActivityRepository
  wallets: WalletsRepository
  categories: CategoriesRepository
  investmentTypes: InvestmentTypesRepository
}
type Deps = {
  books: Pick<BooksRepository, "listForUser" | "findForMember" | "isActiveMember">
  uow: Pick<UnitOfWork<Repos>, "withTransaction">
  newId: () => string
  newCode: () => string
}

const MAX_CODE_ATTEMPTS = 5

export class BooksService {
  constructor(private readonly d: Deps) {}

  list(ctx: UserCtx): Promise<Book[]> {
    return this.d.books.listForUser(ctx.userId)
  }

  async get(ctx: ServiceCtx): Promise<Book> {
    const book = await this.d.books.findForMember(ctx.bookId, ctx.userId)
    if (!book) throw new NotFound("BOOK_NOT_FOUND")
    return book
  }

  /** Untuk middleware bookAccess: bukan anggota atau buku terhapus → 404 (TSD §5.2). */
  async assertMember(userId: string, bookId: string): Promise<void> {
    if (!(await this.d.books.isActiveMember(bookId, userId))) throw new NotFound("BOOK_NOT_FOUND")
  }

  /** BR-46/BR-48: buat buku + anggota pembuat + pengaturan + aktivitas dalam satu transaksi; ulangi bila kode bentrok. */
  /** Buku pertama saat daftar (PB-01). */
  createDefault(ctx: UserCtx): Promise<Book> {
    return this.create(ctx, { name: DEFAULT_BOOK_NAME })
  }

  async create(ctx: UserCtx, input: CreateBookInput): Promise<Book> {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
      const bookId = this.d.newId()
      const code = this.d.newCode()
      const created = await this.d.uow.withTransaction(async (r) => {
        if (
          (await r.books.insert({ id: bookId, code, name: input.name, createdBy: ctx.userId })) === "duplicate_code"
        ) {
          return false
        }
        await r.books.addMember({ id: this.d.newId(), bookId, userId: ctx.userId, createdBy: ctx.userId })
        await r.books.insertSettings(bookId, ctx.userId)
        await this.seed(r, bookId, ctx.userId)
        await r.activity.record({
          id: this.d.newId(),
          bookId,
          actorId: ctx.userId,
          action: "book.created",
          entityType: "book",
          entityId: bookId,
          summary: { name: input.name },
        })
        return true
      })
      if (created) return this.get({ userId: ctx.userId, bookId })
    }
    logger.error("kode buku bentrok terus", { attempts: MAX_CODE_ATTEMPTS })
    throw new AppError(500, "BOOK_CODE_EXHAUSTED")
  }

  /** BR-46: data bawaan dari shared/defaults, dalam transaksi yang sama dengan pembuatan buku. */
  private async seed(r: Repos, bookId: string, userId: string): Promise<void> {
    for (const w of SEED_WALLETS) {
      await r.wallets.insert({
        id: this.d.newId(),
        bookId,
        name: w.name,
        type: w.type,
        icon: w.icon,
        openingBalance: 0n,
        creditLimit: w.creditLimit,
        createdBy: userId,
      })
    }
    const cats = [
      ...SEED_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, kind: "expense" as const, sortOrder: i })),
      ...SEED_INCOME_CATEGORIES.map((c, i) => ({ ...c, kind: "income" as const, sortOrder: i })),
    ]
    for (const c of cats) {
      await r.categories.insert({
        id: this.d.newId(),
        bookId,
        name: c.name,
        kind: c.kind,
        budgetGroup: c.budgetGroup,
        icon: c.icon,
        monthlyBudget: null,
        sortOrder: c.sortOrder,
        createdBy: userId,
      })
    }
    await r.investmentTypes.insertMany(
      SEED_INVESTMENT_TYPES.map((t, i) => ({
        id: this.d.newId(),
        bookId,
        name: t.name,
        icon: t.icon,
        sortOrder: i,
        createdBy: userId,
      })),
    )
  }

  async rename(ctx: ServiceCtx, input: UpdateBookInput): Promise<Book> {
    await this.d.uow.withTransaction(async (r) => {
      await r.books.rename(ctx.bookId, input.name)
      await r.activity.record({
        id: this.d.newId(),
        bookId: ctx.bookId,
        actorId: ctx.userId,
        action: "book.renamed",
        entityType: "book",
        entityId: ctx.bookId,
        summary: { name: input.name },
      })
    })
    return this.get(ctx)
  }
}
