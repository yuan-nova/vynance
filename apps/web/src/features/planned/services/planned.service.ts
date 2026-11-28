import { moneyToJson, type PlannedList, plannedListSchema, type RealizePlannedInput } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const r = api.books[":bookId"].planned

export async function fetchPlanned(bookId: string, month: string): Promise<PlannedList> {
  const res = await r.$get({ param: { bookId }, query: { month } })
  await ensureOk(res)
  return plannedListSchema.parse((await res.json()).data)
}

export async function realizePlanned(bookId: string, input: RealizePlannedInput): Promise<PlannedList> {
  const res = await r.realize.$post({ param: { bookId }, json: { ...input, amount: moneyToJson(input.amount) } })
  await ensureOk(res)
  return plannedListSchema.parse((await res.json()).data)
}
