import { zValidator } from "@hono/zod-validator"
import { openingBalancesSchema } from "@vynance/shared"
import { Hono } from "hono"
import type { AppEnv } from "../../lib/app-env"
import { noContent } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { OnboardingService } from "./onboarding.service"

/** `/books/:bookId/onboarding` (FR-02). */
export const onboardingRoutes = (svc: OnboardingService) =>
  new Hono<AppEnv>().post("/opening-balances", zValidator("json", openingBalancesSchema, validationHook), async (c) => {
    await svc.setOpeningBalances(c.var.ctx, c.req.valid("json"))
    return noContent(c)
  })
