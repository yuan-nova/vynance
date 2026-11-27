import { zValidator } from "@hono/zod-validator"
import { idempotencyKeySchema, zakatHaulSchema, zakatPaymentSchema, zakatQuerySchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { ZakatService } from "./zakat.service"

const idemHeader = z.object({ "idempotency-key": idempotencyKeySchema.optional() })

/** `/books/:bookId/zakat` (FR-110, TSD §8). */
export const zakatRoutes = (svc: ZakatService) =>
  new Hono<AppEnv>()
    .get("/", zValidator("query", zakatQuerySchema, validationHook), async (c) => {
      const g = c.req.valid("query").goldPrice
      return ok(c, await svc.summary(c.var.ctx, g ? BigInt(g) : undefined))
    })
    .post(
      "/payments",
      zValidator("header", idemHeader, validationHook),
      zValidator("json", zakatPaymentSchema, validationHook),
      async (c) => created(c, await svc.pay(c.var.ctx, c.req.valid("json"), c.req.valid("header")["idempotency-key"])),
    )
    .put("/haul", zValidator("json", zakatHaulSchema, validationHook), async (c) => {
      await svc.setHaulStart(c.var.ctx, c.req.valid("json").haulStart)
      return noContent(c)
    })
