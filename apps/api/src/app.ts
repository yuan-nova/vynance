import { Hono } from "hono"
import { healthRoutes } from "./modules/health/health.route"
import type { HealthService } from "./modules/health/health.service"

// Route wajib dirangkai supaya AppType terbaca Hono RPC (CODING-GUIDELINES §6.2).
export const createApp = (deps: { healthService: HealthService }) =>
  new Hono().basePath("/api/v1").route("/health", healthRoutes(deps.healthService))

export type AppType = ReturnType<typeof createApp>
