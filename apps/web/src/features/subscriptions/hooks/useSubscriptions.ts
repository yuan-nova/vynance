import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateSubscriptionInput, FxRates, SubscriptionList, UpdateSubscriptionInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import {
  createSubscription,
  deleteSubscription,
  fetchFxRates,
  fetchSubscriptions,
  updateSubscription,
} from "../services/subscriptions.service"

export function useSubscriptions(bookId: string): UseQueryResult<SubscriptionList> {
  return useQuery({
    queryKey: qk.subscriptions(bookId),
    queryFn: () => fetchSubscriptions(bookId),
    enabled: Boolean(bookId),
  })
}

export function useFxRates(bookId: string): UseQueryResult<FxRates> {
  return useQuery({
    queryKey: qk.fxRates(bookId),
    queryFn: () => fetchFxRates(bookId),
    enabled: Boolean(bookId),
    staleTime: 3_600_000,
  })
}

function useInvalidate(bookId: string) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.subscriptions(bookId) })
}

export function useCreateSubscription(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (v: CreateSubscriptionInput) => createSubscription(bookId, v), onSuccess })
}

export function useUpdateSubscription(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateSubscriptionInput }) => updateSubscription(bookId, v.id, v.input),
    onSuccess,
  })
}

export function useDeleteSubscription(bookId: string) {
  const onSuccess = useInvalidate(bookId)
  return useMutation({ mutationFn: (id: string) => deleteSubscription(bookId, id), onSuccess })
}
