import { zValidator } from "@hono/zod-validator"
import { createChildSchema, idSchema, updateChildSchema, updateEducationSettingsSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { EducationService } from "./education.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/children` (FR-120, PB-09). */
export const childRoutes = (svc: EducationService) =>
  new Hono<AppEnv>()
    .post("/", zValidator("json", createChildSchema, validationHook), async (c) =>
      created(c, await svc.createChild(c.var.ctx, c.req.valid("json"))),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateChildSchema, validationHook),
      async (c) => ok(c, await svc.updateChild(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.removeChild(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })

/** `/books/:bookId/education-plan` (FR-120, BR-43). */
export const educationPlanRoutes = (svc: EducationService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.plan(c.var.ctx)))
    .patch("/", zValidator("json", updateEducationSettingsSchema, validationHook), async (c) =>
      ok(c, await svc.updateSettings(c.var.ctx, c.req.valid("json"))),
    )
