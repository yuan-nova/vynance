import { Hono } from "hono"
import type { HealthService } from "./health.service"

export const healthRoutes = (svc: HealthService) =>
  new Hono().get("/", async (c) => c.json({ data: await svc.check(new Date()) }))
