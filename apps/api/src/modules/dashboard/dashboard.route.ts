import { zValidator } from "@hono/zod-validator"
import { dashboardQuerySchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { DashboardService } from "./dashboard.service"

/** `/books/:bookId/dashboard?month=YYYY-MM` (FR-50, FR-53). */
export const dashboardRoutes = (svc: DashboardService) =>
  new Hono<AppEnv>().get("/", zValidator("query", dashboardQuerySchema, validationHook), async (c) =>
    ok(c, await svc.get(c.var.ctx, c.req.valid("query").month)),
  )
