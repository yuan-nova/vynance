import { Hono } from "hono"
import type { AppEnv } from "./lib/app-env"
import { requireAuth } from "./middleware/auth"
import { errorHandler, notFoundHandler } from "./middleware/error-handler"
import { authRoutes } from "./modules/auth/auth.route"
import type { AuthService } from "./modules/auth/auth.service"
import { healthRoutes } from "./modules/health/health.route"
import type { HealthService } from "./modules/health/health.service"
import { meRoutes } from "./modules/me/me.route"
import type { MeService } from "./modules/me/me.service"

type Deps = { healthService: HealthService; authService: AuthService; meService: MeService }

// Route wajib dirangkai supaya AppType terbaca Hono RPC (CODING-GUIDELINES §6.2).
export const createApp = (deps: Deps) => {
  const authed = requireAuth(deps.authService)
  return new Hono<AppEnv>()
    .basePath("/api/v1")
    .onError(errorHandler)
    .notFound(notFoundHandler)
    .route("/health", healthRoutes(deps.healthService))
    .route("/auth", authRoutes(deps.authService))
    .route("/me", new Hono<AppEnv>().use(authed).route("/", meRoutes(deps.meService)))
}

export type AppType = ReturnType<typeof createApp>
