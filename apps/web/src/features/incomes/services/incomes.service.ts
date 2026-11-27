import {
  type CreateIncomeSourceInput,
  type IncomeList,
  incomeListSchema,
  moneyToJson,
  type UpdateIncomeSourceInput,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const r = api.books[":bookId"]["income-sources"]

export async function fetchIncomes(bookId: string): Promise<IncomeList> {
  const res = await r.$get({ param: { bookId } })
  await ensureOk(res)
  return incomeListSchema.parse((await res.json()).data)
}

export async function createIncome(bookId: string, input: CreateIncomeSourceInput): Promise<IncomeList> {
  const res = await r.$post({
    param: { bookId },
    json: { ...input, monthlyAmount: moneyToJson(input.monthlyAmount) },
  })
  await ensureOk(res)
  return incomeListSchema.parse((await res.json()).data)
}

export async function updateIncome(bookId: string, id: string, input: UpdateIncomeSourceInput): Promise<IncomeList> {
  const res = await r[":id"].$patch({
    param: { bookId, id },
    json: {
      ...input,
      monthlyAmount: input.monthlyAmount === undefined ? undefined : moneyToJson(input.monthlyAmount),
    },
  })
  await ensureOk(res)
  return incomeListSchema.parse((await res.json()).data)
}

export async function deleteIncome(bookId: string, id: string): Promise<void> {
  const res = await r[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}

export async function updatePassiveTarget(bookId: string, targetBp: number): Promise<IncomeList> {
  const res = await r.target.$patch({ param: { bookId }, json: { targetBp } })
  await ensureOk(res)
  return incomeListSchema.parse((await res.json()).data)
}
