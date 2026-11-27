import { queryOptions, type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InvestmentType, Plan, PutPlanInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { carryOverPlan, fetchInvestmentTypes, fetchPlan, savePlan } from "../services/plans.service"

export const planQueryOptions = (bookId: string, month: string) =>
  queryOptions({ queryKey: qk.plan(bookId, month), queryFn: () => fetchPlan(bookId, month) })

export function usePlan(bookId: string, month: string): UseQueryResult<Plan> {
  return useQuery(planQueryOptions(bookId, month))
}

export function useInvestmentTypes(bookId: string): UseQueryResult<InvestmentType[]> {
  return useQuery({ queryKey: qk.investmentTypes(bookId), queryFn: () => fetchInvestmentTypes(bookId) })
}

/** Simpan rencana; hasil server langsung menggantikan cache (versi baru). */
export function useSavePlan(bookId: string, month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PutPlanInput) => savePlan(bookId, month, input),
    onSuccess: (plan) => {
      qc.setQueryData(qk.plan(bookId, month), plan)
    },
  })
}

/** Hasil server menggantikan cache; editor dipasang ulang oleh pemanggil karena versinya berubah. */
export function useCarryOver(bookId: string, month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => carryOverPlan(bookId, month),
    onSuccess: (plan) => {
      qc.setQueryData(qk.plan(bookId, month), plan)
    },
  })
}
