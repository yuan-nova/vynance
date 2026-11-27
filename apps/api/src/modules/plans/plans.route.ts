import { zValidator } from "@hono/zod-validator"
import { monthSchema, putPlanSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { PlansService } from "./plans.service"

const monthParam = z.object({ month: monthSchema })

/** `/books/:bookId/plans/:month` (FR-40, PB-04). */
export const planRoutes = (svc: PlansService) =>
  new Hono<AppEnv>()
    .get("/:month", zValidator("param", monthParam, validationHook), async (c) =>
      ok(c, await svc.get(c.var.ctx, c.req.valid("param").month)),
    )
    .put(
      "/:month",
      zValidator("param", monthParam, validationHook),
      zValidator("json", putPlanSchema, validationHook),
      async (c) => ok(c, await svc.put(c.var.ctx, c.req.valid("param").month, c.req.valid("json"))),
    )
