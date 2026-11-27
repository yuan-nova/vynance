import { createMiddleware } from "hono/factory"
import type { AppEnv } from "../lib/app-env"
import { Unauthorized } from "../lib/errors"
import type { AuthService } from "../modules/auth/auth.service"

/** Wajib login: memasang `userId` di konteks, atau 401 (TSD §5.1). */
export const requireAuth = (svc: AuthService) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const userId = await svc.userIdFrom(c.req.raw.headers)
    if (!userId) throw new Unauthorized()
    c.set("userId", userId)
    await next()
  })
