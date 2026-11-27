import Anthropic from "@anthropic-ai/sdk"
import type { AskLlm } from "@vynance/shared"

const MODEL = "claude-opus-5-5"
// ±300 kata; batas keras di atasnya supaya jawaban tidak terpotong di tengah kalimat.
const MAX_TOKENS = 2000

/**
 * Penyedia LLM untuk AI advisor (ADR 0005): Claude lewat SDK resmi, di-stream.
 * Effort rendah untuk tanya jawab; fallback sisi server bila permintaan ditolak (refusal).
 */
export function createClaudeAsk(apiKey: string | undefined): AskLlm | null {
  if (!apiKey) return null
  const client = new Anthropic({ apiKey })
  return async function* ask(system, user) {
    const s = client.beta.messages.stream({
      model: MODEL,
      // biome-ignore lint/style/useNamingConvention: nama parameter API Anthropic.
      max_tokens: MAX_TOKENS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // biome-ignore lint/style/useNamingConvention: nama parameter API Anthropic.
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: user }],
    })
    for await (const event of s) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text
    }
    const final = await s.finalMessage()
    if (final.stop_reason === "refusal") yield "\n\nMaaf, pertanyaan ini belum bisa dijawab."
    if (final.stop_reason === "max_tokens") yield "…"
  }
}
