import { type HealthScoreResponse, healthScoreSchema } from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

export async function fetchHealthScore(bookId: string, month: string): Promise<HealthScoreResponse> {
  const res = await api.books[":bookId"]["health-score"].$get({ param: { bookId }, query: { month } })
  await ensureOk(res)
  return healthScoreSchema.parse((await res.json()).data)
}
