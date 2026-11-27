import { zValidator } from "@hono/zod-validator"
import { updateBookSettingsSchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { NotificationsService } from "./notifications.service"

/** `/books/:bookId/{notifications,settings}` (PB-12 langkah 6). Notifikasi milik pengguna yang masuk. */
export const notificationRoutes = (svc: NotificationsService) =>
  new Hono<AppEnv>()
    .get("/notifications", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/notifications/read-all", async (c) => {
      await svc.readAll(c.var.ctx)
      return noContent(c)
    })
    .get("/settings", async (c) => ok(c, await svc.settings(c.var.ctx)))
    .patch("/settings", zValidator("json", updateBookSettingsSchema, validationHook), async (c) =>
      ok(c, await svc.updateSettings(c.var.ctx, c.req.valid("json"))),
    )
