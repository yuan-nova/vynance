import { zValidator } from "@hono/zod-validator"
import { activityQuerySchema, idSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { MembersService } from "./members.service"

/** `/books/:bookId/{members,leave,activities}` (di bawah bookAccess). */
export const memberRoutes = (svc: MembersService) =>
  new Hono<AppEnv>()
    .get("/members", async (c) => ok(c, await svc.list(c.var.ctx)))
    .delete("/members/:userId", zValidator("param", z.object({ userId: idSchema }), validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").userId)
      return noContent(c)
    })
    .post("/leave", async (c) => {
      await svc.leave(c.var.ctx)
      return noContent(c)
    })
    .get("/activities", zValidator("query", activityQuerySchema, validationHook), async (c) =>
      ok(c, await svc.activities(c.var.ctx, c.req.valid("query").limit)),
    )
