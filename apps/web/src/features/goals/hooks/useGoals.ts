import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateContributionInput, CreateGoalInput, GoalList, UpdateGoalInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { contribute, createGoal, deleteGoal, fetchGoals, updateGoal } from "../services/goals.service"

export function useGoals(bookId: string): UseQueryResult<GoalList> {
  return useQuery({ queryKey: qk.goals(bookId), queryFn: () => fetchGoals(bookId), enabled: Boolean(bookId) })
}

function useInvalidateGoals(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.goals(bookId) })
}

export function useCreateGoal(bookId: string) {
  const onSuccess = useInvalidateGoals(bookId)
  return useMutation({ mutationFn: (input: CreateGoalInput) => createGoal(bookId, input), onSuccess })
}

export function useUpdateGoal(bookId: string) {
  const onSuccess = useInvalidateGoals(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateGoalInput }) => updateGoal(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteGoal(bookId: string) {
  const onSuccess = useInvalidateGoals(bookId)
  return useMutation({ mutationFn: (id: string) => deleteGoal(bookId, id), onSuccess })
}

export function useContribute(bookId: string) {
  const onSuccess = useInvalidateGoals(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: CreateContributionInput }) => contribute(bookId, v.id, v.input),
    onSuccess,
  })
}
