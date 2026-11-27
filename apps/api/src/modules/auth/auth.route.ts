import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { ok } from "../../lib/respond"
import type { AuthService } from "./auth.service"

/** `/auth/*` diteruskan ke Better Auth (login Google, OTP, logout). */
export const authRoutes = (svc: AuthService) =>
  new Hono<AppEnv>()
    .get("/providers", (c) => ok(c, svc.providers()))
    .on(["GET", "POST"], "/*", (c) => svc.handler(c.req.raw))
