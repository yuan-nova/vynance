import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import type { AppEnv } from "../../lib/app-env"
import type { BookEvents } from "../../lib/book-events"

const PING_MS = 8_000

/**
 * `GET /books/:bookId/events` (SSE, NFR-03). Sudah lewat bookAccess.
 * Ping < 10 detik supaya koneksi tidak diputus idle timeout server/proxy.
 */
export const eventRoutes = (events: BookEvents) =>
  new Hono<AppEnv>().get("/", (c) => {
    const { bookId, userId } = c.var.ctx
    return streamSSE(c, async (stream) => {
      const unsubscribe = events.subscribe(bookId, (e) => {
        // Penulis sudah meng-invalidate cache sendiri; cukup kirim ke anggota/perangkat lain juga
        // (perangkat lain milik penulis tetap perlu tahu, jadi actorId dikirim dan klien yang memutuskan).
        void stream.writeSSE({ event: e.type, data: JSON.stringify({ keys: e.keys, actorId: e.actorId }) })
      })
      stream.onAbort(unsubscribe)
      await stream.writeSSE({ event: "ready", data: JSON.stringify({ userId }) })
      while (!stream.aborted && !stream.closed) {
        await stream.sleep(PING_MS)
        if (!stream.aborted) await stream.writeSSE({ event: "ping", data: "" })
      }
      unsubscribe()
    })
  })
