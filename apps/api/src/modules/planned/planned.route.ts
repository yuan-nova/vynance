import { zValidator } from "@hono/zod-validator"
import { plannedQuerySchema, realizePlannedSchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { PlannedService } from "./planned.service"

/** `/books/:bookId/planned` (FR-160, PB-13). */
export const plannedRoutes = (svc: PlannedService) =>
  new Hono<AppEnv>()
    .get("/", zValidator("query", plannedQuerySchema, validationHook), async (c) =>
      ok(c, await svc.list(c.var.ctx, c.req.valid("query").month)),
    )
    .post("/realize", zValidator("json", realizePlannedSchema, validationHook), async (c) =>
      ok(c, await svc.realize(c.var.ctx, c.req.valid("json"))),
    )
