import { zValidator } from "@hono/zod-validator"
import { idSchema, invitationTokenSchema } from "@vynance/shared"
import { Hono, type MiddlewareHandler } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { InvitationsService } from "./invitations.service"

/** `/books/:bookId/invitations` (di bawah bookAccess). */
export const bookInvitationRoutes = (svc: InvitationsService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/", async (c) => created(c, await svc.create(c.var.ctx)))
    .delete("/:id", zValidator("param", z.object({ id: idSchema }), validationHook), async (c) => {
      await svc.revoke(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })

/** `/invitations/:token`: pratinjau publik (sebelum login) dan terima (wajib login). */
export const invitationRoutes = (svc: InvitationsService, authed: MiddlewareHandler<AppEnv>) =>
  new Hono<AppEnv>()
    .get("/:token", zValidator("param", invitationTokenSchema, validationHook), async (c) =>
      ok(c, await svc.preview(c.req.valid("param").token)),
    )
    .post("/:token/accept", authed, zValidator("param", invitationTokenSchema, validationHook), async (c) =>
      ok(c, await svc.accept({ userId: c.var.userId }, c.req.valid("param").token)),
    )
