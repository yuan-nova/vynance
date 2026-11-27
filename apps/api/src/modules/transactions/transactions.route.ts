import { zValidator } from "@hono/zod-validator"
import { categoryKindSchema, createTransactionSchema, idempotencyKeySchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { TransactionsService } from "./transactions.service"

const idemHeader = z.object({ "idempotency-key": idempotencyKeySchema.optional() })

/** `/books/:bookId/transactions` (FR-20). Daftar, ubah, hapus di #12–#13. */
export const transactionRoutes = (svc: TransactionsService) =>
  new Hono<AppEnv>()
    .post(
      "/",
      zValidator("header", idemHeader, validationHook),
      zValidator("json", createTransactionSchema, validationHook),
      async (c) =>
        created(c, await svc.create(c.var.ctx, c.req.valid("json"), c.req.valid("header")["idempotency-key"])),
    )
    .get("/category-usage", zValidator("query", z.object({ kind: categoryKindSchema }), validationHook), async (c) =>
      ok(c, await svc.categoryUsage(c.var.ctx, c.req.valid("query").kind)),
    )
