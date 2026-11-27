import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import type { HealthService } from "./health.service"

export const healthRoutes = (svc: HealthService) =>
  new Hono<AppEnv>().get("/", async (c) => ok(c, await svc.check(new Date())))
