import type { AskLlm, LlmTracer } from "@vynance/shared"
import { logger } from "./logger"

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
// ±300 kata; batas keras di atasnya supaya jawaban tidak terpotong di tengah kalimat.
const MAX_TOKENS = 2000
const REFUSED = "\n\nMaaf, pertanyaan ini belum bisa dijawab."

// Bentuk respons OpenRouter (snake_case dari API).
type Usage = {
  // biome-ignore lint/style/useNamingConvention: nama field API OpenRouter.
  prompt_tokens?: number
  // biome-ignore lint/style/useNamingConvention: nama field API OpenRouter.
  completion_tokens?: number
  cost?: number
}
type Choice = {
  delta?: { content?: string | null }
  // biome-ignore lint/style/useNamingConvention: nama field API OpenRouter.
  finish_reason?: string | null
}
type Chunk = {
  choices?: Choice[]
  usage?: Usage
  error?: { message?: string }
}

/** Mengurai body SSE OpenRouter (format OpenAI) menjadi objek chunk. Baris komentar `:` dilewati. */
export async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<Chunk> {
  const decoder = new TextDecoder()
  let buf = ""
  for await (const part of body) {
    buf += decoder.decode(part, { stream: true })
    let nl = buf.indexOf("\n")
    while (nl >= 0) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      nl = buf.indexOf("\n")
      if (!line.startsWith("data:")) continue
      const data = line.slice(5).trim()
      if (data === "[DONE]") return
      yield JSON.parse(data) as Chunk
    }
  }
}

type Options = { apiKey: string | undefined; model: string; tracer: LlmTracer | null }

/**
 * Penyedia LLM untuk AI advisor (ADR 0006): OpenRouter, di-stream lewat fetch.
 * Tiap panggilan dicatat ke Langfuse bila tracer aktif.
 */
export function createOpenRouterAsk({ apiKey, model, tracer }: Options): AskLlm | null {
  if (!apiKey) return null
  return async function* ask(system, user) {
    const started = new Date()
    let output = ""
    let finish: string | null = null
    let usage: Usage | undefined
    let failed: string | undefined
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "x-title": "Vynance" },
        body: JSON.stringify({
          model,
          stream: true,
          // biome-ignore lint/style/useNamingConvention: nama parameter API OpenRouter.
          max_tokens: MAX_TOKENS,
          usage: { include: true },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      })
      if (!res.ok || !res.body) throw new Error(`openrouter ${res.status}`)
      for await (const chunk of parseSse(res.body)) {
        if (chunk.error) throw new Error(chunk.error.message ?? "openrouter stream error")
        if (chunk.usage) usage = chunk.usage
        const choice = chunk.choices?.[0]
        if (choice?.finish_reason) finish = choice.finish_reason
        const text = choice?.delta?.content
        if (text) {
          output += text
          yield text
        }
      }
      if (finish === "content_filter") yield REFUSED
      if (finish === "length") yield "…"
    } catch (e) {
      failed = e instanceof Error ? e.message : String(e)
      logger.error("llm gagal", { model, error: failed })
      throw e
    } finally {
      tracer?.generation({
        name: "advisor.ask",
        model,
        startTime: started,
        endTime: new Date(),
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        output,
        usage: usage && { input: usage.prompt_tokens, output: usage.completion_tokens, totalCost: usage.cost },
        level: failed ? "ERROR" : "DEFAULT",
        statusMessage: failed ?? finish ?? undefined,
      })
    }
  }
}
