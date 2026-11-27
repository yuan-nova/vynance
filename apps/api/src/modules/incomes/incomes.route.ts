import { zValidator } from "@hono/zod-validator"
import {
  createIncomeSourceSchema,
  idSchema,
  updateIncomeSourceSchema,
  updatePassiveTargetSchema,
} from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { IncomesService } from "./incomes.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/income-sources` (FR-130, PB-10). `/target` didaftarkan sebelum `/:id`. */
export const incomeRoutes = (svc: IncomesService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/", zValidator("json", createIncomeSourceSchema, validationHook), async (c) =>
      created(c, await svc.create(c.var.ctx, c.req.valid("json"))),
    )
    .patch("/target", zValidator("json", updatePassiveTargetSchema, validationHook), async (c) =>
      ok(c, await svc.setTarget(c.var.ctx, c.req.valid("json"))),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateIncomeSourceSchema, validationHook),
      async (c) => ok(c, await svc.update(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
