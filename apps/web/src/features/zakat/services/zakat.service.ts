import { moneyToJson, type ZakatPaymentInput, type ZakatSummary, zakatSummarySchema } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const z = api.books[":bookId"].zakat

export async function fetchZakat(bookId: string, goldPrice: bigint | null): Promise<ZakatSummary> {
  const res = await z.$get({ param: { bookId }, query: goldPrice ? { goldPrice: goldPrice.toString() } : {} })
  await ensureOk(res)
  return zakatSummarySchema.parse((await res.json()).data)
}

export async function payZakat(bookId: string, input: ZakatPaymentInput, idempotencyKey: string): Promise<void> {
  const res = await z.payments.$post({
    param: { bookId },
    header: { "idempotency-key": idempotencyKey },
    json: { ...input, amount: moneyToJson(input.amount) },
  })
  await ensureOk(res)
}

export async function saveHaulStart(bookId: string, haulStart: string | null): Promise<void> {
  const res = await z.haul.$put({ param: { bookId }, json: { haulStart } })
  await ensureOk(res)
}
