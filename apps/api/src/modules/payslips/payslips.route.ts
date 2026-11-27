import { zValidator } from "@hono/zod-validator"
import { idSchema, savePayslipSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { PayslipsService } from "./payslips.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/payslips` (FR-140, PB-10). Menerima JSON angka, bukan file PDF (ADR 0007). */
export const payslipRoutes = (svc: PayslipsService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/", zValidator("json", savePayslipSchema, validationHook), async (c) =>
      created(c, await svc.save(c.var.ctx, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
