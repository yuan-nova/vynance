import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateIncomeSourceInput, IncomeList, UpdateIncomeSourceInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  createIncome,
  deleteIncome,
  fetchIncomes,
  updateIncome,
  updatePassiveTarget,
} from "../services/incomes.service"

export function useIncomes(bookId: string): UseQueryResult<IncomeList> {
  return useQuery({ queryKey: qk.incomes(bookId), queryFn: () => fetchIncomes(bookId), enabled: Boolean(bookId) })
}

function useInvalidate(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.incomes(bookId) })
}

export function useCreateIncome(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (input: CreateIncomeSourceInput) => createIncome(bookId, input), onSuccess })
}

export function useUpdateIncome(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateIncomeSourceInput }) => updateIncome(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteIncome(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => deleteIncome(bookId, id), onSuccess })
}

export function useUpdatePassiveTarget(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (bp: number) => updatePassiveTarget(bookId, bp), onSuccess })
}
