import { zValidator } from "@hono/zod-validator"
import { createWalletSchema, idSchema, updateWalletSchema } from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { WalletsService } from "./wallets.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/wallets` (FR-10). Dipasang di bawah auth → bookAccess. */
export const walletRoutes = (svc: WalletsService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.list(c.var.ctx)))
    .post("/", zValidator("json", createWalletSchema, validationHook), async (c) =>
      created(c, await svc.create(c.var.ctx, c.req.valid("json"))),
    )
    .get("/:id", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.get(c.var.ctx, c.req.valid("param").id)),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateWalletSchema, validationHook),
      async (c) => ok(c, await svc.update(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .post("/:id/archive", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.setArchived(c.var.ctx, c.req.valid("param").id, true)),
    )
    .post("/:id/unarchive", zValidator("param", idParam, validationHook), async (c) =>
      ok(c, await svc.setArchived(c.var.ctx, c.req.valid("param").id, false)),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.remove(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
