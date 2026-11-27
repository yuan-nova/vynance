import type { Book, CreateBookInput, ServiceCtx, UpdateBookInput, UserCtx } from "@vynance/shared"
import type { UnitOfWork } from "../../db/unit-of-work"
import { AppError, NotFound } from "../../lib/errors"
import { logger } from "../../lib/logger"
import type { ActivityRepository } from "../activity/activity.repository"
import type { BooksRepository } from "./books.repository"

type Repos = { books: BooksRepository; activity: ActivityRepository }
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
  async create(
    ctx: UserCtx,
    input: CreateBookInput,
    seed?: (repos: Repos, bookId: string) => Promise<void>,
  ): Promise<Book> {
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
        if (seed) await seed(r, bookId)
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
