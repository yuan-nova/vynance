import { zValidator } from "@hono/zod-validator"
import {
  categoryKindSchema,
  createTransactionSchema,
  idempotencyKeySchema,
  idSchema,
  scanCommitSchema,
  transactionListQuerySchema,
  transactionSummaryQuerySchema,
  updateTransactionSchema,
} from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok, page } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { TransactionsService } from "./transactions.service"

const idParam = z.object({ id: idSchema })
const idemHeader = z.object({ "idempotency-key": idempotencyKeySchema.optional() })

/** `/books/:bookId/transactions` (FR-20). Daftar, ubah, hapus di #12–#13. */
export const transactionRoutes = (svc: TransactionsService) =>
  new Hono<AppEnv>()
    .get("/", zValidator("query", transactionListQuerySchema, validationHook), async (c) =>
      page(c, await svc.list(c.var.ctx, c.req.valid("query"))),
    )
    .get("/summary", zValidator("query", transactionSummaryQuerySchema, validationHook), async (c) => {
      const q = c.req.valid("query")
      return ok(c, await svc.summary(c.var.ctx, q.from, q.to))
    })
    .post(
      "/",
      zValidator("header", idemHeader, validationHook),
      zValidator("json", createTransactionSchema, validationHook),
      async (c) =>
        created(c, await svc.create(c.var.ctx, c.req.valid("json"), c.req.valid("header")["idempotency-key"])),
    )
    .post(
      "/scan",
      zValidator("header", idemHeader, validationHook),
      zValidator("json", scanCommitSchema, validationHook),
      async (c) =>
        created(
          c,
          await svc.createFromScan(c.var.ctx, c.req.valid("json").items, c.req.valid("header")["idempotency-key"]),
        ),
    )
    .get("/category-usage", zValidator("query", z.object({ kind: categoryKindSchema }), validationHook), async (c) =>
      ok(c, await svc.categoryUsage(c.var.ctx, c.req.valid("query").kind)),
    )
    // Rute /:id setelah rute statis supaya "summary" dan "category-usage" tidak tertangkap sebagai ID.
    .get("/:id", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.get(c.var.ctx, c.req.valid("param").id)),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateTransactionSchema, validationHook),
      async (c) => ok(c, await svc.update(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
    .post("/:id/restore", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.restore(c.var.ctx, c.req.valid("param").id)),
    )
