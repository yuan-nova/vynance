import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import type { InvestmentsService } from "./investments.service"

/** `/books/:bookId/investment-types`. */
export const investmentTypeRoutes = (svc: InvestmentsService) =>
  new Hono<AppEnv>().get("/", async (c) => ok(c, await svc.listTypes(c.var.ctx)))
