import { zValidator } from "@hono/zod-validator"
import { advisorQuestionSchema } from "@vynance/shared"
import { Hono } from "hono"
import { stream } from "hono/streaming"
import { z } from "zod"
import type { AppEnv } from "../../lib/app-env"
import { logger } from "../../lib/logger"
import { ok } from "../../lib/respond"
import { validationHook } from "../../lib/validation"
import type { AdvisorService } from "./advisor.service"

/** `/books/:bookId/advisor` (FR-100, PB-11). Jawaban berupa text/plain yang di-stream. */
export const advisorRoutes = (svc: AdvisorService) =>
  new Hono<AppEnv>()
    .get("/consent", async (c) => ok(c, await svc.consent(c.var.ctx)))
    .put("/consent", zValidator("json", z.object({ consent: z.boolean() }).strict(), validationHook), async (c) =>
      ok(c, await svc.setConsent(c.var.ctx, c.req.valid("json").consent)),
    )
    .get("/context", async (c) => ok(c, { text: await svc.context(c.var.ctx) }))
    .post("/ask", zValidator("json", advisorQuestionSchema, validationHook), async (c) => {
      // Error persetujuan/konfigurasi dilempar sebelum stream dibuka → amplop error biasa.
      const chunks = await svc.ask(c.var.ctx, c.req.valid("json").question)
      c.header("content-type", "text/plain; charset=utf-8")
      c.header("cache-control", "no-store")
      return stream(c, async (s) => {
        try {
          for await (const t of chunks) await s.write(t)
        } catch (e) {
          logger.error("advisor gagal", { err: e instanceof Error ? e.name : "unknown" })
          await s.write("\n\n[Jawaban terputus. Coba lagi sebentar lagi.]")
        }
      })
    })
