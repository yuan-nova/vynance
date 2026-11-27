import type { LlmTracer } from "@vynance/shared"
import { newId } from "./id"
import { logger } from "./logger"

type Options = {
  publicKey: string | undefined
  secretKey: string | undefined
  baseUrl: string
  /** false = isi prompt dan jawaban (data keuangan pengguna) tidak dikirim, hanya metrik. */
  captureContent: boolean
  fetchFn?: typeof fetch
}

const HIDDEN = "[tidak direkam]"

/**
 * Pencatat observabilitas LLM ke Langfuse lewat Ingestion API (TSD §12).
 * Fire-and-forget: kegagalan Langfuse hanya dicatat di log, tidak pernah menggagalkan jawaban.
 */
export function createLangfuse(o: Options): LlmTracer | null {
  if (!o.publicKey || !o.secretKey) return null
  const auth = `Basic ${btoa(`${o.publicKey}:${o.secretKey}`)}`
  const send = o.fetchFn ?? fetch
  const url = `${o.baseUrl.replace(/\/$/, "")}/api/public/ingestion`
  return {
    generation(g) {
      const traceId = newId()
      const timestamp = g.endTime.toISOString()
      const input = o.captureContent ? g.input : HIDDEN
      const output = o.captureContent ? g.output : HIDDEN
      const batch = [
        { id: newId(), type: "trace-create", timestamp, body: { id: traceId, name: g.name, input, output } },
        {
          id: newId(),
          type: "generation-create",
          timestamp,
          body: {
            id: newId(),
            traceId,
            name: g.name,
            model: g.model,
            startTime: g.startTime.toISOString(),
            endTime: timestamp,
            input,
            output,
            level: g.level,
            statusMessage: g.statusMessage,
            usageDetails: g.usage && { input: g.usage.input, output: g.usage.output },
            costDetails: g.usage?.totalCost === undefined ? undefined : { total: g.usage.totalCost },
          },
        },
      ]
      send(url, {
        method: "POST",
        headers: { authorization: auth, "content-type": "application/json" },
        body: JSON.stringify({ batch }),
      })
        .then((r) => {
          if (!r.ok) logger.warn("langfuse menolak", { status: r.status })
        })
        .catch((e: unknown) => logger.warn("langfuse tidak terjangkau", { error: String(e) }))
    },
  }
}
