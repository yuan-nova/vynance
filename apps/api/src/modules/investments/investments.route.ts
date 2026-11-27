import { zValidator } from "@hono/zod-validator"
import {
  createAssetSchema,
  createInvestmentTypeSchema,
  idSchema,
  updateAssetSchema,
  updateInvestmentTypeSchema,
} from "@vynance/shared"
import { Hono } from "hono"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { created, noContent, ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { InvestmentsService } from "./investments.service"

const idParam = z.object({ id: idSchema })

/** `/books/:bookId/investment-types` (PB-06 langkah 1). */
export const investmentTypeRoutes = (svc: InvestmentsService) =>
  new Hono<AppEnv>()
    .get("/", async (c) => ok(c, await svc.listTypes(c.var.ctx)))
    .post("/", zValidator("json", createInvestmentTypeSchema, validationHook), async (c) =>
      created(c, await svc.createType(c.var.ctx, c.req.valid("json"))),
    )
    .put(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateInvestmentTypeSchema, validationHook),
      async (c) => ok(c, await svc.updateType(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.removeType(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })

/** `/books/:bookId/investments` (portofolio) dan `/books/:bookId/assets` (PB-06). */
export const portfolioRoutes = (svc: InvestmentsService) =>
  new Hono<AppEnv>().get("/", async (c) => ok(c, await svc.portfolio(c.var.ctx)))

export const assetRoutes = (svc: InvestmentsService) =>
  new Hono<AppEnv>()
    .post("/", zValidator("json", createAssetSchema, validationHook), async (c) =>
      created(c, await svc.createAsset(c.var.ctx, c.req.valid("json"))),
    )
    .patch(
      "/:id",
      zValidator("param", idParam, validationHook),
      zValidator("json", updateAssetSchema, validationHook),
      async (c) => ok(c, await svc.updateAsset(c.var.ctx, c.req.valid("param").id, c.req.valid("json"))),
    )
    .delete("/:id", zValidator("param", idParam, validationHook), async (c) => {
      await svc.removeAsset(c.var.ctx, c.req.valid("param").id)
      return noContent(c)
    })
