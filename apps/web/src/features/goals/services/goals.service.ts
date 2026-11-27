import {
  type CreateContributionInput,
  type CreateGoalInput,
  type Goal,
  type GoalList,
  goalListSchema,
  goalSchema,
  moneyToJson,
  type UpdateGoalInput,
} from "@vynance/shared"
import { api } from "@/lib/api-client"
import { ensureOk } from "@/lib/api-error"

const g = api.books[":bookId"].goals

export async function fetchGoals(bookId: string): Promise<GoalList> {
  const res = await g.$get({ param: { bookId } })
  await ensureOk(res)
  return goalListSchema.parse((await res.json()).data)
}

export async function createGoal(bookId: string, input: CreateGoalInput): Promise<Goal> {
  const res = await g.$post({
    param: { bookId },
    json: {
      ...input,
      targetAmount: moneyToJson(input.targetAmount),
      initialAmount: moneyToJson(input.initialAmount),
    },
  })
  await ensureOk(res)
  return goalSchema.parse((await res.json()).data)
}

export async function updateGoal(bookId: string, id: string, input: UpdateGoalInput): Promise<Goal> {
  const res = await g[":id"].$patch({
    param: { bookId, id },
    json: {
      ...input,
      targetAmount: input.targetAmount === undefined ? undefined : moneyToJson(input.targetAmount),
      initialAmount: input.initialAmount === undefined ? undefined : moneyToJson(input.initialAmount),
    },
  })
  await ensureOk(res)
  return goalSchema.parse((await res.json()).data)
}

export async function deleteGoal(bookId: string, id: string): Promise<void> {
  const res = await g[":id"].$delete({ param: { bookId, id } })
  await ensureOk(res)
}

export async function contribute(bookId: string, id: string, input: CreateContributionInput): Promise<Goal> {
  const res = await g[":id"].contributions.$post({
    param: { bookId, id },
    json: { amount: moneyToJson(input.amount), contributedOn: input.contributedOn },
  })
  await ensureOk(res)
  return goalSchema.parse((await res.json()).data)
}
