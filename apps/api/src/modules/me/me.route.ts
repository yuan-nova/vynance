import { zValidator } from "@hono/zod-validator"
import { updateMeSchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { MeService } from "./me.service"

export const meRoutes = (svc: MeService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.get({ userId: c.var.userId })))
    .patch("/", zValidator("json", updateMeSchema, validationHook), async (c) =>
      ok(c, await svc.update({ userId: c.var.userId }, c.req.valid("json"))),
    )
