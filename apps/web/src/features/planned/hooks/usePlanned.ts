import { type UseQueryResult, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { PlannedList, RealizePlannedInput } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchPlanned, realizePlanned } from "../services/planned.service"

export function usePlanned(bookId: string, month: string): UseQueryResult<PlannedList> {
  return useQuery({
    queryKey: qk.planned(bookId, month),
    queryFn: () => fetchPlanned(bookId, month),
    enabled: Boolean(bookId),
  })
}

/** Realisasi/Lewati. Saldo, anggaran, dan daftar ikut berubah, jadi semua data buku dimuat ulang. */
export function useRealizePlanned(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RealizePlannedInput) => realizePlanned(bookId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.book(bookId) }),
  })
}
