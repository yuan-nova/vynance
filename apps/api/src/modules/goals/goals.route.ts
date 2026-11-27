import { zValidator } from "@hono/zod-validator"
import { createContributionSchema, createGoalSchema, idSchema, updateGoalSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { GoalsService } from "./goals.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/goals` (FR-60, PB-07). */
export const goalRoutes = (svc: GoalsService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/", zValidator("json", createGoalSchema, validationHook), async (c) =>
      created(c, await svc.create(c.var.ctx, c.req.valid("json"))),
    )
    .get("/:id", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.get(c.var.ctx, c.req.valid("param").id)),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateGoalSchema, validationHook),
      async (c) => ok(c, await svc.update(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
    .post(
      "/:id/contributions",
      zValidator("param", idParam, validationHook),
      zValidator("json", createContributionSchema, validationHook),
      async (c) => created(c, await svc.contribute(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
