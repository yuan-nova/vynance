import { zValidator } from "@hono/zod-validator"
import { dashboardQuerySchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { HealthScoreService } from "./health-score.service"

/** `/books/:bookId/health-score?month=YYYY-MM` (FR-51). */
export const healthScoreRoutes = (svc: HealthScoreService) =>
  new Hono<AppEnv>().get("/", zValidator("query", dashboardQuerySchema, validationHook), async (c) =>
    ok(c, await svc.get(c.var.ctx, c.req.valid("query").month)),
  )
