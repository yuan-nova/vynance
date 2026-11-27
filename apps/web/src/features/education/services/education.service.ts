import {
  type CreateChildInput,
  type EducationPlan,
  educationPlanSchema,
  moneyToJson,
  type UpdateChildInput,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const b = api.books[":bookId"]

export async function fetchEducationPlan(bookId: string): Promise<EducationPlan> {
  const res = await b["education-plan"].$get({ param: { bookId } })
  await ensureOk(res)
  return educationPlanSchema.parse((await res.json()).data)
}

export async function updateInflation(bookId: string, inflationBp: number): Promise<EducationPlan> {
  const res = await b["education-plan"].$patch({ param: { bookId }, json: { inflationBp } })
  await ensureOk(res)
  return educationPlanSchema.parse((await res.json()).data)
}

export async function createChild(bookId: string, input: CreateChildInput): Promise<EducationPlan> {
  const res = await b.children.$post({ param: { bookId }, json: { ...input, savings: moneyToJson(input.savings) } })
  await ensureOk(res)
  return educationPlanSchema.parse((await res.json()).data)
}

export async function updateChild(bookId: string, id: string, input: UpdateChildInput): Promise<EducationPlan> {
  const res = await b.children[":id"].$patch({
    param: { bookId, id },
    json: { ...input, savings: input.savings === undefined ? undefined : moneyToJson(input.savings) },
  })
  await ensureOk(res)
  return educationPlanSchema.parse((await res.json()).data)
}

export async function deleteChild(bookId: string, id: string): Promise<void> {
  const res = await b.children[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}
