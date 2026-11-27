import { type ApiError, errorMessage } from "@vynance/shared"
import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { AppError } from "../lib/errors"
import { logger } from "../lib/logger"

/** `app.onError`: semua error menjadi `{ error: { code, message, field? } }`, tanpa stack trace. */
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    const body: ApiError = {
      error: { code: err.code, message: err.message, ...(err.field ? { field: err.field } : {}) },
    }
    return c.json(body, err.status)
  }
  if (err instanceof HTTPException && err.status < 500) {
    const code = err.status === 401 ? "UNAUTHORIZED" : err.status === 404 ? "NOT_FOUND" : "VALIDATION"
    const status = err.status === 401 || err.status === 404 ? err.status : 422
    return c.json({ error: { code, message: errorMessage(code) } } satisfies ApiError, status)
  }
  logger.error("unhandled", { path: c.req.path, method: c.req.method, err: err.name, detail: safeDetail(err.message) })
  return c.json({ error: { code: "INTERNAL", message: errorMessage("INTERNAL") } } satisfies ApiError, 500)
}

export function notFoundHandler(c: Context): Response {
  return c.json({ error: { code: "NOT_FOUND", message: errorMessage("NOT_FOUND") } } satisfies ApiError, 404)
}

// Pesan error Drizzle memuat parameter query (bisa berisi nominal/email). Potong sebelum dicatat.
function safeDetail(message: string): string {
  return message.split("params:")[0]?.slice(0, 300) ?? ""
}
