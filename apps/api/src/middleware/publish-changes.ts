import { createMiddleware } from "hono/factory"
import type { AppEnv } from "../lib/app-env"
import type { BookEvents } from "../lib/book-events"

const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"])

/**
 * Setelah tulis berhasil di `/books/:bookId/...`, terbitkan event invalidate ke anggota lain (TSD §8.1).
 * Handler baru selesai setelah transaksi commit, jadi event selalu terbit setelah data tersimpan.
 */
export const publishChanges = (events: BookEvents) =>
  createMiddleware<AppEnv>(async (c, next) => {
    await next()
    if (!WRITE.has(c.req.method) || c.res.status >= 400) return
    const ctx = c.get("ctx")
    if (!ctx) return
    // /api/v1/books/:bookId/<resource>/... → resource; tulis ke buku itu sendiri → "book".
    const rest = c.req.path.split(`/books/${ctx.bookId}`)[1] ?? ""
    const resource = rest.split("/").filter(Boolean)[0] ?? "book"
    events.publish(ctx.bookId, { type: "invalidate", keys: [resource], actorId: ctx.userId })
  })
