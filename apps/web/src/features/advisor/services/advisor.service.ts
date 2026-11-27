import { type AdvisorConsent, advisorConsentSchema } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const a = api.books[":bookId"].advisor

export async function fetchConsent(bookId: string): Promise<AdvisorConsent> {
  const res = await a.consent.$get({ param: { bookId } })
  await ensureOk(res)
  return advisorConsentSchema.parse((await res.json()).data)
}

export async function saveConsent(bookId: string, consent: boolean): Promise<AdvisorConsent> {
  const res = await a.consent.$put({ param: { bookId }, json: { consent } })
  await ensureOk(res)
  return advisorConsentSchema.parse((await res.json()).data)
}

export async function fetchContext(bookId: string): Promise<string> {
  const res = await a.context.$get({ param: { bookId } })
  await ensureOk(res)
  return (await res.json()).data.text
}

/** Tanya; potongan jawaban (teks biasa) diteruskan ke `onChunk` saat tiba. */
export async function askAdvisor(
  bookId: string,
  question: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/v1/books/${bookId}/advisor/ask`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  })
  await ensureOk(res)
  const reader = res.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}
