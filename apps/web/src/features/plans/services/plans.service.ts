import {
  type InvestmentType,
  investmentTypeSchema,
  moneyToJson,
  type Plan,
  type PutPlanInput,
  planSchema,
} from "@vynance/shared"
import { z } from "zod"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

export async function fetchPlan(bookId: string, month: string): Promise<Plan> {
  const res = await api.books[":bookId"].plans[":month"].$get({ param: { bookId, month } })
  await ensureOk(res)
  return planSchema.parse((await res.json()).data)
}

export async function savePlan(bookId: string, month: string, input: PutPlanInput): Promise<Plan> {
  const res = await api.books[":bookId"].plans[":month"].$put({
    param: { bookId, month },
    json: {
      ...input,
      spendingCap: input.spendingCap === null ? null : moneyToJson(input.spendingCap),
      incomes: input.incomes.map((i) => ({ name: i.name, amount: moneyToJson(i.amount) })),
      allocations: input.allocations.map((a) => ({ ...a, amount: moneyToJson(a.amount) })),
    },
  })
  await ensureOk(res)
  return planSchema.parse((await res.json()).data)
}

export async function fetchInvestmentTypes(bookId: string): Promise<InvestmentType[]> {
  const res = await api.books[":bookId"]["investment-types"].$get({ param: { bookId } })
  await ensureOk(res)
  return z.array(investmentTypeSchema).parse((await res.json()).data)
}
