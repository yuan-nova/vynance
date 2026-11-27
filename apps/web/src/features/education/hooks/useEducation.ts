import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateChildInput, EducationPlan, UpdateChildInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  createChild,
  deleteChild,
  fetchEducationPlan,
  updateChild,
  updateInflation,
} from "../services/education.service"

export function useEducationPlan(bookId: string): UseQueryResult<EducationPlan> {
  return useQuery({
    queryKey: qk.educationPlan(bookId),
    queryFn: () => fetchEducationPlan(bookId),
    enabled: Boolean(bookId),
  })
}

function useInvalidate(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.educationPlan(bookId) })
}

export function useCreateChild(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (input: CreateChildInput) => createChild(bookId, input), onSuccess })
}

export function useUpdateChild(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateChildInput }) => updateChild(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteChild(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => deleteChild(bookId, id), onSuccess })
}

export function useUpdateInflation(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (bp: number) => updateInflation(bookId, bp), onSuccess })
}
