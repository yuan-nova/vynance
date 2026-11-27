import {
  type Category,
  type CategoryKind,
  type CreateCategoryInput,
  categorySchema,
  moneyToJson,
  type UpdateCategoryInput,
} from "@vynance/shared"
import { z } from "zod"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const c = api.books[":bookId"].categories
const money = (v: bigint | null | undefined) => (v === undefined ? undefined : v === null ? null : moneyToJson(v))

export async function fetchCategories(bookId: string, kind?: CategoryKind): Promise<Category[]> {
  const res = await c.$get({ param: { bookId }, query: kind ? { kind } : {} })
  await ensureOk(res)
  return z.array(categorySchema).parse((await res.json()).data)
}

export async function createCategory(bookId: string, input: CreateCategoryInput): Promise<Category> {
  const res = await c.$post({ param: { bookId }, json: { ...input, monthlyBudget: money(input.monthlyBudget) } })
  await ensureOk(res)
  return categorySchema.parse((await res.json()).data)
}

export async function updateCategory(bookId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
  const res = await c[":id"].$patch({
    param: { bookId, id },
    json: { ...input, monthlyBudget: money(input.monthlyBudget) },
  })
  await ensureOk(res)
  return categorySchema.parse((await res.json()).data)
}

export async function deleteCategory(bookId: string, id: string): Promise<"archived" | "deleted"> {
  const res = await c[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
  return z.object({ result: z.enum(["archived", "deleted"]) }).parse((await res.json()).data).result
}

export async function restoreCategory(bookId: string, id: string): Promise<void> {
  const res = await c[":id"].restore.$post({ param: { bookId, id } })
  await ensureOk(res)
}

export async function reorderCategories(bookId: string, kind: CategoryKind, ids: string[]): Promise<void> {
  const res = await c.order.$put({ param: { bookId }, json: { kind, ids } })
  await ensureOk(res)
}
