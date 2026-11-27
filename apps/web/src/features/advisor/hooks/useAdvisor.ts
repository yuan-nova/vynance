import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdvisorConsent } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchConsent, fetchContext, saveConsent } from "../services/advisor.service"

export function useAdvisorConsent(bookId: string): UseQueryResult<AdvisorConsent> {
  return useQuery({
    queryKey: qk.advisorConsent(bookId),
    queryFn: () => fetchConsent(bookId),
    enabled: Boolean(bookId),
  })
}

/** Ringkasan yang akan dikirim; ditampilkan sebelum pengguna setuju. */
export function useAdvisorContext(bookId: string): UseQueryResult<string> {
  return useQuery({
    queryKey: qk.advisorContext(bookId),
    queryFn: () => fetchContext(bookId),
    enabled: Boolean(bookId),
  })
}

export function useSaveConsent(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (consent: boolean) => saveConsent(bookId, consent),
    onSuccess: (c) => qc.setQueryData(qk.advisorConsent(bookId), c),
  })
}
