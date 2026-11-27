import { zValidator } from "@hono/zod-validator"
import { createSubscriptionSchema, idSchema, updateSubscriptionSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { SubscriptionsService } from "./subscriptions.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/subscriptions` (FR-80, PB-05). */
export const subscriptionRoutes = (svc: SubscriptionsService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .get("/rates", async (c) => ok(c, await svc.rates()))
    .post("/", zValidator("json", createSubscriptionSchema, validationHook), async (c) =>
      created(c, await svc.create(c.var.ctx, c.req.valid("json"))),
    )
    .get("/:id", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.get(c.var.ctx, c.req.valid("param").id)),
    )
    .put(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateSubscriptionSchema, validationHook),
      async (c) => ok(c, await svc.update(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
