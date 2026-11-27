import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { HealthScoreResponse } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchHealthScore } from "../services/health-score.service"

/** Skor kesehatan bulan yang dipilih; ikut dibuang saat data buku berubah (awalan qk.book). */
export function useHealthScore(bookId: string, month: string): UseQueryResult<HealthScoreResponse> {
  return useQuery({
    queryKey: qk.healthScore(bookId, month),
    queryFn: () => fetchHealthScore(bookId, month),
    enabled: Boolean(bookId),
  })
}
