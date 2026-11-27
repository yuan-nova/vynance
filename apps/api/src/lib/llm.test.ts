import { describe, expect, test } from "bun:test"
import { createLangfuse } from "./langfuse"
import { parseSse } from "./llm"

function stream(parts: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const p of parts) c.enqueue(enc.encode(p))
      c.close()
    },
  })
}

describe("parseSse", () => {
  test("menggabung baris terpotong, melewati komentar, berhenti di [DONE]", async () => {
    const body = stream([
      ": OPENROUTER PROCESSING\n\n",
      'data: {"choices":[{"delta":{"content":"Ha"}}]}\n\ndata: {"choi',
      'ces":[{"delta":{"content":"lo"},"finish_reason":"stop"}]}\n\n',
      'data: {"choices":[],"usage":{"prompt_tokens":3}}\n\ndata: [DONE]\n\n',
      'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
    ])
    const out = []
    for await (const c of parseSse(body)) out.push(c)
    expect(out.map((c) => c.choices?.[0]?.delta?.content ?? null)).toEqual(["Ha", "lo", null])
    expect(out[2]?.usage?.prompt_tokens).toBe(3)
  })
})

describe("createLangfuse", () => {
  test("mati tanpa kunci", () => {
    expect(createLangfuse({ publicKey: undefined, secretKey: "s", baseUrl: "x", captureContent: false })).toBeNull()
  })

  test("tanpa captureContent, isi prompt tidak dikirim", async () => {
    const calls: string[] = []
    const fetchFn = (async (_u: string, init: RequestInit) => {
      calls.push(String(init.body))
      return new Response("{}", { status: 207 })
    }) as unknown as typeof fetch
    const t = createLangfuse({
      publicKey: "pk",
      secretKey: "sk",
      baseUrl: "https://lf/",
      captureContent: false,
      fetchFn,
    })
    t?.generation({
      name: "advisor.ask",
      model: "m",
      startTime: new Date(),
      endTime: new Date(),
      input: "aset bersih 123",
      output: "jawaban rahasia",
      level: "DEFAULT",
    })
    await Bun.sleep(0)
    expect(calls).toHaveLength(1)
    expect(calls[0]).not.toContain("123")
    expect(calls[0]).not.toContain("rahasia")
    expect(calls[0]).toContain("generation-create")
  })
})
