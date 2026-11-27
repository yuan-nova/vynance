import { createMiddleware } from "hono/factory"
import type { AppEnv } from "../lib/app-env"
import { NotFound } from "../lib/errors"
import type { BooksService } from "../modules/books/books.service"

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/

/** Keanggotaan buku di URL (TSD §5.2). Bukan anggota / buku terhapus → 404. Memasang `ctx = { userId, bookId }`. */
export const bookAccess = (svc: BooksService) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const bookId = c.req.param("bookId")
    if (!bookId || !ULID.test(bookId)) throw new NotFound("BOOK_NOT_FOUND")
    await svc.assertMember(c.var.userId, bookId)
    c.set("ctx", { userId: c.var.userId, bookId })
    await next()
  })
