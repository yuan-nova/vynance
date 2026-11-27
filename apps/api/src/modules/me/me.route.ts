import { zValidator } from "@hono/zod-validator"
import { dateOnlyOf, deleteAccountSchema, exportQuerySchema, updateMeSchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { AccountService } from "./account.service"
import type { MeService } from "./me.service"

export const meRoutes = (svc: MeService, account: AccountService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.get({ userId: c.var.userId })))
    .patch("/", zValidator("json", updateMeSchema, validationHook), async (c) =>
      ok(c, await svc.update({ userId: c.var.userId }, c.req.valid("json"))),
    )
    // UU PDP (NFR-08): unduh semua data. Berkas, bukan amplop { data }.
    .get("/export", zValidator("query", exportQuerySchema, validationHook), async (c) => {
      const ctx = { userId: c.var.userId }
      const { format } = c.req.valid("query")
      const name = `vynance-ekspor-${dateOnlyOf(new Date())}.${format}`
      const body = format === "csv" ? await account.exportCsv(ctx) : await account.exportJson(ctx)
      return c.body(body, 200, {
        "content-type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${name}"`,
        "cache-control": "no-store",
      })
    })
    .get("/deletion-preview", async (c) => ok(c, await account.deletionPreview({ userId: c.var.userId })))
    .delete("/", zValidator("json", deleteAccountSchema, validationHook), async (c) => {
      await account.deleteAccount({ userId: c.var.userId }, c.req.valid("json"))
      return noContent(c)
    })
