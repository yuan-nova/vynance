import { zValidator } from "@hono/zod-validator"
import { createBookSchema, deleteBookSchema, idSchema, updateBookSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { BooksService } from "./books.service"

/** `/books`: daftar dan buat buku milik pengguna (tanpa bookAccess). */
export const booksRoutes = (svc: BooksService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list({ userId: c.var.userId })))
    .post("/", zValidator("json", createBookSchema, validationHook), async (c) =>
      created(c, await svc.create({ userId: c.var.userId }, c.req.valid("json"))),
    )
    // Buku terhapus sudah 404 di bookAccess, jadi daftar dan pulihkan ada di sini (TSD §5.5).
    .get("/deleted", async (c) => ok(c, await svc.listDeleted({ userId: c.var.userId })))
    .post("/:bookId/restore", zValidator("param", z.object({ bookId: idSchema }), validationHook), async (c) =>
      ok(c, await svc.restore({ userId: c.var.userId }, c.req.valid("param").bookId)),
    )

/** `/books/:bookId`: dipasang di bawah bookAccess. */
export const bookRoutes = (svc: BooksService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.get(c.var.ctx)))
    .patch("/", zValidator("json", updateBookSchema, validationHook), async (c) =>
      ok(c, await svc.rename(c.var.ctx, c.req.valid("json"))),
    )
    .get("/deletion-info", async (c) => ok(c, await svc.deletionInfo(c.var.ctx)))
    .delete("/", zValidator("json", deleteBookSchema, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("json"))
      return noContent(c)
    })
