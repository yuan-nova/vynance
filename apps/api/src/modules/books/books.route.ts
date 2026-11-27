import { zValidator } from "@hono/zod-validator"
import { createBookSchema, updateBookSchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { created, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { BooksService } from "./books.service"

/** `/books`: daftar dan buat buku milik pengguna (tanpa bookAccess). */
export const booksRoutes = (svc: BooksService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list({ userId: c.var.userId })))
    .post("/", zValidator("json", createBookSchema, validationHook), async (c) =>
      created(c, await svc.create({ userId: c.var.userId }, c.req.valid("json"))),
    )

/** `/books/:bookId`: dipasang di bawah bookAccess. */
export const bookRoutes = (svc: BooksService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.get(c.var.ctx)))
    .patch("/", zValidator("json", updateBookSchema, validationHook), async (c) =>
      ok(c, await svc.rename(c.var.ctx, c.req.valid("json"))),
    )
