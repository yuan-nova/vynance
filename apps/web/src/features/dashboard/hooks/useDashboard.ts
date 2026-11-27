import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { Dashboard } from "@vynance/shared"
import { qk } from "@/lib/query-keys"
import { fetchDashboard } from "../services/dashboard.service"

/** Agregat Beranda; ikut dibuang saat transaksi/rekening/rencana berubah (awalan qk.book). */
export function useDashboard(bookId: string, month: string): UseQueryResult<Dashboard> {
  return useQuery({
    queryKey: qk.dashboard(bookId, month),
    queryFn: () => fetchDashboard(bookId, month),
    enabled: Boolean(bookId),
  })
}
